import React, { useState } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { TransactionFormData, TransactionItem } from '@/types/transaction';
import { useUsers } from '@/features/user/hooks/useUsers';
import { useProducts } from '@/features/product/hooks/useProducts';
import { useNavigate } from 'react-router-dom';
import './TransactionEntryPage.css';

export const TransactionEntryPage: React.FC = () => {
  const { createTransaction, loading } = useTransactions();
  const usersQuery = useUsers();
  const productsQuery = useProducts();
  const users = Array.isArray(usersQuery.data?.data) ? usersQuery.data.data : [];
  const products = productsQuery.data?.data ?? [];
  const navigate = useNavigate();

  const [formData, setFormData] = useState<TransactionFormData>({
    buyer_user_id: 0,
    type: 'sale',
    commission_rate: 0,
    date: new Date().toISOString().slice(0, 10),
    items: [],
    farmer_paid_amount: 0,
    commission_confirmed: false,
    buyer_paid_amount: 0,
  });
  const [selectedFarmer, setSelectedFarmer] = useState<number | undefined>(undefined);
  const [selectedProduct, setSelectedProduct] = useState<number | undefined>(undefined);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [buyer, setBuyer] = useState<number | undefined>(undefined);
  const [farmerPaid, setFarmerPaid] = useState(false);
  const [commissionReceived, setCommissionReceived] = useState(false);
  const [buyerPaid, setBuyerPaid] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Validate required fields
  const validateFields = () => {
    const errs: string[] = [];
    if (!selectedFarmer) errs.push('Farmer is required');
    if (!selectedProduct) errs.push('Product is required');
    if (!quantity || Number(quantity) <= 0) errs.push('Quantity must be positive');
    if (!price || Number(price) <= 0) errs.push('Price must be positive');
    return errs;
  };

  const handleAddItem = () => {
    const errs = validateFields();
    setErrors(errs);
    if (errs.length) return;
    const newItem: TransactionItem = {
      product_id: selectedProduct!,
      quantity: Number(quantity),
      price: Number(price),
      farmer_user_id: selectedFarmer!,
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setSelectedProduct(undefined);
    setQuantity('');
    setPrice('');
    setSelectedFarmer(undefined);
    setErrors([]);
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!buyer) {
      setErrors(['Buyer is required']);
      return;
    }
    if (formData.items.length === 0) {
      setErrors(['At least one item is required']);
      return;
    }
    
    // Calculate total for payment status
    const total = formData.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const submitData: TransactionFormData = {
      ...formData,
      buyer_user_id: buyer,
      farmer_paid_amount: farmerPaid ? total : 0,
      commission_confirmed: commissionReceived,
      buyer_paid_amount: buyerPaid ? total : 0,
    };
    
    try {
      await createTransaction(submitData);
      navigate('/dashboard');
    } catch (error) {
      setErrors(['Failed to create transaction. Please try again.']);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  return (
    <div className="transaction-entry-page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">🌾 New Transaction Entry</h1>
        <p className="page-subtitle">Create a new farmer sale transaction with multiple products</p>
      </div>

      {/* Error Alert */}
      {errors.length > 0 && (
        <div className="error-alert">
          <h4 className="error-title">⚠️ Please fix the following errors:</h4>
          <ul className="error-list">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="form-container">
        {/* Add Item Section */}
        <div className="form-section">
          <h2 className="section-title">Add Transaction Item</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="farmer">Farmer *</label>
              <select 
                id="farmer"
                value={selectedFarmer ?? ''}
                onChange={e => setSelectedFarmer(Number(e.target.value))}
                className="form-select"
              >
                <option value="">Select Farmer</option>
                {users.filter((u: any) => u.role === 'farmer').map((farmer: any) => (
                  <option key={farmer.id} value={farmer.id}>{farmer.username}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="product">Product *</label>
              <select 
                id="product"
                value={selectedProduct ?? ''}
                onChange={e => setSelectedProduct(Number(e.target.value))}
                className="form-select"
              >
                <option value="">Select Product</option>
                {products.map((product: { id: number; name: string }) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input 
                id="quantity"
                value={quantity} 
                onChange={e => setQuantity(e.target.value)} 
                type="number" 
                min="0" 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Price per Unit *</label>
              <input 
                id="price"
                value={price} 
                onChange={e => setPrice(e.target.value)} 
                type="number" 
                min="0" 
                className="form-input"
              />
            </div>
          </div>

          <button 
            onClick={handleAddItem} 
            className="btn btn-primary add-item-btn"
            disabled={!selectedFarmer || !selectedProduct || !quantity || !price}
          >
            ➕ Add Item to Transaction
          </button>
        </div>

        <div className="form-section">
          <h2 className="section-title">Buyer Information</h2>
          
          <div className="form-group">
            <label htmlFor="buyer">Buyer *</label>
            <select 
              id="buyer"
              value={buyer ?? ''}
              onChange={e => setBuyer(Number(e.target.value))}
              className="form-select"
            >
              <option value="">Select Buyer</option>
              {users.filter((u: any) => u.role === 'buyer').map((buyer: any) => (
                <option key={buyer.id} value={buyer.id}>{buyer.username}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Payment Status</h2>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={farmerPaid} 
                onChange={e => setFarmerPaid(e.target.checked)} 
                className="checkbox-input"
              />
              📦 Farmer Paid
            </label>
            
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={commissionReceived} 
                onChange={e => setCommissionReceived(e.target.checked)} 
                className="checkbox-input"
              />
              💰 Commission Received
            </label>
            
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={buyerPaid} 
                onChange={e => setBuyerPaid(e.target.checked)} 
                className="checkbox-input"
              />
              👤 Buyer Paid
            </label>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Transaction Items</h2>
          
          {formData.items.length === 0 ? (
            <div className="empty-state">
              <p>No items added yet. Add items using the form above.</p>
            </div>
          ) : (
            <>
              <div className="items-table">
                <div className="table-header">
                  <span>Product</span>
                  <span>Quantity</span>
                  <span>Unit Price</span>
                  <span>Total</span>
                  <span>Action</span>
                </div>
                
                {formData.items.map((item, idx) => {
                  const product = products.find((p: { id: number }) => p.id === item.product_id);
                  const farmer = users.find((u: { id: number }) => u.id === item.farmer_user_id);
                  const itemTotal = item.quantity * item.price;
                  
                  return (
                    <div className="table-row" key={idx}>
                      <span>{product?.name ?? item.product_id}</span>
                      <span>{item.quantity}</span>
                      <span>{formatCurrency(item.price)}</span>
                      <span>{formatCurrency(itemTotal)}</span>
                      <button 
                        onClick={() => handleRemoveItem(idx)}
                        className="btn btn-danger remove-btn"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <div className="total-section">
                <h3>Total Amount: {formatCurrency(getTotalAmount())}</h3>
              </div>
            </>
          )}
        </div>

        <div className="form-actions">
          <button 
            onClick={handleSubmit} 
            disabled={loading || formData.items.length === 0}
            className="btn btn-success submit-btn"
          >
            {loading ? 'Submitting...' : '✅ Submit Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};
