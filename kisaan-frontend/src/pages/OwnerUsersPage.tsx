import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getRoleBadgeClass } from '@/utils/getRoleBadgeClass';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Edit, Trash2, RefreshCw } from 'lucide-react';
import { usersApi } from '../services/api';
import type { User } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { UserForm } from '../components/owner/UserForm';
import { useUsers } from '../context/UsersContext';

const OwnerUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { users, isLoading, refreshUsers } = useUsers();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });

  // Filtered users based on filters
  const filteredUsers = users.filter(u => {
    if (filters.role && u.role !== filters.role) return false;
    if (filters.status && u.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!u.username.toLowerCase().includes(searchLower) &&
          !(u.contact && u.contact.includes(filters.search)) &&
          !(u.email && u.email.toLowerCase().includes(searchLower))) {
        return false;
      }
    }
    return true;
  });

  const handleUserCreated = (user: User) => {
    refreshUsers();
    setShowCreateForm(false);
  };

  const handleUserUpdated = (user: User) => {
    refreshUsers();
    setEditingUser(null);
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await usersApi.delete(userId);
        refreshUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const getRoleColor = (role: string) => {
  // Deprecated: use RoleBadge component instead
  return '';
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

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

  return (
  <div className="p-2 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage farmers, buyers and other users</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={refreshUsers}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex-1 sm:flex-initial"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)} className="flex-1 sm:flex-initial">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 text-sm"
              />
            </div>
            <Select 
              value={filters.role || "all"} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, role: value === "all" ? "" : value }))}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="farmer">Farmer</SelectItem>
                <SelectItem value="buyer">Buyer</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={filters.status || "all"} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === "all" ? "" : value }))}
            >
              <SelectTrigger className="text-sm">
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
          <CardTitle className="flex items-center justify-between text-base sm:text-lg">
            <span>Users ({filteredUsers.length})</span>
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-500 text-base sm:text-lg">No users found</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-2">
                {filters.search || filters.role || filters.status
                  ? 'Try adjusting your filters'
                  : 'Add your first user to get started'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <Table className="w-full text-xs sm:text-sm whitespace-normal break-words">
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID / Status</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            #{user.id}
                            <span className={user.status === 'active' ? 'inline-block w-2.5 h-2.5 rounded-full bg-green-500' : 'inline-block w-2.5 h-2.5 rounded-full bg-red-500'} title={user.status}></span>
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleBadgeClass(user.role)}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(user.balance)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingUser(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {user.id !== currentUser?.id && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile Card/List Layout */}
              <div className="block sm:hidden space-y-3">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="rounded-lg border p-3 bg-white shadow-sm w-[90vw] max-w-[90vw] overflow-x-auto mx-auto">
                    <div className="flex justify-between items-center mb-1 gap-2">
                      <span className="font-semibold text-base break-words max-w-[60%]">{user.username}</span>
                      <Badge variant="outline" className={getRoleBadgeClass(user.role)}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mb-1 break-words">ID: #{user.id} <span className={user.status === 'active' ? 'inline-block w-2.5 h-2.5 rounded-full bg-green-500 ml-1' : 'inline-block w-2.5 h-2.5 rounded-full bg-red-500 ml-1'} title={user.status}></span></div>
                    <div className="flex flex-wrap gap-2 text-xs mb-1">
                      <div className="break-words max-w-[48%]"><span className="font-medium">Balance:</span> {formatCurrency(user.balance)}</div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {user.id !== currentUser?.id && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerUsersPage;
