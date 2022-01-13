import os

from django.utils import timezone

from celery import Celery
from utils import celery_instrumentation  # noqa: F401, E402

# set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "crh.settings.local")

app = Celery("crh")


# Monkey patch now so that Celery beat respects USE_TZ=False.
# https://github.com/celery/django-celery-beat/issues/80
app.now = timezone.now

# Using a string here means the worker don't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()
