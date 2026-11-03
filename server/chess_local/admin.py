from django.contrib import admin

from chess_local.models import Game, Move


class MoveInline(admin.TabularInline):
    model = Move
    extra = 0
    fields = ["ply", "san", "uci", "fen_after"]
    readonly_fields = fields


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ["id", "owner", "title", "user_color", "status", "updated_at"]
    list_filter = ["status", "user_color"]
    search_fields = ["title", "owner__username"]
    inlines = [MoveInline]
