import secrets
from datetime import timedelta
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import StaleDataError
from .config import settings, ROOT
from .db import get_db
from .models import (User, Faculty, Group, LoginSession, CertificateRequest as CR,
                     RequestEvent, Document, Notification, now)
from .schemas import LoginIn, RequestIn, TransitionIn, ReplyIn
from .security import (COOKIE, passwords, DUMMY_HASH, digest, current_session, current_user,
                       student, staff, csrf, require_origin, new_session)
from .pdf import certificate
from .study import router as study_router
from .campus import router as campus_router

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


def profile(user, db):
    faculty = db.get(Faculty, user.faculty_id)
    group = db.get(Group, user.group_id) if user.group_id else None
    return dict(id=user.id, login=user.login, role=user.role, full_name=user.full_name,
        faculty=faculty.name, group=group.name if group else None,
        course=user.course, direction=user.direction)


def request_data(req, db, detail=False):
    data = dict(id=req.id, number=req.number, status=req.status, version=req.version,
        type='Справка об обучении', purpose=req.purpose, created_at=req.created_at,
        due_at=req.due_at, delivery='Электронный PDF', student=profile(req.student, db))
    if detail:
        data['events'] = [dict(id=e.id, kind=e.kind, text=e.text, created_at=e.created_at,
            actor=e.actor.full_name, role=e.actor.role) for e in req.events]
        data['document_url'] = f'/api/v1/requests/{req.id}/document' if req.status == 'ready' else None
    return data


def visible_request(request_id, user, db):
    stmt = select(CR).join(User, CR.student_id == User.id).where(CR.id == request_id)
    stmt = stmt.where(CR.student_id == user.id) if user.role == 'student' else stmt.where(User.faculty_id == user.faculty_id)
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
    return {'user': profile(user, db), 'csrf_token': session.csrf}


@api.post('/auth/logout', status_code=204, dependencies=[Depends(csrf)])
def logout(response: Response, session=Depends(current_session), db: Session = Depends(get_db)):
    db.delete(session)
    db.commit()
    response.delete_cookie(COOKIE, path='/')


@api.get('/me')
def me(user=Depends(current_user), db: Session = Depends(get_db)):
    return profile(user, db)


@api.get('/requests')
def requests(user=Depends(student), db: Session = Depends(get_db)):
    return [request_data(r, db) for r in db.scalars(select(CR).where(CR.student_id == user.id).order_by(CR.id.desc()))]


@api.post('/requests', status_code=201, dependencies=[Depends(csrf)])
def create_request(data: RequestIn, user=Depends(student), db: Session = Depends(get_db)):
    key = str(data.idempotency_key)
    def existing():
        return db.scalar(select(CR).where(CR.student_id == user.id, CR.idempotency_key == key))
    req = existing()
    if req:
        if req.purpose != data.purpose:
            raise HTTPException(409, 'Ключ отправки уже использован. Обновите форму.')
        return request_data(req, db, True)
    req = CR(student_id=user.id, purpose=data.purpose, idempotency_key=key, due_at=due_date())
    db.add(req)
    try:
        db.flush()
        event(db, req, user, 'accepted', 'Заявка принята. Электронная выдача — до 2 рабочих дней.')
        db.commit()
    except IntegrityError:
        db.rollback()
        req = existing()
        if not req:
            raise
        if req.purpose != data.purpose:
            raise HTTPException(409, 'Ключ отправки уже использован.')
    return request_data(req, db, True)


@api.get('/requests/{request_id}')
def request_detail(request_id: int, user=Depends(student), db: Session = Depends(get_db)):
    return request_data(visible_request(request_id, user, db), db, True)


@api.get('/requests/{request_id}/document')
def download(request_id: int, user=Depends(student), db: Session = Depends(get_db)):
    req = visible_request(request_id, user, db)
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
def staff_requests(q: str = '', status: str = '', user=Depends(staff), db: Session = Depends(get_db)):
    stmt = select(CR).join(User, CR.student_id == User.id).where(User.faculty_id == user.faculty_id)
    if status:
        stmt = stmt.where(CR.status == status)
    rows = db.scalars(stmt.order_by(CR.id.desc()))
    return [request_data(r, db) for r in rows if q.strip().lower() in r.number.lower()]


@api.get('/staff/requests/{request_id}')
def staff_detail(request_id: int, user=Depends(staff), db: Session = Depends(get_db)):
    return request_data(visible_request(request_id, user, db), db, True)


@api.post('/staff/requests/{request_id}/transitions', dependencies=[Depends(csrf)])
def transition(request_id: int, data: TransitionIn, user=Depends(staff), db: Session = Depends(get_db)):
    req = visible_request(request_id, user, db)
    target, source, text = {
        'start': ('in_progress', 'accepted', 'Сотрудник взял заявку в работу.'),
        'clarify': ('needs_info', 'in_progress', data.text.strip()),
        'complete': ('ready', 'in_progress', 'Справка готова. Доступен демонстрационный PDF.'),
    }[data.action]
    if data.action == 'clarify' and not text:
        raise HTTPException(422, 'Напишите вопрос студенту.')
    if req.status != source or req.version != data.version:
        raise HTTPException(409, 'Действие уже выполнено или недоступно. Обновите карточку.')
    req.status = target
    event(db, req, user, target, text)
    notify(db, req, {'in_progress': 'Заявка в работе', 'needs_info': 'Нужно уточнение по заявке', 'ready': 'Ваша справка готова'}[target])
    if target == 'ready':
        db.add(Document(request_id=req.id))
    save(db)
    db.refresh(req)
    return request_data(req, db, True)


def notification_data(n):
    return dict(id=n.id, title=n.title, request_id=n.request_id, read=n.read, created_at=n.created_at)


def own_notification(notification_id, user, db):
    n = db.scalar(select(Notification).where(Notification.id == notification_id, Notification.user_id == user.id))
    if not n:
        raise HTTPException(404, 'Уведомление недоступно.')
    return n


@api.get('/notifications')
def notifications(user=Depends(student), db: Session = Depends(get_db)):
    return [notification_data(n) for n in db.scalars(select(Notification).where(Notification.user_id == user.id).order_by(Notification.id.desc()))]


@api.get('/notifications/{notification_id}')
def get_notification(notification_id: int, user=Depends(student), db: Session = Depends(get_db)):
    return notification_data(own_notification(notification_id, user, db))


@api.patch('/notifications/{notification_id}', dependencies=[Depends(csrf)])
def read_notification(notification_id: int, user=Depends(student), db: Session = Depends(get_db)):
    n = own_notification(notification_id, user, db)
    n.read = True
    db.commit()
    return notification_data(n)


app.include_router(api)
app.include_router(study_router)
app.include_router(campus_router)
dist = ROOT / 'frontend' / 'dist'
if (dist / 'assets').exists():
    app.mount('/assets', StaticFiles(directory=dist / 'assets'), name='assets')


@app.get('/{path:path}', include_in_schema=False)
def spa(path: str):
    if path.startswith('api/') or not (dist / 'index.html').exists():
        raise HTTPException(404, 'Страница не найдена. Соберите frontend.')
    return FileResponse(dist / 'index.html')
