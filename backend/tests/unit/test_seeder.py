"""
Simple test data seeder for pytest
"""
import sys
import os
from decimal import Decimal
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from src.models import (
    User, UserRole, Shop, Product, Category, Plan, PaymentMethod,
    RecordStatus, Superadmin, FarmerStock, StockStatus
)

def seed_test_data(session):
    """Seed minimal test data for tests"""
    
    # Create superadmin
    superadmin = Superadmin(
        username="superadmin",
        password_hash="hashed_password_superadmin",
        email="admin@kisaancenter.com",
        contact="+91-9876543210",
    status='active'
    )
    session.add(superadmin)
    session.flush()
    
    # Create plan
    plan = Plan(
        name="Basic",
        description="Basic plan for small shops",
        price=Decimal("999.00"),
        billing_cycle="monthly",
        max_users=5,
        max_transactions=500,
        status='active'
    )
    session.add(plan)
    session.flush()
    
    # Create categories
    category = Category(
        name="Grains",
        description="Rice, Wheat, Barley, etc."
    )
    session.add(category)
    session.flush()
    
    # Create payment methods
    payment_method = PaymentMethod(
        name="Cash",
        description="Cash payment"
    )
    session.add(payment_method)
    session.flush()
    
    # Create shop
    shop = Shop(
        name="Test Market Center",
        location="123 Market Street, Test City",
        plan_id=plan.id,
        created_by=superadmin.id,
        status='active'
    )
    session.add(shop)
    session.flush()
    
    # Create users
    superadmin_user = User(
        username="superadmin_user",
        password_hash="hashed_password_superadmin_user",
        role=UserRole.SUPERADMIN,
        shop_id=shop.id,
        contact="+91-9000000000",
        credit_limit=Decimal("0.00"),
        status='active'
    )
    session.add(superadmin_user)
    
    owner = User(
        username="owner1",
        password_hash="hashed_password_owner",
        role=UserRole.OWNER,
        shop_id=shop.id,
        contact="+91-9000000001",
        credit_limit=Decimal("0.00"),
        status='active'
    )
    session.add(owner)
    session.flush()
    
    # Update shop with owner
    shop.owner_user_id = owner.id
    
    farmer = User(
        username="farmer1",
        password_hash="hashed_password_farmer1",
        role=UserRole.FARMER,
        shop_id=shop.id,
        contact="+91-9000000002",
        credit_limit=Decimal("0.00"),
        status='active'
    )
    session.add(farmer)
    
    buyer = User(
        username="buyer1",
        password_hash="hashed_password_buyer1",
        role=UserRole.BUYER,
        shop_id=shop.id,
        contact="+91-9000000004",
        credit_limit=Decimal("10000.00"),
        status='active'
    )
    session.add(buyer)
    
    employee = User(
        username="employee1",
        password_hash="hashed_password_employee1",
        role=UserRole.EMPLOYEE,
        shop_id=shop.id,
        contact="+91-9000000006",
        credit_limit=Decimal("0.00"),
        status='active'
    )
    session.add(employee)
    session.flush()
    
    # Create products
    product = Product(
        shop_id=shop.id,
        name="Basmati Rice",
        category_id=category.id,
        status='active'
    )
    session.add(product)
    session.flush()
    
    # Create farmer stock
    farmer_stock = FarmerStock(
        shop_id=shop.id,
        farmer_user_id=farmer.id,
        product_id=product.id,
        quantity=Decimal("100.00"),
        status=StockStatus.ACTIVE,
        date=date.today()
    )
    session.add(farmer_stock)
    session.flush()
    
    # Import additional models for transactions
    from src.models import (
        Transaction, TransactionItem, TransactionType, TransactionStatus,
        PaymentStatus, CompletionStatus, Credit, CreditStatus, CreditDetail,
        Payment, PaymentType
    )
    
    # Create multiple transactions for testing
    transactions = []
    for i in range(35):  # Create 35 transactions to satisfy the >= 30 test
        transaction = Transaction(
            shop_id=shop.id,
            buyer_user_id=buyer.id,
            type=TransactionType.SALE,
            status=TransactionStatus.ACTIVE if i < 30 else TransactionStatus.COMPLETED if i < 33 else TransactionStatus.CANCELLED,
            commission_rate=Decimal("10.00"),
            commission_amount=Decimal("100.00"),
            payment_status=PaymentStatus.PENDING if i < 20 else PaymentStatus.PARTIAL if i < 30 else PaymentStatus.PAID,
            buyer_paid_amount=Decimal("0.00") if i < 20 else Decimal("500.00"),
            farmer_paid_amount=Decimal("0.00") if i < 25 else Decimal("800.00"),
            commission_confirmed=False if i < 25 else True,
            completion_status=CompletionStatus.PENDING if i < 20 else CompletionStatus.PARTIAL if i < 30 else CompletionStatus.COMPLETE,
            date=date.today()
        )
        session.add(transaction)
        transactions.append(transaction)
    
    session.flush()
    
    # Create transaction items
    for transaction in transactions[:10]:  # Create items for first 10 transactions
        transaction_item = TransactionItem(
            transaction_id=transaction.id,
            product_id=product.id,
            farmer_stock_id=farmer_stock.id,
            quantity=Decimal("5.00"),
            price=Decimal("200.00"),
            status='active'
        )
        session.add(transaction_item)
    
    # Create credits
    credits = []
    for i in range(5):
        credit = Credit(
            transaction_id=transactions[i].id,
            buyer_user_id=buyer.id,
            amount=Decimal("1000.00"),
            status=CreditStatus.OUTSTANDING if i < 2 else CreditStatus.PARTIAL if i < 4 else CreditStatus.SETTLED
        )
        session.add(credit)
        credits.append(credit)
    
    session.flush()
    
    # Create credit details
    for credit in credits:
        credit_detail = CreditDetail(
            credit_id=credit.id,
            farmer_user_id=farmer.id,
            product_id=product.id,
            quantity=Decimal("10.00"),
            price=Decimal("100.00"),
            date=date.today()
        )
        session.add(credit_detail)
    
    # Create payments
    for i in range(8):
        payment = Payment(
            transaction_id=transactions[i].id if i < 5 else None,
            credit_id=credits[i % 5].id if i >= 5 else None,
            amount=Decimal("500.00"),
            payment_method_id=payment_method.id,
            type=PaymentType.PAYMENT if i < 6 else PaymentType.ADVANCE if i < 7 else PaymentType.REFUND,
            status='active',
            date=date.today()
        )
        session.add(payment)
    
    session.commit()
    return {
        'superadmin': superadmin,
        'superadmin_user': superadmin_user,
        'plan': plan,
        'shop': shop,
        'owner': owner,
        'farmer': farmer,
        'buyer': buyer,
        'employee': employee,
        'category': category,
        'product': product,
        'farmer_stock': farmer_stock,
        'payment_method': payment_method,
        'transactions': transactions,
        'credits': credits
    }