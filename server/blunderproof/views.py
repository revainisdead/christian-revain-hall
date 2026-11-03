from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import permissions, viewsets

from blunderproof.serializers import (
    GroupLinkSerializer,
    GroupSerializer,
    UserLinkSerializer,
    UserSerializer,
)

User = get_user_model()


# Full CRUD over every user/group: staff only. Regular users use /api/auth/me/.
class UsersViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class GroupsViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().order_by("name")
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAdminUser]


class UsersLinkViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserLinkSerializer
    permission_classes = [permissions.IsAdminUser]


class GroupsLinkViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().order_by("name")
    serializer_class = GroupLinkSerializer
    permission_classes = [permissions.IsAdminUser]
