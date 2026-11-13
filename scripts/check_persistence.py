"""Keep a browser-like cookie jar in memory while the operator restarts the API."""
import os
from pathlib import Path
import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / '.env')
with httpx.Client(base_url='http://127.0.0.1:8000/api/v1', timeout=10) as client:
    token = client.get('/auth/csrf').json()['csrf_token']
    client.headers.update({'Origin': os.environ['APP_ORIGIN'], 'X-CSRF-Token': token})
    login = client.post('/auth/login', json={'login': 'student.a', 'password': os.environ['DEMO_STUDENT_A_PASSWORD']})
    assert login.status_code == 200
    client.headers['X-CSRF-Token'] = login.json()['csrf_token']
    profile = client.get('/me').json()
    requests = client.get('/requests').json()
    assert requests, 'Run smoke.py first.'
    notifications = client.get('/notifications').json()
    print('READY: restart the API and PostgreSQL, then press Enter.', flush=True)
    input()
    assert client.get('/me').json() == profile
    assert client.get('/requests').json() == requests
    assert client.get('/notifications').json() == notifications
    for req in requests:
        if req['status'] == 'ready':
            doc = client.get(f"/requests/{req['id']}/document")
            assert doc.status_code == 200 and doc.content.startswith(b'%PDF')
    assert client.post('/auth/logout').status_code == 204
    print('PASS: session, profile, requests, notifications and PDF survived restart.', flush=True)
