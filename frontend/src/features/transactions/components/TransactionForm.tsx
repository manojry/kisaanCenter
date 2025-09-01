
import React, { useState } from 'react';
import { useNotifications, useLoading } from '../../../context/AppStateContext';
import { apiClient } from '../../../services/api';

const TransactionForm: React.FC = () => {
  const { addNotification } = useNotifications();
  const { setLoading, isLoading } = useLoading();
  const [formData, setFormData] = useState({
    buyer_id: '',
    farmer_id: '',
    product_name: '',
    quantity: '',
    price: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading('createTransaction', true);
      
      const response = await apiClient.post('/transactions', formData);
      
      if (response.success) {
        addNotification({
          type: 'success',
          title: 'Transaction Created',
          message: `Transaction #${response.data.id} created successfully!`
        });
        
        // Reset form
        setFormData({
          buyer_id: '',
          farmer_id: '',
          product_name: '',
          quantity: '',
          price: ''
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Transaction Failed',
        message: 'Failed to create transaction. Please try again.',
        autoClose: false // Keep error visible until manually closed
      });
    } finally {
      setLoading('createTransaction', false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Product Name
        </label>
        <input
          type="text"
          value={formData.product_name}
          onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>

      {/* More form fields... */}

      <button
        type="submit"
        disabled={isLoading('createTransaction')}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading('createTransaction') ? 'Creating...' : 'Create Transaction'}
      </button>
    </form>
  );
};

export default TransactionForm;
