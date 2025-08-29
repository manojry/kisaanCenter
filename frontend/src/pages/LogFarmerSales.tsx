import React, { useState } from 'react';
import { apiClient } from '@/services/api';
import toast from 'react-hot-toast';

const LogFarmerSales: React.FC = () => {
  const [farmerId, setFarmerId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/farmer-sales', {
        farmer_user_id: Number(farmerId),
        product_id: Number(productId),
        quantity: Number(quantity),
        date: date || new Date().toISOString().slice(0, 10)
      });
      toast.success('Sale logged successfully');
      setFarmerId('');
      setProductId('');
      setQuantity('');
      setDate('');
    } catch (error) {
      toast.error('Failed to log sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Log Farmer Product Sale</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Farmer ID</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2 mt-1"
            value={farmerId}
            onChange={e => setFarmerId(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Product ID</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2 mt-1"
            value={productId}
            onChange={e => setProductId(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Quantity</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2 mt-1"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Date</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2 mt-1"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          disabled={loading}
        >
          {loading ? 'Logging...' : 'Log Sale'}
        </button>
      </form>
    </div>
  );
};

export default LogFarmerSales;
