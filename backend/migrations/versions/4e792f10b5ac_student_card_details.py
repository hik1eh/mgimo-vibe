"""Add student card details.

Revision ID: 4e792f10b5ac
Revises: d30c92a74fc1
"""

from alembic import op
import sqlalchemy as sa

revision = '4e792f10b5ac'
down_revision = 'd30c92a74fc1'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('birth_date', sa.Date(), nullable=True))
    op.add_column('users', sa.Column('study_mode', sa.String(32), nullable=True))
    op.add_column('users', sa.Column('student_card_number', sa.String(40), nullable=True))


def downgrade():
    op.drop_column('users', 'student_card_number')
    op.drop_column('users', 'study_mode')
    op.drop_column('users', 'birth_date')
