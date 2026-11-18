import hashlib
import secrets
from datetime import timedelta
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pwdlib import PasswordHash
from .config import settings
from .db import get_db
from .models import LoginSession, User, now

passwords = PasswordHash.recommended()
DUMMY_HASH = passwords.hash(secrets.token_urlsafe(32))
COOKIE = 'dekanat_session'


def digest(token: str):
    return hashlib.sha256(token.encode()).hexdigest()


def current_session(request: Request, db: Session = Depends(get_db)):
    session = db.get(LoginSession, digest(request.cookies.get(COOKIE, '')))
    if not session or session.expires_at <= now():
        raise HTTPException(401, 'Сессия завершена. Войдите снова.')
    user = db.get(User, session.user_id)
    if not user or not user.active:
        raise HTTPException(401, 'Учётная запись недоступна.')
    return session


def current_user(session=Depends(current_session), db: Session = Depends(get_db)):
    return db.get(User, session.user_id)


def student(user=Depends(current_user)):
    if user.role != 'student':
        raise HTTPException(403, 'Действие доступно студенту.')
    return user


def staff(user=Depends(current_user)):
    if user.role != 'staff':
        raise HTTPException(403, 'Действие доступно сотруднику.')
    return user


def teacher(user=Depends(current_user)):
    if user.role != 'teacher' or user.teacher_id is None:
        raise HTTPException(403, 'Действие доступно преподавателю.')
    return user


def require_origin(request: Request):
    if request.headers.get('origin') != settings.app_origin.rstrip('/'):
        raise HTTPException(403, 'Недопустимый источник запроса.')


def csrf(request: Request, session=Depends(current_session), _=Depends(require_origin)):
    if not secrets.compare_digest(request.headers.get('x-csrf-token', ''), session.csrf):
        raise HTTPException(403, 'Обновите страницу и повторите действие.')


def new_session(user_id):
    token = secrets.token_urlsafe(48)
    return token, LoginSession(token_hash=digest(token), user_id=user_id,
        csrf=secrets.token_urlsafe(32), expires_at=now() + timedelta(hours=settings.session_hours))
