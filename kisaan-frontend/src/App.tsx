import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


import Login from './pages/Login';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import NewTransactionPage from './pages/NewTransactionPage';
import NotFound from './pages/NotFound';
import ProductsPage from './pages/Products';
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
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/new-transaction" element={<NewTransactionPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
