import React, { useState, useEffect } from 'react';
import TransactionForm from '@/features/transaction/components/TransactionForm';
import { TransactionFormData } from '@/types/transaction';
import { apiClient } from '@/services/api';
import toast from 'react-hot-toast';

interface User {
  id: number;
  username: string;
  role: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

const initialFormData: TransactionFormData = {
  buyer_user_id: 0,
  type: 'sale',
  commission_rate: 10,
  date: new Date().toISOString().split('T')[0],
  items: []
};

const TransactionEntry: React.FC = () => {
  const [formData, setFormData] = useState<TransactionFormData>(initialFormData);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
          const [usersResponse, productsResponse] = await Promise.all([
            apiClient.get('/users'),
            apiClient.get('/products')
          ]);
          setUsers(usersResponse.data as User[]);
          setProducts(productsResponse.data as Product[]);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        toast.error('Failed to load form data');
      }
    };
    fetchInitialData();
  }, []);

  const handleSubmit = async (data: TransactionFormData) => {
    setLoading(true);
    try {
      // Replace with your actual createTransaction API call
      await apiClient.post('/transactions', data);
      toast.success('Transaction created successfully');
      setFormData(initialFormData);
    } catch (err) {
      console.error('Error submitting transaction:', err);
      toast.error('Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <TransactionForm
          formData={formData}
          users={users}
          products={products}
          loading={loading}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onChange={setFormData}
          isEditing={false}
        />
      </div>
    </div>
  );
};

export default TransactionEntry;
