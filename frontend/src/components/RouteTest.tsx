import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Package, ShoppingCart, CreditCard, FileText } from 'lucide-react';

const RouteTest: React.FC = () => {
  const location = useLocation();

  const testRoutes = [
    { path: '/dashboard', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
    { path: '/transactions', label: 'Transactions', icon: <ShoppingCart className="h-4 w-4" /> },
    { path: '/payments', label: 'Payments', icon: <CreditCard className="h-4 w-4" /> },
    { path: '/stock', label: 'Stock', icon: <Package className="h-4 w-4" /> },
    { path: '/users', label: 'Users', icon: <Users className="h-4 w-4" /> },
    { path: '/products', label: 'Products', icon: <Package className="h-4 w-4" /> },
    { path: '/reports', label: 'Reports', icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Route Test</h3>
      <p className="text-sm text-gray-600 mb-4">Current route: {location.pathname}</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {testRoutes.map((route) => (
          <Link
            key={route.path}
            to={route.path}
            className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
              location.pathname === route.path
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {route.icon}
            <span className="text-sm font-medium">{route.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RouteTest;