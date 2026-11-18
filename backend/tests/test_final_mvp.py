from uuid import uuid4


def test_contacts_are_validated_and_private(signed):
    a, b, staff = signed('student.a'), signed('student.b'), signed('staff.a')
    path = '/api/v1/me/contacts'
    data = dict(contact_email='student.a@example.test', contact_phone='+7 (000) 123-45-67')
    assert a.patch(path, json=data, headers={'X-CSRF-Token': ''}).status_code == 403
    assert a.patch(path, json={**data, 'group_id': 2}).status_code == 422
    assert a.patch(path, json={**data, 'contact_email': 'bad'}).status_code == 422
    assert a.patch(path, json={**data, 'contact_phone': '123'}).status_code == 422
    assert a.patch(path, json=data).status_code == 200
    assert a.get('/api/v1/me').json()['contact_email'] == data['contact_email']
    assert b.get('/api/v1/me').json()['contact_email'] is None
    assert staff.patch(path, json=data).status_code == 403
    req = a.post('/api/v1/requests', json=dict(purpose='Учебный центр', idempotency_key=str(uuid4()))).json()
    assert 'contact_email' not in staff.get(f"/api/v1/staff/requests/{req['id']}").json()['student']


def test_route_uses_current_room_and_notification_scope(signed):
    a, b, staff = signed('student.a'), signed('student.b'), signed('staff.a')
    rows = staff.get('/api/v1/staff/schedule').json()
    lesson = next(row for row in rows if row['room'] == '305')
    path = f"/api/v1/schedule/{lesson['id']}/route"
    assert [s['floor'] for s in a.get(path).json()['segments']] == [1, 3]
    update_path = f"/api/v1/staff/schedule/{lesson['id']}"
    moved = staff.patch(update_path, json=dict(version=lesson['version'], room='412', reason='Уточнили аудиторию')).json()
    assert moved['room_id'] != lesson['room_id'] and moved['teacher_id'] == lesson['teacher_id']
    route = a.get(path).json()
    assert route['lesson']['room_id'] == moved['room_id']
    assert [s['floor'] for s in route['segments']] == [1, 4]
    assert route['segments'][0]['points'][0] == [340, 336]
    assert route['segments'][1]['points'][-1] == [598, 184]
    assert route['segments'][1]['end'] == 'Аудитория 412'
    assert b.get(path).status_code == 404
    assert staff.get(path).status_code == 403
    notice = next(item for item in a.get('/api/v1/notifications').json() if item['lesson_id'] == lesson['id'])
    assert notice['kind'] == 'lesson' and not notice['read']
    assert b.get(f"/api/v1/notifications/{notice['id']}").status_code == 404
    assert a.post('/api/v1/notifications/read-all').status_code == 204
    assert a.get(f"/api/v1/notifications/{notice['id']}").json()['read']
    assert staff.patch(update_path, json=dict(version=moved['version'], action='cancel', reason='Пара отменена')).status_code == 200
    result = a.get(path).json()
    assert not result['lesson']['has_route'] and not result['segments']


def test_published_announcement_notice_tracks_visibility(signed):
    a, b, staff = signed('student.a'), signed('student.b'), signed('staff.a')
    group = staff.get('/api/v1/staff/groups').json()[0]
    data = dict(title='Практикум группы', text='Приходите в учебный корпус.', fact='В среду в 10:00',
                audience='group', group_id=group['id'], status='published')
    created = staff.post('/api/v1/staff/announcements', json={**data, 'idempotency_key': str(uuid4())}).json()
    assert a.get(f"/api/v1/announcements/{created['id']}").json()['fact'] == data['fact']
    notice = next(n for n in a.get('/api/v1/notifications').json() if n['announcement_id'] == created['id'])
    assert notice['available'] and notice['title'] == data['title']
    assert all(n['announcement_id'] != created['id'] for n in b.get('/api/v1/notifications').json())
    assert staff.patch(f"/api/v1/staff/announcements/{created['id']}",
                       json={**data, 'status': 'withdrawn', 'version': created['version']}).status_code == 200
    stale = a.get(f"/api/v1/notifications/{notice['id']}").json()
    assert not stale['available'] and stale['title'] == 'Объявление недоступно'


def test_staff_academic_scope_has_no_student_records(signed):
    a, b, staff = signed('student.a'), signed('student.b'), signed('staff.a')
    path = '/api/v1/staff/academic-results'
    result = staff.get(path).json()
    group_b = b.get('/api/v1/me').json()['group_id']
    assert result['subjects'] and {r['group'] for r in result['subjects']} == {'ОН-201'}
    assert all('student_id' not in r and 'grade' not in r for r in result['subjects'])
    assert staff.get(path, params={'group_id': group_b}).status_code == 404
    assert a.get(path).status_code == 403
