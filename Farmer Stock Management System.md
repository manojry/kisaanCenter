# 🌸 Farmer Stock Management System - Complete Documentation

## **Overview**

This document defines the complete farmer stock management system that supports two distinct operational workflows in agricultural market shops. The system accommodates both organized farmers who declare inventory upfront and casual farmers who prefer transaction-only tracking.

---

## **Core Concept: Dual Stock Management Approaches**

The system supports **two distinct workflows** for managing farmer inventory:

1. **Declared Stock Flow** - Farmer declares inventory upfront (proactive)
2. **Implicit Stock Flow** - Inventory tracked only through sales (reactive)

Both flows maintain complete financial accuracy while providing operational flexibility.

---

## **Flow A: Declared Stock (Proactive Declaration)**

### **Morning Setup**
- Farmer **XY** arrives at Shop **ABC** and declares stock:
  - Roses: 100 kg
  - Jasmine: 50 kg
- Shop Owner records this in the app
- System creates `FARMER_STOCK` records:
  - `declared_qty = 100/50`
  - `mode = 'declared'`
  - `sold_qty = 0`
  - `balance_qty = declared_qty - sold_qty`

### **Sales During the Day**

**Sale 1: Buyer A purchases 40 kg Roses @ ₹100/kg**
- Transaction logged: Farmer=XY, Product=Roses, Qty=40, Rate=₹100, Total=₹4,000
- System updates: `sold_qty=40`, `balance_qty=60`

**Sale 2: Buyer B purchases 10 kg Jasmine @ ₹120/kg (partial payment)**
- Transaction: ₹1,200 total (₹600 cash, ₹600 credit)
- System updates: Jasmine `sold_qty=10`, `balance_qty=40`

### **Evening Settlement**
Owner views **Farmer XY ledger**:

Farmer XY Ledger:
├── Roses: Declared=100kg, Sold=40kg, Balance=60kg, Sales=₹4,000
├── Jasmine: Declared=50kg, Sold=10kg, Balance=40kg, Sales=₹1,200
└── Status: Complete visibility ✅


**Settlement Process:**
- Roses: Full payment (₹4,000 - 10% commission)
- Jasmine: Partial payment for cash portion only
- Pending: ₹600 credit from Buyer B

✅ **Result**: Clean flow with transparent stock balance and financial tracking

---

## **Flow B: Implicit Stock (Reactive Tracking)**

### **Morning Setup**
- Farmer **XY** arrives with flowers but makes **no stock declaration**
- Shop Owner does not create any Farmer Stock entry initially

### **Sales During the Day**

**Sale 1: Buyer C purchases 20 kg Roses @ ₹110/kg**
- Transaction logged: Farmer=XY, Product=Roses, Qty=20, Rate=₹110, Total=₹2,200
- System **auto-creates implicit Farmer Stock record**:
  - `declared_qty = NULL`
  - `mode = 'implicit'`
  - `sold_qty = 20`
  - `balance_qty = NULL` (unknown)

**Sale 2: Buyer D purchases 30 kg Jasmine @ ₹90/kg (full payment)**
- Another implicit stock record created:
  - Jasmine `declared_qty=NULL`, `sold_qty=30`

### **Optional Late Declaration**
At 5:00 PM, Farmer says: *"Actually, I had 100 Roses, 50 Jasmine"*

Owner updates the records:
- Roses → `declared_qty=100` → `balance_qty` auto-calculated = 80
- Jasmine → `declared_qty=50` → `balance_qty` auto-calculated = 20

### **Evening View**

Before Declaration:
├── Roses: Sold=20kg, Balance=Unknown
├── Jasmine: Sold=30kg, Balance=Unknown
└── Status: Sales tracked, inventory unknown ⚠️
After Late Declaration:
├── Roses: Declared=100kg, Sold=20kg, Balance=80kg
├── Jasmine: Declared=50kg, Sold=30kg, Balance=20kg
└── Status: Complete visibility ✅


**Audit Trail:**
11:30 AM - Sold 20kg Roses (no prior declaration - implicit mode)
02:15 PM - Sold 30kg Jasmine (implicit mode)
05:00 PM - Farmer declared starting stock: 100kg Roses, 50kg Jasmine
05:00 PM - System recalculated balances retroactively


---

## **Schema Design**

### **FARMER_STOCK Table**
```sql
FARMER_STOCK {
  id                 INTEGER PRIMARY KEY
  farmer_user_id     INTEGER FOREIGN KEY → users.id
  product_id         INTEGER FOREIGN KEY → products.id
  shop_id            INTEGER FOREIGN KEY → shops.id
  
  -- Stock Quantities
  declared_qty       DECIMAL(10,3) NULL     -- NULL for implicit mode
  sold_qty           DECIMAL(10,3) DEFAULT 0 -- Auto-calculated from sales
  balance_qty        COMPUTED               -- declared_qty - sold_qty (if declared_qty exists)
  
  -- Metadata
  mode               ENUM('declared', 'implicit')
  declared_at        DATETIME NULL          -- When farmer made declaration
  entry_date         DATE                   -- Business date
  created_at         DATETIME
  updated_at         DATETIME
  status             ENUM('active', 'inactive') DEFAULT 'active'
}

Computed Balance Logic

balance_qty = CASE 
  WHEN declared_qty IS NOT NULL 
  THEN declared_qty - sold_qty 
  ELSE NULL 
END

Business Rules
Stock Creation Rules
Declared Mode: Created at start of day with farmer input
Implicit Mode: Auto-created on first sale transaction for farmer+product combination
One record per farmer+product+date: Prevents duplicates
Balance Calculation Rules
With Declaration: balance = declared_qty - sold_qty
Without Declaration: balance = NULL (unknown)
Negative Balance: Allowed with warnings (overselling scenario)
Late Declaration Rules
Farmer can declare stock after sales have occurred
System recalculates balance retroactively
Audit log captures timing and changes
Cannot declare less than already sold (validation error)
Transaction Integration
Every sale automatically updates sold_qty
Stock deduction happens at transaction creation
Returns/cancellations reverse the stock changes
Key Differences Between Flows
| Aspect              | Declared Flow                      | Implicit Flow                            |
|--------------------|------------------------------------|------------------------------------------|
| **Start of Day**   | Farmer declares stock upfront      | No declaration, only transactions logged |
| **Stock Tracking** | Declared vs Sold → Balance visible | Only Sold visible, Balance unknown       |
| **Ledger Clarity** | Transparent live balance           | Balance only visible if declared later   |
| **Flexibility**    | Works for organized farmers        | Works for unorganized farmers            |
| **Audit Trail**    | Standard transaction logging       | Must log late declarations/adjustments   |
| **Reporting**      | Complete inventory reports         | Sales-only reports until declaration     |


UI/UX Design
Farmer Dashboard

Declared Mode Display:
┌─────────────────────────────────────┐
│ Today's Inventory - Farmer XY       │
├─────────────────────────────────────┤
│ 🌹 Roses                           │
│    Brought: 100kg                   │
│    Sold: 40kg                       │
│    Remaining: 60kg                  │
│    Revenue: ₹4,000                  │
├─────────────────────────────────────┤
│ 🌸 Jasmine                         │
│    Brought: 50kg                    │
│    Sold: 10kg                       │
│    Remaining: 40kg                  │
│    Revenue: ₹1,200                  │
└─────────────────────────────────────┘

Implicit Mode Display:
┌─────────────────────────────────────┐
│ Today's Sales - Farmer XY          │
├─────────────────────────────────────┤
│ 🌹 Roses                           │
│    Sold: 20kg                       │
│    Starting Stock: Not declared     │
│    Revenue: ₹2,200                  │
│    [Declare Stock] button           │
├─────────────────────────────────────┤
│ 🌸 Jasmine                         │
│    Sold: 30kg                       │
│    Starting Stock: Not declared     │
│    Revenue: ₹2,700                  │
│    [Declare Stock] button           │
└─────────────────────────────────────┘

Implicit Mode Display:
┌─────────────────────────────────────┐
│ Today's Sales - Farmer XY          │
├─────────────────────────────────────┤
│ 🌹 Roses                           │
│    Sold: 20kg                       │
│    Starting Stock: Not declared     │
│    Revenue: ₹2,200                  │
│    [Declare Stock] button           │
├─────────────────────────────────────┤
│ 🌸 Jasmine                         │
│    Sold: 30kg                       │
│    Starting Stock: Not declared     │
│    Revenue: ₹2,700                  │
│    [Declare Stock] button           │
└─────────────────────────────────────┘

Owner Dashboard

Stock Management Overview:
┌─────────────────────────────────────┐
│ Today's Stock Status                │
├─────────────────────────────────────┤
│ 📊 Farmers with declared stock: 15  │
│ 📈 Farmers with implicit tracking: 8│
│ ✅ Products with known balance: 45  │
│ ❓ Products with unknown balance: 12│
│                                     │
│ 🎯 Stock Declaration Rate: 65%     │
└─────────────────────────────────────┘

Transaction Entry Screen

When creating a sale:
1. Select Farmer → XY
2. Select Product → Roses
3. System checks:
   - If stock record exists → deduct from sold_qty
   - If no stock record → create implicit record
4. Show warning if overselling declared stock
5. Complete transaction normally

Reporting & Analytics
Complete Reports (Declared Stock)

Daily Stock Report - Shop ABC
Date: 2024-01-15

Farmer: XY
├── Roses: 100kg → 40kg sold → 60kg remaining
├── Jasmine: 50kg → 10kg sold → 40kg remaining
└── Total Value: ₹15,000 → ₹5,200 sold → ₹9,800 remaining

Farmer: YZ
├── Tomatoes: 200kg → 150kg sold → 50kg remaining
└── Total Value: ₹20,000 → ₹15,000 sold → ₹5,000 remaining

Sales-Only Reports (Implicit Stock)

Daily Sales Report - Shop ABC
Date: 2024-01-15

Farmer: XY (No stock declaration)
├── Roses: 20kg sold → ₹2,200
├── Jasmine: 30kg sold → ₹2,700
└── Total Sales: ₹4,900 (remaining stock unknown)

Farmer: YZ (No stock declaration)
├── Tomatoes: 75kg sold → ₹7,500
└── Total Sales: ₹7,500 (remaining stock unknown)


Mixed Reports
Combined Daily Report - Shop ABC
Date: 2024-01-15

Stock Status Legend:
✅ = Complete (declared stock)
⚠️ = Partial (sales only)

Farmer XY ✅
├── Roses: 100kg declared, 40kg sold, 60kg remaining
└── Revenue: ₹4,000

Farmer YZ ⚠️
├── Tomatoes: 75kg sold, starting stock unknown
└── Revenue: ₹7,500

Audit Trail System
Declared Flow Audit

Farmer XY - Roses (Stock ID: FS-001)
├── 10:00 AM - Stock declared: 100kg (mode: declared)
├── 11:30 AM - Sale to Buyer A: -40kg (balance: 60kg)
├── 02:15 PM - Sale to Buyer B: -20kg (balance: 40kg)
├── 02:15 PM - Sale to Buyer B: -20kg (balance: 40kg)
└── 05:30 PM - End of day balance: 40kg remaining

Implicit Flow Audit

Farmer YZ - Tomatoes (Stock ID: FS-002)
├── 11:00 AM - First sale: 25kg sold (mode: implicit, no declaration)
├── 01:30 PM - Second sale: 30kg sold (total sold: 55kg)
├── 03:45 PM - Third sale: 20kg sold (total sold: 75kg)
├── 05:00 PM - Late declaration: 200kg starting stock
├── 05:00 PM - Balance recalculated: 125kg remaining
└── 05:00 PM - Mode changed: implicit → declared

Stock Adjustment Audit
Farmer XY - Jasmine (Stock ID: FS-003)
├── 10:30 AM - Stock declared: 50kg (mode: declared)
├── 12:00 PM - Sale: -10kg (balance: 40kg)
├── 02:00 PM - Sale: -15kg (balance: 25kg)
├── 04:00 PM - Farmer adjustment: +5kg (found extra stock)
├── 04:00 PM - Updated declared qty: 55kg (balance: 30kg)
└── 04:01 PM - Audit note: "Found additional stock in second basket"

---

## **Implementation Guidelines**

### **Backend Service Layer**

#### **Stock Service Methods**
```python
class FarmerStockService:
    
    def create_declared_stock(farmer_id, product_id, shop_id, declared_qty):
        """Create stock record with upfront declaration"""
        
    def create_implicit_stock(farmer_id, product_id, shop_id, sold_qty):
        """Auto-create stock record from first sale"""
        
    def update_sold_quantity(stock_id, additional_qty):
        """Update sold quantity from transaction"""
        
    def declare_stock_late(stock_id, declared_qty, declared_by):
        """Add declaration to existing implicit stock"""
        
    def get_farmer_stock_summary(farmer_id, date):
        """Get complete stock summary for farmer on date"""
        
    def get_shop_stock_overview(shop_id, date):
        """Get all farmers' stock status for shop"""

        def create_transaction_with_stock_update(transaction_data):
            """
            1. Validate transaction data
            2. Check/create farmer stock record
            3. Update sold quantity
            4. Create transaction record
            5. Log audit trail
            """
            
            for item in transaction_data.items:
                # Check if stock record exists
                stock = get_farmer_stock(item.farmer_id, item.product_id, today)
                
                if not stock:
                    # Create implicit stock record
                    stock = create_implicit_stock(
                        farmer_id=item.farmer_id,
                        product_id=item.product_id,
                        shop_id=transaction_data.shop_id,
                        sold_qty=item.quantity
                    )
                else:
                    # Update existing stock
                    update_sold_quantity(stock.id, item.quantity)
                
                # Validate overselling if declared
                if stock.declared_qty and stock.sold_qty > stock.declared_qty:
                    log_warning(f"Overselling detected: {stock.sold_qty} > {stock.declared_qty}")


                    