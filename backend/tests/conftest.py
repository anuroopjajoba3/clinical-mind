"""
Shared fixtures for ClinicalMind test suite.
"""
import os
import uuid
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

# Set test env vars before importing app modules
os.environ.setdefault("ANTHROPIC_API_KEY", "sk-ant-test-key")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://clinicalmind:clinicalmind@localhost:5432/clinicalmind_test")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-ci-only")

from database import Base, get_db, User
from main import app
from auth import create_access_token, hash_password


TEST_DB_URL = os.environ["DATABASE_URL"]


@pytest_asyncio.fixture(scope="session")
async def engine():
    engine = create_async_engine(TEST_DB_URL, echo=False, poolclass=NullPool)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine):
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(engine):
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with async_session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def authed_client(client, engine):
    """Client pre-authenticated as test@example.com.

    Inserts the user directly into the DB (bypassing HTTP register/login)
    so the fixture is reliable regardless of test execution order.
    """
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        result = await session.execute(
            select(User).where(User.email == "test@example.com")
        )
        if result.scalar_one_or_none() is None:
            session.add(User(
                id=uuid.uuid4(),
                email="test@example.com",
                hashed_password=hash_password("testpass123"),
                full_name="Test User",
                is_active=True,
            ))
            await session.commit()

    token = create_access_token({"sub": "test@example.com"})
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client
