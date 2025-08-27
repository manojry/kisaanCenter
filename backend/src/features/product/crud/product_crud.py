from sqlalchemy.orm import Session, joinedload
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from ..models.product import Product, ProductPriceHistory, Category
from ....models import RecordStatus


class ProductCRUD:
    """CRUD operations for Product model with advanced features"""
    
    @staticmethod
    def create(db: Session, product_data) -> Product:
        """Create a new product"""
        product_dict = product_data.model_dump() if hasattr(product_data, 'model_dump') else product_data
        
        product = Product(**product_dict)
        db.add(product)
        db.flush()  # Get the ID without committing
        return product
    
    @staticmethod
    def get_by_id(db: Session, product_id: int) -> Optional[Product]:
        """Get product by ID"""
        return db.query(Product).filter(
            Product.id == product_id,
            Product.status == RecordStatus.ACTIVE
        ).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str, shop_id: int = None) -> Optional[Product]:
        """Get product by name (optionally within a shop)"""
        query = db.query(Product).filter(
            Product.name == name,
            Product.status == RecordStatus.ACTIVE
        )
        
        if shop_id:
            query = query.filter(Product.shop_id == shop_id)
        
        return query.first()
    
    @staticmethod
    def get_with_relations(db: Session, product_id: int) -> Optional[Dict]:
        """Get product with all relationships"""
        product = db.query(Product).options(
            joinedload(Product.category),
            joinedload(Product.shop),
            joinedload(Product.farmer_stocks),
            joinedload(Product.price_history)
        ).filter(
            Product.id == product_id,
            Product.status == RecordStatus.ACTIVE
        ).first()
        
        if not product:
            return None
        
        return {
            **product.to_dict(),
            'category_name': product.category.name if product.category else None,
            'shop_name': product.shop.name if product.shop else None,
            'stock_count': len(product.farmer_stocks) if product.farmer_stocks else 0,
            'price_history_count': len(product.price_history) if product.price_history else 0,
            'latest_price': ProductCRUD._get_latest_price(product.price_history)
        }
    
    @staticmethod
    def get_multi(
        db: Session, 
        skip: int = 0, 
        limit: int = 100, 
        filters: Dict[str, Any] = None
    ) -> List[Product]:
        """Get multiple products with optional filters"""
        query = db.query(Product).filter(Product.status == RecordStatus.ACTIVE)
        
        if filters:
            if 'shop_id' in filters:
                query = query.filter(Product.shop_id == filters['shop_id'])
            if 'category_id' in filters:
                query = query.filter(Product.category_id == filters['category_id'])
            if 'name' in filters:
                query = query.filter(Product.name.ilike(f"%{filters['name']}%"))
            if 'status' in filters:
                query = query.filter(Product.status == filters['status'])
        
        return query.order_by(Product.name).offset(skip).limit(limit).all()
    
    @staticmethod
    def update(db: Session, product_id: int, product_data) -> Optional[Product]:
        """Update product"""
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return None
        
        update_data = product_data.model_dump(exclude_unset=True) if hasattr(product_data, 'model_dump') else product_data
        
        for field, value in update_data.items():
            setattr(product, field, value)
        
        db.flush()
        return product
    
    @staticmethod
    def delete(db: Session, product_id: int) -> bool:
        """Soft delete product by setting status to DELETED"""
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return False
        
        product.status = RecordStatus.DELETED
        db.flush()
        return True
    
    @staticmethod
    def get_by_category(db: Session, category_id: int, skip: int = 0, limit: int = 100) -> List[Product]:
        """Get all products in a specific category"""
        return db.query(Product).filter(
            Product.category_id == category_id,
            Product.status == RecordStatus.ACTIVE
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_shop(db: Session, shop_id: int, skip: int = 0, limit: int = 100) -> List[Product]:
        """Get all products for a specific shop"""
        return db.query(Product).filter(
            Product.shop_id == shop_id,
            Product.status == RecordStatus.ACTIVE
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_product_stock(db: Session, product_id: int) -> Optional[Dict]:
        """Get current stock levels for a product"""
        from ....models import FarmerStock  # Import here to avoid circular import
        
        product = ProductCRUD.get_by_id(db, product_id)
        if not product:
            return None
        
        # Get all farmer stocks for this product
        farmer_stocks = db.query(FarmerStock).filter(
            FarmerStock.product_id == product_id,
            FarmerStock.status == RecordStatus.ACTIVE
        ).all()
        
        total_quantity = sum(float(stock.quantity or 0) for stock in farmer_stocks)
        available_quantity = sum(float(stock.available_quantity or 0) for stock in farmer_stocks)
        
        return {
            'product_id': product_id,
            'product_name': product.name,
            'total_quantity': total_quantity,
            'available_quantity': available_quantity,
            'reserved_quantity': total_quantity - available_quantity,
            'farmer_stock_count': len(farmer_stocks),
            'stock_details': [
                {
                    'farmer_stock_id': stock.id,
                    'farmer_id': stock.farmer_user_id,
                    'quantity': float(stock.quantity or 0),
                    'available': float(stock.available_quantity or 0),
                    'price': float(stock.price or 0)
                }
                for stock in farmer_stocks
            ]
        }
    
    @staticmethod
    def get_price_history(db: Session, product_id: int, limit: int = 10) -> List[Dict]:
        """Get price history for a product"""
        price_history = db.query(ProductPriceHistory).filter(
            ProductPriceHistory.product_id == product_id,
            ProductPriceHistory.status == RecordStatus.ACTIVE
        ).order_by(ProductPriceHistory.created_at.desc()).limit(limit).all()
        
        return [history.to_dict() for history in price_history]
    
    @staticmethod
    def get_product_transactions(db: Session, product_id: int, limit: int = 20) -> List[Dict]:
        """Get recent transactions for a product"""
        from ....models import TransactionItem, Transaction  # Import here to avoid circular import
        
        transaction_items = db.query(TransactionItem).join(Transaction).filter(
            TransactionItem.product_id == product_id,
            TransactionItem.status == RecordStatus.ACTIVE,
            Transaction.status != 'DELETED'
        ).order_by(Transaction.created_at.desc()).limit(limit).all()
        
        return [
            {
                **item.to_dict(),
                'transaction_date': item.transaction.date.isoformat() if item.transaction.date else None,
                'transaction_type': item.transaction.type.value if item.transaction.type else None,
                'buyer_id': item.transaction.buyer_user_id
            }
            for item in transaction_items
        ]
    
    @staticmethod
    def get_product_analytics(db: Session, product_id: int, days: int = 30) -> Optional[Dict]:
        """Get product analytics for specified period"""
        from ....models import TransactionItem, Transaction  # Import here to avoid circular import
        
        product = ProductCRUD.get_by_id(db, product_id)
        if not product:
            return None
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get transaction items for this product in the period
        transaction_items = db.query(TransactionItem).join(Transaction).filter(
            TransactionItem.product_id == product_id,
            TransactionItem.status == RecordStatus.ACTIVE,
            Transaction.created_at >= start_date,
            Transaction.created_at <= end_date
        ).all()
        
        # Calculate analytics
        total_transactions = len(transaction_items)
        total_quantity_sold = sum(float(item.quantity or 0) for item in transaction_items)
        total_revenue = sum(float(item.quantity or 0) * float(item.price or 0) for item in transaction_items)
        
        average_price = (
            sum(float(item.price or 0) for item in transaction_items) / total_transactions
            if total_transactions > 0 else 0
        )
        
        # Get current stock
        stock_data = ProductCRUD.get_product_stock(db, product_id)
        current_stock = stock_data['available_quantity'] if stock_data else 0
        
        return {
            'product_id': product_id,
            'product_name': product.name,
            'period_days': days,
            'period_start': start_date.isoformat(),
            'period_end': end_date.isoformat(),
            'analytics': {
                'total_transactions': total_transactions,
                'total_quantity_sold': total_quantity_sold,
                'total_revenue': total_revenue,
                'average_price': round(average_price, 2),
                'current_stock': current_stock,
                'turnover_rate': round(total_quantity_sold / max(current_stock, 1), 2)
            }
        }
    
    @staticmethod
    def initialize_inventory(db: Session, product_id: int, initial_quantity: float) -> bool:
        """Initialize inventory for a product (stub - would integrate with inventory system)"""
        # This would integrate with the inventory/farmer_stock system
        # For now, just log the action
        return True
    
    @staticmethod
    def add_price_history(db: Session, product_id: int, price: float, created_by: int = None) -> ProductPriceHistory:
        """Add a price history entry"""
        price_entry = ProductPriceHistory(
            product_id=product_id,
            price=price,
            created_by=created_by
        )
        db.add(price_entry)
        db.flush()
        return price_entry
    
    @staticmethod
    def _get_latest_price(price_history) -> Optional[float]:
        """Get the latest price from price history"""
        if not price_history:
            return None
        
        latest = max(price_history, key=lambda x: x.created_at)
        return float(latest.price) if latest.price else None


class CategoryCRUD:
    """CRUD operations for Category model"""
    
    @staticmethod
    def create(db: Session, category_data) -> Category:
        """Create a new category"""
        category_dict = category_data.model_dump() if hasattr(category_data, 'model_dump') else category_data
        
        category = Category(**category_dict)
        db.add(category)
        db.flush()
        return category
    
    @staticmethod
    def get_by_id(db: Session, category_id: int) -> Optional[Category]:
        """Get category by ID"""
        return db.query(Category).filter(
            Category.id == category_id,
            Category.status == RecordStatus.ACTIVE
        ).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Category]:
        """Get category by name"""
        return db.query(Category).filter(
            Category.name == name,
            Category.status == RecordStatus.ACTIVE
        ).first()
    
    @staticmethod
    def get_all(db: Session) -> List[Category]:
        """Get all active categories"""
        return db.query(Category).filter(
            Category.status == RecordStatus.ACTIVE
        ).order_by(Category.name).all()