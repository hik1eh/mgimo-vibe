from collections import defaultdict
from datetime import datetime, time, timedelta
from sqlalchemy import select
from .config import settings
from .models import StudyScenario, Lesson, LessonChange, AcademicResult, User
from .study import MOSCOW
from .campus_map import room_for, teacher_for


SOCIAL_SCIENCES = {
    'sociology': ('Социология повседневности', 'Елена Лазурная', 'Семинар', '412'),
    'methods': ('Методы социальных исследований', 'Павел Кедров', 'Лекция', '210'),
    'writing': ('Академическое письмо', 'Софья Снегирева', 'Практика', '305'),
    'history': ('История социальных идей', 'Роман Береговой', 'Лекция', '210'),
    'statistics': ('Прикладная статистика', 'Вера Тихолесова', 'Практика', '412'),
    'ethics': ('Профессиональная этика', 'Илья Светлов', 'Семинар', '305'),
    'culture': ('Культурология', 'Майя Вишнева', 'Лекция', '210'),
}
DIGITAL_TECHNOLOGY = {
    'algorithms': ('Алгоритмы и структуры данных', 'Лев Ясный', 'Практика', '602'),
    'design': ('Проектирование интерфейсов', 'Дарья Туманова', 'Лекция', '504'),
    'logic': ('Математическая логика', 'Олег Кленов', 'Семинар', '310'),
    'programming': ('Основы программирования', 'Яна Серебрина', 'Практика', '506'),
    'databases': ('Базы данных', 'Константин Озеров', 'Лабораторная', '602'),
    'networks': ('Компьютерные сети', 'Наталья Горская', 'Лекция', '504'),
    'project': ('Проектный практикум', 'Фёдор Ветлов', 'Практика', '310'),
}


def seed_demo_weeks(db, week, user, prefix, building, hours, courses, timetable, reserved):
    since = datetime.combine(week, time.min, MOSCOW)
    until = since + timedelta(weeks=2)
    occupied = list(reserved)
    occupied.extend(db.execute(select(Lesson.starts_at, Lesson.ends_at).where(
        Lesson.group_id == user.group_id, Lesson.starts_at < until, Lesson.ends_at > since)))
    existing_keys = set(db.scalars(select(Lesson.demo_key).where(
        Lesson.demo_key.startswith(f'{prefix}-timetable-'))))
    for week_offset in range(2):
        for weekday, subjects in enumerate(timetable):
            day = week + timedelta(weeks=week_offset, days=weekday)
            for hour, name in zip(hours, subjects, strict=True):
                key = f'{prefix}-timetable-{day.isoformat()}-{hour}'
                starts = datetime.combine(day, time(hour), MOSCOW)
                ends = starts + timedelta(minutes=90)
                if key in existing_keys or any(start < ends and end > starts for start, end in occupied):
                    continue
                subject, teacher, kind, room = courses[name]
                db.add(Lesson(demo_key=key, group_id=user.group_id, subject=subject,
                              instructor=teacher_for(db, teacher), kind=kind, place=room_for(db, building, room),
                              starts_at=starts, ends_at=ends, status='scheduled'))
                occupied.append((starts, ends))


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
    original_slots = defaultdict(list)
    for key, user, day, hour, subject, teacher, kind, building, room, status in definitions:
        starts = datetime.combine(day, time(hour), MOSCOW)
        ends = starts + timedelta(minutes=90)
        original_slots[user.group_id].append((starts, ends))
        if db.scalar(select(Lesson.id).where(Lesson.demo_key == key)):
            continue
        lesson = Lesson(demo_key=key, group_id=user.group_id, subject=subject, instructor=teacher_for(db, teacher),
            kind=kind, place=room_for(db, building, room), status=status,
            starts_at=starts, ends_at=ends)
        db.add(lesson)
        db.flush()
        if status in ('moved', 'cancelled'):
            after = snapshot(lesson)
            before = dict(after, status='scheduled', room='305' if status == 'moved' else room)
            db.add(LessonChange(lesson_id=lesson.id, actor_id=staff.id, before=before, after=after,
                reason='Смена аудитории: 305 → 412.' if status == 'moved' else 'Отмена демонстрационного занятия.',
                created_at=datetime.combine(week - timedelta(days=1), time(16), MOSCOW)))

    seed_demo_weeks(db, week, a, 'a', 'Северный корпус', (9, 11, 13), SOCIAL_SCIENCES, (
        ('sociology', 'methods', 'writing'),
        ('history', 'statistics', 'culture'),
        ('sociology', 'ethics', 'writing'),
        ('methods', 'culture', 'history'),
        ('statistics', 'sociology', 'ethics'),
    ), original_slots[a.group_id])
    seed_demo_weeks(db, week, b, 'b', 'Технологический корпус', (10, 12, 14), DIGITAL_TECHNOLOGY, (
        ('algorithms', 'design', 'programming'),
        ('networks', 'logic', 'databases'),
        ('programming', 'design', 'project'),
        ('algorithms', 'databases', 'networks'),
        ('design', 'project', 'logic'),
    ), original_slots[b.group_id])
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
