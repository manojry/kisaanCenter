import React, { useState, useEffect } from 'react';
import { Plan, Shop, User } from '../types/entities';
import AuditLogViewer from '../features/audit/components/AuditLogViewer';
import PlanManager from '../features/shop/components/PlanManager';
import OwnerCreator from '../features/user/components/OwnerCreator';

interface SuperAdminDashboardProps {
  user: User;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [shops, setShops] = useState<Shop[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [owners, setOwners] = useState<User[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load shops, plans, and owners
      const [shopsRes, plansRes, usersRes] = await Promise.all([
        fetch('/api/v1/shops'),
        fetch('/api/v1/plans'),
        fetch('/api/v1/users?role=owner')
      ]);

      const [shopsData, plansData, usersData] = await Promise.all([
        shopsRes.json(),
        plansRes.json(),
        usersRes.json()
      ]);

      if (shopsData.success) setShops(shopsData.data);
      if (plansData.success) setPlans(plansData.data);
      if (usersData.success) setOwners(usersData.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerCreated = (owner: User) => {
    setOwners(prev => [...prev, owner]);
  };

  const handlePlanAssigned = () => {
    loadData(); // Refresh data after plan assignment
  };

  const tabs = [
    { id: 'overview', name: 'System Overview', icon: '📊' },
    { id: 'owners', name: 'Owner Management', icon: '👥' },
    { id: 'shops', name: 'Shop Management', icon: '🏪' },
    { id: 'plans', name: 'Plan Management', icon: '📋' },
    { id: 'audit', name: 'Audit Logs', icon: '📝' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.username}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                Super Admin
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* System Overview */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">🏪</div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{shops.length}</p>
                      <p className="text-gray-600">Total Shops</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">👥</div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{owners.length}</p>
                      <p className="text-gray-600">Total Owners</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">📋</div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
                      <p className="text-gray-600">Available Plans</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">✅</div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {shops.filter(s => s.status === 'active').length}
                      </p>
                      <p className="text-gray-600">Active Shops</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Owner Management */}
            {activeTab === 'owners' && (
              <div className="space-y-6">
                <OwnerCreator onOwnerCreated={handleOwnerCreated} />
                
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Existing Owners</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {owners.map((owner) => (
                          <tr key={owner.id}>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">{owner.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900">{owner.contact || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                              {shops.find(s => s.owner_user_id === owner.id)?.name || 'No shop assigned'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                owner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {owner.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                              {new Date(owner.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Shop Management */}
            {activeTab === 'shops' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Shop Directory</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shops.map((shop) => (
                      <div key={shop.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">{shop.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{shop.address}</p>
                        <div className="mt-2 flex justify-between items-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            shop.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {shop.status}
                          </span>
                          <button
                            onClick={() => setSelectedShop(shop)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Manage Plan
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedShop && (
                  <PlanManager
                    shopId={selectedShop.id}
                    shopName={selectedShop.name}
                    plans={plans}
                    onPlanAssigned={handlePlanAssigned}
                  />
                )}
              </div>
            )}

            {/* Plan Management */}
            {activeTab === 'plans' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div key={plan.id} className="border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-lg">{plan.name}</h4>
                      <p className="text-gray-600 mt-2">{plan.description}</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span>Monthly:</span>
                          <span className="font-semibold">${plan.monthly_price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max Farmers:</span>
                          <span>{plan.max_farmers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max Buyers:</span>
                          <span>{plan.max_buyers}</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {plan.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Logs */}
            {activeTab === 'audit' && <AuditLogViewer />}
          </>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
