
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Plus, Edit, Eye } from 'lucide-react';
import { productManagementApi } from '../api/productManagementApi';

interface Farmer {
  id: number;
  username: string;
  contact?: string;
  assigned_products: FarmerProduct[];
  total_products: number;
}

interface FarmerProduct {
  farmer_product_id: number;
  product_id: number;
  shop_product_id: number;
  name: string;
  unit: string;
  preferred_price?: number;
  default_price?: number;
  notes?: string;
}

interface FarmersProductsManagerProps {
  shopId: number;
  onAssignProducts: (farmerId: number) => void;
}

export const FarmersProductsManager: React.FC<FarmersProductsManagerProps> = ({
  shopId,
  onAssignProducts
}) => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadFarmersData();
  }, [shopId]);

  const loadFarmersData = async () => {
    setLoading(true);
    try {
      const response = await productManagementApi.getFarmersProductsSummary(shopId);
      setFarmers(response.data.farmers || []);
    } catch (error) {
      console.error('Failed to load farmers data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFarmers = farmers.filter(farmer =>
    farmer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.contact?.includes(searchTerm)
  );

  const handleViewDetails = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setShowDetails(true);
  };

  if (showDetails && selectedFarmer) {
    return (
      <FarmerProductDetails
        farmer={selectedFarmer}
        onBack={() => setShowDetails(false)}
        onEdit={() => {
          setShowDetails(false);
          onAssignProducts(selectedFarmer.id);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Farmer Product Management</h2>
          <p className="text-gray-600">
            Assign and manage products for each farmer
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search farmers by name or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Farmers List */}
      {loading ? (
        <div className="text-center py-8">Loading farmers...</div>
      ) : filteredFarmers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No Farmers Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'No farmers match your search criteria.' : 'No farmers registered yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFarmers.map(farmer => (
            <FarmerCard
              key={farmer.id}
              farmer={farmer}
              onViewDetails={() => handleViewDetails(farmer)}
              onAssignProducts={() => onAssignProducts(farmer.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Farmer Card Component
interface FarmerCardProps {
  farmer: Farmer;
  onViewDetails: () => void;
  onAssignProducts: () => void;
}

const FarmerCard: React.FC<FarmerCardProps> = ({
  farmer,
  onViewDetails,
  onAssignProducts
}) => {
  const getStatusColor = (productCount: number) => {
    if (productCount === 0) return 'bg-red-100 text-red-800';
    if (productCount < 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (productCount: number) => {
    if (productCount === 0) return 'No Products';
    if (productCount < 3) return 'Few Products';
    return 'Well Configured';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{farmer.username}</h3>
            {farmer.contact && (
              <p className="text-sm text-gray-600">{farmer.contact}</p>
            )}
          </div>
          <Badge className={getStatusColor(farmer.total_products)}>
            {getStatusText(farmer.total_products)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Assigned Products:</span>
            <span className="font-medium">{farmer.total_products}</span>
          </div>

          {farmer.total_products > 0 && (
            <div className="text-xs text-gray-500">
              Recent: {farmer.assigned_products.slice(0, 2).map(p => p.name).join(', ')}
              {farmer.total_products > 2 && ` +${farmer.total_products - 2} more`}
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              onClick={onAssignProducts}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-1" />
              {farmer.total_products > 0 ? 'Edit' : 'Assign'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Farmer Product Details Component
interface FarmerProductDetailsProps {
  farmer: Farmer;
  onBack: () => void;
  onEdit: () => void;
}

const FarmerProductDetails: React.FC<FarmerProductDetailsProps> = ({
  farmer,
  onBack,
  onEdit
}) => {
  const productsByCategory = farmer.assigned_products.reduce((acc, product) => {
    // Note: We'd need category info from the API response
    const category = 'General'; // This should come from the API
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as { [key: string]: FarmerProduct[] });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{farmer.username}</h2>
            <p className="text-gray-600">Product assignments and pricing</p>
          </div>
        </div>
        <Button onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Assignments
        </Button>
      </div>

      {/* Farmer Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Farmer Name</Label>
              <p className="text-lg">{farmer.username}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Contact</Label>
              <p className="text-lg">{farmer.contact || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Total Products</Label>
              <p className="text-lg font-semibold">{farmer.total_products}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products by Category */}
      {farmer.total_products === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No Products Assigned</h3>
            <p className="text-gray-600 mb-4">
              This farmer hasn't been assigned any products yet.
            </p>
            <Button onClick={onEdit}>
              <Plus className="h-4 w-4 mr-2" />
              Assign Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(productsByCategory).map(([category, products]) => (
            <Card key={category}>
              <CardHeader>
                <h3 className="font-semibold capitalize">{category}</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {products.map(product => (
                    <div
                      key={product.farmer_product_id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">Unit: {product.unit}</p>
                        {product.notes && (
                          <p className="text-xs text-gray-500 mt-1">{product.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {product.preferred_price ? (
                          <div>
                            <p className="font-semibold text-green-600">
                              ₹{product.preferred_price}/{product.unit}
                            </p>
                            <p className="text-xs text-gray-500">Preferred</p>
                          </div>
                        ) : product.default_price ? (
                          <div>
                            <p className="font-semibold text-blue-600">
                              ₹{product.default_price}/{product.unit}
                            </p>
                            <p className="text-xs text-gray-500">Default</p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">No price set</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
