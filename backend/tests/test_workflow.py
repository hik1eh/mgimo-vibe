from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from io import BytesIO
from uuid import uuid4
from pypdf import PdfReader
import pytest
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from app.db import SessionLocal
from app.models import (User, Group, LoginSession, CertificateRequest as CR, RequestEvent,
                        Notification, Document, now)
from app.seed import seed


def create(client, key=None, purpose='По месту требования'):
    response = client.post('/api/v1/requests', json={'purpose': purpose, 'idempotency_key': key or str(uuid4())})
    assert response.status_code == 201, response.text
    return response.json()


def change(client, req, action, text=''):
    return client.post(f"/api/v1/staff/requests/{req['id']}/transitions", json={'action': action, 'text': text, 'version': req['version']})


def test_login_profiles_logout_revocation_and_expiry(signed, client, database):
    assert client.get('/api/v1/me').status_code == 401
    token = client.get('/api/v1/auth/csrf').json()['csrf_token']
    bad = client.post('/api/v1/auth/login', headers={'Origin': 'http://testserver', 'X-CSRF-Token': token}, json={'login': 'student.a', 'password': 'incorrect'})
    assert bad.status_code == 401
    a, b, staff = [signed(login) for login in ['student.a', 'student.b', 'staff.a']]
    profiles = [c.get('/api/v1/me').json() for c in [a, b, staff]]
    assert profiles[0]['group'] != profiles[1]['group']
    assert profiles[0]['faculty'] == profiles[2]['faculty'] != profiles[1]['faculty']
    for c in [a, b, staff]:
        assert c.get('/api/v1/me').status_code == 200
        cookies = dict(c.cookies)
        assert c.post('/api/v1/auth/logout').status_code == 204
        c.cookies.update(cookies)
        assert c.get('/api/v1/me').status_code == 401
    a = signed('student.a')
    with SessionLocal() as db:
        db.scalar(select(LoginSession)).expires_at = now() - timedelta(seconds=1)
        db.commit()
    assert a.get('/api/v1/me').status_code == 401


def test_csrf_including_login_logout_and_origin(signed, client, database):
    body = {'login': 'student.a', 'password': database['student.a']}
    assert client.post('/api/v1/auth/login', json=body).status_code == 403
    token = client.get('/api/v1/auth/csrf').json()['csrf_token']
    assert client.post('/api/v1/auth/login', json=body, headers={'Origin': 'https://evil.invalid', 'X-CSRF-Token': token}).status_code == 403
    a = signed('student.a')
    assert a.post('/api/v1/requests', json={'purpose': 'Test', 'idempotency_key': str(uuid4())}, headers={'X-CSRF-Token': ''}).status_code == 403
    assert a.post('/api/v1/auth/logout', headers={'X-CSRF-Token': 'wrong'}).status_code == 403
    assert a.post('/api/v1/auth/logout', headers={'Origin': 'https://evil.invalid'}).status_code == 403
    assert a.get('/api/v1/me').status_code == 200


def test_complete_clarification_flow_and_pdf(signed):
    a, staff = signed('student.a'), signed('staff.a')
    req = create(a)
    assert a.get('/api/v1/requests').json()[0]['id'] == req['id']
    assert a.get(f"/api/v1/requests/{req['id']}").json()['number'] == req['number']
    assert a.get(f"/api/v1/requests/{req['id']}/document").status_code == 409
    assert change(staff, req, 'complete').status_code == 409
    req = change(staff, req, 'start').json()
    assert change(staff, req, 'clarify', ' ').status_code == 422
    req = change(staff, req, 'clarify', 'Уточните место предъявления.').json()
    response = a.post(f"/api/v1/requests/{req['id']}/reply", json={'text': 'В учебный отдел Северного кампуса.', 'version': req['version']})
    assert response.status_code == 200
    req = response.json()
    assert req['status'] == 'in_progress'
    req = change(staff, req, 'complete').json()
    assert req['status'] == 'ready'
    assert [e['kind'] for e in req['events']] == ['accepted', 'in_progress', 'needs_info', 'reply', 'ready']
    document = a.get(f"/api/v1/requests/{req['id']}/document")
    assert document.status_code == 200
    assert document.headers['content-type'] == 'application/pdf'
    reader = PdfReader(BytesIO(document.content))
    text = ' '.join(''.join(p.extract_text() for p in reader.pages).split())
    assert 'ДЕМОНСТРАЦИОННЫЙ ОБРАЗЕЦ' in text
    assert 'Алина Ветрова' in text and 'Не имеет юридической силы' in text
    notices = a.get('/api/v1/notifications').json()
    assert len(notices) == 3 and notices[0]['title'] == 'Ваша справка готова'
    n = notices[0]['id']
    assert a.patch(f'/api/v1/notifications/{n}').json()['read']
    assert a.get(f'/api/v1/notifications/{n}').json()['read']
    with SessionLocal() as db:
        assert db.get(Document, req['id'])


def test_foreign_request_document_notification_and_staff_scope(signed, client):
    a, b, staff = signed('student.a'), signed('student.b'), signed('staff.a')
    req, other = create(a), create(b)
    req = change(staff, req, 'start').json()
    req = change(staff, req, 'complete').json()
    for suffix in ['', '/document']:
        response = b.get(f"/api/v1/requests/{req['id']}{suffix}")
        assert response.status_code == 404
        assert 'Алина' not in response.text
        assert client.get(f"/api/v1/requests/{req['id']}{suffix}").status_code == 401
    n = a.get('/api/v1/notifications').json()[0]['id']
    assert b.get(f'/api/v1/notifications/{n}').status_code == 404
    assert b.patch(f'/api/v1/notifications/{n}').status_code == 404
    assert staff.get(f"/api/v1/staff/requests/{other['id']}").status_code == 404
    assert change(staff, other, 'start').status_code == 404
    assert [r['id'] for r in staff.get('/api/v1/staff/requests').json()] == [req['id']]
    assert [r['id'] for r in b.get('/api/v1/requests').json()] == [other['id']]
    assert b.post(f"/api/v1/requests/{req['id']}/reply", json={'text': 'Чужой ответ', 'version': req['version']}).status_code == 404


def test_role_boundaries(signed):
    a, staff = signed('student.a'), signed('staff.a')
    req = create(a)
    assert a.get('/api/v1/staff/requests').status_code == 403
    assert change(a, req, 'start').status_code == 403
    assert staff.get('/api/v1/requests').status_code == 403
    assert staff.post('/api/v1/requests', json={'purpose': 'Test', 'idempotency_key': str(uuid4())}).status_code == 403
    assert staff.get(f"/api/v1/requests/{req['id']}/document").status_code == 403


def test_idempotent_submit_and_conflict(signed):
    a = signed('student.a')
    key = str(uuid4())
    one, two = create(a, key), create(a, key)
    assert one['id'] == two['id']
    assert len(a.get('/api/v1/requests').json()) == 1
    assert a.post('/api/v1/requests', json={'purpose': 'Иное место', 'idempotency_key': key}).status_code == 409
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(RequestEvent)) == 1


def test_parallel_transition_is_atomic(signed):
    a, first, second = signed('student.a'), signed('staff.a'), signed('staff.a')
    req = create(a)
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda c: change(c, req, 'start'), [first, second]))
    assert sorted(r.status_code for r in responses) == [200, 409]
    assert change(first, req, 'start').status_code == 409
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(RequestEvent)) == 2
        assert db.scalar(select(func.count()).select_from(Notification)) == 1
        assert db.scalar(select(func.count()).select_from(Document)) == 0
    req = a.get(f"/api/v1/requests/{req['id']}").json()
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda c: change(c, req, 'complete'), [first, second]))
    assert sorted(r.status_code for r in responses) == [200, 409]
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(RequestEvent)) == 3
        assert db.scalar(select(func.count()).select_from(Notification)) == 2
        assert db.scalar(select(func.count()).select_from(Document)) == 1


def test_parallel_create_does_not_duplicate_request_or_history(signed):
    first, second = signed('student.a'), signed('student.a')
    key = str(uuid4())
    with ThreadPoolExecutor(max_workers=2) as pool:
        records = list(pool.map(lambda c: create(c, key), [first, second]))
    assert records[0]['id'] == records[1]['id']
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(CR)) == 1
        assert db.scalar(select(func.count()).select_from(RequestEvent)) == 1


def test_reply_only_when_asked_and_no_repeat(signed):
    a, staff = signed('student.a'), signed('staff.a')
    req = create(a)
    url = f"/api/v1/requests/{req['id']}/reply"
    assert a.post(url, json={'text': 'Ответ', 'version': req['version']}).status_code == 409
    req = change(staff, req, 'start').json()
    req = change(staff, req, 'clarify', 'Вопрос').json()
    body = {'text': 'Ответ', 'version': req['version']}
    assert a.post(url, json=body).status_code == 200
    assert a.post(url, json=body).status_code == 409


def test_seed_preserves_state_and_hashes_and_profile_constraints(signed, database):
    a = signed('student.a')
    req = create(a)
    with SessionLocal() as db:
        original = db.scalar(select(User).where(User.login == 'student.a'))
        hashed = original.password_hash
        assert hashed.startswith('$argon2id$')
        assert hashed != database['student.a']
        seed(db, {login: 'ignored-password-change' for login in database})
        assert db.scalar(select(func.count()).select_from(User)) == 3
        assert db.get(CR, req['id'])
        assert original.password_hash == hashed
        other_group = db.scalar(select(Group).where(Group.id != original.group_id))
        original.group_id = other_group.id
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()
        original.course = None
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()


def test_validation_and_filters(signed):
    a, staff = signed('student.a'), signed('staff.a')
    assert a.post('/api/v1/requests', json={'purpose': '   ', 'idempotency_key': str(uuid4())}).status_code == 422
    req = create(a)
    assert len(staff.get('/api/v1/staff/requests?status=accepted').json()) == 1
    assert staff.get('/api/v1/staff/requests?status=ready').json() == []
    assert len(staff.get(f"/api/v1/staff/requests?q={req['number']}").json()) == 1
