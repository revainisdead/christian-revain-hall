from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class BpUser(AbstractUser):
    """
    A user model that extends the default Django User model.
    """

    # Google account id ("sub" claim). Stable even if the Google email changes.
    google_sub = models.CharField(max_length=255, unique=True, null=True, blank=True)

    # Fair-play policy (FAIR_PLAY.md): when the user accepted it, and which version.
    # They must accept settings.FAIR_PLAY_VERSION before using the app (see has_accepted_fair_play).
    fair_play_accepted_at = models.DateTimeField(null=True, blank=True)
    fair_play_version = models.CharField(max_length=20, blank=True, default="")

    @property
    def has_accepted_fair_play(self):
        return bool(self.fair_play_accepted_at) and self.fair_play_version == settings.FAIR_PLAY_VERSION
