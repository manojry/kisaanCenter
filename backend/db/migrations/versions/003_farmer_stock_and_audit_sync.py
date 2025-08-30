"""
Sync FarmerStock and FarmerStockAudit schema with ERD and model

Revision ID: 003
Revises: 002
Create Date: 2025-08-30 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None

def upgrade():
    # Create enums if not exist
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_mode') THEN CREATE TYPE stock_mode AS ENUM ('declared', 'implicit'); END IF; END $$;")
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_status') THEN CREATE TYPE stock_status AS ENUM ('active', 'inactive', 'archived'); END IF; END $$;")

    # Sync farmer_stock table
    op.alter_column('farmer_stock', 'farmer_user_id', existing_type=sa.Integer(), nullable=False)
    op.alter_column('farmer_stock', 'product_id', existing_type=sa.Integer(), nullable=False)
    op.alter_column('farmer_stock', 'shop_id', existing_type=sa.Integer(), nullable=False)
    op.alter_column('farmer_stock', 'declared_qty', type_=sa.DECIMAL(10,3), nullable=True)
    op.alter_column('farmer_stock', 'sold_qty', type_=sa.DECIMAL(10,3), nullable=False, server_default='0')
    op.alter_column('farmer_stock', 'unit_price', type_=sa.DECIMAL(10,2), nullable=True)
    op.alter_column('farmer_stock', 'mode', type_=sa.Enum('declared', 'implicit', name='stock_mode'), nullable=False, server_default='implicit')
    op.alter_column('farmer_stock', 'declared_at', type_=sa.DateTime(), nullable=True)
    op.alter_column('farmer_stock', 'declared_by_id', type_=sa.Integer(), nullable=True)
    op.alter_column('farmer_stock', 'carry_forward', type_=sa.Boolean(), nullable=False, server_default='false')
    op.alter_column('farmer_stock', 'carried_from_date', type_=sa.Date(), nullable=True)
    op.alter_column('farmer_stock', 'entry_date', type_=sa.Date(), nullable=False)
    op.alter_column('farmer_stock', 'notes', type_=sa.Text(), nullable=True)
    op.alter_column('farmer_stock', 'created_at', type_=sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('farmer_stock', 'updated_at', type_=sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('farmer_stock', 'status', type_=sa.Enum('active', 'inactive', 'archived', name='stock_status'), nullable=False, server_default='active')

    # Add/Update constraints and indexes
    op.create_unique_constraint('uq_farmer_stock_daily_product', 'farmer_stock', ['farmer_user_id', 'product_id', 'shop_id', 'entry_date'])
    op.create_check_constraint('chk_declared_qty_positive', 'farmer_stock', 'declared_qty IS NULL OR declared_qty > 0')
    op.create_check_constraint('chk_valid_declaration', 'farmer_stock', 'declared_qty IS NULL OR declared_qty >= sold_qty')
    op.create_check_constraint('chk_sold_qty_non_negative', 'farmer_stock', 'sold_qty >= 0')
    op.create_check_constraint('chk_unit_price_positive', 'farmer_stock', 'unit_price IS NULL OR unit_price > 0')
    op.create_check_constraint('chk_mode_consistency', 'farmer_stock', "(mode = 'declared' AND declared_qty IS NOT NULL AND declared_by_id IS NOT NULL) OR mode = 'implicit'")
    op.create_check_constraint('chk_carry_forward_consistency', 'farmer_stock', "(carry_forward = true AND carried_from_date IS NOT NULL) OR (carry_forward = false AND carried_from_date IS NULL)")
    op.create_index('idx_farmer_stock_lookup', 'farmer_stock', ['farmer_user_id', 'product_id', 'entry_date'])
    op.create_index('idx_farmer_stock_shop_date', 'farmer_stock', ['shop_id', 'entry_date'])
    op.create_index('idx_farmer_stock_mode', 'farmer_stock', ['mode', 'entry_date'])
    op.create_index('idx_farmer_stock_shop_date_status', 'farmer_stock', ['shop_id', 'entry_date', 'status'])
    op.create_index('idx_farmer_stock_farmer_date', 'farmer_stock', ['farmer_user_id', 'entry_date'])

    # Create farmer_stock_audit table if not exists
    op.create_table(
        'farmer_stock_audit',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('farmer_stock_id', sa.Integer(), sa.ForeignKey('farmer_stock.id', ondelete='CASCADE'), nullable=False),
        sa.Column('performed_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action_type', sa.String(50), nullable=False),
        sa.Column('old_values', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('new_values', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('transaction_id', sa.Integer(), sa.ForeignKey('transaction.id', ondelete='SET NULL'), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Index('idx_farmer_stock_audit_fsid', 'farmer_stock_id'),
        sa.Index('idx_farmer_stock_audit_action', 'action_type'),
        sa.Index('idx_farmer_stock_audit_created_at', 'timestamp'),
    )

def downgrade():
    op.drop_table('farmer_stock_audit')
    op.drop_index('idx_farmer_stock_farmer_date', table_name='farmer_stock')
    op.drop_index('idx_farmer_stock_shop_date_status', table_name='farmer_stock')
    op.drop_index('idx_farmer_stock_mode', table_name='farmer_stock')
    op.drop_index('idx_farmer_stock_shop_date', table_name='farmer_stock')
    op.drop_index('idx_farmer_stock_lookup', table_name='farmer_stock')
    op.drop_constraint('chk_carry_forward_consistency', 'farmer_stock', type_='check')
    op.drop_constraint('chk_mode_consistency', 'farmer_stock', type_='check')
    op.drop_constraint('chk_unit_price_positive', 'farmer_stock', type_='check')
    op.drop_constraint('chk_sold_qty_non_negative', 'farmer_stock', type_='check')
    op.drop_constraint('chk_valid_declaration', 'farmer_stock', type_='check')
    op.drop_constraint('chk_declared_qty_positive', 'farmer_stock', type_='check')
    op.drop_constraint('uq_farmer_stock_daily_product', 'farmer_stock', type_='unique')
    op.alter_column('farmer_stock', 'status', type_=sa.String(), nullable=True)
    op.alter_column('farmer_stock', 'updated_at', type_=sa.DateTime(), nullable=True)
    op.alter_column('farmer_stock', 'created_at', type_=sa.DateTime(), nullable=True)
    op.alter_column('farmer_stock', 'entry_date', type_=sa.Date(), nullable=True)
    op.alter_column('farmer_stock', 'carried_from_date', type_=sa.Date(), nullable=True)
    op.alter_column('farmer_stock', 'carry_forward', type_=sa.Boolean(), nullable=True)
    op.alter_column('farmer_stock', 'declared_by_id', type_=sa.Integer(), nullable=True)
    op.alter_column('farmer_stock', 'declared_at', type_=sa.DateTime(), nullable=True)
    op.alter_column('farmer_stock', 'mode', type_=sa.String(), nullable=True)
    op.alter_column('farmer_stock', 'unit_price', type_=sa.DECIMAL(10,2), nullable=True)
    op.alter_column('farmer_stock', 'sold_qty', type_=sa.DECIMAL(10,3), nullable=True)
    op.alter_column('farmer_stock', 'declared_qty', type_=sa.DECIMAL(10,3), nullable=True)
    op.alter_column('farmer_stock', 'shop_id', type_=sa.Integer(), nullable=True)
    op.alter_column('farmer_stock', 'product_id', type_=sa.Integer(), nullable=True)
    op.alter_column('farmer_stock', 'farmer_user_id', type_=sa.Integer(), nullable=True)
    op.execute("DROP TYPE IF EXISTS stock_status;")
    op.execute("DROP TYPE IF EXISTS stock_mode;")
