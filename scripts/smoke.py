"""Exercise a running server with three isolated cookie jars; never print credentials."""
import argparse
import os
from pathlib import Path
from uuid import uuid4
import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / '.env')
parser = argparse.ArgumentParser()
parser.add_argument('--base', default='http://127.0.0.1:8000')
parser.add_argument('--save-pdf', action='store_true')
args = parser.parse_args()
origin = os.environ['APP_ORIGIN']
clients = []


def signed(login, password_key):
    c = httpx.Client(base_url=args.base + '/api/v1', timeout=10)
    token = c.get('/auth/csrf').json()['csrf_token']
    c.headers.update({'Origin': origin, 'X-CSRF-Token': token})
    response = c.post('/auth/login', json={'login': login, 'password': os.environ[password_key]})
    assert response.status_code == 200, f'Login {login}: {response.status_code}'
    c.headers['X-CSRF-Token'] = response.json()['csrf_token']
    clients.append(c)
    return c


def change(c, req, action, text=''):
    r = c.post(f"/staff/requests/{req['id']}/transitions", json={'action': action, 'version': req['version'], 'text': text})
    assert r.status_code == 200, f'Transition {action}: {r.status_code}'
    return r.json()


try:
    a = signed('student.a', 'DEMO_STUDENT_A_PASSWORD')
    b = signed('student.b', 'DEMO_STUDENT_B_PASSWORD')
    staff = signed('staff.a', 'DEMO_STAFF_PASSWORD')
    assert a.get('/me').json()['faculty'] != b.get('/me').json()['faculty']
    body = {'purpose': 'Демонстрационная проверка — по месту требования', 'idempotency_key': str(uuid4())}
    response = a.post('/requests', json=body)
    assert response.status_code == 201
    req = response.json()
    assert a.post('/requests', json=body).json()['id'] == req['id']
    assert a.get(f"/requests/{req['id']}").json()['number'] == req['number']
    req = change(staff, req, 'start')
    req = change(staff, req, 'clarify', 'Для какой организации нужна справка?')
    r = a.post(f"/requests/{req['id']}/reply", json={'text': 'Для вымышленного учебного центра «Орбита».', 'version': req['version']})
    assert r.status_code == 200
    req = change(staff, r.json(), 'complete')
    pdf = a.get(f"/requests/{req['id']}/document")
    assert pdf.status_code == 200 and pdf.content.startswith(b'%PDF')
    if args.save_pdf:
        (ROOT / 'artifacts').mkdir(exist_ok=True)
        (ROOT / 'artifacts/demo-certificate.pdf').write_bytes(pdf.content)
    assert b.get(f"/requests/{req['id']}").status_code == 404
    assert b.get(f"/requests/{req['id']}/document").status_code == 404
    notice = next(n for n in a.get('/notifications').json() if n['request_id'] == req['id'])
    assert b.get(f"/notifications/{notice['id']}").status_code == 404
    assert a.patch(f"/notifications/{notice['id']}").json()['read']
    rb = b.post('/requests', json={'purpose': 'Проверка другого факультета', 'idempotency_key': str(uuid4())}).json()
    assert staff.get(f"/staff/requests/{rb['id']}").status_code == 404
    for c in clients:
        assert c.post('/auth/logout').status_code == 204
        assert c.get('/me').status_code == 401
    print(f"PASS: {req['number']}; three logins, clarification, reply, ready, PDF, notifications, isolation, logout.")
    print('Creates demo requests intentionally. Does not reset existing data.')
finally:
    for c in clients:
        c.close()
