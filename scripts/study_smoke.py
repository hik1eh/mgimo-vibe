"""Read-only T04 HTTP smoke against the seeded demo. Credentials stay in memory."""
import os
from datetime import date, timedelta
from pathlib import Path
import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / '.env')
clients = []


def signed(login, key):
    c = httpx.Client(base_url='http://127.0.0.1:8000/api/v1', timeout=10)
    clients.append(c)
    csrf = c.get('/auth/csrf').json()['csrf_token']
    c.headers.update({'Origin': os.environ['APP_ORIGIN'], 'X-CSRF-Token': csrf})
    r = c.post('/auth/login', json={'login': login, 'password': os.environ[key]})
    assert r.status_code == 200, f'Login failed: {r.status_code}'
    c.headers['X-CSRF-Token'] = r.json()['csrf_token']
    return c


try:
    a = signed('student.a', 'DEMO_STUDENT_A_PASSWORD')
    b = signed('student.b', 'DEMO_STUDENT_B_PASSWORD')
    staff = signed('staff.a', 'DEMO_STAFF_PASSWORD')
    context = a.get('/study-context').json()
    reference = date.fromisoformat(context['today'])
    monday = reference - timedelta(days=reference.weekday())
    params = {'start': monday.isoformat(), 'end': (monday + timedelta(days=6)).isoformat()}
    first = a.get('/schedule', params=params).json()
    second = b.get('/schedule', params=params).json()
    assert first and second
    assert not ({r['id'] for r in first} & {r['id'] for r in second})
    moved = next(r for r in first if r['status'] == 'moved')
    assert moved['room'] == '412' and moved['changes'][0]['before']['room'] == '305'
    assert any(r['status'] == 'cancelled' for r in first)
    assert a.get(f"/schedule/{moved['id']}").json() == moved
    assert b.get(f"/schedule/{moved['id']}").status_code == 404
    sunday = (monday + timedelta(days=6)).isoformat()
    assert a.get('/schedule', params={'start': sunday, 'end': sunday}).json() == []
    for c in [a, b]:
        results = c.get('/academic-results').json()
        assert results['summary']['closed'] == sum(r['passed'] for r in results['results'])
        assert results['summary']['total'] == len(results['results'])
        assert any(r['label'] == 'Ожидается результат' for r in results['results'])
        assert results['summary']['next_credit']['label'] == 'Предстоит зачёт'
        assert c.get('/academic-results?semester=2').json()['semester'] == 2
    assert staff.get('/schedule').status_code == 403
    assert staff.get('/academic-results').status_code == 403
    for c in clients:
        assert c.post('/auth/logout').status_code == 204
    print(f'PASS: T04; isolated schedules, 305 -> 412, cancellation, empty Sunday, semesters, real summary. Scenario {reference}.')
finally:
    for c in clients:
        c.close()
