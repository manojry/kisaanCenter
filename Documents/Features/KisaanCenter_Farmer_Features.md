# Market Management System - Farmer Features & User Journey

## 🌾 **Farmer - Complete Feature Set & Use Cases**

Based on the comprehensive ERD and business logic, this document outlines all features available to Farmers, with practical examples and implementation details.

---

## What Farmer Has Access To

### Personal Data Scope
- **Own deliveries** and stock records only
- **Sales information** for their products
- **Payment history** and outstanding amounts
- **Commission deductions** and calculations
- **Personal profile** and contact information

### Database Entities Accessible:
- `USER` (own record only)
- `FARMER_STOCK` (own deliveries only)
- `TRANSACTION_ITEM` (sales of their products)
- `FARMER_PAYMENT` (own payments only)
- `COMMISSION_RULE` (applicable rules - read only)
- `AUDIT_LOG` (own transaction history)

---

## Core Farmer Capabilities

### 1. Product Delivery Management

#### **What Farmer Can Do:**
- Record new product deliveries to shops
- Track delivery status and quantities
- View current stock levels at each shop
- Monitor product sales performance
- Handle stock returns if unsold

#### **Practical Examples:**
```
Example 1 - Morning Delivery:
Farmer delivers 50kg roses to Shop A:
- Create FARMER_STOCK record
- quantity: 50.0, status: 'active'
- Automatic timestamping for delivery tracking
- Owner gets notification of new stock

Example 2 - Multi-Product Delivery:
Single delivery trip with multiple products:
- 30kg roses → FARMER_STOCK record #1
- 20kg marigolds → FARMER_STOCK record #2
- 15kg jasmine → FARMER_STOCK record #3
All linked to same farmer and delivery date

Example 3 - Stock Monitoring:
Check remaining stock throughout day:
- Started: 50kg roses
- Sold: 35kg (via TRANSACTION_ITEM records)
- Remaining: 15kg in FARMER_STOCK
- Status: still 'active' and available for sale
```

#### **API Endpoints Used:**
- `POST /shops/{shop_id}/stock` - Record delivery
- `GET /farmer/stock` - View current stock
- `GET /farmer/stock/{id}/sales` - Track sales of specific delivery

---

### 2. Sales Tracking & Performance

#### **What Farmer Can Do:**
- Monitor real-time sales of their products
- View detailed sales breakdown by shop/date
- Track which products sell faster
- Analyze seasonal demand patterns
- Compare performance across different shops

#### **Practical Examples:**
```
Example 1 - Daily Sales Monitoring:
Morning: Delivered 50kg roses
Afternoon check:
- Sold: 35kg at ₹120/kg = ₹4,200
- Commission: 5% = ₹210
- Net due: ₹4,200 - ₹210 = ₹3,990
- Remaining: 15kg still available

Example 2 - Product Performance Analysis:
Weekly comparison:
- Roses: 200kg delivered, 180kg sold (90% sell-through)
- Marigolds: 150kg delivered, 120kg sold (80% sell-through)
- Jasmine: 100kg delivered, 95kg sold (95% sell-through)
Insight: Focus more on jasmine production

Example 3 - Multi-Shop Analysis:
Same product across different shops:
- Shop A: Roses ₹120/kg, 90% sell rate
- Shop B: Roses ₹110/kg, 85% sell rate
- Shop C: Roses ₹125/kg, 95% sell rate
Insight: Shop C offers best returns
```

#### **Database Queries Available:**
```sql
-- Track my sales today
SELECT p.name, ti.quantity, ti.price, 
       (ti.quantity * ti.price) as revenue
FROM TRANSACTION_ITEM ti
JOIN FARMER_STOCK fs ON ti.farmer_stock_id = fs.id
JOIN PRODUCT p ON ti.product_id = p.id
WHERE fs.farmer_user_id = {farmer_id} 
AND DATE(ti.created_at) = CURDATE();

-- Check remaining stock
SELECT p.name, fs.quantity, fs.status
FROM FARMER_STOCK fs
JOIN PRODUCT p ON fs.product_id = p.id
WHERE fs.farmer_user_id = {farmer_id} 
AND fs.status = 'active';
```

---

### 3. Payment Management

#### **What Farmer Can Do:**
- Request advance payments before delivery
- Track settlement payments after sales
- View detailed payment breakdown with commissions
- Monitor outstanding dues from shops
- Handle payment disputes with audit trail

#### **Practical Examples:**
```
Example 1 - Advance Payment Request:
Before peak season:
- Request ₹10,000 advance for festival preparations
- FARMER_PAYMENT record: payment_type = 'advance'
- transaction_id = NULL (not tied to specific sale)
- Used for purchasing seeds, fertilizers, etc.

Example 2 - Settlement Calculation:
After sales completion:
Sale: ₹15,000 (100kg roses at ₹150/kg)
Commission: ₹750 (5% rate)
Previous advance: ₹5,000
Settlement: ₹15,000 - ₹750 - ₹5,000 = ₹9,250

FARMER_PAYMENT record:
- payment_type: 'settlement'
- amount: ₹9,250
- transaction_id: links to specific sales

Example 3 - Payment History Tracking:
Monthly summary view:
- Total sales: ₹45,000
- Total commission: ₹2,250
- Advances received: ₹8,000
- Settlements received: ₹34,750
- Outstanding: ₹0 (fully settled)
```

#### **Payment Status Monitoring:**
- Pending settlements
- Commission deduction details
- Payment method preferences
- Historical payment patterns
- Outstanding amount alerts

---

### 4. Commission & Pricing Visibility

#### **What Farmer Can Do:**
- View applicable commission rates per shop/product
- Understand commission calculation methods
- Track how commission affects final payments
- Compare commission structures across shops
- Plan deliveries based on commission rates

#### **Practical Examples:**
```
Example 1 - Commission Rate Awareness:
Shop A commission rules:
- Roses: 5% flat rate on all sales
- Marigolds: Slab rate (3% for 0-50kg, 5% for 50kg+)
- Jasmine: 7% flat rate (premium product)

Example 2 - Slab Commission Calculation:
Delivered 75kg marigolds:
- First 50kg: 50 × ₹100 × 3% = ₹150 commission
- Next 25kg: 25 × ₹100 × 5% = ₹125 commission
- Total commission: ₹275
- Net payment: ₹7,500 - ₹275 = ₹7,225

Example 3 - Shop Comparison for Strategic Planning:
Same product, different shops:
- Shop A: 5% commission, good payment terms
- Shop B: 7% commission, faster payments
- Shop C: 4% commission, large volume potential
Choose based on overall profitability
```

---

### 5. Quality & Stock Management

#### **What Farmer Can Do:**
- Report product quality issues
- Handle stock returns and adjustments
- Track wastage and unsold products
- Plan future deliveries based on demand
- Coordinate with shops on product requirements

#### **Practical Examples:**
```
Example 1 - Quality Issue Reporting:
If delivered roses show quality issues:
- Owner creates STOCK_ADJUSTMENT record
- reason: 'quality_issue'
- adjustment_qty: -10.0 (remove damaged stock)
- Farmer notified of adjustment with details
- Future delivery planning adjusted

Example 2 - Unsold Product Management:
End of day: 15kg roses unsold
Options:
1. Return to farmer: fs.status = 'returned'
2. Discard due to perishability: fs.status = 'discarded'
3. Keep for next day: remains 'active'
Farmer sees status updates in real-time

Example 3 - Demand Planning:
Historical data analysis:
- Tuesdays: High rose demand (festival preparation)
- Fridays: High jasmine demand (weekend events)
- Monsoon: Lower overall demand
Plan deliveries accordingly
```

---

## Farmer Daily Workflow Examples

### Early Morning (5:00 AM - 8:00 AM) - Harvest & Preparation
```
1. Check weather and market conditions
2. Harvest products based on previous day's demand data:
   GET /farmer/stock/performance?days=7
3. Sort and package products for delivery
4. Plan delivery route and quantities
```

### Morning (8:00 AM - 11:00 AM) - Delivery
```
1. Deliver to Shop A:
   POST /shops/123/stock (roses, marigolds)
   
2. Deliver to Shop B:
   POST /shops/456/stock (jasmine, roses)
   
3. Update delivery status and quantities
4. Get immediate feedback on product quality
```

### Afternoon (12:00 PM - 4:00 PM) - Monitoring
```
1. Check sales progress:
   GET /farmer/stock?date=today&status=active
   
2. Monitor which products are selling:
   GET /farmer/sales?date=today&shop_id=all
   
3. Plan for next day based on current sales pace
4. Handle any quality issues or returns
```

### Evening (4:00 PM - 7:00 PM) - Analysis & Planning
```
1. Review daily sales summary:
   GET /farmer/dashboard?date=today
   
2. Check payment status and dues:
   GET /farmer/payments?status=pending
   
3. Plan tomorrow's harvest and deliveries:
   - Analyze demand patterns
   - Check weather forecast
   - Coordinate with shops if needed
   
4. Update farming activities based on market feedback
```

---

## Advanced Farmer Features

### Business Intelligence
- Sales trend analysis by product and season
- Shop performance comparison
- Price optimization insights
- Demand forecasting
- Quality feedback tracking

### Mobile App Features (Future)
- Photo documentation of deliveries
- GPS tracking for delivery routes
- Push notifications for sales updates
- Offline data sync capabilities
- Weather integration for planning

### Collaboration Tools
- Direct messaging with shop owners
- Delivery scheduling coordination
- Quality feedback exchange
- Market price information sharing
- Joint promotional planning

---

## Farmer Success Metrics

### Financial KPIs
- Revenue per product category
- Commission optimization
- Payment collection speed
- Advance utilization efficiency
- Seasonal profitability trends

### Operational KPIs
- Product sell-through rates
- Delivery efficiency
- Quality acceptance rates
- Shop relationship strength
- Market demand alignment

### Growth Indicators
- Volume growth month-over-month
- New shop partnerships
- Product diversification success
- Price realization improvements
- Customer satisfaction scores

---

## Support & Dispute Resolution

### Available Support
- Direct contact with shop owners
- System audit trail for disputes
- Payment verification tools
- Quality issue documentation
- Market information access

### Dispute Resolution Process
1. **Issue Identification** - Via audit logs and system records
2. **Evidence Collection** - Transaction history and documentation  
3. **Communication** - Direct discussion with shop owner
4. **Resolution** - System-supported settlement process
5. **Documentation** - Complete audit trail maintenance

This comprehensive feature set empowers farmers with complete visibility and control over their product deliveries, sales, and payments while maintaining transparency and trust in the market ecosystem.
