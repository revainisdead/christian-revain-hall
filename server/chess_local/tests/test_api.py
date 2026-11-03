import pytest
from django.contrib.auth import get_user_model
from model_bakery import baker
from rest_framework.test import APIClient

from chess_local.models import Game

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


def test_requires_login():
    assert APIClient().get("/api/games/").status_code == 401


def test_other_users_games_are_hidden(client):
    other = baker.make(Game)
    assert client.get(f"/api/games/{other.pk}/").status_code == 404
    assert client.get("/api/games/").data == []
    assert client.post(f"/api/games/{other.pk}/moves/", {"uci": "e2e4", "ply": 1}).status_code == 404


def test_full_flow(client, user):
    resp = client.post("/api/games/", {"user_color": "black", "title": "Sicilian practice"})
    assert resp.status_code == 201
    game_id = resp.data["id"]
    assert Game.objects.get(pk=game_id).owner == user

    assert client.post(f"/api/games/{game_id}/moves/", {"uci": "e2e4", "ply": 1}).status_code == 201
    resp = client.post(f"/api/games/{game_id}/moves/", {"uci": "c7c5", "ply": 2})
    assert resp.status_code == 201
    assert resp.data["san"] == "c5"

    detail = client.get(f"/api/games/{game_id}/").data
    assert [m["san"] for m in detail["moves"]] == ["e4", "c5"]
    assert detail["user_color"] == "black"
    assert "moves" not in client.get("/api/games/").data[0]

    assert client.delete(f"/api/games/{game_id}/moves/?after=1").status_code == 204
    assert [m["san"] for m in client.get(f"/api/games/{game_id}/").data["moves"]] == ["e4"]


def test_move_errors(client, user):
    game = baker.make(Game, owner=user)
    url = f"/api/games/{game.pk}/moves/"
    assert client.post(url, {"uci": "e2e5", "ply": 1}).status_code == 400
    assert client.post(url, {"uci": "e2e4", "ply": 3}).status_code == 409
    assert client.post(url, {"ply": 1}).status_code == 400
    assert client.delete(url).status_code == 400  # missing ?after


def test_user_color_cannot_change(client, user):
    game = baker.make(Game, owner=user, user_color="white")
    resp = client.patch(f"/api/games/{game.pk}/", {"user_color": "black", "title": "Renamed"})
    assert resp.status_code == 200
    game.refresh_from_db()
    assert (game.user_color, game.title) == ("white", "Renamed")
