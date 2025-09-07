/**
 * 404 Not Found page component
 * Mobile-first responsive design with navigation back to app
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Home, ArrowLeft, Leaf, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  const location = useLocation();

  React.useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-emerald/10 rounded-xl">
              <Leaf className="h-7 w-7 text-primary-emerald" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground">
            KisaanCenter
          </h1>
        </div>

        {/* 404 Card */}
        <Card className="bg-background/95 backdrop-blur border-border/50">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-4xl font-bold text-muted-foreground mb-2">
              404
            </div>
            <CardTitle>Page Not Found</CardTitle>
            <CardDescription>
              The page you're looking for doesn't exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/" className="w-full">
              <Button className="w-full" variant="default">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Button>
            </Link>
            
            <Button 
              onClick={() => window.history.back()} 
              variant="outline" 
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center mt-8">
          <p className="text-sm text-primary-foreground/60">
            Need help? Contact your system administrator
          </p>
        </div>
      </div>
    </div>
  );
}
