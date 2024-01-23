#from django.shortcuts import render

from django.contrib.auth.models import Group, User
from rest_framework import permissions, viewsets

from crh.serializers import (
    GroupSerializer,
    UserSerializer,
    GroupLinkSerializer,
    UserLinkSerializer,
)


class UsersViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class GroupsViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]


class UsersLinkViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserLinkSerializer
    permission_classes = [permissions.IsAuthenticated]


class GroupsLinkViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupLinkSerializer
    permission_classes = [permissions.IsAuthenticated]

