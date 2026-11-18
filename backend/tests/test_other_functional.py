from io import BytesIO
from uuid import uuid4

import pytest
from pypdf import PdfReader

from app.db import SessionLocal
from app.seed import seed


API = '/api/v1'


def submit(client, kind, purpose='Вымышленная организация'):
    response = client.post(f'{API}/requests', json={
        'kind': kind, 'purpose': purpose, 'idempotency_key': str(uuid4()),
    })
    assert response.status_code == 201, response.text
    return response.json()


def transition(staff, record, action, text=''):
    return staff.post(f"{API}/staff/requests/{record['id']}/transitions",
                      json=dict(action=action, version=record['version'], text=text))


@pytest.mark.parametrize(('kind', 'prefix', 'title'), [
    ('practice', 'СП', 'СПРАВКА ДЛЯ СТАЖИРОВКИ ИЛИ ПРАКТИКИ'),
    ('military', 'СВ', 'СПРАВКА ДЛЯ ВОЕНКОМАТА'),
    ('retake', 'НП', 'НАПРАВЛЕНИЕ НА ПЕРЕСДАЧУ'),
])
def test_typed_document_is_issued_to_its_owner(signed, kind, prefix, title):
    student, stranger, staff = map(signed, ['student.a', 'student.b', 'staff.a'])
    record = submit(student, kind, 'Учебный центр <Север>')
    assert record['number'].startswith(prefix + '-') and record['has_document']
    assert record['kind'] == kind and record['document_url'] is None
    assert transition(staff, record, 'start').status_code == 200
    staff_path = f"{API}/staff/requests/{record['id']}"
    ready = transition(staff, staff.get(staff_path).json(), 'complete')
    assert ready.status_code == 200
    pdf_path = ready.json()['document_url']
    assert student.get(f"{API}/requests/{record['id']}").json()['status'] == 'ready'
    assert stranger.get(f"{API}/requests/{record['id']}").status_code == 404
    assert stranger.get(pdf_path).status_code == 404
    document = student.get(pdf_path)
    assert document.status_code == 200 and document.headers['content-type'] == 'application/pdf'
    contents = ' '.join(' '.join(page.extract_text() for page in PdfReader(BytesIO(document.content)).pages).split())
    assert title in contents and 'ДЕМОНСТРАЦИОННЫЙ ОБРАЗЕЦ' in contents
    assert 'Учебный центр <Север>' in contents


@pytest.mark.parametrize(('kind', 'notice'), [
    ('dean_message', 'Деканат ответил на обращение'),
    ('academic_leave', 'Деканат рассмотрел заявление'),
])
def test_text_reply_closes_the_request_without_a_pdf(signed, kind, notice):
    owner, stranger, staff = map(signed, ['student.a', 'student.b', 'staff.a'])
    record = submit(owner, kind, 'Текст демонстрационного запроса')
    forbidden = submit(stranger, kind)
    queue = staff.get(f'{API}/staff/requests', params={'kind': kind}).json()
    assert [row['id'] for row in queue] == [record['id']]
    assert transition(staff, forbidden, 'start').status_code == 404
    detail = f"{API}/requests/{record['id']}"
    started = transition(staff, record, 'start').json()
    assert transition(staff, started, 'complete', '  ').status_code == 422
    clarification = transition(staff, started, 'clarify', 'Уточните даты.').json()
    assert stranger.post(detail + '/reply', json={'version': clarification['version'], 'text': 'Ответ'}).status_code == 404
    answered = owner.post(detail + '/reply', json={'version': clarification['version'], 'text': 'Уточнение ученика'}).json()
    response = transition(staff, answered, 'complete', 'Ответ деканата сохранён в карточке.')
    assert response.status_code == 200, response.text
    result = owner.get(detail).json()
    assert result['status'] == 'ready' and not result['has_document'] and result['document_url'] is None
    assert result['events'][-1]['text'] == 'Ответ деканата сохранён в карточке.'
    assert result['events'][-1]['role'] == 'staff'
    assert owner.get(detail + '/document').status_code == 404
    assert owner.get(f'{API}/notifications').json()[0]['title'] == notice


def test_catalog_validation_and_submission_key_include_kind(signed):
    student = signed('student.a')
    assert [row['kind'] for row in student.get(f'{API}/request-types').json()] == [
        'study', 'practice', 'military', 'retake', 'academic_leave', 'dean_message',
    ]
    data = dict(purpose='Демонстрационный запрос', idempotency_key=str(uuid4()), kind='dean_message')
    path = f'{API}/requests'
    accepted = student.post(path, json=data)
    assert accepted.status_code == 201
    assert student.post(path, json=data).json()['id'] == accepted.json()['id']
    assert student.post(path, json=dict(data, kind='academic_leave')).status_code == 409
    assert student.post(path, json=dict(data, kind='unknown')).status_code == 422


def test_teacher_directory_follows_student_group(signed):
    a, b, staff, teacher = map(signed, ['student.a', 'student.b', 'staff.a', 'teacher.a'])
    path = f'{API}/teachers'
    directory, other = a.get(path).json(), b.get(path).json()
    assert len(directory) == len(other) == 7
    lina = next(person for person in directory if person['full_name'] == 'Лазурная Елена Андреевна')
    assert lina['subjects'] == ['Консультация по социологии', 'Социология повседневности']
    assert lina['work_email'] == 'e.lazurnaya@north-campus.example'
    assert {p['id'] for p in directory}.isdisjoint(p['id'] for p in other)
    assert all(len(person['full_name'].split()) == 3 and person['work_email'].endswith('.example') for person in other)
    assert staff.get(path).status_code == teacher.get(path).status_code == 403


def test_teacher_marks_are_private_versioned_and_persistent(signed, database):
    student, stranger, staff, teacher = map(signed, ['student.a', 'student.b', 'staff.a', 'teacher.a'])
    path = f'{API}/teaching/lessons'
    assert teacher.get(f'{API}/me').json()['role'] == 'teacher'
    for private in ['/requests', '/staff/requests', '/schedule', '/academic-results']:
        assert teacher.get(API + private).status_code == 403

    own_id = student.get(f'{API}/me').json()['id']
    other_id = stranger.get(f'{API}/me').json()['id']
    taught = teacher.get(path).json()
    assert taught and {lesson['teacher'] for lesson in taught} == {'Елена Лазурная'}
    lesson = next(row for row in taught if row['status'] == 'moved')
    foreign = next(row for row in student.get(f'{API}/schedule').json() if row['teacher_id'] != lesson['teacher_id'])
    detail = f"{path}/{lesson['id']}"
    assert teacher.get(f"{path}/{foreign['id']}").status_code == 404
    assert staff.get(detail).status_code == student.get(detail).status_code == 403
    assert [row['student_id'] for row in teacher.get(detail).json()['roster']] == [own_id]
    mark_path = detail + f'/journal/{own_id}'
    scores_path = f'{API}/academic-results?semester=3'
    stranger_before = stranger.get(scores_path).json()['engagement']
    version = teacher.get(detail).json()['roster'][0]['version']
    data = dict(attendance='absent', checkpoint='pending', version=version)
    assert student.put(mark_path, json=data).status_code == 403
    assert staff.put(mark_path, json=data).status_code == 403
    assert teacher.put(mark_path, json=data, headers={'X-CSRF-Token': ''}).status_code == 403
    assert teacher.put(detail + f'/journal/{other_id}', json=data).status_code == 404
    assert teacher.put(f"{path}/{foreign['id']}/journal/{own_id}", json=data).status_code == 404
    reply = teacher.put(mark_path, json=data)
    assert reply.status_code == 200, reply.text
    marked = reply.json()
    assert marked['version'] == version + 1
    assert teacher.put(mark_path, json=data).json() == marked
    assert teacher.put(mark_path, json=dict(data, attendance='present')).status_code == 409
    assert student.get(scores_path).json()['engagement'] == {
        'present': 0, 'absent': 1, 'completed': 0, 'pending': 1,
        'subjects': [{'subject': lesson['subject'], 'present': 0, 'absent': 1, 'completed': 0, 'pending': 1}],
    }
    assert student.get(f'{API}/academic-results?semester=2').json()['engagement']['subjects'] == []
    assert stranger.get(scores_path, params={'student_id': own_id, 'semester': 3}).json()['engagement'] == stranger_before

    cleared = teacher.put(mark_path, json=dict(attendance=None, checkpoint=None, version=marked['version'])).json()
    assert cleared['version'] == marked['version'] + 1
    with SessionLocal() as db:
        seed(db, database)
    assert teacher.get(detail).json()['roster'][0] == cleared
    assert student.get(scores_path).json()['engagement']['subjects'] == []


def test_cancellation_excludes_marks_and_closes_journal(signed):
    student, staff, teacher = map(signed, ['student.a', 'staff.a', 'teacher.a'])
    row = next(item for item in teacher.get(f'{API}/teaching/lessons').json() if item['status'] == 'moved')
    response = staff.patch(f"{API}/staff/schedule/{row['id']}",
                           json=dict(action='cancel', reason='Проверка отмены', version=row['version']))
    assert response.status_code == 200, response.text
    detail = f"{API}/teaching/lessons/{row['id']}"
    entry = teacher.get(detail).json()['roster'][0]
    response = teacher.put(detail + f"/journal/{entry['student_id']}",
                            json=dict(attendance='absent', checkpoint='pending', version=entry['version']))
    assert response.status_code == 409
    assert student.get(f'{API}/academic-results').json()['engagement']['subjects'] == []
