import React, { useState, useEffect } from 'react';
import { Transaction, CreateTransactionRequest, TransactionType } from '../types';
import { fetchAvailableStock } from '../../stock/api';
import { userApi } from '../../user/api';
import { createTransaction } from '../api';
import { previewCommission } from '../../commission/api';
import { FarmerStock } from '../../stock/types';
import { User } from '../../../types/entities';
import { CommissionCalculation } from '../../commission/types';
import './TransactionForm.css';

interface TransactionFormProps {
  shopId: string;
  onTransactionCreated?: (transaction: Transaction) => void;
  onCancel?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  shopId,
  onTransactionCreated,
  onCancel
}) => {
  const [availableStock, setAvailableStock] = useState<FarmerStock[]>([]);
  const [buyers, setBuyers] = useState<User[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<string>('');
  const [transactionItems, setTransactionItems] = useState<{
    product_id: string;
    farmer_id: string;
    quantity: number;
    unit_price: number;
    stock_id: string;
  }[]>([]);
  const [commissionPreview, setCommissionPreview] = useState<CommissionCalculation[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, [shopId]);

  const loadInitialData = async () => {
    try {
      const [stockData, usersResponse] = await Promise.all([
        fetchAvailableStock(shopId),
        userApi.getUsers({ role: 'BUYER', status: 'active' })
      ]);
      
      setAvailableStock(stockData);
      setBuyers(usersResponse.data || []);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    }
  };

  const addTransactionItem = () => {
    setTransactionItems([...transactionItems, {
      product_id: '',
      farmer_id: '',
      quantity: 0,
      unit_price: 0,
      stock_id: ''
    }]);
  };

  const removeTransactionItem = (index: number) => {
    const newItems = transactionItems.filter((_, i) => i !== index);
    setTransactionItems(newItems);
    updateCommissionPreview(newItems);
  };

  const updateTransactionItem = (index: number, field: string, value: any) => {
    const newItems = [...transactionItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'stock_id' && value) {
      const selectedStock = availableStock.find(s => s.id === value);
      if (selectedStock) {
        newItems[index].product_id = selectedStock.product_id;
        newItems[index].farmer_id = selectedStock.farmer_user_id;
        newItems[index].unit_price = selectedStock.unit_price || 0;
      }
    }
    
    setTransactionItems(newItems);
    updateCommissionPreview(newItems);
  };

  const updateCommissionPreview = async (items: typeof transactionItems) => {
    if (items.length === 0 || items.some(item => !item.product_id || !item.quantity || !item.unit_price)) {
      setCommissionPreview([]);
      return;
    }

    try {
      const preview = await previewCommission({
        shop_id: shopId,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      });
      setCommissionPreview(preview);
    } catch (err) {
      console.error('Failed to preview commission:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBuyer || transactionItems.length === 0) {
      setError('Please select a buyer and add at least one item');
      return;
    }

    if (transactionItems.some(item => !item.product_id || !item.quantity || item.quantity <= 0)) {
      setError('Please fill in all item details with valid quantities');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const transactionData: CreateTransactionRequest = {
        shop_id: shopId,
        buyer_user_id: selectedBuyer,
        type: TransactionType.SALE,
        items: transactionItems.map(item => ({
          product_id: item.product_id,
          farmer_id: item.farmer_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        notes: notes || undefined
      };

      const transaction = await createTransaction(transactionData);
      onTransactionCreated?.(transaction);
    } catch (err) {
      setError('Failed to create transaction');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    return transactionItems.reduce((total, item) => 
      total + (item.quantity * item.unit_price), 0
    );
  };

  const getTotalCommission = () => {
    return commissionPreview.reduce((total, comm) => 
      total + comm.commission_amount, 0
    );
  };

  return (
    <div className="transaction-form">
      <div className="form-header">
        <h2>Create New Transaction</h2>
        {onCancel && (
          <button type="button" onClick={onCancel} className="close-btn">
            ×
          </button>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Select Buyer *</label>
            <select 
              value={selectedBuyer} 
              onChange={(e) => setSelectedBuyer(e.target.value)}
              className="form-select"
              required
            >
              <option value="">-- Select Buyer --</option>
              {buyers.map(buyer => (
                <option key={buyer.id} value={buyer.id}>
                  {buyer.username} {buyer.contact ? `(${buyer.contact})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>Transaction Items</h3>
            <button type="button" onClick={addTransactionItem} className="add-item-btn">
              + Add Item
            </button>
          </div>
          
          {transactionItems.map((item, index) => (
            <div key={index} className="transaction-item">
              <div className="item-header">
                <span className="item-number">Item {index + 1}</span>
                <button 
                  type="button" 
                  onClick={() => removeTransactionItem(index)}
                  className="remove-item-btn"
                >
                  Remove
                </button>
              </div>
              
              <div className="item-form">
                <div className="form-group">
                  <label className="form-label">Product Stock *</label>
                  <select
                    value={item.stock_id}
                    onChange={(e) => updateTransactionItem(index, 'stock_id', e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">-- Select Product Stock --</option>
                    {availableStock.map(stock => (
                      <option key={stock.id} value={stock.id}>
                        {stock.product?.name} - {stock.farmer_user?.username} 
                        (Qty: {stock.quantity}, Price: ${stock.unit_price})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Quantity *</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateTransactionItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      min="1"
                      max={availableStock.find(s => s.id === item.stock_id)?.quantity || 1}
                      className="form-input"
                      placeholder="0"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Unit Price *</label>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateTransactionItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div className="item-total">
                    <span className="total-label">Total:</span>
                    <span className="total-amount">${(item.quantity * item.unit_price).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {transactionItems.length === 0 && (
            <div className="empty-state">
              <p>No items added yet. Click "Add Item" to start.</p>
            </div>
          )}
        </div>

        {commissionPreview.length > 0 && (
          <div className="form-section commission-preview">
            <h3>Commission Preview</h3>
            <div className="commission-items">
              {commissionPreview.map((comm, index) => (
                <div key={index} className="commission-item">
                  <span>Item {index + 1}:</span>
                  <span className="commission-rate">{(comm.commission_rate * 100).toFixed(1)}%</span>
                  <span className="commission-amount">${comm.commission_amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="commission-total">
              <strong>Total Commission: ${getTotalCommission().toFixed(2)}</strong>
            </div>
          </div>
        )}

        <div className="form-section transaction-summary">
          <h3>Transaction Summary</h3>
          <div className="summary-grid">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${getTotalAmount().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Commission:</span>
              <span>${getTotalCommission().toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span><strong>Net to Farmer:</strong></span>
              <span><strong>${(getTotalAmount() - getTotalCommission()).toFixed(2)}</strong></span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
              placeholder="Any additional notes for this transaction..."
              rows={3}
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={loading || transactionItems.length === 0} 
            className="primary-btn"
          >
            {loading ? 'Creating...' : 'Create Transaction'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="secondary-btn">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
