import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ownerAdminApi } from '../api';

const CommissionManager: React.FC = () => {
  const { user } = useAuth();
  const [commissionRate, setCommissionRate] = useState<number>(0);
  const [message, setMessage] = useState<string>('');

  const handleUpdateCommission = async () => {
    if (!user?.shop_id) return;
    try {
      await ownerAdminApi.setShopCommission(user.shop_id, commissionRate);
      setMessage('Commission updated successfully!');
    } catch (error) {
      setMessage('Failed to update commission.');
    }
  };

  return (
    <div className="commission-manager">
      <h3>Commission Settings</h3>
      <input
        type="number"
        value={commissionRate}
        onChange={(e) => setCommissionRate(Number(e.target.value))}
        min="0"
        max="100"
        step="0.1"
      />
      <button onClick={handleUpdateCommission}>Update Commission</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default CommissionManager;
