from fastapi.testclient import TestClient
from app.config import settings
from app.main import app


def test_https_cookie_flags_and_revocation(monkeypatch, database):
    # This verifies the production cookie contract; public TLS still needs an external deployment.
    monkeypatch.setattr(settings, 'cookie_secure', True)
    monkeypatch.setattr(settings, 'app_origin', 'https://testserver')
    with TestClient(app, base_url='https://testserver') as client:
        response = client.get('/api/v1/auth/csrf')
        pre_cookie = response.headers['set-cookie'].lower()
        assert 'httponly' in pre_cookie and 'secure' in pre_cookie and 'samesite=strict' in pre_cookie
        client.headers.update({'Origin': 'https://testserver', 'X-CSRF-Token': response.json()['csrf_token']})
        response = client.post('/api/v1/auth/login', json={'login': 'student.a', 'password': database['student.a']})
        assert response.status_code == 200
        cookie = next(v.lower() for v in response.headers.get_list('set-cookie') if v.startswith('dekanat_session='))
        assert 'httponly' in cookie and 'secure' in cookie and 'samesite=lax' in cookie
        assert client.get('/api/v1/me').status_code == 200
        client.headers['X-CSRF-Token'] = response.json()['csrf_token']
        original = dict(client.cookies)
        assert client.post('/api/v1/auth/logout').status_code == 204
        client.cookies.update(original)
        assert client.get('/api/v1/me').status_code == 401
