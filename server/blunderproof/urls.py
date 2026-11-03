"""blunderproof URL configuration: https://docs.djangoproject.com/en/5.2/topics/http/urls/"""
from django.contrib import admin
from django.urls import include, path
from rest_framework import routers

from blunderproof.views import (
    GroupsLinkViewSet,
    GroupsViewSet,
    UsersLinkViewSet,
    UsersViewSet,
)
from chess_local.views import GameViewSet

accounts_router = routers.DefaultRouter()
accounts_router.register(r"groups", GroupsViewSet)
accounts_router.register(r"users", UsersViewSet)
accounts_router.register(r"groups-link", GroupsLinkViewSet, basename="group-link")
accounts_router.register(r"users-link", UsersLinkViewSet, basename="user-link")

games_router = routers.DefaultRouter()
games_router.register(r"games", GameViewSet, basename="game")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(games_router.urls)),
    path("api/auth/", include("accounts.urls")),
    path("api/accounts/", include(accounts_router.urls)),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
]
