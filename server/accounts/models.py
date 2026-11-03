from django.contrib.auth.models import AbstractUser
from django.db import models


class BpUser(AbstractUser):
    """
    A user model that extends the default Django User model.
    """

    # Google account id ("sub" claim). Stable even if the Google email changes.
    google_sub = models.CharField(max_length=255, unique=True, null=True, blank=True)
