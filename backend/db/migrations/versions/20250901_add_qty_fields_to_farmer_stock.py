"""
Alembic migration: Add declared_qty, sold_qty, balance_qty to farmer_stock
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('farmer_stock', sa.Column('declared_qty', sa.Numeric(10,3), nullable=True))
    op.add_column('farmer_stock', sa.Column('sold_qty', sa.Numeric(10,3), nullable=True, server_default='0.000'))
    op.add_column('farmer_stock', sa.Column('balance_qty', sa.Numeric(10,3), nullable=True))

def downgrade():
    op.drop_column('farmer_stock', 'declared_qty')
    op.drop_column('farmer_stock', 'sold_qty')
    op.drop_column('farmer_stock', 'balance_qty')
