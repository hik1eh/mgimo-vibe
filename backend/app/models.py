from datetime import datetime, timezone
from sqlalchemy import (String, Integer, Text, DateTime, ForeignKey, ForeignKeyConstraint,
                        UniqueConstraint, CheckConstraint, Boolean)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base


def now():
    return datetime.now(timezone.utc)


class Faculty(Base):
    __tablename__ = 'faculties'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True)


class Group(Base):
    __tablename__ = 'groups'
    __table_args__ = (UniqueConstraint('id', 'faculty_id'),)
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(40), unique=True)
    faculty_id: Mapped[int] = mapped_column(ForeignKey('faculties.id'))


class User(Base):
    __tablename__ = 'users'
    __table_args__ = (
        ForeignKeyConstraint(['group_id', 'faculty_id'], ['groups.id', 'groups.faculty_id']),
        CheckConstraint("role IN ('student','staff')", name='user_role'),
        CheckConstraint("(role='student' AND group_id IS NOT NULL AND course IS NOT NULL AND course BETWEEN 1 AND 6 AND direction IS NOT NULL) OR (role='staff' AND group_id IS NULL)", name='profile_role'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    login: Mapped[str] = mapped_column(String(80), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    full_name: Mapped[str] = mapped_column(String(180))
    faculty_id: Mapped[int] = mapped_column(ForeignKey('faculties.id'))
    group_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    direction: Mapped[str | None] = mapped_column(String(160), nullable=True)
    course: Mapped[int | None] = mapped_column(Integer, nullable=True)


class LoginSession(Base):
    __tablename__ = 'sessions'
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    csrf: Mapped[str] = mapped_column(String(100))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class CertificateRequest(Base):
    __tablename__ = 'requests'
    __table_args__ = (
        UniqueConstraint('student_id', 'idempotency_key'),
        CheckConstraint("status IN ('accepted','in_progress','needs_info','ready')", name='request_status'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    idempotency_key: Mapped[str] = mapped_column(String(36))
    purpose: Mapped[str] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(30), default='accepted', index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    version: Mapped[int] = mapped_column(Integer, default=1)
    __mapper_args__ = {'version_id_col': version}
    student: Mapped[User] = relationship()
    events: Mapped[list['RequestEvent']] = relationship(order_by='RequestEvent.id')

    @property
    def number(self):
        return f'СО-{self.id:06d}'


class RequestEvent(Base):
    __tablename__ = 'request_events'
    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey('requests.id'), index=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    kind: Mapped[str] = mapped_column(String(30))
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    actor: Mapped[User] = relationship()


class Document(Base):
    __tablename__ = 'documents'
    request_id: Mapped[int] = mapped_column(ForeignKey('requests.id'), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Notification(Base):
    __tablename__ = 'notifications'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    request_id: Mapped[int] = mapped_column(ForeignKey('requests.id'))
    title: Mapped[str] = mapped_column(String(200))
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
