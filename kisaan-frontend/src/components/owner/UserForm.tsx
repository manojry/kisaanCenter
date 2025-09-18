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


export const UserForm: React.FC<UserFormProps> = ({ onSuccess, onCancel, editUser }) => {
  // Validation state
  const [contactError, setContactError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserCreate>({
    role: editUser?.role || 'farmer',
    shop_id: currentUser?.shop_id || 0,
    contact: editUser?.contact || '',
    cumulative_value: editUser?.cumulative_value || 0,
    firstname: editUser?.firstname || '',
    password: editUser?.password || 'kisaan@123',
    status: editUser?.status || 'active',
    email: editUser?.email || 'contact@kisaancenter.com'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    // Validate contact (if provided)
    if (formData.contact && formData.contact.length > 0 && formData.contact.length < 10) {
      setContactError('Contact number must be at least 10 digits');
      return;
    } else {
      setContactError(null);
    }
    e.preventDefault();

    if (!editUser && !formData.firstname) {
      setFormError('Please enter first name');
      return;
    }

    setIsLoading(true);
    setFormError(null);
    try {
      let response;
      if (editUser) {
        // Update existing user
        const updateData: UserCreate = {
          ...formData,
          role: formData.role,
          status: editUser.status,
          password: formData.password,
          email: formData.email
        };
        response = await usersApi.update(editUser.id, updateData);
      } else {
        // Create new user, backend will generate username
        // For owner and farmer, set default email and password
        let createData: UserCreate = {
          ...formData,
          status: 'active',
          password: (formData.role === 'owner' || formData.role === 'farmer') ? 'kisaan@123' : formData.password,
          email: (formData.role === 'owner' || formData.role === 'farmer') ? 'contact@kisaancenter.com' : formData.email
        };
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

          {/* Contact only */}
          <div className="space-y-2">
            <Label htmlFor="contact">Contact Number *</Label>
            <div className="text-xs text-gray-500">Required. Enter a valid 10-digit phone number.</div>
            <Input
              id="contact"
              value={formData.contact}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFormData(prev => ({ ...prev, contact: e.target.value }));
                if (!e.target.value || e.target.value.length < 10) {
                  setContactError('Contact number is required and must be at least 10 digits');
                } else {
                  setContactError(null);
                }
              }}
              placeholder="Enter 10-digit contact number"
              required
            />
            {contactError && <div className="text-xs text-red-600 mt-1">{contactError}</div>}
          </div>

          {/* Password removed for owner/farmer creation (default used) */}

          {/* Status and Initial Balance removed for owner/farmer creation (default used) */}

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