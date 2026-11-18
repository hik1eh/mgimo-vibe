"""Check the running local demo without changing application records.

Only authentication sessions are created and revoked. Never print credentials.
Run with the backend virtualenv; dependencies come from requirements.lock.
"""
import argparse
from contextlib import ExitStack
from datetime import date, datetime, timedelta
import json
import os
from pathlib import Path
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
ACCOUNTS = {
    'student.a': ('DEMO_STUDENT_A_PASSWORD', 'student'),
    'student.b': ('DEMO_STUDENT_B_PASSWORD', 'student'),
    'staff.a': ('DEMO_STAFF_PASSWORD', 'staff'),
    'teacher.a': ('DEMO_TEACHER_PASSWORD', 'teacher'),
}


def local_url(value):
    parts = urlsplit(value)
    if (parts.scheme != 'http' or parts.hostname not in {'localhost', '127.0.0.1', '::1'}
            or parts.username or parts.password or parts.path not in {'', '/'}
            or parts.query or parts.fragment):
        raise argparse.ArgumentTypeError('Use a local HTTP origin only, e.g. http://localhost:8000')
    return value.rstrip('/')


def check_demo(base, origin):
    checks, warnings, clients, profiles = [], [], {}, {}

    def require(condition, label):
        if not condition:
            raise RuntimeError(label)
        checks.append(label)

    def get(client, path, status=200, **kwargs):
        response = client.get('/api/v1' + path, **kwargs)
        require(response.status_code == status, f'GET {path}: HTTP {status}')
        return response.json() if status == 200 else None

    with ExitStack() as stack:
        guest = stack.enter_context(httpx.Client(base_url=base, timeout=15, trust_env=False))
        require(get(guest, '/health')['status'] == 'ok', 'Database health is OK')
        get(guest, '/me', 401)
        home = guest.get('/today')
        require(home.status_code == 200 and 'id="root"' in home.text, 'SPA /today is available')
        try:
            for login, (key, role) in ACCOUNTS.items():
                if not os.environ.get(key):
                    if role == 'teacher':
                        warnings.append('Teacher account is disabled. Add DEMO_TEACHER_PASSWORD to enable the journal.')
                        continue
                    raise RuntimeError(f'Missing environment variable: {key}')
                client = stack.enter_context(httpx.Client(base_url=base, timeout=15, trust_env=False))
                csrf = get(client, '/auth/csrf')['csrf_token']
                client.headers.update({'Origin': origin, 'X-CSRF-Token': csrf})
                response = client.post('/api/v1/auth/login', json={
                    'login': login, 'password': os.environ[key]})
                require(response.status_code == 200, f'{login}: login succeeds')
                clients[login] = client
                client.headers['X-CSRF-Token'] = response.json()['csrf_token']
                profile = get(client, '/me')
                require(profile['login'] == login and profile['role'] == role, f'{login}: correct profile')
                profiles[login] = profile
            a, b, staff = (clients[name] for name in ('student.a', 'student.b', 'staff.a'))
            require(profiles['student.a']['faculty'] != profiles['student.b']['faculty'], 'Student faculties differ')
            require(profiles['staff.a']['faculty'] == profiles['student.a']['faculty'], 'Staff belongs to faculty A')
            if teacher := clients.get('teacher.a'):
                lessons = get(teacher, '/teaching/lessons')
                require(bool(lessons), 'Teacher has assigned lessons')
                get(a, '/teaching/lessons', 403)
                get(teacher, '/staff/requests', 403)
            require(len(get(a, '/request-types')) == 6, 'Six request types are available')
            require(all(row['work_email'] for row in get(a, '/teachers')), 'Directory entries have work email')
            notices = guest.get('/assets/third-party-notices.txt')
            require(notices.status_code == 200 and 'Permission is hereby granted' in notices.text,
                    'Frontend license notices are served')
            context = get(a, '/study-context')
            reference = date.fromisoformat(context['today'])
            monday = reference - timedelta(days=reference.weekday())
            params = {'start': monday.isoformat(), 'end': (monday + timedelta(days=6)).isoformat()}
            schedules = [get(client, '/schedule', params=params) for client in (a, b)]
            require(all(schedules) and not ({r['id'] for r in schedules[0]} & {r['id'] for r in schedules[1]}),
                    'Both groups have separate schedules')
            get(b, f"/schedule/{schedules[0][0]['id']}", 404)
            get(staff, '/schedule', 403)
            consultation = next((row for row in schedules[0] if row['subject'] == 'Консультация по социологии'), None)
            if not consultation or consultation['room'] != '305' or consultation['status'] != 'scheduled':
                warnings.append('Consultation is already changed; use the isolated QA reset for a fresh 305 -> 412 rehearsal.')
            sunday = (monday + timedelta(days=6)).isoformat()
            require(get(a, '/schedule', params={'start': sunday, 'end': sunday}) == [], 'Sunday is empty')
            feeds = [get(client, '/announcements') for client in (a, b)]
            common = [{r['id'] for r in feed if r['audience'] == 'university'} for feed in feeds]
            require(bool(common[0] & common[1]), 'Both students see a shared university announcement')
            targeted = next((r for r in feeds[0] if r['audience'] == 'group'), None)
            if targeted:
                get(b, f"/announcements/{targeted['id']}", 404)
            else:
                warnings.append('No active group announcement for A; publish one during the demo.')
            for client in (a, b):
                results = get(client, '/academic-results')
                require(results['summary']['closed'] == sum(r['passed'] for r in results['results']),
                        'Academic summary matches its records')
                require(any(r['status'] == 'awaiting' for r in results['results'])
                        and results['summary']['next_credit'] is not None, 'Upcoming credit and awaiting result exist')
                get(client, '/requests')
                get(client, '/notifications')
            for path in ['/staff/requests', '/staff/schedule', '/staff/announcements', '/staff/groups']:
                get(staff, path)
                get(a, path, 403)
        finally:
            for login, client in clients.items():
                response = client.post('/api/v1/auth/logout')
                require(response.status_code == 204, f'{login}: logout succeeds')
                get(client, '/me', 401)
    return {'checked_at': datetime.now(ZoneInfo('Europe/Moscow')).isoformat(),
            'base_url': base, 'status': 'pass', 'checks': checks, 'warnings': warnings,
            'scenario_date': reference.isoformat(),
            'scope': 'Local readiness only; full write workflows are tested separately in QA.'}


def main():
    load_dotenv(ROOT / '.env')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', type=local_url, default='http://localhost:8000')
    parser.add_argument('--origin', type=local_url, default=os.environ.get('APP_ORIGIN', 'http://localhost:8000'))
    parser.add_argument('--output', type=Path, default=ROOT / 'artifacts/t07/local-readiness.json')
    args = parser.parse_args()
    try:
        report = check_demo(args.base, args.origin)
    except (RuntimeError, httpx.HTTPError, KeyError, ValueError) as error:
        # Do not emit response bodies, cookie jars, URLs with credentials or raw exceptions.
        label = str(error) if isinstance(error, RuntimeError) else type(error).__name__
        raise SystemExit(f'FAIL: {label}') from None
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"PASS: {len(report['checks'])} local readiness checks; {len(report['warnings'])} warnings. Report: {args.output}")


if __name__ == '__main__':
    main()
