import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, UserPlus } from 'lucide-react';
import { usersApi } from '../../services/api';
import type { UserCreate, User } from '../../types/api';
import { useAuth } from '../../context/AuthContext';

interface UserFormProps {
  onSuccess?: (user: User) => void;
  onCancel?: () => void;
  editUser?: User | null;
}

interface UserCreate {
  role: string;
  shop_id: number;
  contact: string;
  email: string;
  password: string;
  status: string;
  balance: number;
  cumulative_value: number;
  firstname?: string;
}

export const UserForm: React.FC<UserFormProps> = ({ onSuccess, onCancel, editUser }) => {
  // Validation state
  const [contactError, setContactError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserCreate>({
    role: editUser?.role || 'farmer',
    shop_id: currentUser?.shop_id || 0,
    contact: editUser?.contact || '',
    email: editUser?.email || '',
    password: '',
    status: editUser?.status || 'active',
    balance: editUser?.balance || 0,
    cumulative_value: editUser?.cumulative_value || 0,
    firstname: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    // Validate contact (if provided)
    if (formData.contact && formData.contact.length > 0 && formData.contact.length < 10) {
      setContactError('Contact number must be at least 10 digits');
      return;
    } else {
      setContactError(null);
    }
    // Validate email (if provided)
    if (formData.email && formData.email.length > 0) {
      const emailPattern = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]+)@[A-Za-z0-9][A-Za-z0-9\-]*\.[A-Za-z]{2,}$/;
      if (!emailPattern.test(formData.email)) {
        setEmailError('Invalid email address');
        return;
      } else {
        setEmailError(null);
      }
    } else {
      setEmailError(null);
    }
    e.preventDefault();
    
    if (!editUser && !formData.firstname) {
      setFormError('Please enter first name');
      return;
    }
    
    if (!editUser && !formData.password) {
      setFormError('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    setFormError(null);
    try {
      let response;
      if (editUser) {
        // Update existing user
  const updateData = { ...formData, role: formData.role as import('../../types/api').UserCreate['role'], status: formData.status as import('../../types/api').UserCreate['status'] };
        (updateData as any).password = undefined;
        (updateData as any).firstname = undefined;
        response = await usersApi.update(editUser.id, updateData);
      } else {
        // Create new user, backend will generate username
  const createData = { ...formData, role: formData.role as import('../../types/api').UserCreate['role'], status: formData.status as import('../../types/api').UserCreate['status'] };
        response = await usersApi.create(createData);
      }
      if (response.success && response.data) {
        onSuccess?.(response.data);
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      setFormError(error.message || 'Failed to save user. Please check your input.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          {editUser ? 'Edit User' : 'Create New User'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">


          {/* First Name (for auto-generating username) */}
          {!editUser && (
            <div className="space-y-2">
              <Label htmlFor="firstname">First Name *</Label>
              <Input
                id="firstname"
                value={formData.firstname}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const firstname = e.target.value;
                  setFormData(prev => ({ 
                    ...prev, 
                    firstname
                  }));
                }}
                placeholder="Enter first name"
                required
              />
              <div className="text-xs text-gray-500">Enter the user's first name. Username will be auto-generated.</div>
            </div>
          )}

          {formError && (
            <div className="text-red-600 text-sm font-medium mb-2">{formError}</div>
          )}
          {/* Role Selection - Based on current user role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
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
          </div>

          {/* Contact and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number</Label>
              <div className="text-xs text-gray-500">Optional. Enter a valid phone number if available.</div>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData(prev => ({ ...prev, contact: e.target.value }));
                  if (e.target.value.length > 0 && e.target.value.length < 10) {
                    setContactError('Contact number must be at least 10 digits');
                  } else {
                    setContactError(null);
                  }
                }}
                placeholder="Enter contact number"
              />
              {contactError && <div className="text-xs text-red-600 mt-1">{contactError}</div>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="text-xs text-gray-500">Optional. Enter a valid email address if available.</div>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  if (e.target.value.length > 0) {
                    const emailPattern = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]+)@[A-Za-z0-9][A-Za-z0-9\-]*\.[A-Za-z]{2,}$/;
                    if (!emailPattern.test(e.target.value)) {
                      setEmailError('Invalid email address');
                    } else {
                      setEmailError(null);
                    }
                  } else {
                    setEmailError(null);
                  }
                }}
                placeholder="Enter email address"
              />
              {emailError && <div className="text-xs text-red-600 mt-1">{emailError}</div>}
            </div>
          </div>

          {/* Password (only for new users) */}
          {!editUser && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="text-xs text-gray-500">Password must be at least 6 characters.</div>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                minLength={6}
                required
              />
            </div>
          )}

          {/* Status and Balance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">Initial Balance (₹)</Label>
              <div className="text-xs text-gray-500">Optional. Set an initial balance for the user (default is 0).</div>
              <Input
                id="balance"
                type="number"
                min="0"
                step="0.01"
                value={formData.balance}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editUser ? 'Update User' : 'Create User'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};