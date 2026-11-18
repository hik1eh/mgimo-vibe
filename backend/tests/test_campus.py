from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from uuid import uuid4
import pytest
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from app.db import SessionLocal
from app.models import Announcement, Lesson, LessonChange, Group, User, now
from app.seed import seed


def announcement_body(**changes):
    return dict(title='Объявление для факультета', text='Вымышленная новость для теста.',
        audience='faculty', group_id=None, lesson_id=None, status='draft', pinned=False,
        expires_at=None, idempotency_key=str(uuid4()), **changes)


def body(**changes):
    data = announcement_body()
    data.update(changes)
    return data


def create(c, **changes):
    r = c.post('/api/v1/staff/announcements', json=body(**changes))
    assert r.status_code == 201, r.text
    return r.json()


def edit(c, row, **changes):
    data = {k: row[k] for k in ['title', 'text', 'audience', 'group_id', 'lesson_id', 'status', 'pinned', 'expires_at', 'version']}
    data.update(changes)
    return c.patch(f"/api/v1/staff/announcements/{row['id']}", json=data)


def consultation(c):
    return next(row for row in c.get('/api/v1/staff/schedule').json() if row['kind'] == 'Консультация')


def test_seeded_feed_audiences_direct_links_and_order(signed, client):
    a, b = signed('student.a'), signed('student.b')
    first, second = a.get('/api/v1/announcements').json(), b.get('/api/v1/announcements').json()
    assert len(first) == 7 and len(second) == 6
    assert [r['title'] for r in first if r['title'].startswith('Декабрьская сессия')] == ['Декабрьская сессия ОН-201']
    assert [r['title'] for r in second if r['title'].startswith('Декабрьская сессия')] == ['Декабрьская сессия ЦТ-202']
    common = {r['id'] for r in first} & {r['id'] for r in second}
    assert len(common) == 4
    assert all(r['audience'] == 'university' for r in first if r['id'] in common)
    group = first[0]
    assert group['pinned'] and group['audience'] == 'group'
    assert group['lesson']['room'] == '412'
    assert group['lesson']['changes'][0]['before']['room'] == '305'
    assert a.get(f"/api/v1/announcements/{group['id']}").json() == group
    denied = b.get(f"/api/v1/announcements/{group['id']}")
    assert denied.status_code == 404 and group['title'] not in denied.text
    assert b.get('/api/v1/announcements?faculty_id=1&group_id=1').json() == second
    assert client.get('/api/v1/announcements').status_code == 401


def test_publication_edit_withdraw_and_republish(signed):
    a, b, staff = signed('student.a'), signed('student.b'), signed('staff.a')
    row = create(staff)
    url = f"/api/v1/announcements/{row['id']}"
    assert a.get(url).status_code == 404
    row = edit(staff, row, status='published').json()
    assert row['published_at'] and a.get(url).status_code == 200
    assert b.get(url).status_code == 404
    row = edit(staff, row, title='Обновлённый заголовок').json()
    assert a.get(url).json()['title'] == 'Обновлённый заголовок'
    row = edit(staff, row, status='withdrawn').json()
    assert a.get(url).status_code == 404
    assert row['id'] not in {r['id'] for r in a.get('/api/v1/announcements').json()}
    row = edit(staff, row, status='published').json()
    assert a.get(url).status_code == 200


def test_future_expired_and_draft_messages_hidden_by_direct_id(signed):
    a, staff = signed('student.a'), signed('staff.a')
    expired = create(staff, status='published')
    future = create(staff, status='published')
    with SessionLocal() as db:
        row = db.get(Announcement, expired['id'])
        row.published_at = now() - timedelta(days=2)
        row.expires_at = now() - timedelta(days=1)
        db.get(Announcement, future['id']).published_at = now() + timedelta(days=1)
        db.commit()
    for row in [expired, future]:
        assert a.get(f"/api/v1/announcements/{row['id']}").status_code == 404
        assert row['id'] not in {r['id'] for r in a.get('/api/v1/announcements').json()}
    response = staff.post('/api/v1/staff/announcements', json=body(status='published', expires_at=(now() - timedelta(days=1)).isoformat()))
    assert response.status_code == 422


def test_staff_scope_audiences_and_link_validation(signed):
    a, b, staff = signed('student.a'), signed('student.b'), signed('staff.a')
    group = staff.get('/api/v1/staff/groups').json()[0]
    assert len(staff.get('/api/v1/staff/groups').json()) == 1
    other = b.get('/api/v1/me').json()
    with SessionLocal() as db:
        other_group = db.scalar(select(User).where(User.login == 'student.b')).group_id
        foreign_announcement = db.scalar(select(Announcement).where(Announcement.demo_key == 'faculty-b')).id
        common = db.scalar(select(Announcement).where(Announcement.demo_key == 'university')).id
    own_lesson = consultation(staff)
    foreign_lesson = b.get('/api/v1/schedule').json()[0]
    assert staff.post('/api/v1/staff/announcements', json=body(audience='university')).status_code == 422
    assert staff.post('/api/v1/staff/announcements', json=body(faculty_id=other['id'])).status_code == 422
    assert staff.post('/api/v1/staff/announcements', json=body(audience='group', group_id=other_group)).status_code == 404
    assert staff.post('/api/v1/staff/announcements', json=body(audience='group', group_id=group['id'], lesson_id=foreign_lesson['id'])).status_code == 404
    assert staff.post('/api/v1/staff/announcements', json=body(lesson_id=own_lesson['id'])).status_code == 422
    for announcement_id in [foreign_announcement, common]:
        assert staff.get(f'/api/v1/staff/announcements/{announcement_id}').status_code == 404
        row = create(staff)
        row['id'] = announcement_id
        assert edit(staff, row).status_code == 404


def test_group_addressing_within_same_faculty(signed):
    a, staff = signed('student.a'), signed('staff.a')
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.login == 'student.a'))
        group = Group(name='ОН-301', faculty_id=user.faculty_id)
        db.add(group); db.commit(); group_id = group.id
    own_lesson = consultation(staff)
    row = create(staff, audience='group', group_id=group_id, status='published')
    assert a.get(f"/api/v1/announcements/{row['id']}").status_code == 404
    assert staff.post('/api/v1/staff/announcements', json=body(audience='group', group_id=group_id, lesson_id=own_lesson['id'])).status_code == 422


def test_lesson_update_history_prefill_and_live_announcement(signed):
    a, b, staff = signed('student.a'), signed('student.b'), signed('staff.a')
    lesson = consultation(staff)
    response = staff.patch(f"/api/v1/staff/schedule/{lesson['id']}", json={
        'version': lesson['version'], 'room': '412', 'reason': 'Перенос консультации в другую аудиторию.'})
    assert response.status_code == 200, response.text
    changed = response.json()
    assert changed['room'] == '412' and changed['status'] == 'moved'
    assert changed['changes'][-1]['before']['room'] == '305'
    assert changed['changes'][-1]['after']['room'] == '412'
    prefill = changed['announcement_prefill']
    assert prefill['group_id'] == lesson['group_id'] and prefill['lesson_id'] == lesson['id']
    row = create(staff, **prefill, status='published')
    assert a.get(f"/api/v1/announcements/{row['id']}").json()['lesson']['room'] == '412'
    assert b.get(f"/api/v1/announcements/{row['id']}").status_code == 404
    again = staff.patch(f"/api/v1/staff/schedule/{lesson['id']}", json={
        'version': changed['version'], 'room': '413', 'building': 'Восточный корпус',
        'starts_at': '2026-11-10T16:00:00+03:00', 'ends_at': '2026-11-10T17:30:00+03:00', 'reason': 'Повторное изменение.'})
    assert again.status_code == 200
    linked = a.get(f"/api/v1/announcements/{row['id']}").json()['lesson']
    schedule = a.get(f"/api/v1/schedule/{lesson['id']}").json()
    assert linked == schedule and linked['room'] == '413'
    assert linked['building'] == 'Восточный корпус'
    cancel = staff.patch(f"/api/v1/staff/schedule/{lesson['id']}", json={
        'version': linked['version'], 'action': 'cancel', 'reason': 'Отмена консультации.'})
    assert cancel.status_code == 200
    assert a.get(f"/api/v1/announcements/{row['id']}").json()['lesson']['status'] == 'cancelled'
    assert cancel.json()['changes'][-1]['after']['status'] == 'cancelled'


def test_lesson_role_scope_csrf_and_invalid_updates(signed, client):
    a, b, staff = signed('student.a'), signed('student.b'), signed('staff.a')
    lesson = consultation(staff)
    url = f"/api/v1/staff/schedule/{lesson['id']}"
    data = {'version': lesson['version'], 'room': '412', 'reason': 'Тестовый перенос.'}
    assert client.patch(url, json=data).status_code == 401
    assert a.patch(url, json=data).status_code == 403
    assert staff.patch(url, json=data, headers={'X-CSRF-Token': ''}).status_code == 403
    assert staff.patch(url, json=data, headers={'Origin': 'https://evil.invalid'}).status_code == 403
    foreign = b.get('/api/v1/schedule').json()[0]
    assert staff.get(f"/api/v1/staff/schedule/{foreign['id']}").status_code == 404
    assert staff.patch(f"/api/v1/staff/schedule/{foreign['id']}", json=data).status_code == 404
    assert staff.patch(url, json={**data, 'group_id': 2}).status_code == 422
    assert staff.patch(url, json={**data, 'starts_at': '2026-11-10T17:00:00', 'ends_at': '2026-11-10T18:00:00'}).status_code == 422
    assert staff.patch(url, json={**data, 'starts_at': '2026-11-10T18:00:00+03:00', 'ends_at': '2026-11-10T17:00:00+03:00'}).status_code == 422
    assert staff.patch(url, json={**data, 'room': lesson['room']}).status_code == 422
    assert staff.get(url).json() == lesson


def test_parallel_lesson_update_or_cancel_is_atomic(signed):
    first, second = signed('staff.a'), signed('staff.a')
    lesson = consultation(first)
    url = f"/api/v1/staff/schedule/{lesson['id']}"
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda pair: pair[0].patch(url, json={'version': lesson['version'], 'room': pair[1], 'reason': 'Параллельный перенос.'}), [(first, '412'), (second, '413')]))
    assert sorted(r.status_code for r in responses) == [200, 409]
    current = first.get(url).json()
    assert len(current['changes']) == 1
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda c: c.patch(url, json={'version': current['version'], 'action': 'cancel', 'reason': 'Параллельная отмена.'}), [first, second]))
    assert sorted(r.status_code for r in responses) == [200, 409]
    current = first.get(url).json()
    assert len(current['changes']) == 2
    assert first.patch(url, json={'version': current['version'], 'action': 'cancel', 'reason': 'Повтор отмены.'}).status_code == 409


def test_announcement_idempotency_parallel_edit_and_csrf(signed):
    first, second, a = signed('staff.a'), signed('staff.a'), signed('student.a')
    payload = body(status='published')
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda c: c.post('/api/v1/staff/announcements', json=payload), [first, second]))
    assert all(r.status_code == 201 for r in responses)
    row = responses[0].json()
    assert row['id'] == responses[1].json()['id']
    assert first.post('/api/v1/staff/announcements', json={**payload, 'title': 'Другое сообщение'}).status_code == 409
    assert a.post('/api/v1/staff/announcements', json=payload).status_code == 403
    assert first.post('/api/v1/staff/announcements', json=body(), headers={'X-CSRF-Token': ''}).status_code == 403
    assert edit(first, row, title='Не пройдёт', faculty_id=2).status_code == 422
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda pair: edit(pair[0], row, title=pair[1]), [(first, 'Первая правка'), (second, 'Вторая правка')]))
    assert sorted(r.status_code for r in responses) == [200, 409]


def test_staff_filters_and_seed_preserves_publications(signed, database):
    staff = signed('staff.a')
    groups = staff.get('/api/v1/staff/groups').json()
    assert len(staff.get('/api/v1/staff/schedule?q=Консультация').json()) == 1
    assert staff.get('/api/v1/staff/schedule?group_id=2').status_code == 404
    for query in ['start=2026-11-15&end=2026-11-01', 'start=2026-01-01&end=2026-11-13', 'start=9999-12-31']:
        assert staff.get('/api/v1/staff/schedule?' + query).status_code == 422
    with SessionLocal() as db:
        row = db.scalar(select(Announcement).where(Announcement.demo_key == 'faculty-a'))
        row.status = 'withdrawn'; row.title = 'Сохранённая правка'
        db.commit(); seed(db, database)
        assert row.status == 'withdrawn' and row.title == 'Сохранённая правка'
        assert db.scalar(select(func.count()).select_from(Announcement)) == 9
        lesson = db.scalar(select(Lesson).where(Lesson.demo_key == 'a-moved'))
        bad = Announcement(title='Плохая связь', text='Проверка ограничений.', source='Тест', audience='group',
            faculty_id=2, group_id=groups[0]['id'], lesson_id=lesson.id, status='draft')
        db.add(bad)
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()
