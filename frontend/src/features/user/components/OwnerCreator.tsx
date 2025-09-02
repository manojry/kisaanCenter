import React, { useState } from 'react';
import { User, Plan } from '../../../types/entities';
import { UserRole } from '../../../types/enums';
import { apiClient } from '../../../services/api';

interface OwnerCreatorProps {
  onOwnerCreated: (owner: User) => void;
}

const OwnerCreator: React.FC<OwnerCreatorProps> = ({ onOwnerCreated }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'owner' as UserRole,
    contact: '',
    credit_limit: 0,
    shop_name: '',
    shop_location: '',
    plan_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);

  // Load available plans when component mounts
  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await apiClient.get<{items: Plan[]}>('/plans');
        if (response.success && response.data?.items) {
          setAvailablePlans(response.data.items);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      }
    };

    fetchPlans();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'credit_limit' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Call API to create owner using apiClient
      const response = await apiClient.post<User>('/users', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
        contact: formData.contact,
        credit_limit: formData.credit_limit
      });
      
      if (response.success) {
        const newUser = response.data;

        // Step 2: Create the shop with the plan if shop details provided
        if (formData.shop_name && formData.shop_location && formData.plan_id) {
          try {
            const shopResponse = await apiClient.post('/shops', {
              name: formData.shop_name,
              location: formData.shop_location,
              owner_user_id: newUser.id,
              plan_id: parseInt(formData.plan_id),
            });
            
            if (!shopResponse.success) {
              console.error('Shop creation failed:', shopResponse.message);
              setError(`Owner created but shop creation failed: ${shopResponse.message}`);
            } else {
              setSuccess(`Owner "${formData.username}" and shop "${formData.shop_name}" created successfully`);
            }
          } catch (shopError) {
            console.error('Shop creation failed:', shopError);
            setError(`Owner created but shop creation failed: ${shopError instanceof Error ? shopError.message : 'Unknown error'}`);
          }
        } else {
          setSuccess(`Owner "${formData.username}" created successfully`);
        }

        onOwnerCreated(newUser);
        
        // Reset form
        setFormData({
          username: '',
          email: '',
          password: '',
          full_name: '',
          role: 'owner' as UserRole,
          contact: '',
          credit_limit: 0,
          shop_name: '',
          shop_location: '',
          plan_id: ''
        });
      } else {
        throw new Error(response.message || 'Failed to create owner');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create owner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-6">Create New Owner</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Owner Details Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Owner Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password (min 6 chars)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter contact number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Credit Limit
              </label>
              <input
                type="number"
                name="credit_limit"
                value={formData.credit_limit}
                onChange={handleInputChange}
                min={0}
                step={0.01}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Shop Details Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Shop Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Name *
              </label>
              <input
                type="text"
                name="shop_name"
                value={formData.shop_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter shop name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Location *
              </label>
              <input
                type="text"
                name="shop_location"
                value={formData.shop_location}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter shop address/location"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subscription Plan *
              </label>
              <select
                name="plan_id"
                value={formData.plan_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a subscription plan</option>
                {availablePlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.monthly_price}/month
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || !formData.username || !formData.password || !formData.full_name || !formData.email || !formData.shop_name || !formData.shop_location || !formData.plan_id}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Owner & Shop...' : 'Create Owner & Shop'}
          </button>
        </div>
      </form>

      {/* Status Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Owner & Shop Creation Notes</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Creates both owner account and associated shop in one step</li>
          <li>• Owner will be assigned to the created shop automatically</li>
          <li>• All fields marked with * are required</li>
          <li>• Username must be unique across the entire system</li>
          <li>• Password must be at least 6 characters long</li>
          <li>• Email must be valid and unique</li>
          <li>• Shop will be linked to the selected subscription plan</li>
        </ul>
      </div>
    </div>
  );
};

export default OwnerCreator;
