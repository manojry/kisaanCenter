
"""Enhance farmer stock for dual-flow management

Revision ID: 002
Revises: 001
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade():
    # Create farmer stock mode enum
    farmer_stock_mode = postgresql.ENUM('declared', 'implicit', name='farmerstockmode')
    farmer_stock_mode.create(op.get_bind())
    
    # Create audit action enum
    audit_action = postgresql.ENUM(
        'declare', 'sale', 'update', 'late_declare', 'carry_forward', 'correction',
        name='auditaction'
    )
    audit_action.create(op.get_bind())
    
    # Update farmer_stock table
    op.add_column('farmer_stock', sa.Column('mode', farmer_stock_mode, nullable=False, server_default='implicit'))
    op.add_column('farmer_stock', sa.Column('declared_at', sa.DateTime(), nullable=True))
    op.add_column('farmer_stock', sa.Column('declared_by_id', sa.Integer(), nullable=True))
    op.add_column('farmer_stock', sa.Column('carry_forward', sa.Boolean(), default=False))
    op.add_column('farmer_stock', sa.Column('carried_from_date', sa.Date(), nullable=True))
    op.add_column('farmer_stock', sa.Column('notes', sa.Text(), nullable=True))
    
    # Add foreign key for declared_by
    op.create_foreign_key('fk_farmer_stock_declared_by', 'farmer_stock', 'users', ['declared_by_id'], ['id'])
    
    # Create unique constraint
    op.create_unique_constraint(
        'uq_farmer_stock_daily', 
        'farmer_stock', 
        ['farmer_user_id', 'product_id', 'entry_date', 'shop_id']
    )
    
    # Create indexes
    op.create_index('idx_farmer_stock_lookup', 'farmer_stock', ['farmer_user_id', 'product_id', 'entry_date'])
    op.create_index('idx_farmer_stock_shop_date', 'farmer_stock', ['shop_id', 'entry_date'])
    op.create_index('idx_farmer_stock_mode', 'farmer_stock', ['mode', 'entry_date'])
    
    # Create farmer_stock_audit table
    op.create_table('farmer_stock_audit',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farmer_stock_id', sa.Integer(), nullable=False),
        sa.Column('performed_by_id', sa.Integer(), nullable=False),
        sa.Column('action_type', sa.String(50), nullable=False),
        sa.Column('old_values', postgresql.JSON(), nullable=True),
        sa.Column('new_values', postgresql.JSON(), nullable=True),
        sa.Column('transaction_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['farmer_stock_id'], ['farmer_stock.id'], ),
        sa.ForeignKeyConstraint(['performed_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create audit indexes
    op.create_index('idx_farmer_stock_audit_fsid', 'farmer_stock_audit', ['farmer_stock_id'])
    op.create_index('idx_farmer_stock_audit_performed_by', 'farmer_stock_audit', ['performed_by_id'])
    op.create_index('idx_farmer_stock_audit_action', 'farmer_stock_audit', ['action_type'])
    op.create_index('idx_farmer_stock_audit_created_at', 'farmer_stock_audit', ['created_at'])

def downgrade():
    # Drop audit indexes
    op.drop_index('idx_farmer_stock_audit_created_at', table_name='farmer_stock_audit')
    op.drop_index('idx_farmer_stock_audit_action', table_name='farmer_stock_audit')
    op.drop_index('idx_farmer_stock_audit_performed_by', table_name='farmer_stock_audit')
    op.drop_index('idx_farmer_stock_audit_fsid', table_name='farmer_stock_audit')
    
    # Drop farmer_stock_audit table
    op.drop_table('farmer_stock_audit')
    
    # Drop indexes
    op.drop_index('idx_farmer_stock_mode', table_name='farmer_stock')
    op.drop_index('idx_farmer_stock_shop_date', table_name='farmer_stock')
    op.drop_index('idx_farmer_stock_lookup', table_name='farmer_stock')
    
    # Drop unique constraint
    op.drop_constraint('uq_farmer_stock_daily', table_name='farmer_stock')
    
    # Drop foreign key
    op.drop_constraint('fk_farmer_stock_declared_by', table_name='farmer_stock')
    
    # Drop columns
    op.drop_column('farmer_stock', 'notes')
    op.drop_column('farmer_stock', 'carried_from_date')
    op.drop_column('farmer_stock', 'carry_forward')
    op.drop_column('farmer_stock', 'declared_by_id')
    op.drop_column('farmer_stock', 'declared_at')
    op.drop_column('farmer_stock', 'mode')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS auditaction')
    op.execute('DROP TYPE IF EXISTS farmerstockmode')
