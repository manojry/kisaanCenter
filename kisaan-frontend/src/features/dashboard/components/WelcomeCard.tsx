/**
 * Welcome card component for dashboard
 * Shows personalized greeting based on user role
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { User, Clock, MapPin } from 'lucide-react';

export function WelcomeCard() {
  const { user } = useAuth();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OWNER': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'EMPLOYEE': return 'bg-green-100 text-green-800 border-green-200';
      case 'FARMER': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'BUYER': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!user) return null;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {getGreeting()}, {user.firstname && user.firstname.trim() ? user.firstname : user.username}!
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Welcome to your KisaanCenter dashboard
              </p>
            </div>
          </div>
          <Badge className={getRoleColor(user.role)}>
            {user.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          {user.shop_id && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Shop ID: {user.shop_id}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}