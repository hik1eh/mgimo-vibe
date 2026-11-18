import argparse
from datetime import date
from sqlalchemy import select
from .config import settings
from .db import SessionLocal
from .models import Faculty, Group, User
from .security import passwords
from .study_seed import seed_study
from .campus_seed import seed_announcements
from .campus_map import seed_maps


def seed(db, credentials, demo_date=None):
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
    cards = {
        'student.a': (date(2006, 3, 22), 'Очная', 'СК-ОН-0201'),
        'student.b': (date(2007, 1, 19), 'Очно-заочная', 'СК-ЦТ-0202'),
    }
    for login, name, role, group, direction, course in records:
        user = db.scalar(select(User).where(User.login == login))
        if not user:
            password = credentials[login]
            if len(password) < 12:
                raise ValueError(f'Задайте пароль {login} в окружении (минимум 12 символов).')
            user = User(login=login, full_name=name, role=role, faculty_id=group.faculty_id,
                group_id=group.id if role == 'student' else None, direction=direction,
                course=course, password_hash=passwords.hash(password))
            db.add(user)
        if role == user.role == 'student':
            birthday, mode, number = cards[login]
            user.birth_date = user.birth_date or birthday
            user.study_mode = user.study_mode or mode
            user.student_card_number = user.student_card_number or number
    db.flush()
    seed_maps(db)
    seed_study(db, demo_date)
    db.flush()
    seed_announcements(db)
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
