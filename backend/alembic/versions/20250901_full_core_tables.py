"""
Alembic migration: Create all core tables for KisaanCenter
"""
from alembic import op
import sqlalchemy as sa

revision = '20250901_full_core_tables'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'shops',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('owner_id', sa.Integer, sa.ForeignKey('users.id')),
        sa.Column('location', sa.String(255)),
        sa.Column('commission_rate', sa.Numeric(5,2), server_default='0.00'),
        sa.Column('status', sa.String(50), server_default='active'),
        sa.Column('created_at', sa.DateTime),
        sa.Column('updated_at', sa.DateTime),
    )
    op.create_table(
        'users',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('username', sa.String(50), unique=True, nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('shop_id', sa.Integer, sa.ForeignKey('shops.id')),
        sa.Column('contact', sa.String(50)),
        sa.Column('credit_limit', sa.Numeric(12,2)),
        sa.Column('status', sa.String(20)),
        sa.Column('created_by', sa.String(50)),
        sa.Column('created_at', sa.DateTime),
        sa.Column('updated_at', sa.DateTime),
    )
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('created_at', sa.DateTime),
        sa.Column('updated_at', sa.DateTime),
    )
    op.create_table(
        'products',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('category', sa.String(100)),
        sa.Column('price', sa.Numeric(12,2)),
        sa.Column('stock', sa.Integer),
        sa.Column('shop_id', sa.Integer, sa.ForeignKey('shops.id')),
        sa.Column('created_at', sa.DateTime),
        sa.Column('updated_at', sa.DateTime),
    )
    op.create_table(
        'shop_products',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('shop_id', sa.Integer, sa.ForeignKey('shops.id')),
        sa.Column('product_id', sa.Integer, sa.ForeignKey('products.id')),
        sa.Column('is_active', sa.Boolean, server_default=sa.sql.expression.true()),
    )
    op.create_table(
        'stock',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('farmer_id', sa.Integer, sa.ForeignKey('users.id')),
        sa.Column('shop_id', sa.Integer, sa.ForeignKey('shops.id')),
        sa.Column('product_id', sa.Integer, sa.ForeignKey('products.id')),
        sa.Column('quantity', sa.Integer),
        sa.Column('status', sa.String(20)),
        sa.Column('created_at', sa.DateTime),
        sa.Column('updated_at', sa.DateTime),
    )
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('shop_id', sa.Integer, sa.ForeignKey('shops.id')),
        sa.Column('buyer_user_id', sa.Integer, sa.ForeignKey('users.id')),
        sa.Column('transaction_type', sa.String(20)),
        sa.Column('commission_rate', sa.Numeric(5,2)),
        sa.Column('status', sa.String(20)),
        sa.Column('created_at', sa.DateTime),
        sa.Column('updated_at', sa.DateTime),
    )
    op.create_table(
        'transaction_items',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('transaction_id', sa.Integer, sa.ForeignKey('transactions.id')),
        sa.Column('product_id', sa.Integer, sa.ForeignKey('products.id')),
        sa.Column('farmer_stock_id', sa.Integer, sa.ForeignKey('stock.id')),
        sa.Column('quantity', sa.Integer),
        sa.Column('price', sa.Numeric(12,2)),
    )
    op.create_table(
        'payments',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('transaction_id', sa.Integer, sa.ForeignKey('transactions.id')),
        sa.Column('amount', sa.Numeric(12,2)),
        sa.Column('method', sa.String(20)),
        sa.Column('status', sa.String(20)),
        sa.Column('created_at', sa.DateTime),
    )
    op.create_table(
        'credits',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id')),
        sa.Column('shop_id', sa.Integer, sa.ForeignKey('shops.id')),
        sa.Column('amount', sa.Numeric(12,2)),
        sa.Column('status', sa.String(20)),
        sa.Column('created_at', sa.DateTime),
    )

def downgrade():
    op.drop_table('credits')
    op.drop_table('payments')
    op.drop_table('transaction_items')
    op.drop_table('transactions')
    op.drop_table('stock')
    op.drop_table('shop_products')
    op.drop_table('products')
    op.drop_table('categories')
    op.drop_table('users')
    op.drop_table('shops')
