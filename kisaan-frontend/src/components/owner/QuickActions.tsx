import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  Plus,
  FileText,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'New Transaction',
      icon: ShoppingCart,
      onClick: () => navigate('/transactions'),
      variant: 'default' as const,
      className: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Manage Users',
      icon: Users,
      onClick: () => navigate('/users'),
      variant: 'outline' as const
    },
    {
      title: 'Manage Products',
      icon: Package,
      onClick: () => navigate('/products'),
      variant: 'outline' as const
    },
    {
      title: 'Record Payment',
      icon: DollarSign,
      onClick: () => navigate('/balance'),
      variant: 'outline' as const
    },
    {
      title: 'View Reports',
      icon: FileText,
      onClick: () => navigate('/reports'),
      variant: 'outline' as const
    },
    {
      title: 'Settlements',
      icon: BarChart3,
      onClick: () => navigate('/settlements'),
      variant: 'outline' as const
    }
  ];

  return (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
      {actions.map((action, index) => (
        <Button
          key={index}
          onClick={action.onClick}
          variant={action.variant}
          className={`h-20 flex-col space-y-2 ${action.className || ''}`}
        >
          <action.icon className="h-6 w-6" />
          <span className="text-sm font-medium break-words truncate max-w-[10ch] md:max-w-[16ch] lg:max-w-[20ch] text-center" style={{overflowWrap: 'anywhere'}} title={action.title}>
            {action.title}
          </span>
        </Button>
      ))}
    </div>
  );
};