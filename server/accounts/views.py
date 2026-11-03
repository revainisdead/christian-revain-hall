from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.http import Http404
from django.utils.decorators import method_decorator
from django.utils.text import slugify
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from accounts.serializers import LoginSerializer, MeSerializer, RegisterSerializer

User = get_user_model()


def require_password_login():
    """Username/password login is dev-only unless PASSWORD_LOGIN_ENABLED is set."""
    if not settings.PASSWORD_LOGIN_ENABLED:
        raise Http404


class AuthConfigView(APIView):
    """What the login page should offer. Public."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "password_login": settings.PASSWORD_LOGIN_ENABLED,
            "google_client_id": settings.GOOGLE_CLIENT_ID or None,
        })


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    """Sets the csrftoken cookie so the SPA can send X-CSRFToken on session requests."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


# DRF views are csrf_exempt and only enforce CSRF for already-authenticated sessions,
# so login/register opt back in explicitly (prevents login CSRF).
@method_decorator(csrf_protect, name="dispatch")
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        require_password_login()
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        return Response(MeSerializer(user).data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        require_password_login()
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(request, **serializer.validated_data)
        if user is None:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        login(request, user)
        return Response(MeSerializer(user).data)


class PasswordTokenObtainPairView(TokenObtainPairView):
    """JWT from username/password; gated like the session password login."""

    def post(self, request, *args, **kwargs):
        require_password_login()
        return super().post(request, *args, **kwargs)


class GoogleCredentialSerializer(serializers.Serializer):
    credential = serializers.CharField()  # Google Identity Services ID token (JWT)


def _unique_username(email):
    base = slugify(email.split("@")[0])[:140] or "player"
    username, n = base, 1
    while User.objects.filter(username=username).exists():
        n += 1
        username = f"{base}{n}"
    return username


def user_for_google_claims(claims):
    """Find the user by Google id, else link by verified email, else create one."""
    user = User.objects.filter(google_sub=claims["sub"]).first()
    if user:
        return user
    email = claims["email"]
    user = User.objects.filter(email__iexact=email, google_sub__isnull=True).first()
    if user is None:
        user = User(username=_unique_username(email), email=email,
                    first_name=claims.get("given_name", ""), last_name=claims.get("family_name", ""))
        user.set_unusable_password()
    user.google_sub = claims["sub"]
    user.save()
    return user


@method_decorator(csrf_protect, name="dispatch")
class GoogleLoginView(APIView):
    """POST {credential}: verify the Google ID token and log in with a session."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not settings.GOOGLE_CLIENT_ID:
            raise Http404
        serializer = GoogleCredentialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            # Checks signature, expiry, issuer (accounts.google.com) and audience (our client id).
            claims = id_token.verify_oauth2_token(
                serializer.validated_data["credential"],
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            return Response({"detail": "Invalid Google credential."}, status=status.HTTP_400_BAD_REQUEST)
        if not claims.get("email_verified"):
            return Response({"detail": "Google email is not verified."}, status=status.HTTP_400_BAD_REQUEST)

        user = user_for_google_claims(claims)
        login(request, user, backend="django.contrib.auth.backends.ModelBackend")
        return Response(MeSerializer(user).data)


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    def get(self, request):
        return Response(MeSerializer(request.user).data)
