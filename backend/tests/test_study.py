from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
import pytest
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from app.db import SessionLocal
from app.models import AcademicResult, Lesson, LessonChange, StudyScenario, User
from app.seed import seed
from app.campus_map import room_for, teacher_for

MOSCOW = ZoneInfo('Europe/Moscow')
WEEK = '?start=2026-11-09&end=2026-11-15'


def test_schedule_scope_and_direct_foreign_lesson(signed, client):
    a, b, staff = signed('student.a'), signed('student.b'), signed('staff.a')
    first = a.get('/api/v1/schedule' + WEEK).json()
    second = b.get('/api/v1/schedule' + WEEK).json()
    for lessons in (first, second):
        assert len(lessons) >= 15
        assert len({row['teacher_id'] for row in lessons}) >= 6
        unique_days = {datetime.fromisoformat(row['starts_at']).astimezone(MOSCOW).date() for row in lessons}
        assert unique_days == {date(2026, 11, 9) + timedelta(days=i) for i in range(5)}
        assert all(previous['ends_at'] <= current['starts_at'] for previous, current in zip(lessons, lessons[1:]))
    assert {r['group'] for r in first} == {'ОН-201'}
    assert {r['group'] for r in second} == {'ЦТ-202'}
    assert not ({r['id'] for r in first} & {r['id'] for r in second})
    foreign = b.get(f"/api/v1/schedule/{first[0]['id']}")
    assert foreign.status_code == 404 and first[0]['subject'] not in foreign.text
    assert b.get('/api/v1/schedule' + WEEK + '&group_id=1').json() == second
    for path in ['/study-context', '/schedule', f"/schedule/{first[0]['id']}", '/academic-results']:
        assert client.get('/api/v1' + path).status_code == 401
        assert staff.get('/api/v1' + path).status_code == 403


def test_today_empty_day_and_range_validation(signed):
    a = signed('student.a')
    assert a.get('/api/v1/study-context').json()['today'] == '2026-11-13'
    today = a.get('/api/v1/schedule').json()
    assert len(today) == 3
    assert len(a.get('/api/v1/schedule?start=2026-11-16&end=2026-11-20').json()) == 15
    assert a.get('/api/v1/schedule?start=2026-11-15&end=2026-11-15').json() == []
    for query in ['start=2026-11-15&end=2026-11-13', 'start=2026-11-01&end=2026-12-02', 'start=invalid', 'start=9999-12-31']:
        assert a.get('/api/v1/schedule?' + query).status_code == 422


def test_moscow_day_boundaries(signed):
    a = signed('student.a')
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.login == 'student.a'))
        instructor = teacher_for(db, 'Нина Озёрная')
        place = room_for(db, 'Северный корпус', '101')
        ids = []
        for day, hour, minute in [(12, 23, 30), (13, 0, 15), (13, 23, 30), (14, 0, 15)]:
            start = datetime(2026, 11, day, hour, minute, tzinfo=MOSCOW)
            row = Lesson(group_id=user.group_id, subject='Пограничная консультация', instructor=instructor,
                         kind='Консультация', starts_at=start, ends_at=start + timedelta(minutes=20),
                         place=place)
            db.add(row)
            db.flush()
            ids.append(row.id)
        db.commit()
    records = a.get('/api/v1/schedule?start=2026-11-13&end=2026-11-13').json()
    actual = {r['id'] for r in records}
    assert ids[1] in actual and ids[2] in actual
    assert ids[0] not in actual and ids[3] not in actual


def test_move_cancel_and_consultation_are_consistent(signed):
    a = signed('student.a')
    records = a.get('/api/v1/schedule' + WEEK).json()
    moved = next(r for r in records if r['status'] == 'moved')
    assert moved['room'] == '412'
    assert moved['changes'][0]['before']['room'] == '305'
    assert moved['changes'][0]['after']['room'] == '412'
    assert moved['teacher'] and moved['starts_at'] and moved['ends_at'] and moved['building']
    assert a.get(f"/api/v1/schedule/{moved['id']}").json() == moved
    cancelled = next(r for r in records if r['status'] == 'cancelled')
    assert cancelled['changes'][0]['before']['status'] == 'scheduled'
    assert cancelled['changes'][0]['after']['status'] == 'cancelled'
    consultation = next(r for r in records if r['kind'] == 'Консультация')
    assert consultation['room'] == '305' and consultation['status'] == 'scheduled'


def test_results_scope_summary_labels_and_semesters(signed):
    a, b = signed('student.a'), signed('student.b')
    result = a.get('/api/v1/academic-results').json()
    other = b.get('/api/v1/academic-results').json()
    assert result['semesters'] == [3, 2] and result['semester'] == 3
    assert result['summary']['closed'] == 2 and result['summary']['total'] == 4
    assert result['summary']['awaiting'] == 1
    assert result['session_period'] == {'start': '2026-11-10', 'end': '2026-11-18'}
    assert result['summary']['next_credit']['subject'] == 'Социология повседневности'
    assert other['summary']['next_credit']['subject'] == 'Алгоритмы и структуры данных'
    assert not ({r['id'] for r in result['results']} & {r['id'] for r in other['results']})
    assert not ({r['subject'] for r in result['results']} & {r['subject'] for r in other['results']})
    assert a.get('/api/v1/academic-results?student_id=2').json() == result
    awaiting = next(r for r in result['results'] if r['status'] == 'awaiting')
    assert awaiting['grade'] is None and awaiting['label'] == 'Ожидается результат' and not awaiting['passed']
    assert result['summary']['next_credit']['label'] == 'Предстоит зачёт'
    assert any(r['label'] == 'Зачёт получен' for r in result['results'])
    previous = a.get('/api/v1/academic-results?semester=2').json()
    assert previous['summary'] == dict(closed=1, total=1, awaiting=0, next_credit=None, next_control=None)
    assert previous['results'][0]['subject'] == 'Иностранный язык'
    empty = a.get('/api/v1/academic-results?semester=9').json()
    assert empty['results'] == [] and empty['summary']['total'] == 0
    for semester in ['0', '13', 'invalid']:
        assert a.get('/api/v1/academic-results?semester=' + semester).status_code == 422


def test_summary_uses_passing_results_and_next_future_credit(signed):
    a = signed('student.a')
    with SessionLocal() as db:
        exam = db.scalar(select(AcademicResult).where(AcademicResult.demo_key == 'a-exam'))
        exam.grade = 2
        user = db.scalar(select(User).where(User.login == 'student.a'))
        for offset in [-2, 1, 8]:
            db.add(AcademicResult(student_id=user.id, subject=f'Дополнительный зачёт {offset}', semester=3,
                kind='credit', status='upcoming', control_at=datetime(2026, 11, 13, 10, tzinfo=MOSCOW) + timedelta(days=offset)))
        db.commit()
    result = a.get('/api/v1/academic-results').json()
    assert result['summary']['closed'] == 1 and result['summary']['total'] == 7
    assert result['summary']['next_credit']['subject'] == 'Дополнительный зачёт 1'
    assert any(r['label'] == 'Не сдано · 2' and not r['passed'] for r in result['results'])
    with SessionLocal() as db:
        db.scalar(select(AcademicResult).where(AcademicResult.demo_key == 'a-credit')).credit_passed = False
        db.commit()
    result = a.get('/api/v1/academic-results').json()
    assert result['summary']['closed'] == 0
    assert any(r['label'] == 'Зачёт не получен' for r in result['results'])


@pytest.mark.parametrize('changes', [
    {'kind': 'exam', 'status': 'published', 'grade': None},
    {'kind': 'exam', 'status': 'published', 'grade': 6},
    {'kind': 'credit', 'status': 'published', 'credit_passed': None},
    {'kind': 'credit', 'status': 'awaiting', 'grade': 5},
    {'kind': 'exam', 'status': 'upcoming', 'grade': 5},
    {'semester': 0},
])
def test_result_constraints(changes):
    with SessionLocal() as db:
        row = db.scalar(select(AcademicResult).where(AcademicResult.demo_key == 'a-upcoming'))
        for key, value in changes.items():
            setattr(row, key, value)
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()


def test_invalid_lesson_time_rejected():
    with SessionLocal() as db:
        row = db.scalar(select(Lesson))
        row.ends_at = row.starts_at
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()


def test_study_seed_preserves_date_changes_and_counts(database):
    with SessionLocal() as db:
        consultation = db.scalar(select(Lesson).where(Lesson.demo_key == 'a-consultation'))
        consultation.place = room_for(db, 'Северный корпус', '501')
        moved = db.scalar(select(Lesson).where(Lesson.demo_key == 'a-moved'))
        starts_at = moved.starts_at + timedelta(hours=7)
        moved.starts_at = starts_at
        moved.ends_at += timedelta(hours=7)
        result = db.scalar(select(AcademicResult).where(AcademicResult.demo_key == 'a-exam'))
        result.grade = 3
        lessons_before = set(db.scalars(select(Lesson.id)))
        db.commit()
        seed(db, database, demo_date=date(2030, 1, 1))
        assert db.get(StudyScenario, 1).reference_date == date(2026, 11, 13)
        assert set(db.scalars(select(Lesson.id))) == lessons_before
        assert db.scalar(select(func.count()).select_from(LessonChange)) == 2
        assert db.scalar(select(func.count()).select_from(AcademicResult)) == 10
        assert consultation.place.number == '501' and result.grade == 3
        assert moved.starts_at == starts_at
