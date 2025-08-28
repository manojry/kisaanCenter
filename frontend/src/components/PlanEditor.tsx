import React, { useState, useEffect } from 'react';
import { Plan } from '../types/entities';
import { createPlan, updatePlan, CreatePlanData, UpdatePlanData } from '../services/planApi';

interface PlanEditorProps {
  plan?: Plan; // If provided, edit mode; if not, create mode
  onSave: (plan: Plan) => void;
  onCancel: () => void;
}

const PlanEditor: React.FC<PlanEditorProps> = ({ plan, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    description: plan?.description || '',
    monthly_price: plan?.monthly_price || 0,
    quarterly_price: plan?.quarterly_price || 0,
    yearly_price: plan?.yearly_price || 0,
    max_farmers: plan?.max_farmers || 10,
    max_buyers: plan?.max_buyers || 20,
    max_transactions: plan?.max_transactions || 1000,
    data_retention_months: plan?.data_retention_months || 6,
    status: plan?.status || 'active',
    features: {
      inventory_management: plan?.features?.inventory_management || false,
      basic_analytics: plan?.features?.basic_analytics || false,
      advanced_analytics: plan?.features?.advanced_analytics || false,
      api_access: plan?.features?.api_access || false,
      custom_integrations: plan?.features?.custom_integrations || false,
      dedicated_support: plan?.features?.dedicated_support || false,
      farmer_management: plan?.features?.farmer_management || false,
      basic_reports: plan?.features?.basic_reports || false,
      advanced_reports: plan?.features?.advanced_reports || false,
    }
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-calculate quarterly and yearly prices based on monthly price
  useEffect(() => {
    if (formData.monthly_price > 0) {
      const quarterly = Math.round(formData.monthly_price * 3 * 0.95 * 100) / 100; // 5% discount
      const yearly = Math.round(formData.monthly_price * 12 * 0.85 * 100) / 100; // 15% discount
      
      setFormData(prev => ({
        ...prev,
        quarterly_price: quarterly,
        yearly_price: yearly
      }));
    }
  }, [formData.monthly_price]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFeatureChange = (feature: string, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: enabled
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }

    if (formData.monthly_price <= 0) {
      newErrors.monthly_price = 'Monthly price must be greater than 0';
    }

    if (formData.max_farmers <= 0) {
      newErrors.max_farmers = 'Max farmers must be greater than 0';
    }

    if (formData.max_buyers <= 0) {
      newErrors.max_buyers = 'Max buyers must be greater than 0';
    }

    if (formData.max_transactions <= 0) {
      newErrors.max_transactions = 'Max transactions must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let savedPlan: Plan;
      
      if (plan) {
        // Update existing plan
        const updateData: UpdatePlanData = { ...formData };
        savedPlan = await updatePlan(plan.id, updateData);
      } else {
        // Create new plan
        const createData: CreatePlanData = { ...formData };
        savedPlan = await createPlan(createData);
      }
      
      onSave(savedPlan);
    } catch (error) {
      console.error('Error saving plan:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save plan' });
    } finally {
      setLoading(false);
    }
  };

  const isEditMode = !!plan;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">
            {isEditMode ? 'Edit Plan' : 'Create New Plan'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter plan name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe this plan..."
            />
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-4">Pricing</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.monthly_price}
                  onChange={(e) => handleInputChange('monthly_price', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.monthly_price ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.monthly_price && <p className="text-red-500 text-sm mt-1">{errors.monthly_price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quarterly Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quarterly_price}
                  onChange={(e) => handleInputChange('quarterly_price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-calculated with 5% discount</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yearly Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.yearly_price}
                  onChange={(e) => handleInputChange('yearly_price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-calculated with 15% discount</p>
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-4">Plan Limits</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Farmers *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_farmers}
                  onChange={(e) => handleInputChange('max_farmers', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.max_farmers ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.max_farmers && <p className="text-red-500 text-sm mt-1">{errors.max_farmers}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Buyers *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_buyers}
                  onChange={(e) => handleInputChange('max_buyers', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.max_buyers ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.max_buyers && <p className="text-red-500 text-sm mt-1">{errors.max_buyers}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Transactions *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_transactions}
                  onChange={(e) => handleInputChange('max_transactions', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.max_transactions ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.max_transactions && <p className="text-red-500 text-sm mt-1">{errors.max_transactions}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Retention (Months)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.data_retention_months}
                  onChange={(e) => handleInputChange('data_retention_months', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-4">Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(formData.features).map(([feature, enabled]) => (
                <label key={feature} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => handleFeatureChange(feature, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {feature.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Plan' : 'Create Plan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanEditor;
