from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView

from accounts.views import (
    AcceptFairPlayView,
    AuthConfigView,
    CsrfView,
    GoogleLoginView,
    LoginView,
    LogoutView,
    MeView,
    PasswordTokenObtainPairView,
    RegisterView,
)

urlpatterns = [
    path("config/", AuthConfigView.as_view(), name="auth-config"),
    path("csrf/", CsrfView.as_view(), name="auth-csrf"),
    path("google/", GoogleLoginView.as_view(), name="auth-google"),
    # Username/password (dev only unless PASSWORD_LOGIN_ENABLED)
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("fair-play/accept/", AcceptFairPlayView.as_view(), name="auth-fair-play-accept"),
    # JWT
    path("token/", PasswordTokenObtainPairView.as_view(), name="token-obtain"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("token/blacklist/", TokenBlacklistView.as_view(), name="token-blacklist"),
]
