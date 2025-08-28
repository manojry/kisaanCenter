import React, { useState } from 'react';
import { User } from '../../../types/entities';
import { UserRole } from '../../../types/enums';

interface OwnerCreatorProps {
  onOwnerCreated: (owner: User) => void;
}

const OwnerCreator: React.FC<OwnerCreatorProps> = ({ onOwnerCreated }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'owner' as UserRole,
    contact: '',
    credit_limit: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      // Call API to create owner
      const response = await fetch('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create owner');
      }

      const result = await response.json();
      
      if (result.success) {
        setSuccess(`Owner "${formData.username}" created successfully`);
        onOwnerCreated(result.data);
        
        // Reset form
        setFormData({
          username: '',
          password: '',
          role: 'owner' as UserRole,
          contact: '',
          credit_limit: 0
        });
      } else {
        throw new Error(result.message || 'Failed to create owner');
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

      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="Enter password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact
          </label>
          <input
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter contact information"
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

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || !formData.username || !formData.password}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Owner...' : 'Create Owner'}
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
        <h4 className="font-medium text-blue-800 mb-2">Owner Creation Notes</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Owners can manage their shops and create farmers/buyers/employees</li>
          <li>• Username must be unique across the entire system</li>
          <li>• Password must be at least 6 characters long</li>
          <li>• After creation, owner can be assigned to a shop by creating a shop</li>
        </ul>
      </div>
    </div>
  );
};

export default OwnerCreator;
