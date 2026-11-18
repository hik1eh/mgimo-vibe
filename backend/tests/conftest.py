import os
import secrets
from datetime import date
from pathlib import Path
import pytest
from sqlalchemy.engine import make_url

# Never point destructive tests at the application database.
test_url = os.environ.get('TEST_DATABASE_URL', '')
if not test_url or not (make_url(test_url).database or '').endswith('_test'):
    raise RuntimeError('Set TEST_DATABASE_URL to a dedicated PostgreSQL database ending in _test.')
os.environ['DATABASE_URL'] = test_url
os.environ['COOKIE_SECURE'] = 'false'
os.environ['APP_ORIGIN'] = 'http://testserver'

from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.db import engine, SessionLocal
from app.main import app
from app.seed import seed


@pytest.fixture(scope='session', autouse=True)
def migrated():
    config = Config(str(Path(__file__).parents[1] / 'alembic.ini'))
    command.downgrade(config, 'base')
    command.upgrade(config, 'head')


@pytest.fixture(autouse=True)
def database(migrated):
    with engine.begin() as conn:
        conn.execute(text('TRUNCATE announcements, lesson_changes, lessons, academic_results, study_scenarios, notifications, documents, request_events, requests, sessions, users, groups, faculties, teachers, campus_rooms RESTART IDENTITY CASCADE'))
    credentials = {login: secrets.token_urlsafe(24) for login in ['student.a', 'student.b', 'staff.a']}
    with SessionLocal() as db:
        seed(db, credentials, demo_date=date(2026, 11, 13))
    yield credentials


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def signed(database):
    clients = []
    def create(login):
        c = TestClient(app)
        csrf = c.get('/api/v1/auth/csrf').json()['csrf_token']
        c.headers.update({'Origin': 'http://testserver', 'X-CSRF-Token': csrf})
        response = c.post('/api/v1/auth/login', json={'login': login, 'password': database[login]})
        assert response.status_code == 200, response.text
        c.headers['X-CSRF-Token'] = response.json()['csrf_token']
        clients.append(c)
        return c
    yield create
    for c in clients:
        c.close()
