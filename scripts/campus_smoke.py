"""T05 rehearsal: intentionally changes demo lessons and publications. Use a separate demo DB."""
import argparse
import os
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4
import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / '.env')
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base', default='http://127.0.0.1:8000')
parser.add_argument('--origin', default=os.environ['APP_ORIGIN'])
args = parser.parse_args()
clients = []


def signed(login, key):
    c = httpx.Client(base_url=args.base + '/api/v1', timeout=10)
    clients.append(c)
    token = c.get('/auth/csrf').json()['csrf_token']
    c.headers.update({'Origin': args.origin, 'X-CSRF-Token': token})
    r = c.post('/auth/login', json={'login': login, 'password': os.environ[key]})
    assert r.status_code == 200, f'Login: {r.status_code}'
    c.headers['X-CSRF-Token'] = r.json()['csrf_token']
    return c


def update(c, row, **changes):
    payload = {key: row[key] for key in ['title', 'text', 'audience', 'group_id', 'lesson_id', 'status', 'pinned', 'expires_at', 'version']}
    payload.update(changes)
    r = c.patch(f"/staff/announcements/{row['id']}", json=payload)
    assert r.status_code == 200, f'Announcement update: {r.status_code}'
    return r.json()


try:
    a = signed('student.a', 'DEMO_STUDENT_A_PASSWORD')
    b = signed('student.b', 'DEMO_STUDENT_B_PASSWORD')
    staff = signed('staff.a', 'DEMO_STAFF_PASSWORD')
    first, second = a.get('/announcements').json(), b.get('/announcements').json()
    assert len({r['id'] for r in first} & {r['id'] for r in second}) == 1
    lesson = next(r for r in staff.get('/staff/schedule').json() if r['kind'] == 'Консультация')
    r = staff.patch(f"/staff/schedule/{lesson['id']}", json={'version': lesson['version'], 'room': '412', 'reason': 'Репетиция: перенос консультации 305 → 412.'})
    assert r.status_code == 200, r.status_code
    changed = r.json()
    payload = dict(**changed['announcement_prefill'], status='draft', pinned=False, expires_at=None, idempotency_key=str(uuid4()))
    r = staff.post('/staff/announcements', json=payload)
    assert r.status_code == 201
    row = r.json()
    assert staff.post('/staff/announcements', json=payload).json()['id'] == row['id']
    assert a.get(f"/announcements/{row['id']}").status_code == 404
    row = update(staff, row, status='published')
    assert a.get(f"/announcements/{row['id']}").json()['lesson']['room'] == '412'
    assert b.get(f"/announcements/{row['id']}").status_code == 404
    row = update(staff, row, text='Репетиция: сообщение отредактировано. Актуальные сведения — в карточке занятия.')
    assert a.get(f"/announcements/{row['id']}").json()['text'] == row['text']
    r = staff.patch(f"/staff/schedule/{lesson['id']}", json={'version': changed['version'], 'room': '413',
        'starts_at': (datetime.fromisoformat(changed['starts_at']) + timedelta(minutes=30)).isoformat(),
        'ends_at': (datetime.fromisoformat(changed['ends_at']) + timedelta(minutes=30)).isoformat(), 'reason': 'Репетиция повторного переноса.'})
    assert r.status_code == 200
    linked = a.get(f"/announcements/{row['id']}").json()['lesson']
    assert linked == a.get(f"/schedule/{lesson['id']}").json() and linked['room'] == '413'
    other = next(r for r in staff.get('/staff/schedule').json() if r['status'] == 'scheduled')
    r = staff.patch(f"/staff/schedule/{other['id']}", json={'version': other['version'], 'action': 'cancel', 'reason': 'Репетиция отмены занятия.'})
    assert r.status_code == 200 and a.get(f"/schedule/{other['id']}").json()['status'] == 'cancelled'
    foreign = b.get('/schedule').json()[0]
    assert staff.patch(f"/staff/schedule/{foreign['id']}", json={'version': foreign['version'], 'room': '412', 'reason': 'Запрещённый перенос.'}).status_code == 404
    assert staff.post('/staff/announcements', json={**payload, 'idempotency_key': str(uuid4()), 'group_id': foreign['group_id'], 'lesson_id': None}).status_code == 404
    row = update(staff, row, status='withdrawn')
    assert a.get(f"/announcements/{row['id']}").status_code == 404
    for c in clients:
        assert c.post('/auth/logout').status_code == 204
    print('PASS: T05 HTTP; audiences, draft/publish/edit/withdraw, live lesson, move, cancel, isolation and replay.')
finally:
    for c in clients:
        c.close()
