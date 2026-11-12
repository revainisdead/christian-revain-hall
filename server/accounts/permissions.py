from rest_framework.permissions import BasePermission


class HasAcceptedFairPlay(BasePermission):
    """Logged in and has accepted the current fair-play policy (settings.FAIR_PLAY_VERSION)."""

    message = "Accept the fair-play policy first."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.has_accepted_fair_play)
