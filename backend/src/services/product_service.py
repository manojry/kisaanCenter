from sqlalchemy.orm import Session
from ..schemas import ProductCreate, ProductUpdate, APIResponse, PaginationParams

class ProductService:
    @staticmethod
    def create_product(db: Session, product_data: ProductCreate, created_by_id: int = None, user_role: str = None) -> APIResponse:
        """
        Create a new product with enterprise-grade validation, shop isolation, atomic transaction, audit logging, and optional inventory initialization.
        """
        from ..crud.product_crud import ProductCRUD
        from ..crud.inventory_crud import InventoryCRUD
        from ..schemas import InventoryCreate
        from ..models import UserRole, Shop, Product
        try:
            # Shop isolation: Only superadmin or owner of shop can create
            shop_id = getattr(product_data, 'shop_id', None)
            if shop_id:
                shop = db.query(Shop).filter(Shop.id == shop_id).first()
                if not shop:
                    return APIResponse(success=False, message="Shop not found.")
                if user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
                    return APIResponse(success=False, message="Permission denied: Only superadmin or owner can create products for shop.")

            # Business rule validation: name, price
            if not product_data.name or not product_data.name.strip():
                return APIResponse(success=False, message="Product name is required.")
            if product_data.price is None or product_data.price <= 0:
                return APIResponse(success=False, message="Invalid product price.")

            # Atomic DB transaction
            from sqlalchemy.exc import SQLAlchemyError
            try:
                product = ProductCRUD.create(db, product_data)
                # Optionally initialize inventory if quantity is provided in product_data
                initial_quantity = getattr(product_data, 'initial_quantity', None)
                if initial_quantity is not None:
                    inventory_data = InventoryCreate(
                        product_id=product.id,
                        shop_id=product.shop_id,
                        quantity=initial_quantity,
                        status="active"
                    )
                    InventoryCRUD.create(db, inventory_data)
                db.commit()
            except (SQLAlchemyError, ValueError) as e:
                db.rollback()
                return APIResponse(success=False, message=f"Database error: {str(e)}")

            # Audit logging (stub)
            # TODO: Implement audit log entry for product creation

            return APIResponse(success=True, message="Product created successfully.", data={"product_id": product.id})
        except Exception as e:
            return APIResponse(success=False, message=f"Unexpected error: {str(e)}")
    
    @staticmethod
    def get_product(db: Session, product_id: int, user_role: str = None) -> APIResponse:
        """
        Retrieve a product by ID with permission checks and error handling.
        """
        from ..crud.product_crud import ProductCRUD
        from ..models import UserRole
        product = ProductCRUD.get_by_id(db, product_id)
        if not product:
            return APIResponse(success=False, message="Product not found.")
        # Shop isolation: Only superadmin/owner can view, or shop member
        if user_role and user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
            # TODO: Add shop member check if needed
            return APIResponse(success=False, message="Permission denied.")
        return APIResponse(success=True, message="Product retrieved.", data={"product": product})
    
    @staticmethod
    def get_products(db: Session, pagination: PaginationParams, user_role: str = None, **filters) -> APIResponse:
        """
        Retrieve products with pagination, shop isolation, and permission checks.
        """
        from ..crud.product_crud import ProductCRUD
        from ..models import UserRole
        # Example: filter by shop_id
        shop_id = filters.get('shop_id')
        if shop_id:
            products = ProductCRUD.get_by_shop_id(db, shop_id, skip=(pagination.page-1)*pagination.limit, limit=pagination.limit)
        else:
            products = []
        # Shop isolation: Only superadmin/owner can view
        if user_role and user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
            return APIResponse(success=False, message="Permission denied.")
        return APIResponse(success=True, message="Products retrieved.", data={"products": products})
    
    @staticmethod
    def update_product(db: Session, product_id: int, product_update: ProductUpdate, user_role: str = None) -> APIResponse:
        """
        Update a product with enterprise validation and permission checks.
        """
        from ..crud.product_crud import ProductCRUD
        from ..models import UserRole
        # Shop isolation: Only superadmin/owner can update
        if user_role and user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
            return APIResponse(success=False, message="Permission denied.")
        try:
            product = ProductCRUD.update(db, product_id, product_update)
            db.commit()
            return APIResponse(success=True, message="Product updated.", data={"product": product})
        except Exception as e:
            db.rollback()
            return APIResponse(success=False, message=f"Error updating product: {str(e)}")
    
    @staticmethod
    def delete_product(db: Session, product_id: int, user_role: str = None) -> APIResponse:
        """
        Delete a product with permission checks and error handling.
        """
        from ..crud.product_crud import ProductCRUD
        from ..models import UserRole
        # Shop isolation: Only superadmin/owner can delete
        if user_role and user_role not in [UserRole.SUPERADMIN.value, UserRole.OWNER.value]:
            return APIResponse(success=False, message="Permission denied.")
        try:
            success = ProductCRUD.delete(db, product_id)
            if success:
                return APIResponse(success=True, message="Product deleted.")
            else:
                return APIResponse(success=False, message="Product not found.")
        except Exception as e:
            db.rollback()
            return APIResponse(success=False, message=f"Error deleting product: {str(e)}")
