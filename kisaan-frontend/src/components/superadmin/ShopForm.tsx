import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Loader2, Building2 } from 'lucide-react';
import { usersApi, shopsApi } from '../../services/api';
import type { User, Shop } from '../../types/api';

interface ShopFormProps {
  onSuccess?: (shop: Shop) => void;
  onCancel?: () => void;
}

export const ShopForm: React.FC<ShopFormProps> = ({ onSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [owners, setOwners] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    owner_id: 0,
    address: '',
    contact: '',
    status: 'active' as const
  });

  useEffect(() => {
    loadOwners();
  }, []);

  const loadOwners = async () => {
    try {
      // Load owners without shops
      const response = await fetch('/api/shops/available-owners', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOwners(data.data || []);
      }
    } catch (error) {
      console.error('Error loading owners:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.owner_id) {
      alert('Please fill all required fields');
      return;
    }
    
    if (owners.length === 0) {
      alert('No available owners. Create an owner first.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await shopsApi.create(formData);
      if (response.success && response.data) {
        onSuccess?.(response.data);
      }
    } catch (error: any) {
      console.error('Error creating shop:', error);
      alert(error.message || 'Failed to create shop');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Create New Shop
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Shop Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter shop name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner">Owner *</Label>
            <Select 
              value={formData.owner_id ? formData.owner_id.toString() : ""} 
              onValueChange={(value: string) => setFormData(prev => ({ ...prev, owner_id: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {owners.length === 0 ? (
                  <div className="px-3 py-2 text-gray-500 text-sm">No available owners (all owners already have shops)</div>
                ) : (
                  owners.map(owner => (
                    <SelectItem key={owner.id} value={owner.id.toString()}>
                      {owner.username} {owner.email && `(${owner.email})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter shop address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact Number</Label>
            <Input
              id="contact"
              value={formData.contact}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
              placeholder="Enter contact number"
              pattern="[0-9]{10,15}"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Shop
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