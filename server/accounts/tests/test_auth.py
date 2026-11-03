import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

User = get_user_model()
PASSWORD = "a-Strong-pass-123"


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(username="alice", email="alice@example.com", password=PASSWORD)


@pytest.mark.django_db
class TestRegister:
    def test_creates_user_and_logs_in(self, client):
        resp = client.post(
            reverse("auth-register"),
            {"username": "bob", "email": "bob@example.com", "password": PASSWORD},
        )
        assert resp.status_code == 201
        assert resp.data["username"] == "bob"
        assert "password" not in resp.data
        assert client.get(reverse("auth-me")).data["username"] == "bob"

    def test_duplicate_username(self, client, user):
        resp = client.post(
            reverse("auth-register"),
            {"username": "alice", "email": "other@example.com", "password": PASSWORD},
        )
        assert resp.status_code == 400
        assert "username" in resp.data

    def test_weak_password(self, client):
        resp = client.post(
            reverse("auth-register"),
            {"username": "bob", "email": "bob@example.com", "password": "password"},
        )
        assert resp.status_code == 400
        assert not User.objects.filter(username="bob").exists()


@pytest.mark.django_db
class TestSessionLogin:
    def test_login_me_logout(self, client, user):
        assert client.get(reverse("auth-me")).status_code == 401

        resp = client.post(reverse("auth-login"), {"username": "alice", "password": PASSWORD})
        assert resp.status_code == 200
        assert resp.data == {"id": user.id, "username": "alice", "email": "alice@example.com"}
        assert client.get(reverse("auth-me")).status_code == 200

        assert client.post(reverse("auth-logout")).status_code == 204
        assert client.get(reverse("auth-me")).status_code == 401

    def test_bad_password(self, client, user):
        resp = client.post(reverse("auth-login"), {"username": "alice", "password": "nope"})
        assert resp.status_code == 400

    def test_login_requires_csrf(self, user):
        client = APIClient(enforce_csrf_checks=True)
        resp = client.post(reverse("auth-login"), {"username": "alice", "password": PASSWORD})
        assert resp.status_code == 403

        client.get(reverse("auth-csrf"))
        token = client.cookies["csrftoken"].value
        resp = client.post(
            reverse("auth-login"),
            {"username": "alice", "password": PASSWORD},
            HTTP_X_CSRFTOKEN=token,
        )
        assert resp.status_code == 200


@pytest.mark.django_db
class TestJwt:
    def test_obtain_use_refresh_blacklist(self, client, user):
        resp = client.post(reverse("token-obtain"), {"username": "alice", "password": PASSWORD})
        assert resp.status_code == 200
        access, refresh = resp.data["access"], resp.data["refresh"]

        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        assert client.get(reverse("auth-me")).data["username"] == "alice"
        client.credentials()

        resp = client.post(reverse("token-refresh"), {"refresh": refresh})
        assert resp.status_code == 200
        new_refresh = resp.data["refresh"]  # rotated

        # The old refresh token was blacklisted on rotation.
        assert client.post(reverse("token-refresh"), {"refresh": refresh}).status_code == 401

        assert client.post(reverse("token-blacklist"), {"refresh": new_refresh}).status_code == 200
        assert client.post(reverse("token-refresh"), {"refresh": new_refresh}).status_code == 401


@pytest.mark.django_db
def test_user_admin_endpoints_are_staff_only(client, user):
    client.force_authenticate(user)
    assert client.get("/api/accounts/users/").status_code == 403
    user.is_staff = True
    user.save()
    assert client.get("/api/accounts/users/").status_code == 200
    assert client.get("/api/accounts/users-link/").status_code == 200
