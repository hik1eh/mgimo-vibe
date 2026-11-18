from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, selectinload
from .db import get_db
from .demo_calendar import demo_week
from .models import AcademicResult, Group, Lesson, LessonJournal, StudyScenario, User
from .security import student, staff
from .campus_map import campus_floors, route_segments

MOSCOW = ZoneInfo('Europe/Moscow')
router = APIRouter(prefix='/api/v1')


def reference_date(db):
    scenario = db.get(StudyScenario, 1)
    return scenario.reference_date if scenario else datetime.now(MOSCOW).date()


@router.get('/study-context')
def study_context(user=Depends(student), db: Session = Depends(get_db)):
    today = reference_date(db)
    return dict(today=today, timezone='Europe/Moscow',
                demo_day=today if today.weekday() < 5 else demo_week(today),
                demo_dates=True)


def lesson_data(lesson):
    return dict(id=lesson.id, group_id=lesson.group_id, group=lesson.group.name, subject=lesson.subject,
        teacher=lesson.instructor.name, teacher_id=lesson.teacher_id, kind=lesson.kind, starts_at=lesson.starts_at,
        ends_at=lesson.ends_at, building=lesson.place.building, room=lesson.place.number,
        room_id=lesson.room_id, floor=lesson.place.floor,
        has_route=lesson.status != 'cancelled' and lesson.place.map_node is not None,
        status=lesson.status, version=lesson.version,
        changes=[dict(id=c.id, before=c.before, after=c.after, reason=c.reason,
                      created_at=c.created_at) for c in lesson.changes])


@router.get('/schedule')
def schedule(start: date | None = None, end: date | None = None,
             user=Depends(student), db: Session = Depends(get_db)):
    start = start or reference_date(db)
    end = end or start
    if end < start or (end - start).days > 30 or end == date.max:
        raise HTTPException(422, 'Выберите диапазон от 1 до 31 дня.')
    since = datetime.combine(start, time.min, MOSCOW)
    until = datetime.combine(end + timedelta(days=1), time.min, MOSCOW)
    lessons = db.scalars(select(Lesson).options(selectinload(Lesson.group), selectinload(Lesson.changes),
        selectinload(Lesson.instructor), selectinload(Lesson.place))
        .where(Lesson.group_id == user.group_id, Lesson.starts_at >= since, Lesson.starts_at < until)
        .order_by(Lesson.starts_at, Lesson.id))
    return [lesson_data(lesson) for lesson in lessons]


def student_lesson(lesson_id, user, db):
    lesson = db.scalar(select(Lesson).where(Lesson.id == lesson_id, Lesson.group_id == user.group_id))
    if not lesson:
        raise HTTPException(404, 'Занятие недоступно.')
    return lesson


@router.get('/schedule/{lesson_id}')
def lesson_detail(lesson_id: int, user=Depends(student), db: Session = Depends(get_db)):
    return lesson_data(student_lesson(lesson_id, user, db))


@router.get('/schedule/{lesson_id}/route')
def lesson_route(lesson_id: int, user=Depends(student), db: Session = Depends(get_db)):
    lesson = student_lesson(lesson_id, user, db)
    segments = route_segments(lesson.place) if lesson.status != 'cancelled' else []
    return dict(lesson=lesson_data(lesson), segments=segments, floors=campus_floors() if segments else [])


def result_data(row):
    passed = row.status == 'published' and (row.credit_passed is True if row.kind == 'credit' else row.grade >= 3)
    if row.status == 'upcoming':
        label = 'Предстоит зачёт' if row.kind == 'credit' else 'Предстоит экзамен'
    elif row.status == 'awaiting':
        label = 'Ожидается результат'
    elif row.kind == 'credit':
        label = 'Зачёт получен' if row.credit_passed else 'Зачёт не получен'
    else:
        label = f'Оценка: {row.grade}' if passed else f'Не сдано · {row.grade}'
    return dict(id=row.id, subject=row.subject, semester=row.semester, kind=row.kind,
        status=row.status, control_at=row.control_at, grade=row.grade,
        credit_passed=row.credit_passed, passed=passed, label=label)


def marked_lessons(column, user, *columns):
    return (select(column, *columns).select_from(LessonJournal).join(Lesson)
            .where(LessonJournal.student_id == user.id, Lesson.group_id == user.group_id,
                   Lesson.status != 'cancelled', Lesson.semester.is_not(None),
                   or_(LessonJournal.attendance.is_not(None), LessonJournal.checkpoint.is_not(None))))


def engagement_data(db, user, semester):
    counts = dict(
        present=func.count().filter(LessonJournal.attendance == 'present'),
        absent=func.count().filter(LessonJournal.attendance == 'absent'),
        completed=func.count().filter(LessonJournal.checkpoint == 'completed'),
        pending=func.count().filter(LessonJournal.checkpoint == 'pending'),
    )
    stmt = (marked_lessons(Lesson.subject, user, *(expr.label(key) for key, expr in counts.items()))
            .where(Lesson.semester == semester).group_by(Lesson.subject).order_by(Lesson.subject))
    subjects = [dict(row) for row in db.execute(stmt).mappings()]
    return dict(**{key: sum(row[key] for row in subjects) for key in counts}, subjects=subjects)


@router.get('/academic-results')
def academic_results(semester: int | None = Query(default=None, ge=1, le=12),
                     user=Depends(student), db: Session = Depends(get_db)):
    result_semesters = select(AcademicResult.semester).where(AcademicResult.student_id == user.id)
    semesters = list(db.scalars(result_semesters.union(marked_lessons(Lesson.semester, user))
                               .order_by(AcademicResult.semester.desc())))
    selected = semester if semester is not None else (semesters[0] if semesters else None)
    rows = db.scalars(select(AcademicResult).where(AcademicResult.student_id == user.id,
        AcademicResult.semester == selected).order_by(AcademicResult.control_at, AcademicResult.id)).all() if selected else []
    results = [result_data(row) for row in rows]
    today = reference_date(db)
    upcoming = [r for r in results if r['status'] == 'upcoming'
                and r['control_at'].astimezone(MOSCOW).date() >= today]
    control_days = [row.control_at.astimezone(MOSCOW).date() for row in rows]
    period = dict(start=min(control_days), end=max(control_days)) if control_days else None
    return dict(semesters=semesters, semester=selected, as_of=today, results=results, session_period=period,
        engagement=engagement_data(db, user, selected),
        summary=dict(closed=sum(r['passed'] for r in results), total=len(results),
                     awaiting=sum(r['status'] == 'awaiting' for r in results),
                     next_credit=next((r for r in upcoming if r['kind'] == 'credit'), None),
                     next_control=upcoming[0] if upcoming else None))


@router.get('/staff/academic-results')
def staff_academic_results(group_id: int | None = Query(default=None, ge=1),
                           user=Depends(staff), db: Session = Depends(get_db)):
    groups = db.scalars(select(Group).where(Group.faculty_id == user.faculty_id).order_by(Group.name)).all()
    if group_id is not None and group_id not in {group.id for group in groups}:
        raise HTTPException(404, 'Группа недоступна.')
    group_fields = (Group.id, Group.name, AcademicResult.semester, AcademicResult.subject, AcademicResult.kind)
    stmt = (select(*group_fields, func.count().label('total'),
                   func.count().filter(AcademicResult.status == 'published').label('published'),
                   func.count().filter(AcademicResult.status == 'awaiting').label('awaiting'))
            .select_from(AcademicResult).join(User, AcademicResult.student_id == User.id).join(Group, User.group_id == Group.id)
            .where(Group.faculty_id == user.faculty_id, User.role == 'student')
            .group_by(*group_fields)
            .order_by(Group.name, AcademicResult.semester.desc(), AcademicResult.subject))
    if group_id is not None:
        stmt = stmt.where(Group.id == group_id)
    return dict(groups=[dict(id=g.id, name=g.name) for g in groups],
                subjects=[dict(group_id=r.id, group=r.name, semester=r.semester, subject=r.subject,
                               kind=r.kind, published=r.published, awaiting=r.awaiting, total=r.total)
                          for r in db.execute(stmt)])
