import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

from accounts import views

User = get_user_model()
pytestmark = pytest.mark.django_db
CLIENT_ID = "test-client.apps.googleusercontent.com"


@pytest.fixture(autouse=True)
def google_on(settings):
    settings.GOOGLE_CLIENT_ID = CLIENT_ID


@pytest.fixture
def claims():
    return {"sub": "1234567890", "email": "Player.One@gmail.com", "email_verified": True,
            "given_name": "Player", "family_name": "One"}


@pytest.fixture
def google_verifies(monkeypatch, claims):
    """Stand-in for Google's signature check; records the audience we asked for."""
    calls = []

    def fake_verify(token, request, audience):
        calls.append(audience)
        if token != "good-token":
            raise ValueError("bad token")
        return claims

    monkeypatch.setattr(views.id_token, "verify_oauth2_token", fake_verify)
    return calls


def google_login(client, token="good-token"):
    return client.post(reverse("auth-google"), {"credential": token})


def test_creates_user_and_logs_in(google_verifies):
    client = APIClient()
    resp = google_login(client)
    assert resp.status_code == 200
    assert google_verifies == [CLIENT_ID]
    user = User.objects.get(google_sub="1234567890")
    assert (user.username, user.email, user.has_usable_password()) == ("playerone", "Player.One@gmail.com", False)
    assert client.get(reverse("auth-me")).data["username"] == "playerone"


def test_second_login_reuses_user(google_verifies):
    google_login(APIClient())
    google_login(APIClient())
    assert User.objects.count() == 1


def test_links_existing_user_by_email(google_verifies):
    existing = User.objects.create_user(username="christian", email="player.one@gmail.com", password="x")
    assert google_login(APIClient()).data["username"] == "christian"
    existing.refresh_from_db()
    assert existing.google_sub == "1234567890"


def test_username_collision_gets_suffix(google_verifies):
    User.objects.create_user(username="playerone", email="someone@else.com")
    assert google_login(APIClient()).data["username"] == "playerone2"


def test_invalid_token(google_verifies):
    assert google_login(APIClient(), token="forged").status_code == 400
    assert not User.objects.exists()


def test_unverified_email(google_verifies, claims):
    claims["email_verified"] = False
    assert google_login(APIClient()).status_code == 400


def test_disabled_without_client_id(google_verifies, settings):
    settings.GOOGLE_CLIENT_ID = ""
    assert google_login(APIClient()).status_code == 404
