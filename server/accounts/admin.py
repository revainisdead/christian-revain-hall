from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from accounts.models import BpUser

admin.site.register(BpUser, UserAdmin)
