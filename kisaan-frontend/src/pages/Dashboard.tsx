import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect owners to their dedicated dashboard immediately
  useEffect(() => {
    if (user?.role === 'owner') {
      navigate('/owner', { replace: true });
      return;
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="container px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // For non-owner roles, show simple message
  return (
    <div className="container px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-muted-foreground mb-4">
        Welcome, {user.username} ({user.role})
      </p>
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Dashboard for {user.role} role is under development.
        </AlertDescription>
      </Alert>
    </div>
  );
}