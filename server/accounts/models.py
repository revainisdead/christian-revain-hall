from django.db import models

from django.contrib.auth.models import User


class BPUser(User):
    """
    A user model that extends the default Django User model.
    """
    # Add any additional fields you want for your user here
    pass
