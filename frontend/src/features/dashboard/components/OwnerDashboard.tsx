import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductAssignmentWizard } from '../../product/components/ProductAssignmentWizard';
import { FarmersProductsManager } from '../../product/components/FarmersProductsManager';
import { productManagementApi } from '../../product/api/productManagementApi';
import { AuthUser } from '../../auth/types';

interface OwnerDashboardProps {
  user: AuthUser;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [shopProducts, setShopProducts] = useState<any>({});
  const [farmersCount, setFarmersCount] = useState(0);
  const [showProductSetup, setShowProductSetup] = useState(false);
  const [showFarmerAssignment, setShowFarmerAssignment] = useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = useState<number | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load shop's product catalog
      const catalogResponse = await productManagementApi.getShopCatalog(user.shop_id!);
      setShopProducts(catalogResponse.data);

      // Load farmers summary
      const summaryResponse = await productManagementApi.getFarmersProductsSummary(user.shop_id!);
      setFarmersCount(summaryResponse.data.farmers?.length || 0);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const handleProductSetupComplete = () => {
    setShowProductSetup(false);
    loadDashboardData();
  };

  const handleFarmerAssignmentComplete = () => {
    setShowFarmerAssignment(false);
    setSelectedFarmerId(null);
    loadDashboardData();
  };

  const totalProducts = Object.values(shopProducts.products_by_category || {})
    .reduce((total: number, products: any) => total + products.length, 0);

  if (showProductSetup) {
    return (
      <ProductAssignmentWizard
        shopId={user.shop_id!}
        mode="shop-setup"
        onComplete={handleProductSetupComplete}
        onCancel={() => setShowProductSetup(false)}
      />
    );
  }

  if (showFarmerAssignment && selectedFarmerId) {
    return (
      <ProductAssignmentWizard
        shopId={user.shop_id!}
        farmerId={selectedFarmerId}
        mode="farmer-assignment"
        onComplete={handleFarmerAssignmentComplete}
        onCancel={() => setShowFarmerAssignment(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Owner Dashboard</h1>
          <p className="text-gray-600">Manage your shop and farmers</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="secondary" 
            onClick={() => setShowProductSetup(true)}
          >
            Manage Shop Products
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-3">
            <div className="text-lg font-semibold">{totalProducts}</div>
            <p className="text-xs text-gray-600">Products Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-lg font-semibold">{farmersCount}</div>
            <p className="text-xs text-gray-600">Active Farmers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-lg font-semibold">
              {Object.keys(shopProducts.products_by_category || {}).length}
            </div>
            <p className="text-xs text-gray-600">Product Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-lg font-semibold">₹0</div>
            <p className="text-xs text-gray-600">Today's Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Product Management</TabsTrigger>
          <TabsTrigger value="farmers">Farmer Management</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProductCategoriesOverview 
            productsByCategory={shopProducts.products_by_category || {}}
          />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductManagementTab 
            shopId={user.shop_id!}
            productsByCategory={shopProducts.products_by_category || {}}
            onSetupProducts={() => setShowProductSetup(true)}
          />
        </TabsContent>

        <TabsContent value="farmers" className="space-y-6">
          <FarmersProductsManager
            shopId={user.shop_id!}
            onAssignProducts={(farmerId) => {
              setSelectedFarmerId(farmerId);
              setShowFarmerAssignment(true);
            }}
          />
        </TabsContent>

        <TabsContent value="transactions">
          <div className="text-center py-12">
            <p className="text-gray-500">Transaction management coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Product Categories Overview Component
interface ProductCategoriesOverviewProps {
  productsByCategory: { [category: string]: any[] };
}

const ProductCategoriesOverview: React.FC<ProductCategoriesOverviewProps> = ({
  productsByCategory
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.entries(productsByCategory).map(([category, products]) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold capitalize">{category}</h3>
              <Badge variant="secondary">{products.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {products.slice(0, 3).map((product, index) => (
                <div key={index} className="text-sm text-gray-600">
                  • {product.name}
                </div>
              ))}
              {products.length > 3 && (
                <div className="text-sm text-gray-400">
                  +{products.length - 3} more...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Product Management Tab Component
interface ProductManagementTabProps {
  shopId: number;
  productsByCategory: { [category: string]: any[] };
  onSetupProducts: () => void;
}

const ProductManagementTab: React.FC<ProductManagementTabProps> = ({
  shopId,
  productsByCategory,
  onSetupProducts
}) => {
  const totalProducts = Object.values(productsByCategory)
    .reduce((total, products) => total + products.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Product Management</h2>
          <p className="text-gray-600">
            Manage which products your shop sells ({totalProducts} products configured)
          </p>
        </div>
        <Button onClick={onSetupProducts}>
          Update Product Selection
        </Button>
      </div>

      {totalProducts === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No Products Configured</h3>
            <p className="text-gray-600 mb-4">
              Set up your shop's product catalog to start managing inventory and transactions.
            </p>
            <Button onClick={onSetupProducts}>
              Setup Products Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(productsByCategory).map(([category, products]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <h3 className="font-semibold capitalize">{category}</h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {products.map((product, index) => (
                    <li key={index} className="text-sm text-gray-600 flex justify-between">
                      <span>{product.name}</span>
                      <span className="text-gray-400">₹{product.price}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
