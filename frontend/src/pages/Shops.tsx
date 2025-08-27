import React from 'react'

const Shops: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Shops</h1>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
          Add Shop
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold">Main Shop</h3>
            <p className="text-sm text-gray-600">Status: Active</p>
            <p className="text-sm text-gray-600">ID: 1</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Shops