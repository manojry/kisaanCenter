# Essential API endpoints that were incorrectly indented

@app.get("/api/v1/products")
async def get_products(shop_id: int = 1, db: Session = Depends(get_db)):
    products = ProductService.get_products(db, shop_id)
    
    product_data = []
    for product in products:
        product_data.append({
            "id": product.id,
            "name": product.name,
            "shop_id": product.shop_id,
            "category_id": product.category_id,
            "status": product.status.value,
            "created_at": product.created_at.isoformat() if product.created_at else None
        })
    
    return {
        "success": True,
        "message": "Products retrieved successfully",
        "data": product_data
    }

@app.get("/api/v1/transactions")  
async def get_transactions(shop_id: int = 1, db: Session = Depends(get_db)):
    transactions = db.query(Transaction).filter(Transaction.shop_id == shop_id).all()
    
    transaction_data = []
    for txn in transactions:
        # Calculate total amount from transaction items
        total_amount = sum(float(item.quantity * item.price) for item in txn.transaction_items)
        
        transaction_data.append({
            "id": txn.id,
            "amount": total_amount,
            "status": txn.status.value,
            "shop_id": txn.shop_id,
            "buyer_id": txn.buyer_user_id,
            "date": txn.date.isoformat() if txn.date else None,
            "created_at": txn.created_at.isoformat() if txn.created_at else None
        })
    
    return {
        "success": True,
        "message": "Transactions retrieved successfully",
        "data": transaction_data
    }

@app.get("/api/v1/credits")
async def get_credits(shop_id: int = 1, db: Session = Depends(get_db)):
    credits = db.query(Credit).join(Transaction).filter(Transaction.shop_id == shop_id).all()
    
    credit_data = []
    for credit in credits:
        credit_data.append({
            "id": credit.id,
            "amount": float(credit.amount),
            "status": credit.status.value,
            "buyer_id": credit.buyer_user_id,
            "transaction_id": credit.transaction_id,
            "created_at": credit.created_at.isoformat() if credit.created_at else None
        })
    
    return {
        "success": True,
        "message": "Credits retrieved successfully",
        "data": credit_data
    }
