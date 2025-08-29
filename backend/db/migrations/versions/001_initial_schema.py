
"""Initial schema creation

Revision ID: 001
Revises: 
Create Date: 2024-01-01 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create plans table
    op.create_table('plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('monthly_price', sa.DECIMAL(10,2), nullable=False),
        sa.Column('quarterly_price', sa.DECIMAL(10,2), nullable=True),
        sa.Column('yearly_price', sa.DECIMAL(10,2), nullable=True),
        sa.Column('max_farmers', sa.Integer(), nullable=False),
        sa.Column('max_buyers', sa.Integer(), nullable=False),
        sa.Column('max_transactions', sa.Integer(), nullable=False),
        sa.Column('data_retention_months', sa.Integer(), nullable=False),
        sa.Column('features', postgresql.JSONB(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create shop table
    op.create_table('shop',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('contact', sa.String(15), nullable=True),
        sa.Column('commission_rate', sa.DECIMAL(5,2), nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=True),
        sa.Column('plan_id', sa.Integer(), nullable=False),
        sa.Column('plan_start_date', sa.Date(), nullable=True),
        sa.Column('plan_end_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['plan_id'], ['plans.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(50), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('contact', sa.String(15), nullable=True),
        sa.Column('shop_id', sa.Integer(), nullable=True),
        sa.Column('credit_limit', sa.DECIMAL(12,2), nullable=True),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['shop_id'], ['shop.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username')
    )
    
    # Add owner_id foreign key to shop table
    op.create_foreign_key(
        'fk_shop_owner_id', 'shop', 'users',
        ['owner_id'], ['id']
    )

def downgrade():
    op.drop_constraint('fk_shop_owner_id', 'shop', type_='foreignkey')
    op.drop_table('users')
    op.drop_table('shop')
    op.drop_table('plans')
