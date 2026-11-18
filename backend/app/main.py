import secrets
from datetime import datetime, timedelta
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import StaleDataError
from .config import settings, ROOT
from .db import get_db
from .models import (User, Faculty, Group, LoginSession, Lesson, Announcement, CertificateRequest as CR,
                     RequestEvent, Document, Notification, now)
from .schemas import ContactsIn, LoginIn, RequestIn, TransitionIn, ReplyIn
from .security import (COOKIE, passwords, DUMMY_HASH, digest, current_session, current_user,
                       student, staff, csrf, require_origin, new_session)
from .pdf import certificate
from .request_types import REQUEST_TYPES, RequestKind
from .study import MOSCOW, router as study_router
from .campus import router as campus_router, visible_announcements
from .teaching import router as teaching_router

app = FastAPI(title='Цифровой деканат — конкурсный прототип', version='0.1.0')
api = APIRouter(prefix='/api/v1')


@app.middleware('http')
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'same-origin'
    response.headers['X-Frame-Options'] = 'DENY'
    if request.url.path.startswith('/api/'):
        response.headers['Cache-Control'] = 'no-store'
    return response


def save(db):
    try:
        db.commit()
    except StaleDataError:
        db.rollback()
        raise HTTPException(409, 'Заявка уже изменена. Обновите карточку.')


def profile(user, db, contacts=False):
    faculty = db.get(Faculty, user.faculty_id)
    group = db.get(Group, user.group_id) if user.group_id else None
    data = dict(id=user.id, login=user.login, role=user.role, full_name=user.full_name,
        faculty=faculty.name, group=group.name if group else None,
        group_id=user.group_id, course=user.course, direction=user.direction)
    if contacts:
        data.update(contact_email=user.contact_email, contact_phone=user.contact_phone)
        if user.role == 'student':
            birthday = user.birth_date
            today = datetime.now(MOSCOW).date()
            age = None
            if birthday and birthday <= today:
                age = today.year - birthday.year - ((today.month, today.day) < (birthday.month, birthday.day))
            data.update(university='Университет Северного кампуса', age=age,
                        study_mode=user.study_mode, student_card_number=user.student_card_number)
    return data


def request_data(req, db, detail=False):
    service = REQUEST_TYPES[req.kind]
    data = dict(id=req.id, number=req.number, status=req.status, version=req.version,
        kind=req.kind, type=service.label, purpose=req.purpose, purpose_label=service.purpose_label,
        created_at=req.created_at, due_at=req.due_at, delivery=service.delivery,
        has_document=service.pdf, student=profile(req.student, db))
    if detail:
        data['events'] = [dict(id=e.id, kind=e.kind, text=e.text, created_at=e.created_at,
            actor=e.actor.full_name, role=e.actor.role) for e in req.events]
        available = service.pdf and req.status == 'ready' and db.get(Document, req.id) is not None
        data['document_url'] = f'/api/v1/requests/{req.id}/document' if available else None
    return data


def visible_request(request_id, user, db):
    stmt = select(CR).join(User, CR.student_id == User.id).where(CR.id == request_id)
    if user.role == 'student':
        stmt = stmt.where(CR.student_id == user.id)
    elif user.role == 'staff':
        stmt = stmt.where(User.faculty_id == user.faculty_id)
    else:
        raise HTTPException(403, 'У этой роли нет доступа к заявкам.')
    req = db.scalar(stmt)
    if not req:
        raise HTTPException(404, 'Заявка недоступна.')
    return req


def event(db, req, user, kind, text):
    db.add(RequestEvent(request_id=req.id, actor_id=user.id, kind=kind, text=text))


def notify(db, req, title):
    db.add(Notification(user_id=req.student_id, request_id=req.id, title=title))


def due_date():
    day = now()
    remaining = 2
    while remaining:
        day += timedelta(days=1)
        if day.weekday() < 5:
            remaining -= 1
    return day


@api.get('/health')
def health(db: Session = Depends(get_db)):
    db.execute(select(1))
    return {'status': 'ok'}


@api.get('/auth/csrf')
def csrf_token(request: Request, response: Response, db: Session = Depends(get_db)):
    session = db.get(LoginSession, digest(request.cookies.get(COOKIE, '')))
    if session and session.expires_at > now():
        return {'csrf_token': session.csrf}
    token = secrets.token_urlsafe(32)
    response.set_cookie('dekanat_pre_csrf', token, httponly=True, secure=settings.cookie_secure,
                        samesite='strict', max_age=1800, path='/')
    return {'csrf_token': token}


@api.post('/auth/login', dependencies=[Depends(require_origin)])
def login(data: LoginIn, request: Request, response: Response, db: Session = Depends(get_db)):
    expected = request.cookies.get('dekanat_pre_csrf', '')
    if not expected or not secrets.compare_digest(expected, request.headers.get('x-csrf-token', '')):
        raise HTTPException(403, 'Обновите страницу входа.')
    user = db.scalar(select(User).where(User.login == data.login.strip()))
    valid = passwords.verify(data.password, user.password_hash if user else DUMMY_HASH)
    if not valid or not user or not user.active:
        raise HTTPException(401, 'Неверный логин или пароль.')
    previous = db.get(LoginSession, digest(request.cookies.get(COOKIE, '')))
    if previous:
        db.delete(previous)
    token, session = new_session(user.id)
    db.add(session)
    db.commit()
    response.set_cookie(COOKIE, token, httponly=True, secure=settings.cookie_secure,
        samesite='lax', max_age=settings.session_hours * 3600, path='/')
    response.delete_cookie('dekanat_pre_csrf', path='/')
    return {'user': profile(user, db, contacts=True), 'csrf_token': session.csrf}


@api.post('/auth/logout', status_code=204, dependencies=[Depends(csrf)])
def logout(response: Response, session=Depends(current_session), db: Session = Depends(get_db)):
    db.delete(session)
    db.commit()
    response.delete_cookie(COOKIE, path='/')


@api.get('/me')
def me(user=Depends(current_user), db: Session = Depends(get_db)):
    return profile(user, db, contacts=True)


@api.patch('/me/contacts', dependencies=[Depends(csrf)])
def edit_contacts(data: ContactsIn, user=Depends(student), db: Session = Depends(get_db)):
    user.contact_email = data.contact_email
    user.contact_phone = data.contact_phone
    db.commit()
    return profile(user, db, contacts=True)


@api.get('/requests')
def requests(user=Depends(student), db: Session = Depends(get_db)):
    return [request_data(r, db) for r in db.scalars(select(CR).where(CR.student_id == user.id).order_by(CR.id.desc()))]


@api.get('/request-types')
def request_types(user=Depends(current_user)):
    if user.role not in ('student', 'staff'):
        raise HTTPException(403, 'У этой роли нет доступа к заявкам.')
    return [dict(kind=kind, label=service.label, purpose_label=service.purpose_label,
                 placeholder=service.placeholder, delivery=service.delivery, has_document=service.pdf)
            for kind, service in REQUEST_TYPES.items()]


@api.post('/requests', status_code=201, dependencies=[Depends(csrf)])
def create_request(data: RequestIn, user=Depends(student), db: Session = Depends(get_db)):
    key = str(data.idempotency_key)

    def existing():
        return db.scalar(select(CR).where(CR.student_id == user.id, CR.idempotency_key == key))

    def retry(req):
        if (req.kind, req.purpose) != (data.kind, data.purpose):
            raise HTTPException(409, 'Ключ отправки уже использован. Обновите форму.')
        return request_data(req, db, True)

    req = existing()
    if req:
        return retry(req)
    req = CR(student_id=user.id, kind=data.kind, purpose=data.purpose, idempotency_key=key, due_at=due_date())
    service = REQUEST_TYPES[data.kind]
    db.add(req)
    try:
        db.flush()
        event(db, req, user, 'accepted', f'Заявка принята. {service.delivery} — до 2 рабочих дней.')
        db.commit()
    except IntegrityError:
        db.rollback()
        req = existing()
        if not req:
            raise
        return retry(req)
    return request_data(req, db, True)


@api.get('/requests/{request_id}')
def request_detail(request_id: int, user=Depends(student), db: Session = Depends(get_db)):
    return request_data(visible_request(request_id, user, db), db, True)


@api.get('/requests/{request_id}/document')
def download(request_id: int, user=Depends(student), db: Session = Depends(get_db)):
    req = visible_request(request_id, user, db)
    if not REQUEST_TYPES[req.kind].pdf:
        raise HTTPException(404, 'У заявки нет PDF. Проверьте историю в карточке.')
    if req.status != 'ready' or not db.get(Document, req.id):
        raise HTTPException(409, 'Документ ещё не готов.')
    content = certificate(req, db.get(Faculty, user.faculty_id), db.get(Group, user.group_id))
    return Response(content, media_type='application/pdf', headers={
        'Content-Disposition': f'attachment; filename="certificate-{req.id}.pdf"'})


@api.post('/requests/{request_id}/reply', dependencies=[Depends(csrf)])
def reply(request_id: int, data: ReplyIn, user=Depends(student), db: Session = Depends(get_db)):
    req = visible_request(request_id, user, db)
    if req.status != 'needs_info' or req.version != data.version:
        raise HTTPException(409, 'Ответ сейчас не ожидается. Обновите карточку.')
    req.status = 'in_progress'
    event(db, req, user, 'reply', data.text)
    save(db)
    db.refresh(req)
    return request_data(req, db, True)


@api.get('/staff/requests')
def staff_requests(q: str = '', status: str = '', group_id: int | None = None,
                   kind: RequestKind | None = None,
                   user=Depends(staff), db: Session = Depends(get_db)):
    stmt = select(CR).join(User, CR.student_id == User.id).where(User.faculty_id == user.faculty_id)
    if status:
        stmt = stmt.where(CR.status == status)
    if group_id is not None:
        stmt = stmt.where(User.group_id == group_id)
    if kind is not None:
        stmt = stmt.where(CR.kind == kind)
    rows = db.scalars(stmt.order_by(CR.id.desc()))
    return [request_data(r, db) for r in rows if q.strip().lower() in r.number.lower()]


@api.get('/staff/requests/{request_id}')
def staff_detail(request_id: int, user=Depends(staff), db: Session = Depends(get_db)):
    return request_data(visible_request(request_id, user, db), db, True)


@api.post('/staff/requests/{request_id}/transitions', dependencies=[Depends(csrf)])
def transition(request_id: int, data: TransitionIn, user=Depends(staff), db: Session = Depends(get_db)):
    req = visible_request(request_id, user, db)
    service = REQUEST_TYPES[req.kind]
    target, source, text = {
        'start': ('in_progress', 'accepted', 'Сотрудник взял заявку в работу.'),
        'clarify': ('needs_info', 'in_progress', data.text.strip()),
        'complete': ('ready', 'in_progress', service.result_text),
    }[data.action]
    if data.action == 'clarify' and not text:
        raise HTTPException(422, 'Напишите вопрос студенту.')
    if req.status != source or req.version != data.version:
        raise HTTPException(409, 'Действие уже выполнено или недоступно. Обновите карточку.')
    if target == 'ready' and not service.pdf:
        text = data.text.strip()
        if not text:
            raise HTTPException(422, 'Напишите ответ для студента.')
    req.status = target
    event(db, req, user, target, text)
    ready_title = 'Ваша справка готова' if req.kind == RequestKind.STUDY else service.result_text.rstrip('.')
    notify(db, req, {'in_progress': 'Заявка в работе', 'needs_info': 'Нужно уточнение по заявке', 'ready': ready_title}[target])
    if target == 'ready' and service.pdf:
        db.add(Document(request_id=req.id))
    save(db)
    db.refresh(req)
    return request_data(req, db, True)


def notification_data(n, user, db):
    title = n.title
    available = True
    if n.kind == 'announcement':
        announcement = db.scalar(visible_announcements(user).where(Announcement.id == n.announcement_id))
        title = announcement.title if announcement else 'Объявление недоступно'
        available = announcement is not None
    elif n.kind == 'lesson':
        lesson = db.get(Lesson, n.lesson_id)
        available = lesson is not None and lesson.group_id == user.group_id
        title = f'{title} · {lesson.subject}' if available else 'Занятие недоступно'
    return dict(id=n.id, title=title, kind=n.kind, request_id=n.request_id, lesson_id=n.lesson_id,
                announcement_id=n.announcement_id, available=available, read=n.read, created_at=n.created_at)


def own_notification(notification_id, user, db):
    n = db.scalar(select(Notification).where(Notification.id == notification_id, Notification.user_id == user.id))
    if not n:
        raise HTTPException(404, 'Уведомление недоступно.')
    return n


@api.get('/notifications')
def notifications(user=Depends(student), db: Session = Depends(get_db)):
    return [notification_data(n, user, db) for n in db.scalars(select(Notification).where(
        Notification.user_id == user.id).order_by(Notification.created_at.desc(), Notification.id.desc()))]


@api.post('/notifications/read-all', status_code=204, dependencies=[Depends(csrf)])
def read_notifications(user=Depends(student), db: Session = Depends(get_db)):
    db.execute(update(Notification).where(Notification.user_id == user.id, Notification.read.is_(False)).values(read=True))
    db.commit()


@api.get('/notifications/{notification_id}')
def get_notification(notification_id: int, user=Depends(student), db: Session = Depends(get_db)):
    return notification_data(own_notification(notification_id, user, db), user, db)


@api.patch('/notifications/{notification_id}', dependencies=[Depends(csrf)])
def read_notification(notification_id: int, user=Depends(student), db: Session = Depends(get_db)):
    n = own_notification(notification_id, user, db)
    n.read = True
    db.commit()
    return notification_data(n, user, db)


app.include_router(api)
app.include_router(study_router)
app.include_router(campus_router)
app.include_router(teaching_router)
dist = ROOT / 'frontend' / 'dist'
if (dist / 'assets').exists():
    app.mount('/assets', StaticFiles(directory=dist / 'assets'), name='assets')


@app.get('/{path:path}', include_in_schema=False)
def spa(path: str):
    if path.startswith('api/') or not (dist / 'index.html').exists():
        raise HTTPException(404, 'Страница не найдена. Соберите frontend.')
    return FileResponse(dist / 'index.html')
