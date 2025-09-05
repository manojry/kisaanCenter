// Generic API response type
interface APIResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';

interface Owner {
  id: string;
  username: string;
  contact?: string;
}

interface ShopCreatorProps {
  owners: Owner[];
  onShopCreated?: () => void;
}

const ShopCreator: React.FC<ShopCreatorProps> = ({ owners, onShopCreated }) => {
  const [ownerList, setOwnerList] = useState<Owner[]>(owners);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [ownerShopInfo, setOwnerShopInfo] = useState<any | null>(null);
  const [shopName, setShopName] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  const [commissionRate, setCommissionRate] = useState<number>(5);
  const [planId, setPlanId] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!owners.length) {
      // Fetch owners if not provided
      apiClient.get<APIResponse<Owner[]>>('/users?role=owner')
        .then(res => setOwnerList(res.data?.data || []))
        .catch(() => setError('Failed to load owners'));
    }
    // Robust fetch for plans
    const fetchPlans = async () => {
      try {
        const response = await apiClient.get('/subscriptions/plans');
        let plans: any[] = [];
        const resData = response.data;
         console.log(resData);
        // Accept direct array or wrapped response
        if (Array.isArray(resData)) {
          plans = resData;
        } else if (resData && typeof resData === 'object') {
          if ('success' in resData && resData.success) {
            const dataAny = (resData as any).data;
            if (Array.isArray(dataAny)) {
              plans = dataAny;
            } else if (dataAny?.items && Array.isArray(dataAny.items)) {
              plans = dataAny.items;
            } else if (Array.isArray(dataAny?.data)) {
              plans = dataAny.data;
            }
          } else if ('items' in resData && Array.isArray((resData as any).items)) {
            plans = (resData as any).items;
          } else if ('data' in resData && Array.isArray((resData as any).data)) {
            plans = (resData as any).data;
          }
        }
        console.log(plans);
        setPlans(plans);
      } catch (error) {
        setPlans([]);
      }
    };
    fetchPlans();
  }, []);

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        name: shopName,
        location: shopLocation,
        commission_rate: commissionRate,
        owner_user_id: ownerList.find(o => o.id === selectedOwnerId)?.id || selectedOwnerId,
        plan_id: planId ? parseInt(planId) : undefined,
      };
  const res = await apiClient.post<APIResponse<any>>('/shops', payload);
      if (res.data?.success) {
        setSuccess('Shop created successfully!');
        // Clear form fields
        setShopName('');
        setShopLocation('');
        setCommissionRate(5);
        setPlanId('');
        setSelectedOwnerId('');
        // Trigger shop list refresh if callback provided
        if (onShopCreated) {
          onShopCreated(res.data.data);
        }
        // Fetch shop info for owner
        if (res.data?.data?.id) {
          try {
            const shopRes = await apiClient.get(`/shops/${res.data.data.id}`);
            setOwnerShopInfo(shopRes.data?.data || null);
          } catch (shopErr) {
            setOwnerShopInfo(null);
          }
        }
      } else {
        setError(res.data?.message || 'Failed to create shop');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error creating shop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-6">Create Shop for Owner</h3>
      <form onSubmit={handleCreateShop} className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Shop Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Owner</label>
              <select
                value={selectedOwnerId}
                onChange={e => setSelectedOwnerId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Owner --</option>
                {ownerList.map(owner => (
                  <option key={owner.id} value={owner.id}>{owner.username} ({owner.contact})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Plan</label>
              <select
                value={planId}
                onChange={e => setPlanId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Plan --</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name} - ₹{plan.monthly_price}/month</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
              <input
                type="text"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={shopLocation}
                onChange={e => setShopLocation(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
              <input
                type="number"
                value={commissionRate}
                min={0}
                max={100}
                step={0.1}
                onChange={e => setCommissionRate(Number(e.target.value))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold"
        >
          {loading ? 'Creating...' : 'Create Shop'}
        </button>
        {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}
        {success && <div className="text-green-600 mt-2 text-sm">{success}</div>}
        {ownerShopInfo && (
          <div className="mt-6 p-4 border rounded bg-gray-50">
            <h4 className="font-bold mb-2">Owner's Shop Info</h4>
            <div><strong>Name:</strong> {ownerShopInfo.name}</div>
            <div><strong>Location:</strong> {ownerShopInfo.location}</div>
            <div><strong>Commission Rate:</strong> {ownerShopInfo.commission_rate}</div>
            <div><strong>Status:</strong> {ownerShopInfo.status}</div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ShopCreator;
