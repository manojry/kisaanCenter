import React, { useState, useEffect } from 'react';
import VirtualizedTable from '../../../components/VirtualizedTable';
import Button from '@/components/ui/Button';

// Fallback Card and Tabs components
const Card = ({ children }: { children: React.ReactNode }) => <div className="bg-white rounded-lg shadow p-4 mb-2">{children}</div>;
const CardHeader = ({ children }: { children: React.ReactNode }) => <div className="mb-2 font-semibold">{children}</div>;
const CardContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

const Tabs = ({ value, onValueChange, children }: any) => <div>{children}</div>;
const TabsContent = ({ value, children, ...props }: any) => <div {...props}>{children}</div>;
const TabsList = ({ children }: any) => <div className="flex space-x-2 mb-4">{children}</div>;
const TabsTrigger = ({ value, children, ...props }: any) => <button className="px-3 py-1 rounded bg-gray-100" {...props}>{children}</button>;
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
  const [transactions, setTransactions] = useState<any[]>([]);
  // Import VirtualizedTable
  // @ts-ignore
  const VirtualizedTable = require('../../../components/VirtualizedTable').default;
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // Only fetch transactions if owner tab is active
    if (activeTab === 'transactions') {
      fetchOwnerTransactions();
    }
  }, [activeTab]);

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

  const fetchOwnerTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const { transactions: txs } = await (await import('@/services/transactionService')).transactionService.getTransactionsByUser(user.id, { page: 1, limit: 100 });
      setTransactions(txs || []);
    } catch (error) {
      console.error('Failed to fetch owner transactions:', error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
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
          <CardContent>
            <div className="text-lg font-semibold">{totalProducts}</div>
            <p className="text-xs text-gray-600">Products Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-lg font-semibold">{farmersCount}</div>
            <p className="text-xs text-gray-600">Active Farmers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-lg font-semibold">
              {Object.keys(shopProducts.products_by_category || {}).length}
            </div>
            <p className="text-xs text-gray-600">Product Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
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
          <div className="py-6">
            {loadingTransactions ? (
              <div className="text-center py-8 text-gray-500">Loading transactions...</div>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">Your Transactions</h3>
                <div className="bg-white rounded-lg shadow-md">
                  <VirtualizedTable
                    data={transactions}
                    columns={[
                      { key: 'id', label: 'ID' },
                      { key: 'date', label: 'Date', render: (value: any) => new Date(value).toLocaleDateString() },
                      { key: 'type', label: 'Type' },
                      { key: 'status', label: 'Status', render: (value: any) => (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${value === 'completed' ? 'bg-green-100 text-green-800' : value === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{value}</span>
                      ) },
                      { key: 'total_amount', label: 'Total', render: (value: any) => `₹${value}` },
                      { key: 'commission_amount', label: 'Commission', render: (value: any) => `₹${value}` },
                      { key: 'payment_status', label: 'Payment', render: (value: any) => (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${value === 'paid' ? 'bg-green-100 text-green-800' : value === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{value}</span>
                      ) },
                    ]}
                    height={400}
                    rowHeight={48}
                  />
                </div>
                {transactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No transactions found.</div>
                )}
              </>
            )}
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
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="font-semibold capitalize">{category}</h3>
              <span className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">{products.length}</span>
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
          <CardContent>
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
              <CardHeader>
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
