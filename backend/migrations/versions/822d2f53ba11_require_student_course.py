"""Require a non-null course in student profiles."""
from alembic import op
import sqlalchemy as sa
revision = '822d2f53ba11'
down_revision = '7657e2972037'
branch_labels = None
depends_on = None
def upgrade():
    op.drop_constraint('profile_role', 'users', type_='check')
    op.create_check_constraint('profile_role', 'users', "(role='student' AND group_id IS NOT NULL AND course IS NOT NULL AND course BETWEEN 1 AND 6 AND direction IS NOT NULL) OR (role='staff' AND group_id IS NULL)")
def downgrade():
    op.drop_constraint('profile_role', 'users', type_='check')
    op.create_check_constraint('profile_role', 'users', "(role='student' AND group_id IS NOT NULL AND course BETWEEN 1 AND 6 AND direction IS NOT NULL) OR (role='staff' AND group_id IS NULL)")
