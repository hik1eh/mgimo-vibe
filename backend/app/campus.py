import hashlib
import json
from datetime import date, datetime, time, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.exc import StaleDataError
from .db import get_db
from .models import Announcement, Group, Lesson, LessonChange, now
from .security import student, staff, csrf
from .study import lesson_data, reference_date, MOSCOW
from .study_seed import snapshot
from .campus_schemas import AnnouncementCreate, AnnouncementEdit, LessonEdit

router = APIRouter(prefix='/api/v1')


def commit(db):
    try:
        db.commit()
    except StaleDataError:
        db.rollback()
        raise HTTPException(409, 'Запись уже изменена. Обновите страницу и сравните данные.')


def announcement_data(row):
    return dict(id=row.id, title=row.title, text=row.text, source=row.source,
        audience=row.audience, faculty_id=row.faculty_id, group_id=row.group_id,
        lesson_id=row.lesson_id, status=row.status, pinned=row.pinned,
        published_at=row.published_at, expires_at=row.expires_at, version=row.version,
        lesson=lesson_data(row.lesson) if row.lesson else None)


def visible_announcements(user):
    instant = now()
    return select(Announcement).where(Announcement.status == 'published',
        Announcement.published_at <= instant,
        or_(Announcement.expires_at.is_(None), Announcement.expires_at > instant),
        or_(Announcement.audience == 'university',
            and_(Announcement.audience == 'faculty', Announcement.faculty_id == user.faculty_id),
            and_(Announcement.audience == 'group', Announcement.group_id == user.group_id,
                 Announcement.faculty_id == user.faculty_id)))


@router.get('/announcements')
def announcements(user=Depends(student), db: Session = Depends(get_db)):
    rows = db.scalars(visible_announcements(user).order_by(Announcement.pinned.desc(), Announcement.published_at.desc(), Announcement.id.desc()))
    return [announcement_data(row) for row in rows]


@router.get('/announcements/{announcement_id}')
def announcement_detail(announcement_id: int, user=Depends(student), db: Session = Depends(get_db)):
    row = db.scalar(visible_announcements(user).where(Announcement.id == announcement_id))
    if not row:
        raise HTTPException(404, 'Объявление недоступно.')
    return announcement_data(row)


def own_group(group_id, user, db):
    group = db.scalar(select(Group).where(Group.id == group_id, Group.faculty_id == user.faculty_id))
    if not group:
        raise HTTPException(404, 'Группа недоступна.')
    return group


def own_lesson(lesson_id, user, db):
    row = db.scalar(select(Lesson).join(Group).where(Lesson.id == lesson_id, Group.faculty_id == user.faculty_id))
    if not row:
        raise HTTPException(404, 'Занятие недоступно.')
    return row


def own_announcement(announcement_id, user, db):
    row = db.scalar(select(Announcement).where(Announcement.id == announcement_id, Announcement.faculty_id == user.faculty_id,
                                             Announcement.audience.in_(['faculty', 'group'])))
    if not row:
        raise HTTPException(404, 'Объявление недоступно.')
    return row


def validate_target(data, user, db):
    if data.audience == 'faculty' and data.group_id is not None:
        raise HTTPException(422, 'Для объявления факультету не выбирайте отдельную группу.')
    if data.audience == 'group':
        if data.group_id is None:
            raise HTTPException(422, 'Выберите группу.')
        own_group(data.group_id, user, db)
    if data.lesson_id is not None:
        lesson = own_lesson(data.lesson_id, user, db)
        if data.audience != 'group' or data.group_id != lesson.group_id:
            raise HTTPException(422, 'Объявление о занятии адресуется только группе этого занятия.')


def assign_fields(row, data):
    published = now() if data.status == 'published' and row.status != 'published' else row.published_at
    if data.expires_at and published and data.expires_at <= published:
        raise HTTPException(422, 'Окончание показа должно быть позже публикации.')
    for field in ['title', 'text', 'audience', 'group_id', 'lesson_id', 'status', 'pinned', 'expires_at']:
        setattr(row, field, getattr(data, field))
    row.published_at = published


@router.get('/staff/groups')
def groups(user=Depends(staff), db: Session = Depends(get_db)):
    return [dict(id=g.id, name=g.name) for g in db.scalars(select(Group).where(Group.faculty_id == user.faculty_id).order_by(Group.name))]


@router.get('/staff/announcements')
def staff_announcements(user=Depends(staff), db: Session = Depends(get_db)):
    rows = db.scalars(select(Announcement).where(Announcement.faculty_id == user.faculty_id)
        .order_by(Announcement.id.desc()))
    return [announcement_data(row) for row in rows]


@router.get('/staff/announcements/{announcement_id}')
def staff_announcement(announcement_id: int, user=Depends(staff), db: Session = Depends(get_db)):
    return announcement_data(own_announcement(announcement_id, user, db))


@router.post('/staff/announcements', status_code=201, dependencies=[Depends(csrf)])
def create_announcement(data: AnnouncementCreate, user=Depends(staff), db: Session = Depends(get_db)):
    validate_target(data, user, db)
    digest = hashlib.sha256(json.dumps(data.model_dump(mode='json'), sort_keys=True).encode()).hexdigest()
    def existing():
        return db.scalar(select(Announcement).where(Announcement.author_id == user.id,
            Announcement.idempotency_key == str(data.idempotency_key)))
    def replay(row):
        if row.create_digest != digest:
            raise HTTPException(409, 'Объявление уже создано. Откройте его из списка для правки.')
        return announcement_data(row)
    old = existing()
    if old:
        return replay(old)
    row = Announcement(author_id=user.id, faculty_id=user.faculty_id, source=user.full_name,
                       idempotency_key=str(data.idempotency_key), create_digest=digest)
    assign_fields(row, data)
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        old = existing()
        if not old:
            raise
        return replay(old)
    return announcement_data(row)


@router.patch('/staff/announcements/{announcement_id}', dependencies=[Depends(csrf)])
def edit_announcement(announcement_id: int, data: AnnouncementEdit, user=Depends(staff), db: Session = Depends(get_db)):
    row = own_announcement(announcement_id, user, db)
    if row.version != data.version:
        raise HTTPException(409, 'Объявление уже изменено. Обновите страницу.')
    validate_target(data, user, db)
    assign_fields(row, data)
    commit(db)
    db.refresh(row)
    return announcement_data(row)


@router.get('/staff/schedule')
def staff_schedule(start: date | None = None, end: date | None = None, group_id: int | None = None,
                   q: str = Query(default='', max_length=120), user=Depends(staff), db: Session = Depends(get_db)):
    if group_id is not None:
        own_group(group_id, user, db)
    today = reference_date(db)
    start = start or today - timedelta(days=today.weekday())
    if end is None:
        end = start + timedelta(days=6) if start <= date.max - timedelta(days=6) else date.max
    if end < start or (end - start).days > 30 or end == date.max:
        raise HTTPException(422, 'Выберите диапазон от 1 до 31 дня.')
    stmt = select(Lesson).join(Group).options(selectinload(Lesson.group), selectinload(Lesson.changes)).where(
        Group.faculty_id == user.faculty_id, Lesson.starts_at >= datetime.combine(start, time.min, MOSCOW),
        Lesson.starts_at < datetime.combine(end + timedelta(days=1), time.min, MOSCOW))
    if group_id is not None:
        stmt = stmt.where(Lesson.group_id == group_id)
    if q.strip():
        stmt = stmt.where(or_(Lesson.subject.ilike(f'%{q.strip()}%'), Lesson.teacher.ilike(f'%{q.strip()}%')))
    return [lesson_data(row) for row in db.scalars(stmt.order_by(Lesson.starts_at, Lesson.id))]


@router.get('/staff/schedule/{lesson_id}')
def staff_lesson(lesson_id: int, user=Depends(staff), db: Session = Depends(get_db)):
    return lesson_data(own_lesson(lesson_id, user, db))


@router.patch('/staff/schedule/{lesson_id}', dependencies=[Depends(csrf)])
def edit_lesson(lesson_id: int, data: LessonEdit, user=Depends(staff), db: Session = Depends(get_db)):
    row = own_lesson(lesson_id, user, db)
    if row.version != data.version or row.status == 'cancelled':
        raise HTTPException(409, 'Занятие уже изменено или отменено. Обновите карточку.')
    before = snapshot(row)
    if data.action == 'cancel':
        row.status = 'cancelled'
    else:
        changed = False
        for field in ['starts_at', 'ends_at', 'building', 'room']:
            value = getattr(data, field)
            if value is not None and value != getattr(row, field):
                setattr(row, field, value)
                changed = True
        if not changed:
            raise HTTPException(422, 'Измените время, корпус или аудиторию.')
        if row.ends_at <= row.starts_at:
            raise HTTPException(422, 'Окончание занятия должно быть позже начала.')
        row.status = 'moved'
    db.add(LessonChange(lesson_id=row.id, actor_id=user.id, before=before, after=snapshot(row), reason=data.reason))
    commit(db)
    db.refresh(row)
    return dict(**lesson_data(row), announcement_prefill=dict(audience='group', group_id=row.group_id,
        lesson_id=row.id, title=f'Изменение занятия: {row.subject}'[:160],
        text='Проверьте актуальные время и место в связанной карточке занятия.'))
