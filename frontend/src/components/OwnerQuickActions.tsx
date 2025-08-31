import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Users, Package, ShoppingCart, DollarSign, 
  FileText, Settings, TrendingUp, AlertCircle 
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
  category: 'primary' | 'secondary' | 'urgent';
  shortcut?: string;
}

const OwnerQuickActions: React.FC = () => {
  const quickActions: QuickAction[] = [
    // Primary Actions - Most Common Owner Tasks
    {
      id: 'record-delivery',
      title: 'Record Farmer Delivery',
      description: 'Log new stock from farmers',
      icon: <Package className="h-6 w-6" />,
      route: '/stock/add',
      color: 'bg-emerald-600 hover:bg-emerald-700',
      category: 'primary',
      shortcut: 'Ctrl+D'
    },
    {
      id: 'process-sale',
      title: 'Process Sale',
      description: 'Create new transaction',
      icon: <ShoppingCart className="h-6 w-6" />,
      route: '/transactions/create',
      color: 'bg-green-600 hover:bg-green-700',
      category: 'primary',
      shortcut: 'Ctrl+S'
    },
    {
      id: 'pay-farmer',
      title: 'Pay Farmer',
      description: 'Process farmer payment',
      icon: <DollarSign className="h-6 w-6" />,
      route: '/payments/farmers',
      color: 'bg-emerald-500 hover:bg-emerald-600',
      category: 'primary',
      shortcut: 'Ctrl+P'
    },
    {
      id: 'add-user',
      title: 'Add User',
      description: 'Register new farmer/buyer',
      icon: <Users className="h-6 w-6" />,
      route: '/users/create',
      color: 'bg-teal-600 hover:bg-teal-700',
      category: 'primary'
    },

    // Secondary Actions - Important but Less Frequent
    {
      id: 'view-reports',
      title: 'View Reports',
      description: 'Daily/monthly analytics',
      icon: <TrendingUp className="h-6 w-6" />,
      route: '/reports',
      color: 'bg-green-700 hover:bg-green-800',
      category: 'secondary'
    },
    {
      id: 'manage-products',
      title: 'Manage Products',
      description: 'Add/edit product catalog',
      icon: <Package className="h-6 w-6" />,
      route: '/products',
      color: 'bg-amber-600 hover:bg-amber-700',
      category: 'secondary'
    },
    {
      id: 'commission-rules',
      title: 'Commission Rules',
      description: 'Set commission rates',
      icon: <Settings className="h-6 w-6" />,
      route: '/commissions',
      color: 'bg-stone-600 hover:bg-stone-700',
      category: 'secondary'
    },
    {
      id: 'generate-invoice',
      title: 'Generate Invoice',
      description: 'Create customer invoice',
      icon: <FileText className="h-6 w-6" />,
      route: '/invoices/create',
      color: 'bg-teal-500 hover:bg-teal-600',
      category: 'secondary'
    },

    // Urgent Actions - Need Immediate Attention
    {
      id: 'pending-payments',
      title: 'Pending Payments',
      description: 'Review overdue payments',
      icon: <AlertCircle className="h-6 w-6" />,
      route: '/payments?filter=overdue',
      color: 'bg-red-600 hover:bg-red-700',
      category: 'urgent'
    }
  ];

  const primaryActions = quickActions.filter(action => action.category === 'primary');
  const secondaryActions = quickActions.filter(action => action.category === 'secondary');
  const urgentActions = quickActions.filter(action => action.category === 'urgent');

  const ActionCard: React.FC<{ action: QuickAction; size?: 'small' | 'large' }> = ({ 
    action, 
    size = 'large' 
  }) => (
    <Link
      to={action.route}
      className={`
        block p-4 rounded-lg text-white transition-all duration-200 transform hover:scale-105 hover:shadow-lg
        ${action.color}
        ${size === 'small' ? 'p-3' : 'p-4'}
        ${action.category === 'urgent' ? 'ring-2 ring-red-300 animate-pulse' : ''}
      `}
      title={action.shortcut ? `Shortcut: ${action.shortcut}` : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
          {action.icon}
        </div>
        {action.category === 'urgent' && (
          <div className="w-3 h-3 bg-red-300 rounded-full animate-ping"></div>
        )}
      </div>
      <h3 className={`font-semibold mb-1 ${size === 'small' ? 'text-sm' : 'text-base'}`}>
        {action.title}
      </h3>
      <p className={`text-white text-opacity-90 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
        {action.description}
      </p>
      {action.shortcut && (
        <div className="mt-2 text-xs text-white text-opacity-70">
          {action.shortcut}
        </div>
      )}
    </Link>
  );

  return (
    <div className="space-y-6">
      {/* Urgent Actions - Always Visible */}
      {urgentActions.length > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-red-700">Urgent Actions Required</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {urgentActions.map(action => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        </div>
      )}

      {/* Primary Actions - Owner's Daily Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Daily Operations</h3>
          <span className="text-sm text-gray-500">Most common tasks</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {primaryActions.map(action => (
            <ActionCard key={action.id} action={action} />
          ))}
        </div>
      </div>

      {/* Secondary Actions - Business Management */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Business Management</h3>
          <span className="text-sm text-gray-500">Setup & configuration</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {secondaryActions.map(action => (
            <ActionCard key={action.id} action={action} size="small" />
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Keyboard Shortcuts</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
          {quickActions
            .filter(action => action.shortcut)
            .map(action => (
              <div key={action.id} className="flex justify-between">
                <span>{action.title}:</span>
                <code className="bg-gray-200 px-2 py-1 rounded text-xs">{action.shortcut}</code>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default OwnerQuickActions;