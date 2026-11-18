from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.orm import Session, selectinload

from .db import get_db
from .models import Group, Lesson, LessonJournal, Teacher, User
from .schemas import JournalIn
from .security import csrf, student, teacher
from .study import lesson_data


router = APIRouter(prefix='/api/v1')


@router.get('/teachers')
def directory(user=Depends(student), db: Session = Depends(get_db)):
    rows = db.execute(
        select(Teacher.id, Teacher.full_name, Teacher.name, Teacher.work_email, Lesson.subject)
        .join(Lesson, Lesson.teacher_id == Teacher.id)
        .where(Lesson.group_id == user.group_id)
        .distinct()
    )
    contacts = {}
    subjects = defaultdict(list)
    for teacher_id, full_name, name, work_email, subject in rows:
        contacts[teacher_id] = dict(id=teacher_id, full_name=full_name or name, work_email=work_email)
        subjects[teacher_id].append(subject)
    return sorted((dict(contact, subjects=sorted(subjects[teacher_id]))
                   for teacher_id, contact in contacts.items()), key=lambda item: item['full_name'])


def assigned_lessons(user):
    return (select(Lesson).join(Group, Lesson.group_id == Group.id)
            .where(Lesson.teacher_id == user.teacher_id, Group.faculty_id == user.faculty_id))


def journal_students(lesson):
    return (User.role == 'student', User.active, User.group_id == lesson.group_id)


def journal_entry(student_id, full_name, attendance, checkpoint, version):
    return dict(student_id=student_id, full_name=full_name, attendance=attendance,
                checkpoint=checkpoint, version=version or 0)


@router.get('/teaching/lessons')
def teaching_lessons(user=Depends(teacher), db: Session = Depends(get_db)):
    rows = db.scalars(assigned_lessons(user).options(
        selectinload(Lesson.group), selectinload(Lesson.changes),
        selectinload(Lesson.instructor), selectinload(Lesson.place),
    ).order_by(Lesson.starts_at, Lesson.id))
    return [dict(**lesson_data(lesson), semester=lesson.semester) for lesson in rows]


@router.get('/teaching/lessons/{lesson_id}')
def teaching_lesson(lesson_id: int, user=Depends(teacher), db: Session = Depends(get_db)):
    lesson = db.scalar(assigned_lessons(user).where(Lesson.id == lesson_id))
    if lesson is None:
        raise HTTPException(404, 'Занятие недоступно.')
    roster = db.execute(
        select(User.id, User.full_name, LessonJournal.attendance, LessonJournal.checkpoint, LessonJournal.version)
        .outerjoin(LessonJournal, and_(LessonJournal.student_id == User.id, LessonJournal.lesson_id == lesson.id))
        .where(*journal_students(lesson))
        .order_by(User.full_name, User.id)
    )
    return dict(lesson=dict(**lesson_data(lesson), semester=lesson.semester),
                roster=[journal_entry(*row) for row in roster])


@router.put('/teaching/lessons/{lesson_id}/journal/{student_id}', dependencies=[Depends(csrf)])
def edit_journal(lesson_id: int, student_id: int, data: JournalIn,
                 user=Depends(teacher), db: Session = Depends(get_db)):
    # Serialize edits to this lesson, including staff changes such as cancellation.
    lesson = db.scalar(assigned_lessons(user).where(Lesson.id == lesson_id).with_for_update(of=Lesson))
    if lesson is None:
        raise HTTPException(404, 'Занятие недоступно.')
    learner = db.scalar(select(User).where(User.id == student_id, *journal_students(lesson)))
    if learner is None:
        raise HTTPException(404, 'Студент недоступен для этого занятия.')
    if lesson.status == 'cancelled' or lesson.semester is None:
        raise HTTPException(409, 'Журнал этого занятия закрыт.')

    row = db.get(LessonJournal, (lesson.id, learner.id))
    current = (row.attendance, row.checkpoint) if row else (None, None)
    requested = (data.attendance, data.checkpoint)
    version = row.version if row else 0
    if requested == current:
        return journal_entry(learner.id, learner.full_name, *current, version)
    if data.version != version:
        raise HTTPException(409, 'Отметки уже изменились. Обновите журнал.')
    if row is None:
        row = LessonJournal(lesson_id=lesson.id, student_id=learner.id)
        db.add(row)
    row.attendance, row.checkpoint = requested
    row.version = version + 1
    db.commit()
    return journal_entry(learner.id, learner.full_name, *requested, row.version)
