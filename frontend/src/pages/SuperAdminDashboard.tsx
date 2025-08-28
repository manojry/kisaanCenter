import React, { useState, useEffect } from 'react';
import { Plan, Shop, User } from '../types/entities';
import { fetchAllPlans } from '../services/planApi';
import AuditLogViewer from '../features/audit/components/AuditLogViewer';
import PlanManager from '../features/shop/components/PlanManager';
import PlanEditor from '../components/PlanEditor';
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
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load shops, plans, and owners
      const [shopsRes, usersRes] = await Promise.all([
        fetch('/api/v1/shops'),
        fetch('/api/v1/users?role=owner')
      ]);

      const [shopsData, usersData] = await Promise.all([
        shopsRes.json(),
        usersRes.json()
      ]);

      // Load plans using the dedicated API function
      const plansData = await fetchAllPlans();

      if (shopsData.success && Array.isArray(shopsData.data)) setShops(shopsData.data);
      if (usersData.success && Array.isArray(usersData.data)) setOwners(usersData.data);
      setPlans(plansData);
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

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setShowPlanEditor(true);
  };

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setShowPlanEditor(true);
  };

  const handlePlanSaved = (plan: Plan) => {
    if (editingPlan) {
      // Update existing plan
      setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
    } else {
      // Add new plan
      setPlans(prev => [...prev, plan]);
    }
    setShowPlanEditor(false);
    setEditingPlan(null);
  };

  const handlePlanEditorCancel = () => {
    setShowPlanEditor(false);
    setEditingPlan(null);
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
                        {Array.isArray(shops) ? shops.filter(s => s.status === 'active').length : 0}
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
                              {Array.isArray(shops) ? shops.find(s => s.owner_user_id === owner.id)?.name || 'No shop assigned' : 'No shop assigned'}
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
                    {Array.isArray(shops) && shops.map((shop) => (
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
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Available Plans</h3>
                  <button
                    onClick={handleCreatePlan}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <span>➕</span>
                    <span>Create Plan</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div key={plan.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-xl text-gray-900">{plan.name}</h4>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {plan.status}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{plan.description}</p>
                      
                      {/* Pricing Section */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Pricing</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Monthly:</span>
                            <span className="font-semibold">₹{plan.monthly_price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Quarterly:</span>
                            <span className="font-semibold">₹{plan.quarterly_price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Yearly:</span>
                            <span className="font-semibold">₹{plan.yearly_price}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Limits Section */}
                      <div className="space-y-3 mb-4">
                        <h5 className="font-medium text-gray-900">Limits</h5>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-blue-600 font-semibold">{plan.max_farmers}</div>
                            <div className="text-blue-700 text-xs">Max Farmers</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-green-600 font-semibold">{plan.max_buyers}</div>
                            <div className="text-green-700 text-xs">Max Buyers</div>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <div className="text-purple-600 font-semibold">{plan.max_transactions.toLocaleString()}</div>
                            <div className="text-purple-700 text-xs">Max Transactions</div>
                          </div>
                          <div className="bg-orange-50 p-3 rounded-lg">
                            <div className="text-orange-600 font-semibold">{plan.data_retention_months}</div>
                            <div className="text-orange-700 text-xs">Data Retention (months)</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Features Section */}
                      {plan.features && (
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-900">Features</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(plan.features).map(([feature, enabled]) => (
                              <div key={feature} className={`flex items-center space-x-2 ${enabled ? 'text-green-700' : 'text-gray-400'}`}>
                                <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                <span className="capitalize text-xs">
                                  {feature.replace(/_/g, ' ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Plan Metadata */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500 space-y-1 mb-3">
                          <div>Created: {new Date(plan.created_at).toLocaleDateString()}</div>
                          <div>Updated: {new Date(plan.updated_at).toLocaleDateString()}</div>
                          <div>Plan ID: {plan.id}</div>
                        </div>
                        
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="w-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          ✏️ Edit Plan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {plans.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">📋</div>
                    <p>No plans available</p>
                  </div>
                )}
              </div>
            )}

            {/* Audit Logs */}
            {activeTab === 'audit' && <AuditLogViewer />}
          </>
        )}

        {/* Plan Editor Modal */}
        {showPlanEditor && (
          <PlanEditor
            plan={editingPlan || undefined}
            onSave={handlePlanSaved}
            onCancel={handlePlanEditorCancel}
          />
        )}

      </div>
    </div>
  );
};

export default SuperAdminDashboard;
