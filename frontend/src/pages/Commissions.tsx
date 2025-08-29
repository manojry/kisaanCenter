import React from 'react';

const Commissions: React.FC = () => {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Commission Rules</h1>
        
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Commission Management</h2>
            <p className="mt-1 text-sm text-gray-600">
              Set and manage commission rates for different product categories and user types.
            </p>
          </div>
          
          <div className="p-6">
            <div className="text-center py-12">
              <p className="text-gray-500">Commission management interface coming soon...</p>
              <p className="text-sm text-gray-400 mt-2">
                Here you'll be able to set commission rates for farmers, buyers, and different product categories.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Commissions;