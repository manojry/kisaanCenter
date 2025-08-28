import React, { useState } from 'react';
import { assignPlanToShop, upgradePlan, downgradePlan, PlanAssignmentRequest } from '../api';
import { Plan } from '../../../types/entities';
import { getPlanPrice, formatPlanFeatures } from '../../../services/planApi';

interface PlanManagerProps {
  shopId: number;
  shopName: string;
  currentPlanId?: number;
  plans: Plan[];
  onPlanAssigned: () => void;
}

const PlanManager: React.FC<PlanManagerProps> = ({
  shopId,
  shopName,
  currentPlanId,
  plans,
  onPlanAssigned
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<number>(currentPlanId || 0);
  const [billingCycle, setBillingCycle] = useState<string>('monthly');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAssignPlan = async () => {
    if (!selectedPlanId) {
      setError('Please select a plan');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const request: PlanAssignmentRequest = {
        plan_id: selectedPlanId,
        billing_cycle: billingCycle,
        reason: reason || 'Plan assignment by superadmin',
        superadmin_id: 1 // TODO: Get from auth context
      };

      await assignPlanToShop(shopId, request);
      setSuccess(`Plan successfully assigned to ${shopName}`);
      onPlanAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign plan');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlanId || selectedPlanId <= (currentPlanId || 0)) {
      setError('Please select a higher plan for upgrade');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await upgradePlan(shopId, selectedPlanId, reason || 'Plan upgrade');
      setSuccess(`Plan successfully upgraded for ${shopName}`);
      onPlanAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upgrade plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!selectedPlanId || selectedPlanId >= (currentPlanId || 0)) {
      setError('Please select a lower plan for downgrade');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await downgradePlan(shopId, selectedPlanId, reason || 'Plan downgrade');
      setSuccess(`Plan successfully downgraded for ${shopName}`);
      onPlanAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to downgrade plan');
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = plans.find(p => p.id === currentPlanId);
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Manage Plan for {shopName}</h3>
      
      {/* Current Plan Display */}
      {currentPlan && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-blue-900">{currentPlan.name}</h4>
              <p className="text-blue-700 text-sm mt-1">{currentPlan.description}</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              Current
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-blue-600">Monthly: </span>
              <span className="font-semibold">₹{currentPlan.monthly_price}</span>
            </div>
            <div>
              <span className="text-blue-600">Max Farmers: </span>
              <span className="font-semibold">{currentPlan.max_farmers}</span>
            </div>
            <div>
              <span className="text-blue-600">Max Buyers: </span>
              <span className="font-semibold">{currentPlan.max_buyers}</span>
            </div>
            <div>
              <span className="text-blue-600">Transactions: </span>
              <span className="font-semibold">{currentPlan.max_transactions.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Plan Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Plan
          </label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>-- Select a Plan --</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - ₹{plan.monthly_price}/month (Farmers: {plan.max_farmers}, Buyers: {plan.max_buyers})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Plan Preview */}
        {selectedPlan && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">{selectedPlan.name}</h4>
            <p className="text-gray-600 text-sm mb-3">{selectedPlan.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Monthly:</span>
                  <span className="font-semibold">₹{selectedPlan.monthly_price}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quarterly:</span>
                  <span className="font-semibold">₹{selectedPlan.quarterly_price || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Yearly:</span>
                  <span className="font-semibold">₹{selectedPlan.yearly_price || 'N/A'}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Max Farmers:</span>
                  <span className="font-semibold">{selectedPlan.max_farmers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Buyers:</span>
                  <span className="font-semibold">{selectedPlan.max_buyers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transactions:</span>
                  <span className="font-semibold">{selectedPlan.max_transactions.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Data Retention:</span>
                  <span className="font-semibold">{selectedPlan.data_retention_months} months</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-semibold ${selectedPlan.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                    {selectedPlan.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Features */}
            {selectedPlan.features && Object.keys(selectedPlan.features).length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-900 mb-2">Features</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {Object.entries(selectedPlan.features).map(([feature, enabled]) => (
                    <div key={feature} className={`flex items-center space-x-2 ${enabled ? 'text-green-700' : 'text-gray-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className="capitalize">
                        {feature.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Billing Cycle
          </label>
          <div className="space-y-2">
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            
            {/* Show selected price */}
            {selectedPlan && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-green-700 font-medium">Selected Price:</span>
                  <span className="text-green-800 font-bold text-lg">
                    ₹{getPlanPrice(selectedPlan, billingCycle as 'monthly' | 'quarterly' | 'yearly').toLocaleString()}
                  </span>
                </div>
                <p className="text-green-600 text-xs mt-1">
                  {billingCycle === 'yearly' && 'Save up to 15% with yearly billing'}
                  {billingCycle === 'quarterly' && 'Save up to 5% with quarterly billing'}
                  {billingCycle === 'monthly' && 'Pay monthly with no commitment'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Reason for plan change..."
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={handleAssignPlan}
          disabled={loading || !selectedPlanId}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Assigning...' : 'Assign Plan'}
        </button>

        {currentPlanId && selectedPlanId > currentPlanId && (
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Upgrading...' : 'Upgrade'}
          </button>
        )}

        {currentPlanId && selectedPlanId < currentPlanId && selectedPlanId > 0 && (
          <button
            onClick={handleDowngrade}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Downgrading...' : 'Downgrade'}
          </button>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
          {success}
        </div>
      )}

      {/* Plan Comparison */}
      {selectedPlan && selectedPlan.id !== currentPlanId && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Selected Plan Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Name:</span> {selectedPlan.name}
            </div>
            <div>
              <span className="font-medium">Price:</span> ${selectedPlan.monthly_price}/month
            </div>
            <div>
              <span className="font-medium">Max Farmers:</span> {selectedPlan.max_farmers}
            </div>
            <div>
              <span className="font-medium">Max Buyers:</span> {selectedPlan.max_buyers}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanManager;
