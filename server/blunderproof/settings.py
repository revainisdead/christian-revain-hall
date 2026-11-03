"""
Django settings for the blunderproof project.

https://docs.djangoproject.com/en/5.2/topics/settings/
https://docs.djangoproject.com/en/5.2/ref/settings/
"""

import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from django.core.exceptions import ImproperlyConfigured


def env_list(name, default=""):
    """Comma-separated env var -> list, ignoring blanks."""
    return [item.strip() for item in os.environ.get(name, default).split(",") if item.strip()]


AUTH_USER_MODEL = "accounts.BpUser"

BASE_DIR = Path(__file__).resolve().parent.parent  # /srv/app/server
REPO_DIR = BASE_DIR.parent  # /srv/app


# Set in the root .env file (loaded by docker compose via env_file). See .env.example.
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise ImproperlyConfigured("SECRET_KEY environment variable is not set (add it to .env).")

DEBUG = os.environ.get("DEBUG", "false").lower() == "true"

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1,crh-server-net" if DEBUG else "")

# Origins the browser posts from (Quasar dev server in dev, the real domain in prod).
CSRF_TRUSTED_ORIGINS = env_list(
    "CSRF_TRUSTED_ORIGINS",
    "http://127.0.0.1:8007,http://localhost:8007" if DEBUG else "",
)

# Username/password login (session login, register, JWT token obtain). Dev only by default;
# real users sign in with Google.
PASSWORD_LOGIN_ENABLED = os.environ.get("PASSWORD_LOGIN_ENABLED", str(DEBUG)).lower() == "true"

# Google Identity Services OAuth client ID (Google Cloud console > Credentials). Empty = Google sign-in off.
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG


# Application definition

INSTALLED_APPS = [
    "blunderproof",
    "accounts",
    "chess_local",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "blunderproof.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "blunderproof.wsgi.application"


# Database

print("TEST DJ CONFIG", dj_database_url.config())
DATABASES = {
    "default": dj_database_url.config(env="DATABASE_URL"),
}


# Password validation

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# Internationalization

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# Static files (admin and DRF browsable API assets); `manage.py collectstatic` writes here.

STATIC_URL = "static/"
STATIC_ROOT = REPO_DIR / "static"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


REST_FRAMEWORK = {
    # JWT for the SPA; sessions for the admin, the browsable API and the session login endpoints.
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    # Every endpoint requires a logged-in user unless a view says otherwise.
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=10),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}
