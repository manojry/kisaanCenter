"""
Add ShopProduct relationship table
Revision ID: add_shop_product_table
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_shop_product_table'
down_revision = '20250901_full_core_tables'
branch_labels = None
depends_on = None

def upgrade():
    # Create shop_products table to link shops with selected products
    op.create_table('shop_products',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('shop_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('custom_price', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['shop_id'], ['shops.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        # Ensure unique shop-product combination
        sa.UniqueConstraint('shop_id', 'product_id', name='uq_shop_product')
    )
    
    # Add indexes for better performance
    op.create_index('idx_shop_products_shop_id', 'shop_products', ['shop_id'])
    op.create_index('idx_shop_products_product_id', 'shop_products', ['product_id'])
    op.create_index('idx_shop_products_active', 'shop_products', ['shop_id', 'is_active'])

def downgrade():
    op.drop_index('idx_shop_products_active', table_name='shop_products')
    op.drop_index('idx_shop_products_product_id', table_name='shop_products')
    op.drop_index('idx_shop_products_shop_id', table_name='shop_products')
    op.drop_table('shop_products')
