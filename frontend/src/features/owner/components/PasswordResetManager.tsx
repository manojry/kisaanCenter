import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ownerAdminApi } from '../api';

const PasswordResetManager: React.FC<{ userId: number }> = ({ userId }) => {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleResetPassword = async () => {
    if (!user?.shop_id) return;
    try {
      await ownerAdminApi.resetUserPassword(user.shop_id, userId, newPassword);
      setMessage('Password reset successful!');
    } catch (error) {
      setMessage('Failed to reset password.');
    }
  };

  return (
    <div className="password-reset-manager">
      <h3>Reset User Password</h3>
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="New Password"
      />
      <button onClick={handleResetPassword}>Reset Password</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default PasswordResetManager;
