from datetime import date, datetime, timezone
from sqlalchemy import (String, Integer, Text, Date, DateTime, ForeignKey, ForeignKeyConstraint,
                        UniqueConstraint, CheckConstraint, Boolean, JSON)
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


class StudyScenario(Base):
    __tablename__ = 'study_scenarios'
    __table_args__ = (CheckConstraint('id = 1', name='single_study_scenario'),)
    id: Mapped[int] = mapped_column(primary_key=True)
    reference_date: Mapped[date] = mapped_column(Date)


class Lesson(Base):
    __tablename__ = 'lessons'
    __table_args__ = (
        UniqueConstraint('id', 'group_id', name='lesson_id_group'),
        CheckConstraint('ends_at > starts_at', name='lesson_time_order'),
        CheckConstraint("status IN ('scheduled','moved','cancelled')", name='lesson_status'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    demo_key: Mapped[str | None] = mapped_column(String(80), unique=True, nullable=True)
    group_id: Mapped[int] = mapped_column(ForeignKey('groups.id'), index=True)
    subject: Mapped[str] = mapped_column(String(180))
    teacher: Mapped[str] = mapped_column(String(180))
    kind: Mapped[str] = mapped_column(String(50))
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    building: Mapped[str] = mapped_column(String(120))
    room: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(20), default='scheduled')
    version: Mapped[int] = mapped_column(Integer, default=1)
    __mapper_args__ = {'version_id_col': version}
    group: Mapped[Group] = relationship()
    changes: Mapped[list['LessonChange']] = relationship(order_by='LessonChange.id')


class LessonChange(Base):
    __tablename__ = 'lesson_changes'
    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey('lessons.id'), index=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    before: Mapped[dict] = mapped_column(JSON)
    after: Mapped[dict] = mapped_column(JSON)
    reason: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class AcademicResult(Base):
    __tablename__ = 'academic_results'
    __table_args__ = (
        CheckConstraint('semester BETWEEN 1 AND 12', name='academic_semester'),
        CheckConstraint("status IN ('upcoming','awaiting','published')", name='academic_status'),
        CheckConstraint("kind IN ('credit','exam')", name='academic_kind'),
        CheckConstraint("(kind='credit' AND grade IS NULL AND ((status='published' AND credit_passed IS NOT NULL) OR (status<>'published' AND credit_passed IS NULL))) OR (kind='exam' AND credit_passed IS NULL AND ((status='published' AND grade IS NOT NULL AND grade BETWEEN 2 AND 5) OR (status<>'published' AND grade IS NULL)))", name='academic_outcome'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    demo_key: Mapped[str | None] = mapped_column(String(80), unique=True, nullable=True)
    student_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    subject: Mapped[str] = mapped_column(String(180))
    semester: Mapped[int] = mapped_column(Integer, index=True)
    kind: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20))
    control_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    grade: Mapped[int | None] = mapped_column(Integer, nullable=True)
    credit_passed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)


class Announcement(Base):
    __tablename__ = 'announcements'
    __table_args__ = (
        UniqueConstraint('author_id', 'idempotency_key', name='announcement_submission'),
        ForeignKeyConstraint(['group_id', 'faculty_id'], ['groups.id', 'groups.faculty_id']),
        ForeignKeyConstraint(['lesson_id', 'group_id'], ['lessons.id', 'lessons.group_id']),
        CheckConstraint("(audience='university' AND faculty_id IS NULL AND group_id IS NULL) OR (audience='faculty' AND faculty_id IS NOT NULL AND group_id IS NULL) OR (audience='group' AND faculty_id IS NOT NULL AND group_id IS NOT NULL)", name='announcement_audience'),
        CheckConstraint("lesson_id IS NULL OR (audience='group' AND group_id IS NOT NULL)", name='announcement_lesson_audience'),
        CheckConstraint("status IN ('draft','published','withdrawn')", name='announcement_status'),
        CheckConstraint("status<>'published' OR published_at IS NOT NULL", name='announcement_publication'),
        CheckConstraint('expires_at IS NULL OR published_at IS NULL OR expires_at > published_at', name='announcement_expiry'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    demo_key: Mapped[str | None] = mapped_column(String(80), unique=True, nullable=True)
    author_id: Mapped[int | None] = mapped_column(ForeignKey('users.id'), nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(36), nullable=True)
    create_digest: Mapped[str | None] = mapped_column(String(64), nullable=True)
    title: Mapped[str] = mapped_column(String(160))
    text: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(180))
    audience: Mapped[str] = mapped_column(String(20))
    faculty_id: Mapped[int | None] = mapped_column(ForeignKey('faculties.id'), nullable=True, index=True)
    group_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lesson_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default='draft')
    pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    __mapper_args__ = {'version_id_col': version}
    lesson: Mapped[Lesson | None] = relationship(foreign_keys=[lesson_id, group_id])
