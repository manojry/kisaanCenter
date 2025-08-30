
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from src.core.response import APIResponse
from src.core.pagination import PaginationParams
from src.features.product.crud.product_crud import ProductCRUD
from src.features.product.crud.shop_product_crud import ShopProductCRUD
from src.features.product.crud.farmer_product_crud import FarmerProductCRUD
from src.features.product.models.product import Product
from src.features.product.models.shop_product import ShopProduct
from src.features.product.models.farmer_product import FarmerProduct
from src.features.auth.models.user import User
from src.features.shop.models.shop import Shop
import logging

logger = logging.getLogger(__name__)

class ProductAssignmentService:
    """Service for managing product assignments between shops and farmers"""
    
    @staticmethod
    def get_all_products_by_category(db: Session) -> APIResponse:
        """Get all products organized by category for superadmin/owner selection"""
        try:
            products = ProductCRUD.get_all_active(db)
            
            # Group products by category
            products_by_category = {}
            for product in products:
                category_name = product.category.name if product.category else "Uncategorized"
                if category_name not in products_by_category:
                    products_by_category[category_name] = []
                
                products_by_category[category_name].append({
                    "id": product.id,
                    "name": product.name,
                    "description": product.description,
                    "unit": product.unit,
                    "category_id": product.category_id,
                    "category_name": category_name
                })
            
            return APIResponse(
                success=True,
                message="Products retrieved successfully",
                data={
                    "products_by_category": products_by_category,
                    "total_products": len(products)
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to retrieve products by category: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve products")
    
    @staticmethod
    def setup_shop_products(db: Session, shop_id: int, selected_product_ids: List[int]) -> APIResponse:
        """Setup which products a shop will sell"""
        try:
            # Validate shop exists
            shop = db.query(Shop).filter(Shop.id == shop_id).first()
            if not shop:
                return APIResponse(success=False, message="Shop not found")
            
            # Remove existing shop products
            ShopProductCRUD.delete_by_shop_id(db, shop_id)
            
            # Add new shop products
            shop_products = []
            for product_id in selected_product_ids:
                product = ProductCRUD.get_by_id(db, product_id)
                if product:
                    shop_product = ShopProductCRUD.create(db, {
                        "shop_id": shop_id,
                        "product_id": product_id,
                        "price": product.default_price or 0.0,
                        "is_available": True
                    })
                    shop_products.append(shop_product)
            
            db.commit()
            
            return APIResponse(
                success=True,
                message=f"Shop products setup successfully. {len(shop_products)} products configured.",
                data={"shop_products_count": len(shop_products)}
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to setup shop products: {str(e)}")
            return APIResponse(success=False, message="Failed to setup shop products")
    
    @staticmethod
    def get_shop_catalog(db: Session, shop_id: int) -> APIResponse:
        """Get shop's product catalog organized by category"""
        try:
            shop_products = ShopProductCRUD.get_by_shop_id(db, shop_id)
            
            # Group by category
            products_by_category = {}
            for shop_product in shop_products:
                product = shop_product.product
                category_name = product.category.name if product.category else "Uncategorized"
                
                if category_name not in products_by_category:
                    products_by_category[category_name] = []
                
                products_by_category[category_name].append({
                    "shop_product_id": shop_product.id,
                    "product_id": product.id,
                    "name": product.name,
                    "description": product.description,
                    "unit": product.unit,
                    "price": shop_product.price,
                    "is_available": shop_product.is_available
                })
            
            return APIResponse(
                success=True,
                message="Shop catalog retrieved successfully",
                data={
                    "products_by_category": products_by_category,
                    "shop_id": shop_id
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to retrieve shop catalog: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve shop catalog")
    
    @staticmethod
    def assign_farmer_products(db: Session, farmer_id: int, product_assignments: List[Dict]) -> APIResponse:
        """Assign products to a farmer with preferred pricing"""
        try:
            # Validate farmer exists and belongs to a shop
            farmer = db.query(User).filter(
                User.id == farmer_id,
                User.role == "farmer"
            ).first()
            
            if not farmer:
                return APIResponse(success=False, message="Farmer not found")
            
            # Remove existing farmer product assignments
            FarmerProductCRUD.delete_by_farmer_id(db, farmer_id)
            
            # Add new assignments
            farmer_products = []
            for assignment in product_assignments:
                shop_product_id = assignment.get("shop_product_id")
                preferred_price = assignment.get("preferred_price")
                notes = assignment.get("notes", "")
                
                # Validate shop product exists
                shop_product = ShopProductCRUD.get_by_id(db, shop_product_id)
                if not shop_product:
                    continue
                
                farmer_product = FarmerProductCRUD.create(db, {
                    "farmer_id": farmer_id,
                    "shop_product_id": shop_product_id,
                    "preferred_price": preferred_price,
                    "notes": notes,
                    "is_active": True
                })
                farmer_products.append(farmer_product)
            
            db.commit()
            
            return APIResponse(
                success=True,
                message=f"Products assigned successfully. {len(farmer_products)} products assigned to farmer.",
                data={"assigned_products_count": len(farmer_products)}
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to assign farmer products: {str(e)}")
            return APIResponse(success=False, message="Failed to assign farmer products")
    
    @staticmethod
    def get_farmer_available_products(db: Session, farmer_id: int) -> APIResponse:
        """Get products available to a farmer for transaction entry"""
        try:
            farmer_products = FarmerProductCRUD.get_by_farmer_id(db, farmer_id)
            
            # Group by category
            products_by_category = {}
            for farmer_product in farmer_products:
                shop_product = farmer_product.shop_product
                product = shop_product.product
                category_name = product.category.name if product.category else "Uncategorized"
                
                if category_name not in products_by_category:
                    products_by_category[category_name] = []
                
                products_by_category[category_name].append({
                    "farmer_product_id": farmer_product.id,
                    "product_id": product.id,
                    "shop_product_id": shop_product.id,
                    "name": product.name,
                    "unit": product.unit,
                    "preferred_price": farmer_product.preferred_price,
                    "default_price": shop_product.price,
                    "notes": farmer_product.notes
                })
            
            return APIResponse(
                success=True,
                message="Farmer products retrieved successfully",
                data={
                    "products_by_category": products_by_category,
                    "farmer_id": farmer_id
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to retrieve farmer products: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve farmer products")
    
    @staticmethod
    def get_farmers_products_summary(db: Session, shop_id: int) -> APIResponse:
        """Get summary of all farmers and their product assignments for a shop"""
        try:
            # Get all farmers for this shop
            farmers = db.query(User).filter(
                User.shop_id == shop_id,
                User.role == "farmer",
                User.is_active == True
            ).all()
            
            farmers_data = []
            for farmer in farmers:
                # Get farmer's assigned products
                farmer_products = FarmerProductCRUD.get_by_farmer_id(db, farmer.id)
                
                assigned_products = []
                for fp in farmer_products:
                    shop_product = fp.shop_product
                    product = shop_product.product
                    assigned_products.append({
                        "farmer_product_id": fp.id,
                        "product_id": product.id,
                        "shop_product_id": shop_product.id,
                        "name": product.name,
                        "unit": product.unit,
                        "preferred_price": fp.preferred_price,
                        "default_price": shop_product.price,
                        "notes": fp.notes
                    })
                
                farmers_data.append({
                    "id": farmer.id,
                    "username": farmer.username,
                    "contact": farmer.contact,
                    "assigned_products": assigned_products,
                    "total_products": len(assigned_products)
                })
            
            return APIResponse(
                success=True,
                message="Farmers products summary retrieved successfully",
                data={
                    "farmers": farmers_data,
                    "shop_id": shop_id,
                    "total_farmers": len(farmers_data)
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to retrieve farmers products summary: {str(e)}")
            return APIResponse(success=False, message="Failed to retrieve farmers summary")
