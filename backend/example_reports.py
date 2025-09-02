
from sqlalchemy.orm import Session
from models.transaction import Transaction

def generate_reports(db: Session):
    # Farmer report - what farmer sold, what he was paid, remaining balance
    farmer_report = Transaction.get_farmer_30_day_summary(db, farmer_id=123, shop_id=1)
    print("Farmer Report:")
    print(f"Total Sales: ₹{farmer_report['sales_summary']['total_sales_value']}")
    print(f"Amount Paid: ₹{farmer_report['payment_summary']['total_paid']}")
    print(f"Remaining Balance: ₹{farmer_report['payment_summary']['remaining_balance']}")
    
    # Buyer report - how much buyer owes the shop
    buyer_report = Transaction.get_buyer_30_day_summary(db, buyer_id=456, shop_id=1)
    print("\nBuyer Report:")
    print(f"Total Purchases: ₹{buyer_report['purchase_summary']['total_purchase_value']}")
    print(f"Amount Paid: ₹{buyer_report['purchase_summary']['total_paid']}")
    print(f"Outstanding Balance: ₹{buyer_report['purchase_summary']['outstanding_balance']}")
