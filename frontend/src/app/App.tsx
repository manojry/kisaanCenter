import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import LoginForm from '@/features/auth/components/LoginForm'
import SuperAdminLayout from '@/components/layout/SuperAdminLayout'
import OwnerLayout from '@/components/layout/OwnerLayout'
import Dashboard from '@/pages/Dashboard'
import Users from '@/pages/Users'
import Shops from '@/pages/Shops'
import Products from '@/pages/Products'
import Stock from '@/pages/Stock'
import Transactions from '@/pages/Transactions'
import Payments from '@/pages/Payments'
import Credits from '@/pages/Credits'
import Expenses from '@/pages/Expenses'
import Reports from '@/pages/Reports'
import Audit from '@/pages/Audit'
import Settings from '@/pages/Settings'
import SuperAdminDashboard from '@/pages/SuperAdminDashboard'
import Profile from '@/pages/Profile'
import ShopOverview from '@/pages/ShopOverview'
import Commissions from '@/pages/Commissions'
import ResetPassword from '@/pages/ResetPassword'
import LogFarmerSales from '@/pages/LogFarmerSales'
import '../styles/global.css'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Super Admin gets their own layout without sidebar
  if (user?.role === 'superadmin') {
    return (
      <SuperAdminLayout>
        {children}
      </SuperAdminLayout>
    )
  }

  // All other users get the owner layout with Navigation
  return (
    <OwnerLayout>
      {children}
    </OwnerLayout>
  )
}

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm />
        } 
      />
      
      {/* Super Admin Dashboard */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            {user?.role === 'superadmin' ? (
              <SuperAdminDashboard user={user} />
            ) : (
              <Dashboard />
            )}
          </ProtectedRoute>
        } 
      />
      

      <Route 
        path="/users" 
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shops" 
        element={
          <ProtectedRoute>
            <Shops />
          </ProtectedRoute>
        } 
      />
      
      {/* Shop Management Routes */}
      <Route 
        path="/shop/overview" 
        element={
          <ProtectedRoute>
            <ShopOverview />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/transactions" 
        element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/stock" 
        element={
          <ProtectedRoute>
            <Stock />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/users" 
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/commissions" 
        element={
          <ProtectedRoute>
            <Commissions />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/payments" 
        element={
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/products" 
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/stock" 
        element={
          <ProtectedRoute>
            <Stock />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/transactions" 
        element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payments" 
        element={
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/credits" 
        element={
          <ProtectedRoute>
            <Credits />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/expenses" 
        element={
          <ProtectedRoute>
            <Expenses />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/audit" 
        element={
          <ProtectedRoute>
            <Audit />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/reset-password"
        element={
          <ProtectedRoute>
            <ResetPassword />
          </ProtectedRoute>
        }
      />
      <Route
        path="/log-farmer-sales"
        element={
          <ProtectedRoute>
            <LogFarmerSales />
          </ProtectedRoute>
        }
      />
      
      {/* Additional Owner Routes */}
      <Route 
        path="/commissions" 
        element={
          <ProtectedRoute>
            <Commissions />
          </ProtectedRoute>
        } 
      />
      
      {/* Farmer-specific routes */}
      <Route 
        path="/farmer/stock" 
        element={
          <ProtectedRoute>
            <Stock />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/farmer/payments" 
        element={
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        } 
      />
      
      {/* Buyer-specific routes */}
      <Route 
        path="/buyer/purchases" 
        element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/buyer/credits" 
        element={
          <ProtectedRoute>
            <Credits />
          </ProtectedRoute>
        } 
      />
      
      {/* Quick action routes */}
      <Route 
        path="/stock/add" 
        element={
          <ProtectedRoute>
            <Stock />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/transactions/create" 
        element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payments/farmers" 
        element={
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payments/buyers" 
        element={
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/users/create" 
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        } 
      />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App