import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from '@/features/auth/components/LoginForm';
// import Dashboard from '@/features/dashboard/Dashboard'; // Uncomment and create Dashboard component

const Dashboard = () => <div>Dashboard Page</div>;

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
