import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Auth from './pages/Auth';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import OwnerDashboardNew from './pages/OwnerDashboardNew';
import NewTransactionPage from './pages/NewTransactionPage';
import NotFound from './pages/NotFound';
import ProductsPage from './pages/Products';
import OwnerUsersPage from './pages/OwnerUsersPage';
import ReportsPage from './pages/Reports';
import ExpensesPage from './pages/Expenses';
import BalanceManagement from './pages/BalanceManagement';
import PaymentManagement from './pages/PaymentManagement';
import TransactionManagement from './pages/TransactionManagement';
import SuperadminDashboard from './pages/SuperadminDashboard';
import SuperadminShops from './pages/SuperadminShops';
import SuperadminUsers from './pages/SuperadminUsers';
import SuperadminCategories from './pages/SuperadminCategories';
import SuperadminProducts from './pages/SuperadminProducts';
import SuperadminReports from './pages/SuperadminReports';
import SuperadminSettings from './pages/SuperadminSettings';
import ShopProducts from './pages/ShopProducts';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { UsersProvider } from './context/UsersContext';
import { AppLayout } from './components/Layout/AppLayout';
import { useAuth } from './context/AuthContext';
import OwnerSettings from './pages/OwnerSettings';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={
          isAuthenticated ? (
            user?.role === 'owner' ? <Navigate to="/owner" replace /> :
            user?.role === 'superadmin' ? <Navigate to="/superadmin" replace /> :
            <Dashboard />
          ) : <Index />
        } />
        <Route path="/login" element={
          isAuthenticated ? (
            user?.role === 'owner' ? <Navigate to="/owner" replace /> :
            user?.role === 'superadmin' ? <Navigate to="/superadmin" replace /> :
            <Navigate to="/dashboard" replace />
          ) : <Login />
        } />
        <Route path="/auth" element={
          isAuthenticated ? (
            user?.role === 'owner' ? <Navigate to="/owner" replace /> :
            user?.role === 'superadmin' ? <Navigate to="/superadmin" replace /> :
            <Navigate to="/dashboard" replace />
          ) : <Auth />
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Owner Routes */}
        <Route path="/owner" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerDashboardNew />
          </ProtectedRoute>
        } />
        <Route path="/transactions" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <TransactionManagement />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerUsersPage />
          </ProtectedRoute>
        } />
        <Route path="/products" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <ProductsPage />
          </ProtectedRoute>
        } />
        <Route path="/balance" element={
          <ProtectedRoute allowedRoles={['owner']}>
              {user && user.shop_id ? (
                <BalanceManagement shopId={user.shop_id} />
              ) : (
                <div>Shop not found for user.</div>
              )}
          </ProtectedRoute>
        } />
        <Route path="/payments" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <PaymentManagement />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <ReportsPage />
          </ProtectedRoute>
        } />
        <Route path="/expenses" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <ExpensesPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerSettings />
          </ProtectedRoute>
        } />
        <Route path="/new-transaction" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <NewTransactionPage />
          </ProtectedRoute>
        } />
        
        {/* Superadmin Routes */}
        <Route path="/superadmin" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperadminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/superadmin/shops" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperadminShops />
          </ProtectedRoute>
        } />
        <Route path="/superadmin/users" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperadminUsers />
          </ProtectedRoute>
        } />
        <Route path="/superadmin/categories" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperadminCategories />
          </ProtectedRoute>
        } />
        <Route path="/superadmin/products" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperadminProducts />
          </ProtectedRoute>
        } />
        <Route path="/superadmin/shop-products" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <ShopProducts />
          </ProtectedRoute>
        } />
        <Route path="/superadmin/reports" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperadminReports />
          </ProtectedRoute>
        } />
        <Route path="/superadmin/settings" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperadminSettings />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <SidebarProvider>
      <UsersProvider>
        <Router>
          <AppRoutes />
        </Router>
      </UsersProvider>
    </SidebarProvider>
  </AuthProvider>
);

export default App;
