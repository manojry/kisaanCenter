/**
 * Quick stats component for dashboard
 * Shows role-specific key metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  ShoppingCart,
  Truck,
  CreditCard
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={trend.isPositive ? 'text-green-500' : 'text-red-500'}>
              {trend.value}
            </span>
            <span>from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function QuickStats() {
  const { user } = useAuth();

  // Mock data based on role
  const getStatsForRole = () => {
    switch (user?.role) {
      case 'OWNER':
        return [
          {
            title: 'Total Revenue',
            value: '₹1,24,500',
            icon: <DollarSign className="h-4 w-4" />,
            trend: { value: '+12.5%', isPositive: true }
          },
          {
            title: 'Active Users',
            value: '23',
            icon: <Users className="h-4 w-4" />,
            trend: { value: '+2', isPositive: true }
          },
          {
            title: 'Transactions',
            value: '156',
            icon: <ShoppingCart className="h-4 w-4" />,
            trend: { value: '+8.2%', isPositive: true }
          },
          {
            title: 'Commission',
            value: '₹12,450',
            icon: <TrendingUp className="h-4 w-4" />,
            trend: { value: '+15.3%', isPositive: true }
          }
        ];

      case 'FARMER':
        return [
          {
            title: 'Total Sales',
            value: '₹45,200',
            icon: <DollarSign className="h-4 w-4" />,
            trend: { value: '+18.2%', isPositive: true }
          },
          {
            title: 'Stock Delivered',
            value: '850 kg',
            icon: <Truck className="h-4 w-4" />,
            trend: { value: '+125 kg', isPositive: true }
          },
          {
            title: 'Pending Payment',
            value: '₹8,500',
            icon: <CreditCard className="h-4 w-4" />
          },
          {
            title: 'Active Products',
            value: '12',
            icon: <Package className="h-4 w-4" />
          }
        ];

      case 'BUYER':
        return [
          {
            title: 'Total Purchases',
            value: '₹32,100',
            icon: <ShoppingCart className="h-4 w-4" />,
            trend: { value: '+22.1%', isPositive: true }
          },
          {
            title: 'Credit Used',
            value: '₹5,200',
            icon: <CreditCard className="h-4 w-4" />
          },
          {
            title: 'Credit Limit',
            value: '₹25,000',
            icon: <DollarSign className="h-4 w-4" />
          },
          {
            title: 'Orders',
            value: '24',
            icon: <Package className="h-4 w-4" />,
            trend: { value: '+6', isPositive: true }
          }
        ];

      case 'EMPLOYEE':
        return [
          {
            title: 'Transactions Processed',
            value: '89',
            icon: <ShoppingCart className="h-4 w-4" />,
            trend: { value: '+12', isPositive: true }
          },
          {
            title: 'Daily Sales',
            value: '₹18,400',
            icon: <DollarSign className="h-4 w-4" />,
            trend: { value: '+8.5%', isPositive: true }
          },
          {
            title: 'Stock Adjustments',
            value: '15',
            icon: <Package className="h-4 w-4" />
          },
          {
            title: 'Customers Served',
            value: '67',
            icon: <Users className="h-4 w-4" />,
            trend: { value: '+11', isPositive: true }
          }
        ];

      case 'SUPERADMIN':
        return [
          {
            title: 'Total Shops',
            value: '12',
            icon: <Package className="h-4 w-4" />,
            trend: { value: '+2', isPositive: true }
          },
          {
            title: 'System Users',
            value: '234',
            icon: <Users className="h-4 w-4" />,
            trend: { value: '+18', isPositive: true }
          },
          {
            title: 'Platform Revenue',
            value: '₹2,45,600',
            icon: <DollarSign className="h-4 w-4" />,
            trend: { value: '+25.3%', isPositive: true }
          },
          {
            title: 'Active Transactions',
            value: '1,156',
            icon: <ShoppingCart className="h-4 w-4" />,
            trend: { value: '+142', isPositive: true }
          }
        ];

      default:
        return [];
    }
  };

  const stats = getStatsForRole();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}