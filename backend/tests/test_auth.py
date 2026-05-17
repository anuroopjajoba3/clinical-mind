"""
Tests for authentication endpoints: register, login, /auth/me.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    resp = await client.post("/auth/register", json={
        "email": "doc@hospital.org",
        "password": "securepass123",
        "full_name": "Dr. Jane Smith"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user_email"] == "doc@hospital.org"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {"email": "dup@test.com", "password": "pass1234", "full_name": "Test"}
    await client.post("/auth/register", json=payload)
    resp = await client.post("/auth/register", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient):
    resp = await client.post("/auth/register", json={
        "email": "weak@test.com",
        "password": "short",
        "full_name": "Test"
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "login@test.com",
        "password": "testpass123",
        "full_name": "Login User"
    })
    resp = await client.post("/auth/login", json={
        "email": "login@test.com",
        "password": "testpass123"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "badpw@test.com",
        "password": "correctpass123",
        "full_name": "Bad PW"
    })
    resp = await client.post("/auth/login", json={
        "email": "badpw@test.com",
        "password": "wrongpassword"
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_authenticated(authed_client: AsyncClient):
    resp = await authed_client.get("/auth/me")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient):
    resp = await client.get("/auth/me")
    assert resp.status_code == 401
