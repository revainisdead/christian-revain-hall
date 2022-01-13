import os
import django
from django.utils import autoreload

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "crh.settings.local")
django.setup()


def run_celery():
    from sk.celery import app

    app.worker_main(["-Ask", "-linfo", "-Psolo"])


print("Starting celery worker with autoreload...")
autoreload.main(run_celery)
