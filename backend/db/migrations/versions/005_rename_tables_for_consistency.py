"""
Rename tables for consistency with models

Revision ID: 005
Revises: 004
Create Date: 2025-08-30 18:55:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None

def upgrade():
    # Rename shop to shops
    op.rename_table('shop', 'shops')
    
    # Rename farmer_stock to farmer_stocks
    op.rename_table('farmer_stock', 'farmer_stocks')
    
    # Update foreign key references in transactions table
    op.drop_constraint('transactions_shop_id_fkey', 'transactions', type_='foreignkey')
    op.create_foreign_key('transactions_shop_id_fkey', 'transactions', 'shops', ['shop_id'], ['id'])
    
    # Update foreign key references in farmer_payment table
    op.drop_constraint('farmer_payment_farmer_stock_id_fkey', 'farmer_payment', type_='foreignkey')
    op.create_foreign_key('farmer_payment_farmer_stock_id_fkey', 'farmer_payment', 'farmer_stocks', ['farmer_stock_id'], ['id'])
    
    # Update foreign key references in transaction_items table
    op.drop_constraint('transaction_items_farmer_stock_id_fkey', 'transaction_items', type_='foreignkey')
    op.create_foreign_key('transaction_items_farmer_stock_id_fkey', 'transaction_items', 'farmer_stocks', ['farmer_stock_id'], ['id'])
    
    # Update foreign key references in farmer_stock_audit table
    op.drop_constraint('farmer_stock_audit_farmer_stock_id_fkey', 'farmer_stock_audit', type_='foreignkey')
    op.create_foreign_key('farmer_stock_audit_farmer_stock_id_fkey', 'farmer_stock_audit', 'farmer_stocks', ['farmer_stock_id'], ['id'])
    
    # Update foreign key references in users table
    op.drop_constraint('users_shop_id_fkey', 'users', type_='foreignkey')
    op.create_foreign_key('users_shop_id_fkey', 'users', 'shops', ['shop_id'], ['id'])

def downgrade():
    # Revert foreign key references
    op.drop_constraint('users_shop_id_fkey', 'users', type_='foreignkey')
    op.create_foreign_key('users_shop_id_fkey', 'users', 'shop', ['shop_id'], ['id'])
    
    op.drop_constraint('farmer_stock_audit_farmer_stock_id_fkey', 'farmer_stock_audit', type_='foreignkey')
    op.create_foreign_key('farmer_stock_audit_farmer_stock_id_fkey', 'farmer_stock_audit', 'farmer_stock', ['farmer_stock_id'], ['id'])
    
    op.drop_constraint('transaction_items_farmer_stock_id_fkey', 'transaction_items', type_='foreignkey')
    op.create_foreign_key('transaction_items_farmer_stock_id_fkey', 'transaction_items', 'farmer_stock', ['farmer_stock_id'], ['id'])
    
    op.drop_constraint('farmer_payment_farmer_stock_id_fkey', 'farmer_payment', type_='foreignkey')
    op.create_foreign_key('farmer_payment_farmer_stock_id_fkey', 'farmer_payment', 'farmer_stock', ['farmer_stock_id'], ['id'])
    
    op.drop_constraint('transactions_shop_id_fkey', 'transactions', type_='foreignkey')
    op.create_foreign_key('transactions_shop_id_fkey', 'transactions', 'shop', ['shop_id'], ['id'])
    
    # Rename tables back
    op.rename_table('farmer_stocks', 'farmer_stock')
    op.rename_table('shops', 'shop')