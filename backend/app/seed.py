import argparse
from sqlalchemy import select
from .config import settings
from .db import SessionLocal
from .models import Faculty, Group, User
from .security import passwords


def seed(db, credentials):
    faculties = [('Факультет общественных наук', 'ОН-201'), ('Факультет цифровых технологий', 'ЦТ-202')]
    groups = []
    for name, group_name in faculties:
        faculty = db.scalar(select(Faculty).where(Faculty.name == name))
        if not faculty:
            faculty = Faculty(name=name)
            db.add(faculty)
            db.flush()
        group = db.scalar(select(Group).where(Group.name == group_name))
        if not group:
            group = Group(name=group_name, faculty_id=faculty.id)
            db.add(group)
            db.flush()
        groups.append(group)
    records = [
        ('student.a', 'Алина Ветрова', 'student', groups[0], 'Социология', 2),
        ('student.b', 'Марк Леснов', 'student', groups[1], 'Прикладная информатика', 2),
        ('staff.a', 'Ирина Речная', 'staff', groups[0], None, None),
    ]
    for login, name, role, group, direction, course in records:
        if not db.scalar(select(User).where(User.login == login)):
            password = credentials[login]
            if len(password) < 12:
                raise ValueError(f'Задайте пароль {login} в окружении (минимум 12 символов).')
            db.add(User(login=login, full_name=name, role=role, faculty_id=group.faculty_id,
                group_id=group.id if role == 'student' else None, direction=direction,
                course=course, password_hash=passwords.hash(password)))
    db.commit()


def main():
    parser = argparse.ArgumentParser(description='Идемпотентное демонаполнение. Не сбрасывает действия и пароли.')
    parser.parse_args()
    with SessionLocal() as db:
        seed(db, {'student.a': settings.demo_student_a_password,
                  'student.b': settings.demo_student_b_password, 'staff.a': settings.demo_staff_password})
    print('Демопрофили готовы. Существующие записи сохранены.')


if __name__ == '__main__':
    main()
