import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Edit, Trash2, RefreshCw, Key, Phone, Mail, Building, Wallet } from 'lucide-react';
import { usersApi } from '../services/api';
import type { User } from '../types/api';
import { UserForm } from '../components/owner/UserForm';
import { useAuth } from '../context/AuthContext';
import { useIsMobile, useIsSmallMobile } from '../hooks/useMediaQuery';

const SuperadminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState<User | null>(null);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });

  // Responsive hooks
  const isMobile = useIsMobile();
  const isSmallMobile = useIsSmallMobile();

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 100 };
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;
      
      const response = await usersApi.getAll(params);
      if (response.data) {
        let filteredUsers = response.data;
        
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredUsers = filteredUsers.filter(u => 
            u.username.toLowerCase().includes(searchLower) ||
            (u.contact && u.contact.includes(filters.search)) ||
            (u.email && u.email.toLowerCase().includes(searchLower))
          );
        }
        
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserCreated = (user: User) => {
    setUsers(prev => [user, ...prev]);
    setShowCreateForm(false);
  };

  const handleUserUpdated = (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    setEditingUser(null);
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await usersApi.delete(userId);
        setUsers(prev => prev.filter(u => u.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handlePasswordReset = async (userId: number, newPassword: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/admin-reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ newPassword })
      });
      
      if (response.ok) {
        alert('Password reset successfully');
        setShowPasswordReset(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password');
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getRoleColor = (role: string) => {
    const colors = {
      superadmin: 'bg-red-100 text-red-800',
      owner: 'bg-orange-100 text-orange-800',
      farmer: 'bg-blue-100 text-blue-800',
      buyer: 'bg-purple-100 text-purple-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '₹0';
    return `₹${amount.toLocaleString()}`;
  };

  if (showCreateForm) {
    return (
      <div className="p-6">
        <UserForm 
          onSuccess={handleUserCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  if (editingUser) {
    return (
      <div className="p-6">
        <UserForm 
          editUser={editingUser}
          onSuccess={handleUserUpdated}
          onCancel={() => setEditingUser(null)}
        />
      </div>
    );
  }

  if (showPasswordReset) {
    return (
      <div className="p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Reset Password for {showPasswordReset.username}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const newPassword = formData.get('newPassword') as string;
              if (newPassword && newPassword.length >= 6) {
                handlePasswordReset(showPasswordReset.id, newPassword);
              } else {
                alert('Password must be at least 6 characters');
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                    New Password
                  </label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    minLength={6}
                    required
                    placeholder="Enter new password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Reset Password
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowPasswordReset(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-4 sm:space-y-6`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            Users Management
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage all platform users</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={fetchUsers}
            variant="outline"
            size={isMobile ? "sm" : "default"}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {!isSmallMobile && "Refresh"}
          </Button>
          <Button 
            onClick={() => setShowCreateForm(true)}
            size={isMobile ? "sm" : "default"}
            className="flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isSmallMobile ? "Add" : "Add User"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder={isSmallMobile ? "Search..." : "Search users..."}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            <Select 
              value={filters.role || "all"} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, role: value === "all" ? "" : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {currentUser?.role === 'superadmin' && (
                  <>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </>
                )}
                {currentUser?.role === 'owner' && (
                  <>
                    <SelectItem value="farmer">Farmer</SelectItem>
                    <SelectItem value="buyer">Buyer</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <Select 
              value={filters.status || "all"} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === "all" ? "" : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Users ({users.length})</span>
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No users found</p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout - Hidden on md and larger screens */}
              <div className="block md:hidden space-y-3">
                {users.map((user) => (
                  <Card key={user.id} className="overflow-hidden border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      {/* Header with user info and status */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{user.firstname && user.firstname.trim() ? user.firstname : user.username}</h3>
                          <p className="text-sm text-gray-500">ID #{user.id}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-3">
                          <Badge className={`${getRoleColor(user.role)} text-xs`}>
                            {user.role}
                          </Badge>
                          <Badge className={`${getStatusColor(user.status)} text-xs`}>
                            {user.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Contact info with icons */}
                      <div className="space-y-2 mb-4">
                        {user.contact && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="font-medium">{user.contact}</span>
                          </div>
                        )}
                        {user.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="font-medium truncate">{user.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Wallet className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium">{formatCurrency(user.balance)}</span>
                        </div>
                        {user.shop_id && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="font-medium">Shop #{user.shop_id}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons - larger for mobile */}
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 text-xs"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                          {!isSmallMobile && <span className="ml-1">View</span>}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingUser(user)}
                          className="flex-1 text-xs"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                          {!isSmallMobile && <span className="ml-1">Edit</span>}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowPasswordReset(user)}
                          className="flex-1 text-xs text-blue-600 hover:text-blue-700"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                          {!isSmallMobile && <span className="ml-1">Reset</span>}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteUser(user.id)}
                          className="flex-1 text-xs text-red-600 hover:text-red-700"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                          {!isSmallMobile && <span className="ml-1">Delete</span>}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table Layout - Hidden on smaller screens */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Shop ID</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>#{user.id}</TableCell>
                        <TableCell className="font-medium">{user.firstname && user.firstname.trim() ? user.firstname : user.username}</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.contact || '-'}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>{user.shop_id ? `#${user.shop_id}` : '-'}</TableCell>
                        <TableCell>{formatCurrency(user.balance)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingUser(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setShowPasswordReset(user)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperadminUsers;