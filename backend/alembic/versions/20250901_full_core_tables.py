"""
Alembic migration: Create all core tables for KisaanCenter
"""

# Alembic migration: Create all core tables for KisaanCenter

from alembic import op
import sqlalchemy as sa

# ENUMS (move to module scope)
user_role_enum = sa.Enum('superadmin', 'owner', 'farmer', 'buyer', 'employee', name='user_role')
record_status_enum = sa.Enum('active', 'inactive', 'deleted', name='record_status')
transaction_status_enum = sa.Enum('pending', 'processing', 'completed', 'cancelled', name='transaction_status')
payment_status_enum = sa.Enum('pending', 'partial', 'completed', 'failed', name='payment_status')
payment_type_enum = sa.Enum('full_payment', 'partial_payment', 'advance', name='payment_type')

revision = '20250901_full_core_tables'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Check and create enums only if they don't exist
    connection = op.get_bind()
    
    # Check if user_role enum exists
    result = connection.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = 'user_role'"))
    if not result.fetchone():
        connection.execute(sa.text("CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'farmer', 'buyer', 'employee')"))
    
    # Check if record_status enum exists
    result = connection.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = 'record_status'"))
    if not result.fetchone():
        connection.execute(sa.text("CREATE TYPE record_status AS ENUM ('active', 'inactive', 'deleted')"))
    
    # Check if transaction_status enum exists
    result = connection.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = 'transaction_status'"))
    if not result.fetchone():
        connection.execute(sa.text("CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'cancelled')"))
    
    # Check if payment_status enum exists
    result = connection.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = 'payment_status'"))
    if not result.fetchone():
        connection.execute(sa.text("CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed', 'failed')"))
    
    # Check if payment_type enum exists
    result = connection.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = 'payment_type'"))
    if not result.fetchone():
        connection.execute(sa.text("CREATE TYPE payment_type AS ENUM ('full_payment', 'partial_payment', 'advance')"))
    
    # Define enums with create_type=False since we just created them
    user_role_enum = sa.Enum('superadmin', 'owner', 'farmer', 'buyer', 'employee', name='user_role', create_type=False)
    record_status_enum = sa.Enum('active', 'inactive', 'deleted', name='record_status', create_type=False)
    transaction_status_enum = sa.Enum('pending', 'processing', 'completed', 'cancelled', name='transaction_status', create_type=False)
    payment_status_enum = sa.Enum('pending', 'partial', 'completed', 'failed', name='payment_status', create_type=False)
    payment_type_enum = sa.Enum('full_payment', 'partial_payment', 'advance', name='payment_type', create_type=False)

    # USERS table first (without shop_id foreign key to avoid circular dependency)
    op.create_table(
        'users',
        sa.Column('id', sa.Integer, primary_key=True),
    sa.Column('username', sa.String(50), unique=True, nullable=False),
    sa.Column('role', user_role_enum, nullable=False),
    sa.Column('shop_id', sa.Integer),  # No foreign key constraint yet
    sa.Column('password_hash', sa.String(255)),
    sa.Column('email', sa.String(100), nullable=True),  # Optional email
    sa.Column('contact', sa.String(50)),
    sa.Column('credit_limit', sa.Numeric(12,2)),
    sa.Column('record_status', record_status_enum, server_default='active'),
    sa.Column('created_by', sa.Integer),  # No foreign key constraint yet
    sa.Column('created_at', sa.DateTime),
    sa.Column('updated_at', sa.DateTime),
    )

    # SHOPS table
    op.create_table(
        'shops',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('owner_id', sa.Integer, sa.ForeignKey('users.id')),
        sa.Column('location', sa.String(255)),
        sa.Column('commission_rate', sa.Numeric(5,2), server_default='0.00'),
        sa.Column('record_status', record_status_enum, server_default='active'),
        sa.Column('created_at', sa.DateTime),
        sa.Column('updated_at', sa.DateTime),
    )

    # CATEGORIES
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.String(255)),
        sa.Column('status', record_status_enum, server_default='active'),
        sa.Column('created_at', sa.DateTime),
        sa.Column('updated_at', sa.DateTime),
    )

    # PRODUCTS
    op.create_table(
        'products',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('category_id', sa.Integer, sa.ForeignKey('categories.id')),
        sa.Column('price', sa.Numeric(12,2)),
        sa.Column('shop_id', sa.Integer, sa.ForeignKey('shops.id')),
        sa.Column('record_status', record_status_enum, server_default='active'),
        sa.Column('created_at', sa.DateTime),
        sa.Column('updated_at', sa.DateTime),
    )

    # SHOP_PRODUCTS
    op.create_table(
        'shop_products',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('shop_id', sa.Integer, sa.ForeignKey('shops.id')),
        sa.Column('product_id', sa.Integer, sa.ForeignKey('products.id')),
        sa.Column('is_active', sa.Boolean, server_default=sa.sql.expression.true()),
    )

    # FARMER_STOCK
    op.create_table(
        'farmer_stock',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('farmer_id', sa.Integer, sa.ForeignKey('users.id')),
        sa.Column('shop_id', sa.Integer, sa.ForeignKey('shops.id')),
        sa.Column('product_id', sa.Integer, sa.ForeignKey('products.id')),
        sa.Column('quantity', sa.Integer),
        sa.Column('record_status', record_status_enum, server_default='active'),
        sa.Column('created_at', sa.DateTime),
        sa.Column('updated_at', sa.DateTime),
    )

    # TRANSACTIONS
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('shop_id', sa.Integer, sa.ForeignKey('shops.id')),
        sa.Column('buyer_id', sa.Integer, sa.ForeignKey('users.id')),
        sa.Column('transaction_type', sa.String(20)),
        sa.Column('commission_rate', sa.Numeric(5,2)),
        sa.Column('status', transaction_status_enum),
        sa.Column('created_at', sa.DateTime),
        sa.Column('updated_at', sa.DateTime),
    )

    # TRANSACTION_ITEMS
    op.create_table(
        'transaction_items',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('transaction_id', sa.Integer, sa.ForeignKey('transactions.id')),
        sa.Column('product_id', sa.Integer, sa.ForeignKey('products.id')),
        sa.Column('farmer_stock_id', sa.Integer, sa.ForeignKey('farmer_stock.id')),
        sa.Column('quantity', sa.Integer),
        sa.Column('price', sa.Numeric(12,2)),
    )

    # PAYMENTS
    op.create_table(
        'payments',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('transaction_id', sa.Integer, sa.ForeignKey('transactions.id')),
        sa.Column('amount', sa.Numeric(12,2)),
        sa.Column('payment_type', payment_type_enum),
        sa.Column('status', payment_status_enum),
        sa.Column('created_at', sa.DateTime),
    )

    # CREDITS
    op.create_table(
        'credits',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id')),
        sa.Column('shop_id', sa.Integer, sa.ForeignKey('shops.id')),
        sa.Column('amount', sa.Numeric(12,2)),
        sa.Column('status', sa.String(20)),
        sa.Column('created_at', sa.DateTime),
    )

    # Now add the foreign key constraints that were deferred
    op.create_foreign_key(
        'fk_users_shop_id',
        'users', 'shops',
        ['shop_id'], ['id']
    )
    
    op.create_foreign_key(
        'fk_users_created_by',
        'users', 'users',
        ['created_by'], ['id']
    )

def downgrade():
    # Drop foreign key constraints first
    op.drop_constraint('fk_users_shop_id', 'users', type_='foreignkey')
    op.drop_constraint('fk_users_created_by', 'users', type_='foreignkey')
    
    # Drop tables in reverse order
    op.drop_table('credits')
    op.drop_table('payments')
    op.drop_table('transaction_items')
    op.drop_table('transactions')
    op.drop_table('farmer_stock')
    op.drop_table('shop_products')
    op.drop_table('products')
    op.drop_table('categories')
    op.drop_table('shops')
    op.drop_table('users')
    
    # Drop enums
    op.execute("DROP TYPE IF EXISTS payment_type CASCADE")
    op.execute("DROP TYPE IF EXISTS payment_status CASCADE") 
    op.execute("DROP TYPE IF EXISTS transaction_status CASCADE")
    op.execute("DROP TYPE IF EXISTS record_status CASCADE")
    op.execute("DROP TYPE IF EXISTS user_role CASCADE")
