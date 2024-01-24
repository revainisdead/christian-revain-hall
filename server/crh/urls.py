"""crh URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from rest_framework import routers

from crh.views import (
    GroupsViewSet,
    UsersViewSet,
    GroupsLinkViewSet,
    UsersLinkViewSet,
)

router = routers.DefaultRouter()
router.register(r"groups", GroupsViewSet)
router.register(r"users", UsersViewSet)
router.register(r"groups-link", GroupsLinkViewSet)
router.register(r"users-link", UsersLinkViewSet)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
]

#urlpatterns += router.urls
