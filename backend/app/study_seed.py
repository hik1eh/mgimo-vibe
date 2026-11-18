from datetime import datetime, time, timedelta
from sqlalchemy import select
from .config import settings
from .models import StudyScenario, Lesson, LessonChange, AcademicResult, User
from .study import MOSCOW
from .campus_map import room_for, teacher_for


def snapshot(lesson):
    return dict(starts_at=lesson.starts_at.isoformat(), ends_at=lesson.ends_at.isoformat(),
                building=lesson.place.building, room=lesson.place.number, status=lesson.status)


def seed_study(db, demo_date=None):
    scenario = db.get(StudyScenario, 1)
    if not scenario:
        scenario = StudyScenario(id=1, reference_date=demo_date or settings.demo_date or datetime.now(MOSCOW).date())
        db.add(scenario)
    anchor = scenario.reference_date
    week = anchor - timedelta(days=anchor.weekday())
    demo_day = anchor if anchor.weekday() < 5 else week
    a, b, staff = [db.scalar(select(User).where(User.login == login)) for login in ['student.a', 'student.b', 'staff.a']]
    definitions = [
        ('a-moved', a, demo_day, 9, 'Социология повседневности', 'Елена Лазурная', 'Семинар', 'Северный корпус', '412', 'moved'),
        ('a-regular', a, demo_day, 11, 'Методы социальных исследований', 'Павел Кедров', 'Лекция', 'Северный корпус', '210', 'scheduled'),
        ('a-consultation', a, week + timedelta(days=1), 15, 'Консультация по социологии', 'Елена Лазурная', 'Консультация', 'Северный корпус', '305', 'scheduled'),
        ('a-cancelled', a, week + timedelta(days=3), 13, 'История социальных идей', 'Роман Береговой', 'Семинар', 'Северный корпус', '118', 'cancelled'),
        ('b-regular', b, demo_day, 10, 'Алгоритмы и структуры данных', 'Лев Ясный', 'Практика', 'Технологический корпус', '602', 'scheduled'),
        ('b-second', b, week + timedelta(days=2), 12, 'Проектирование интерфейсов', 'Дарья Туманова', 'Лекция', 'Технологический корпус', '504', 'scheduled'),
        ('b-friday', b, week + timedelta(days=4), 14, 'Математическая логика', 'Олег Кленов', 'Семинар', 'Технологический корпус', '310', 'scheduled'),
    ]
    for key, user, day, hour, subject, teacher, kind, building, room, status in definitions:
        if db.scalar(select(Lesson.id).where(Lesson.demo_key == key)):
            continue
        starts = datetime.combine(day, time(hour), MOSCOW)
        lesson = Lesson(demo_key=key, group_id=user.group_id, subject=subject, instructor=teacher_for(db, teacher),
            kind=kind, place=room_for(db, building, room), status=status,
            starts_at=starts, ends_at=starts + timedelta(minutes=90))
        db.add(lesson)
        db.flush()
        if status in ('moved', 'cancelled'):
            after = snapshot(lesson)
            before = dict(after, status='scheduled', room='305' if status == 'moved' else room)
            db.add(LessonChange(lesson_id=lesson.id, actor_id=staff.id, before=before, after=after,
                reason='Смена аудитории: 305 → 412.' if status == 'moved' else 'Отмена демонстрационного занятия.',
                created_at=datetime.combine(week - timedelta(days=1), time(16), MOSCOW)))
    for user, prefix, subjects in [
        (a, 'a', ['Социология повседневности', 'Методы социальных исследований', 'История социальных идей', 'Академическое письмо']),
        (b, 'b', ['Алгоритмы и структуры данных', 'Математическая логика', 'Проектирование интерфейсов', 'Основы программирования']),
    ]:
        definitions = [
            ('upcoming', subjects[0], 3, 'credit', 'upcoming', 5, None, None),
            ('awaiting', subjects[1], 3, 'exam', 'awaiting', -1, None, None),
            ('credit', subjects[2], 3, 'credit', 'published', -3, None, True),
            ('exam', subjects[3], 3, 'exam', 'published', -2, 5 if prefix == 'a' else 4, None),
            ('previous', 'Иностранный язык' if prefix == 'a' else 'Дискретная математика', 2, 'exam', 'published', -120, 4 if prefix == 'a' else 5, None),
        ]
        for key, subject, semester, kind, status, offset, grade, passed in definitions:
            demo_key = f'{prefix}-{key}'
            if db.scalar(select(AcademicResult.id).where(AcademicResult.demo_key == demo_key)):
                continue
            db.add(AcademicResult(demo_key=demo_key, student_id=user.id, subject=subject, semester=semester,
                kind=kind, status=status, control_at=datetime.combine(anchor + timedelta(days=offset), time(10), MOSCOW),
                grade=grade, credit_passed=passed))
