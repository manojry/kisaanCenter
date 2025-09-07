import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Plus, AlertCircle, Users } from 'lucide-react';
import AddUserDialog from './AddUserDialog';

interface User {
  id: number;
  username: string;
  role: string;
  contact?: string;
  email?: string;
  status: string;
  created_at: string;
}

interface UsersManagementProps {
  shopId?: number;
  onRefresh?: () => void;
}

export default function UsersManagement({ shopId, onRefresh }: UsersManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [shopId]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/users');
      const allUsers = response?.users || [];
      
      // Filter users for this shop (farmers and buyers)
      const shopUsers = allUsers.filter((user: User) => 
        user.role === 'farmer' || user.role === 'buyer'
      );
      
      setUsers(shopUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAdded = () => {
    fetchUsers();
    if (onRefresh) onRefresh();
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      farmer: "default",
      buyer: "secondary"
    };
    
    return (
      <Badge variant={variants[role] || "outline"}>
        {role.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'active' ? "default" : "destructive"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading users...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users Management
              </CardTitle>
              <CardDescription>
                Manage farmers and buyers in your shop ({users.length} users)
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddUser(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found. Add farmers and buyers to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{user.contact || '-'}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddUserDialog 
        open={showAddUser} 
        onOpenChange={setShowAddUser}
        onSuccess={handleUserAdded}
      />
    </>
  );
}