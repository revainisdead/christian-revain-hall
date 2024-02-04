from django.contrib import admin

from django.contrib.auth.models import User, Group


class GroupAdmin(admin.ModelAdmin):
    list_display = ()
    list_filter = ()


class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "first_name", "last_name")
    list_filter = ("is_staff", "is_superuser")


## Unregister django's default admin page.
#admin.site.unregister(Group)
#admin.site.register(Group, GroupAdmin)
#
## Unregister django's default admin page.
#admin.site.unregister(User)
#admin.site.register(User, UserAdmin)
