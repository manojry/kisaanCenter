"""
Create transactions table and related tables

Revision ID: 004
Revises: 003
Create Date: 2025-08-30 18:50:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None

def upgrade():
    # Create enums
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled'); END IF; END $$;")
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed'); END IF; END $$;")
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'completion_status') THEN CREATE TYPE completion_status AS ENUM ('incomplete', 'complete'); END IF; END $$;")
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_status') THEN CREATE TYPE record_status AS ENUM ('active', 'inactive'); END IF; END $$;")
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN CREATE TYPE payment_type AS ENUM ('full', 'partial', 'advance'); END IF; END $$;")
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'farmer_payment_type') THEN CREATE TYPE farmer_payment_type AS ENUM ('advance', 'settlement', 'bonus'); END IF; END $$;")
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_status') THEN CREATE TYPE credit_status AS ENUM ('pending', 'approved', 'rejected'); END IF; END $$;")

    # Create transactions table
    op.create_table('transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('shop_id', sa.Integer(), nullable=False),
        sa.Column('buyer_user_id', sa.Integer(), nullable=False),
        sa.Column('parent_transaction_id', sa.Integer(), nullable=True),
        sa.Column('type', sa.String(20), nullable=False, server_default='sale'),
        sa.Column('status', sa.Enum('pending', 'completed', 'cancelled', name='transaction_status'), nullable=False, server_default='pending'),
        sa.Column('commission_rate', sa.DECIMAL(5,2), nullable=True, server_default='0.00'),
        sa.Column('commission_amount', sa.DECIMAL(12,2), nullable=True, server_default='0.00'),
        sa.Column('payment_status', sa.Enum('pending', 'partial', 'completed', name='payment_status'), nullable=False, server_default='pending'),
        sa.Column('buyer_paid_amount', sa.DECIMAL(12,2), nullable=True, server_default='0.00'),
        sa.Column('farmer_paid_amount', sa.DECIMAL(12,2), nullable=True, server_default='0.00'),
        sa.Column('commission_confirmed', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('completion_status', sa.Enum('incomplete', 'complete', name='completion_status'), nullable=False, server_default='incomplete'),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['shop_id'], ['shop.id']),
        sa.ForeignKeyConstraint(['buyer_user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['parent_transaction_id'], ['transactions.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Create transaction_items table
    op.create_table('transaction_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('farmer_stock_id', sa.Integer(), nullable=True),
        sa.Column('quantity', sa.DECIMAL(10,3), nullable=False),
        sa.Column('price', sa.DECIMAL(10,2), nullable=False),
        sa.Column('status', sa.Enum('active', 'inactive', name='record_status'), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id']),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.ForeignKeyConstraint(['farmer_stock_id'], ['farmer_stock.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Create credit table
    op.create_table('credit',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.DECIMAL(12,2), nullable=False),
        sa.Column('status', sa.Enum('pending', 'approved', 'rejected', name='credit_status'), nullable=False, server_default='pending'),
        sa.Column('record_status', sa.Enum('active', 'inactive', name='record_status'), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Create payment_method table
    op.create_table('payment_method',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Create payment table
    op.create_table('payment',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('credit_id', sa.Integer(), nullable=True),
        sa.Column('amount', sa.DECIMAL(12,2), nullable=False),
        sa.Column('payment_method_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.Enum('full', 'partial', 'advance', name='payment_type'), nullable=False),
        sa.Column('status', sa.Enum('active', 'inactive', name='record_status'), server_default='active'),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('reference_number', sa.String(100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('processed_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id']),
        sa.ForeignKeyConstraint(['credit_id'], ['credit.id']),
        sa.ForeignKeyConstraint(['payment_method_id'], ['payment_method.id']),
        sa.ForeignKeyConstraint(['processed_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Create farmer_payment table
    op.create_table('farmer_payment',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('farmer_stock_id', sa.Integer(), nullable=True),
        sa.Column('farmer_user_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.DECIMAL(12,2), nullable=False),
        sa.Column('payment_type', sa.Enum('advance', 'settlement', 'bonus', name='farmer_payment_type'), nullable=False),
        sa.Column('payment_method_id', sa.Integer(), nullable=False),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('reference_number', sa.String(100), nullable=True),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('active', 'inactive', name='record_status'), server_default='active'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id']),
        sa.ForeignKeyConstraint(['farmer_stock_id'], ['farmer_stock.id']),
        sa.ForeignKeyConstraint(['farmer_user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['payment_method_id'], ['payment_method.id']),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('farmer_payment')
    op.drop_table('payment')
    op.drop_table('payment_method')
    op.drop_table('credit')
    op.drop_table('transaction_items')
    op.drop_table('transactions')
    op.execute("DROP TYPE IF EXISTS farmer_payment_type;")
    op.execute("DROP TYPE IF EXISTS payment_type;")
    op.execute("DROP TYPE IF EXISTS record_status;")
    op.execute("DROP TYPE IF EXISTS completion_status;")
    op.execute("DROP TYPE IF EXISTS payment_status;")
    op.execute("DROP TYPE IF EXISTS transaction_status;")
    op.execute("DROP TYPE IF EXISTS credit_status;")