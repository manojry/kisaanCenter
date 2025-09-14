import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Users, 
  Calendar,
  ShoppingCart
} from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    today_sales: number;
    today_transactions: number;
    today_commission: number;
    pending_collections: number;
    farmer_payments_due: number;
    total_users: number;
    commission_realized?: number;
  };
  isLoading?: boolean;
}

const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="ml-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Today's Sales",
      value: formatCurrency(stats.today_sales),
      subtitle: `${stats.today_transactions} transactions`,
      icon: Calendar,
      color: "text-blue-600"
    },
    {
      title: "Your Commission",
      value: formatCurrency(stats.today_commission),
      subtitle: "Earned today",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "To Collect",
      value: formatCurrency(stats.pending_collections),
      subtitle: "From buyers",
      icon: AlertCircle,
      color: "text-orange-600"
    },
    {
      title: "To Pay",
      value: formatCurrency(stats.farmer_payments_due),
      subtitle: "To farmers",
      icon: Users,
      color: "text-red-600"
    }
  ];

  return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color} break-words truncate max-w-[12ch] md:max-w-[20ch] lg:max-w-[28ch]`} style={{overflowWrap: 'anywhere'}} title={stat.value}>
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500">{stat.subtitle}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};