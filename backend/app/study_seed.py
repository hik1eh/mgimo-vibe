from collections import defaultdict
from datetime import datetime, time, timedelta
from sqlalchemy import select
from .config import settings
from .demo_calendar import DEFAULT_DEMO_DATE, TERM_START, TERM_END, demo_week
from .models import StudyScenario, Lesson, LessonChange, AcademicResult, User
from .study import MOSCOW
from .campus_map import room_for, teacher_for


DEMO_SEMESTER = 3


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


def seed_timetable(db, date_range, user, prefix, building, hours, courses, timetable, reserved):
    first_day, last_day = date_range
    since = datetime.combine(first_day, time.min, MOSCOW)
    until = datetime.combine(last_day + timedelta(days=1), time.min, MOSCOW)
    occupied = list(reserved)
    occupied.extend(db.execute(select(Lesson.starts_at, Lesson.ends_at).where(
        Lesson.group_id == user.group_id, Lesson.starts_at < until, Lesson.ends_at > since)))
    existing_keys = set(db.scalars(select(Lesson.demo_key).where(
        Lesson.demo_key.startswith(f'{prefix}-timetable-'))))
    instructors = {name: teacher_for(db, teacher) for name, (_, teacher, _, _) in courses.items()}
    rooms = {room: room_for(db, building, room) for room in sorted({data[3] for data in courses.values()})}
    for offset in range((last_day - first_day).days + 1):
        day = first_day + timedelta(days=offset)
        if day.weekday() >= len(timetable):
            continue
        for hour, name in zip(hours, timetable[day.weekday()], strict=True):
            key = f'{prefix}-timetable-{day.isoformat()}-{hour}'
            starts = datetime.combine(day, time(hour), MOSCOW)
            ends = starts + timedelta(minutes=90)
            if key in existing_keys or any(start < ends and end > starts for start, end in occupied):
                continue
            subject, _, kind, room = courses[name]
            db.add(Lesson(demo_key=key, group_id=user.group_id, subject=subject,
                          instructor=instructors[name], kind=kind, place=rooms[room],
                          starts_at=starts, ends_at=ends, status='scheduled', semester=DEMO_SEMESTER))
            occupied.append((starts, ends))


def snapshot(lesson):
    return dict(starts_at=lesson.starts_at.isoformat(), ends_at=lesson.ends_at.isoformat(),
                building=lesson.place.building, room=lesson.place.number, status=lesson.status)


def seed_study(db, demo_date=None):
    scenario = db.get(StudyScenario, 1)
    if not scenario:
        scenario = StudyScenario(id=1, reference_date=demo_date or settings.demo_date or DEFAULT_DEMO_DATE)
        db.add(scenario)
    anchor = scenario.reference_date
    week = demo_week(anchor)
    fixed_term = TERM_START <= anchor <= TERM_END
    date_range = (TERM_START, TERM_END) if fixed_term else (week, week + timedelta(days=13))
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
            starts_at=starts, ends_at=ends, semester=DEMO_SEMESTER)
        db.add(lesson)
        db.flush()
        if status in ('moved', 'cancelled'):
            after = snapshot(lesson)
            before = dict(after, status='scheduled', room='305' if status == 'moved' else room)
            db.add(LessonChange(lesson_id=lesson.id, actor_id=staff.id, before=before, after=after,
                reason='Смена аудитории: 305 → 412.' if status == 'moved' else 'Отмена демонстрационного занятия.',
                created_at=datetime.combine(week - timedelta(days=1), time(16), MOSCOW)))

    seed_timetable(db, date_range, a, 'a', 'Северный корпус', (9, 11, 13), SOCIAL_SCIENCES, (
        ('sociology', 'methods', 'writing'),
        ('history', 'statistics', 'culture'),
        ('sociology', 'ethics', 'writing'),
        ('methods', 'culture', 'history'),
        ('statistics', 'sociology', 'ethics'),
    ), original_slots[a.group_id])
    seed_timetable(db, date_range, b, 'b', 'Технологический корпус', (10, 12, 14), DIGITAL_TECHNOLOGY, (
        ('algorithms', 'design', 'programming'),
        ('networks', 'logic', 'databases'),
        ('programming', 'design', 'project'),
        ('algorithms', 'databases', 'networks'),
        ('design', 'project', 'logic'),
    ), original_slots[b.group_id])
    for user, prefix, courses, control_order in [
        (a, 'a', SOCIAL_SCIENCES, ('sociology', 'methods', 'history', 'writing', 'ethics', 'culture', 'statistics')),
        (b, 'b', DIGITAL_TECHNOLOGY, ('algorithms', 'logic', 'design', 'programming', 'project', 'networks', 'databases')),
    ]:
        subjects = [courses[code][0] for code in control_order]
        definitions = [
            ('upcoming', subjects[0], DEMO_SEMESTER, 'credit', 'upcoming', 5, None, None),
            ('awaiting', subjects[1], DEMO_SEMESTER, 'exam', 'awaiting', -1, None, None),
            ('credit', subjects[2], DEMO_SEMESTER, 'credit', 'published', -3, None, True),
            ('exam', subjects[3], DEMO_SEMESTER, 'exam', 'published', -2, 5 if prefix == 'a' else 4, None),
            ('previous', 'Иностранный язык' if prefix == 'a' else 'Дискретная математика', 2, 'exam', 'published', -120, 4 if prefix == 'a' else 5, None),
        ]
        if fixed_term:
            for index, (kind, days_before_end) in enumerate((('credit', 6), ('exam', 4), ('exam', 2))):
                control_day = TERM_END - timedelta(days=days_before_end)
                definitions.append((f'final-{control_order[4 + index]}', subjects[4 + index], DEMO_SEMESTER,
                                    kind, 'upcoming', (control_day - anchor).days, None, None))
        for key, subject, semester, kind, status, offset, grade, passed in definitions:
            demo_key = f'{prefix}-{key}'
            if db.scalar(select(AcademicResult.id).where(AcademicResult.demo_key == demo_key)):
                continue
            control_day = anchor + timedelta(days=offset)
            if fixed_term and semester == DEMO_SEMESTER:
                control_day = min(TERM_END, max(TERM_START, control_day))
            control_time = time(16) if key.startswith('final-') else time(10)
            db.add(AcademicResult(demo_key=demo_key, student_id=user.id, subject=subject, semester=semester,
                kind=kind, status=status, control_at=datetime.combine(control_day, control_time, MOSCOW),
                grade=grade, credit_passed=passed))
