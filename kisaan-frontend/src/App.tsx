import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Auth from './pages/Auth';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import OwnerDashboardNew from './pages/OwnerDashboardNew';

import NotFound from './pages/NotFound';
import ProductsPage from './pages/Products';
import OwnerUsersPage from './pages/OwnerUsersPage';
import ReportsPage from './pages/Reports';
import ExpensesPage from './pages/Expenses';
import BalanceManagement from './pages/BalanceManagement';
import PaymentManagement from './pages/PaymentManagement';
import TransactionManagement from './pages/TransactionManagement';
import QuickSalePage from './pages/QuickSalePage';
import SuperadminDashboard from './pages/SuperadminDashboard';
import SuperadminShops from './pages/SuperadminShops';
import SuperadminUsers from './pages/SuperadminUsers';
import SuperadminCategories from './pages/SuperadminCategories';
import SuperadminProducts from './pages/SuperadminProducts';
import PricingPage from './pages/PricingPage';
import SuperadminReports from './pages/SuperadminReports';
import SuperadminSettings from './pages/SuperadminSettings';
import ShopProducts from './pages/ShopProducts';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { UsersProvider } from './context/UsersContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppLayout } from './components/Layout/AppLayout';
import { useAuth } from './context/AuthContext';
import OwnerSettings from './pages/OwnerSettings';
import { Toaster } from './components/ui/toaster';

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
        {/* /auth used previously for combined auth page — route to canonical /login to avoid signup-only submission */}
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        
        {/* Public pricing page */}
        <Route path="/pricing" element={<PricingPage />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Owner Routes */}
        <Route path="/owner" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerDashboardNew  key="owner-dashboard"/>
          </ProtectedRoute>
        } />
        <Route path="/transactions" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <TransactionManagement key="transactions" />
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
        <Route path="/simple-transactions" element={
          <ProtectedRoute allowedRoles={['owner', 'employee']}>
            <QuickSalePage />
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
        {/* Plans moved to public pricing page at /pricing */}
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
        <ThemeProvider>
          <NotificationProvider>
            <Router>
              <AppRoutes />
            </Router>
            <Toaster />
          </NotificationProvider>
        </ThemeProvider>
      </UsersProvider>
    </SidebarProvider>
  </AuthProvider>
);

export default App;
