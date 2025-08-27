import React from 'react'

const Reports: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Sales Report</h3>
          <p className="text-gray-600">Total Sales: $1,000</p>
          <p className="text-gray-600">Transactions: 10</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">User Report</h3>
          <p className="text-gray-600">Total Users: 3</p>
          <p className="text-gray-600">Active: 3</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Product Report</h3>
          <p className="text-gray-600">Total Products: 1</p>
          <p className="text-gray-600">In Stock: 1</p>
        </div>
      </div>
    </div>
  )
}

export default Reports