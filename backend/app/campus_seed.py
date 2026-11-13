from datetime import timedelta
from sqlalchemy import select
from .models import Announcement, Lesson, User, now


def seed_announcements(db):
    a, b, staff = [db.scalar(select(User).where(User.login == login)) for login in ['student.a', 'student.b', 'staff.a']]
    moved = db.scalar(select(Lesson).where(Lesson.demo_key == 'a-moved'))
    definitions = [
        ('university', 'university', None, None, None, 'Добро пожаловать в Северный кампус', 'Справки, расписание и результаты доступны в вашем кабинете.', 'Университет Северного кампуса', False),
        ('faculty-a', 'faculty', a.faculty_id, None, None, 'Приём учебного отдела', 'Вымышленный учебный отдел отвечает на вопросы по будням с 10:00 до 16:00.', 'Деканат общественных наук', False),
        ('faculty-b', 'faculty', b.faculty_id, None, None, 'Проектная неделя', 'Подготовьте демонстрационный проект интерфейса к консультации своей группы.', 'Деканат цифровых технологий', False),
        ('group-move', 'group', a.faculty_id, a.group_id, moved.id, 'Изменение аудитории семинара', 'Проверьте актуальное место занятия в связанной карточке.', 'Деканат общественных наук', True),
    ]
    for key, audience, faculty, group, lesson, title, text, source, pinned in definitions:
        if db.scalar(select(Announcement.id).where(Announcement.demo_key == key)):
            continue
        db.add(Announcement(demo_key=key, author_id=staff.id if faculty == a.faculty_id else None,
            title=title, text=text, source=source, audience=audience, faculty_id=faculty,
            group_id=group, lesson_id=lesson, status='published', pinned=pinned,
            published_at=now() - timedelta(minutes=10)))
