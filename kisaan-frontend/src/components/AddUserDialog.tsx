import React, { useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle } from 'lucide-react';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: '',
    contact: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userData = {
        ...formData,
        shop_id: user?.shop_id,
        created_by: user?.id,
        status: 'active'
      };

      await apiClient.post('/users', userData);
      
      // Reset form
      setFormData({
        username: '',
        password: '',
        role: '',
        contact: '',
        email: ''
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new farmer or buyer account for your shop.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="farmer">Farmer</SelectItem>
                <SelectItem value="buyer">Buyer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact</Label>
            <Input
              id="contact"
              value={formData.contact}
              onChange={(e) => handleInputChange('contact', e.target.value)}
              placeholder="Phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Email address"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}