"""
Alembic migration: Add owner_id to shop table
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('shop', sa.Column('owner_id', sa.Integer(), nullable=False))
    op.create_foreign_key('fk_shop_owner_id_users', 'shop', 'users', ['owner_id'], ['id'])

def downgrade():
    op.drop_constraint('fk_shop_owner_id_users', 'shop', type_='foreignkey')
    op.drop_column('shop', 'owner_id')
