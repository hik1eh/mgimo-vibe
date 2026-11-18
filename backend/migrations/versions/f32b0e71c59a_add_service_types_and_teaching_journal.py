"""Extend requests and add the teaching journal."""

from alembic import op
import sqlalchemy as sa

revision = 'f32b0e71c59a'
down_revision = '4e792f10b5ac'
branch_labels = None
depends_on = None


STUDENT_PROFILE = (
    "role='student' AND group_id IS NOT NULL AND course IS NOT NULL AND course BETWEEN 1 AND 6 "
    "AND direction IS NOT NULL"
)


def upgrade():
    op.add_column('requests', sa.Column('kind', sa.String(30), server_default='study', nullable=False))
    op.create_check_constraint('request_kind', 'requests',
        "kind IN ('study','practice','military','retake','academic_leave','dean_message')")

    op.add_column('teachers', sa.Column('full_name', sa.String(180)))
    op.add_column('teachers', sa.Column('work_email', sa.String(254)))
    op.add_column('users', sa.Column('teacher_id', sa.Integer()))
    op.create_foreign_key('user_teacher_fk', 'users', 'teachers', ['teacher_id'], ['id'])
    op.create_unique_constraint('user_teacher_account', 'users', ['teacher_id'])
    op.drop_constraint('user_role', 'users', type_='check')
    op.drop_constraint('profile_role', 'users', type_='check')
    op.create_check_constraint('user_role', 'users', "role IN ('student','staff','teacher')")
    op.create_check_constraint('profile_role', 'users',
        f"({STUDENT_PROFILE} AND teacher_id IS NULL) OR "
        "(role='staff' AND group_id IS NULL AND teacher_id IS NULL) OR "
        "(role='teacher' AND group_id IS NULL AND teacher_id IS NOT NULL)")

    op.add_column('lessons', sa.Column('semester', sa.Integer()))
    op.create_check_constraint('lesson_semester', 'lessons', 'semester BETWEEN 1 AND 12')
    op.create_index('ix_lessons_teacher_id', 'lessons', ['teacher_id'])
    op.execute(
        "UPDATE lessons SET semester=3 WHERE "
        "demo_key IN ('a-moved','a-regular','a-consultation','a-cancelled','b-regular','b-second','b-friday') "
        "OR demo_key LIKE 'a-timetable-%' OR demo_key LIKE 'b-timetable-%'"
    )
    op.create_table(
        'lesson_journal',
        sa.Column('lesson_id', sa.Integer(), sa.ForeignKey('lessons.id'), primary_key=True),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('attendance', sa.String(12)),
        sa.Column('checkpoint', sa.String(12)),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.CheckConstraint("attendance IN ('present','absent')", name='journal_attendance'),
        sa.CheckConstraint("checkpoint IN ('completed','pending')", name='journal_checkpoint'),
    )
    op.create_index('ix_lesson_journal_student_id', 'lesson_journal', ['student_id'])


def downgrade():
    op.drop_table('lesson_journal')
    op.drop_index('ix_lessons_teacher_id', table_name='lessons')
    op.drop_constraint('lesson_semester', 'lessons', type_='check')
    op.drop_column('lessons', 'semester')

    op.execute("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE role='teacher')")
    op.execute("DELETE FROM users WHERE role='teacher'")
    op.drop_constraint('profile_role', 'users', type_='check')
    op.drop_constraint('user_role', 'users', type_='check')
    op.create_check_constraint('user_role', 'users', "role IN ('student','staff')")
    op.create_check_constraint('profile_role', 'users',
        f"({STUDENT_PROFILE}) OR (role='staff' AND group_id IS NULL)")
    op.drop_column('users', 'teacher_id')
    op.drop_column('teachers', 'work_email')
    op.drop_column('teachers', 'full_name')
    op.drop_constraint('request_kind', 'requests', type_='check')
    op.drop_column('requests', 'kind')
