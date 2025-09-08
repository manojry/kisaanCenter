import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


import Login from './pages/Login';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import OwnerDashboardNew from './pages/OwnerDashboardNew';
import NewTransactionPage from './pages/NewTransactionPage';
import NotFound from './pages/NotFound';
import ProductsPage from './pages/Products';
import UsersPage from './pages/Users';
import ReportsPage from './pages/Reports';
import SettlementsPage from './pages/Settlements';
import BalanceManagement from './pages/BalanceManagement';
import TransactionManagement from './pages/TransactionManagement';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/Layout/AppLayout';


const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/owner" element={<OwnerDashboardNew />} />
          <Route path="/new-transaction" element={<NewTransactionPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settlements" element={<SettlementsPage />} />
          <Route path="/balance" element={<BalanceManagement />} />
          <Route path="/transactions" element={<TransactionManagement />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
