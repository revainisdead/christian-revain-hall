import pytest
from django.contrib.auth import get_user_model
from model_bakery import baker
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db
User = get_user_model()


@pytest.fixture
def user():
    return baker.make(User)


@pytest.fixture
def client(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


def test_new_user_has_not_accepted(client):
    assert client.get("/api/auth/me/").data["fair_play_accepted"] is False


def test_accept_records_time_and_version(client, user, settings):
    resp = client.post("/api/auth/fair-play/accept/")
    assert resp.status_code == 200
    assert resp.data["fair_play_accepted"] is True

    user.refresh_from_db()
    assert user.fair_play_accepted_at is not None
    assert user.fair_play_version == settings.FAIR_PLAY_VERSION
    assert client.get("/api/auth/me/").data["fair_play_accepted"] is True


def test_new_policy_version_asks_again(client, settings):
    client.post("/api/auth/fair-play/accept/")
    settings.FAIR_PLAY_VERSION = "2099-01-01"
    assert client.get("/api/auth/me/").data["fair_play_accepted"] is False


def test_games_api_opens_after_accepting(client):
    assert client.get("/api/games/").status_code == 403
    client.post("/api/auth/fair-play/accept/")
    assert client.get("/api/games/").status_code == 200


def test_accept_requires_login():
    assert APIClient().post("/api/auth/fair-play/accept/").status_code == 401
