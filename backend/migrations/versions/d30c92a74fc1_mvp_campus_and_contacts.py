"""Backfill campus directories and add contacts and linked notifications."""
from alembic import op
import sqlalchemy as sa

revision = 'd30c92a74fc1'
down_revision = '809243ec75e2'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('contact_email', sa.String(254)))
    op.add_column('users', sa.Column('contact_phone', sa.String(32)))
    op.add_column('announcements', sa.Column('fact', sa.String(140)))
    op.create_table('teachers',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(180), nullable=False))
    op.create_table('campus_rooms',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('building', sa.String(120), nullable=False),
        sa.Column('number', sa.String(40), nullable=False),
        sa.Column('floor', sa.Integer()),
        sa.Column('map_node', sa.String(40), unique=True),
        sa.UniqueConstraint('building', 'number', name='campus_room_place'))
    op.add_column('lessons', sa.Column('teacher_id', sa.Integer()))
    op.add_column('lessons', sa.Column('room_id', sa.Integer()))
    op.execute('INSERT INTO teachers (name) SELECT DISTINCT teacher FROM lessons ORDER BY teacher')
    op.execute('INSERT INTO campus_rooms (building, number) SELECT DISTINCT building, room FROM lessons ORDER BY building, room')
    op.execute('UPDATE lessons SET teacher_id = teachers.id FROM teachers WHERE lessons.teacher = teachers.name')
    op.execute('UPDATE lessons SET room_id = campus_rooms.id FROM campus_rooms WHERE lessons.building = campus_rooms.building AND lessons.room = campus_rooms.number')
    op.alter_column('lessons', 'teacher_id', nullable=False)
    op.alter_column('lessons', 'room_id', nullable=False)
    op.create_foreign_key('lesson_teacher_fk', 'lessons', 'teachers', ['teacher_id'], ['id'])
    op.create_foreign_key('lesson_room_fk', 'lessons', 'campus_rooms', ['room_id'], ['id'])
    for field in ('teacher', 'building', 'room'):
        op.drop_column('lessons', field)
    op.add_column('notifications', sa.Column('kind', sa.String(20), nullable=False, server_default='request'))
    op.alter_column('notifications', 'kind', server_default=None)
    op.alter_column('notifications', 'request_id', nullable=True)
    op.add_column('notifications', sa.Column('lesson_id', sa.Integer()))
    op.add_column('notifications', sa.Column('announcement_id', sa.Integer()))
    op.create_foreign_key('notification_lesson_fk', 'notifications', 'lessons', ['lesson_id'], ['id'])
    op.create_foreign_key('notification_announcement_fk', 'notifications', 'announcements', ['announcement_id'], ['id'])
    op.create_check_constraint('notification_target', 'notifications',
        "(kind='request' AND request_id IS NOT NULL AND lesson_id IS NULL AND announcement_id IS NULL) OR "
        "(kind='lesson' AND request_id IS NULL AND lesson_id IS NOT NULL AND announcement_id IS NULL) OR "
        "(kind='announcement' AND request_id IS NULL AND lesson_id IS NULL AND announcement_id IS NOT NULL)")


def downgrade():
    op.drop_constraint('notification_target', 'notifications', type_='check')
    op.execute("DELETE FROM notifications WHERE kind <> 'request'")
    op.drop_constraint('notification_announcement_fk', 'notifications', type_='foreignkey')
    op.drop_constraint('notification_lesson_fk', 'notifications', type_='foreignkey')
    for field in ('announcement_id', 'lesson_id', 'kind'):
        op.drop_column('notifications', field)
    op.alter_column('notifications', 'request_id', nullable=False)
    op.add_column('lessons', sa.Column('teacher', sa.String(180)))
    op.add_column('lessons', sa.Column('building', sa.String(120)))
    op.add_column('lessons', sa.Column('room', sa.String(40)))
    op.execute('UPDATE lessons SET teacher = teachers.name FROM teachers WHERE lessons.teacher_id = teachers.id')
    op.execute('UPDATE lessons SET building = campus_rooms.building, room = campus_rooms.number FROM campus_rooms WHERE lessons.room_id = campus_rooms.id')
    for field in ('teacher', 'building', 'room'):
        op.alter_column('lessons', field, nullable=False)
    for field in ('room_id', 'teacher_id'):
        op.drop_column('lessons', field)
    op.drop_table('campus_rooms')
    op.drop_table('teachers')
    op.drop_column('announcements', 'fact')
    op.drop_column('users', 'contact_phone')
    op.drop_column('users', 'contact_email')
