from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from accounts.models import BpUser


@admin.register(BpUser)
class BpUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("BlunderProof", {"fields": ("google_sub", "fair_play_accepted_at", "fair_play_version")}),
    )
    list_display = UserAdmin.list_display + ("fair_play_accepted_at",)
