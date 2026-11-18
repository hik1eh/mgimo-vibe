from sqlalchemy import select

from .models import Lesson, LessonJournal, Teacher, User
from .security import passwords


TEACHERS = {
    'Елена Лазурная': ('Лазурная Елена Андреевна', 'e.lazurnaya'),
    'Павел Кедров': ('Кедров Павел Иванович', 'p.kedrov'),
    'Софья Снегирева': ('Снегирева Софья Алексеевна', 's.snegireva'),
    'Роман Береговой': ('Береговой Роман Юрьевич', 'r.beregovoy'),
    'Вера Тихолесова': ('Тихолесова Вера Павловна', 'v.tikholesova'),
    'Илья Светлов': ('Светлов Илья Максимович', 'i.svetlov'),
    'Майя Вишнева': ('Вишнева Майя Олеговна', 'm.vishneva'),
    'Лев Ясный': ('Ясный Лев Андреевич', 'l.yasny'),
    'Дарья Туманова': ('Туманова Дарья Сергеевна', 'd.tumanova'),
    'Олег Кленов': ('Кленов Олег Леонидович', 'o.klenov'),
    'Яна Серебрина': ('Серебрина Яна Михайловна', 'y.serebrina'),
    'Константин Озеров': ('Озеров Константин Денисович', 'k.ozerov'),
    'Наталья Горская': ('Горская Наталья Олеговна', 'n.gorskaya'),
    'Фёдор Ветлов': ('Ветлов Фёдор Романович', 'f.vetlov'),
}


def seed_teaching(db, faculty_id, password):
    instructors = db.scalars(select(Teacher).where(Teacher.name.in_(TEACHERS)).order_by(Teacher.id)).all()
    for instructor in instructors:
        name, local_part = TEACHERS[instructor.name]
        instructor.full_name = instructor.full_name or name
        instructor.work_email = instructor.work_email or f'{local_part}@north-campus.example'

    if password and not db.scalar(select(User.id).where(User.login == 'teacher.a')):
        if len(password) < 12:
            raise ValueError('Задайте пароль teacher.a в окружении (минимум 12 символов).')
        instructor = next(row for row in instructors if row.name == 'Елена Лазурная')
        db.add(User(login='teacher.a', role='teacher', faculty_id=faculty_id, teacher_id=instructor.id,
                    full_name=instructor.full_name, password_hash=passwords.hash(password)))

    fixtures = [
        ('student.a', 'a-moved', 'present', 'completed'),
        ('student.b', 'b-regular', 'present', 'pending'),
    ]
    for login, key, attendance, checkpoint in fixtures:
        record = db.execute(
            select(Lesson.id, User.id).join(User, User.group_id == Lesson.group_id)
            .where(Lesson.demo_key == key, User.login == login)
        ).one_or_none()
        if record is None:
            continue
        lesson_id, student_id = record
        if db.get(LessonJournal, (lesson_id, student_id)) is None:
            db.add(LessonJournal(lesson_id=lesson_id, student_id=student_id,
                                 attendance=attendance, checkpoint=checkpoint))
