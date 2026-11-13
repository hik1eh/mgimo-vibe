from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from .db import get_db
from .models import AcademicResult, Lesson, StudyScenario
from .security import student

MOSCOW = ZoneInfo('Europe/Moscow')
router = APIRouter(prefix='/api/v1')


def reference_date(db):
    scenario = db.get(StudyScenario, 1)
    return scenario.reference_date if scenario else datetime.now(MOSCOW).date()


@router.get('/study-context')
def study_context(user=Depends(student), db: Session = Depends(get_db)):
    today = reference_date(db)
    return dict(today=today, timezone='Europe/Moscow',
                demo_day=today if today.weekday() < 5 else today - timedelta(days=today.weekday()),
                demo_dates=True)


def lesson_data(lesson):
    return dict(id=lesson.id, group_id=lesson.group_id, group=lesson.group.name, subject=lesson.subject,
        teacher=lesson.teacher, kind=lesson.kind, starts_at=lesson.starts_at,
        ends_at=lesson.ends_at, building=lesson.building, room=lesson.room,
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
    lessons = db.scalars(select(Lesson).options(selectinload(Lesson.group), selectinload(Lesson.changes))
        .where(Lesson.group_id == user.group_id, Lesson.starts_at >= since, Lesson.starts_at < until)
        .order_by(Lesson.starts_at, Lesson.id))
    return [lesson_data(lesson) for lesson in lessons]


@router.get('/schedule/{lesson_id}')
def lesson_detail(lesson_id: int, user=Depends(student), db: Session = Depends(get_db)):
    lesson = db.scalar(select(Lesson).where(Lesson.id == lesson_id, Lesson.group_id == user.group_id))
    if not lesson:
        raise HTTPException(404, 'Занятие недоступно.')
    return lesson_data(lesson)


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


@router.get('/academic-results')
def academic_results(semester: int | None = Query(default=None, ge=1, le=12),
                     user=Depends(student), db: Session = Depends(get_db)):
    semesters = list(db.scalars(select(AcademicResult.semester).where(AcademicResult.student_id == user.id)
                               .distinct().order_by(AcademicResult.semester.desc())))
    selected = semester if semester is not None else (semesters[0] if semesters else None)
    rows = db.scalars(select(AcademicResult).where(AcademicResult.student_id == user.id,
        AcademicResult.semester == selected).order_by(AcademicResult.control_at, AcademicResult.id)).all() if selected else []
    results = [result_data(row) for row in rows]
    today = reference_date(db)
    upcoming = [r for r in results if r['kind'] == 'credit' and r['status'] == 'upcoming'
                and r['control_at'].astimezone(MOSCOW).date() >= today]
    control_days = [row.control_at.astimezone(MOSCOW).date() for row in rows]
    period = dict(start=min(control_days), end=max(control_days)) if control_days else None
    return dict(semesters=semesters, semester=selected, as_of=today, results=results, session_period=period,
        summary=dict(closed=sum(r['passed'] for r in results), total=len(results),
                     awaiting=sum(r['status'] == 'awaiting' for r in results),
                     next_credit=upcoming[0] if upcoming else None))
