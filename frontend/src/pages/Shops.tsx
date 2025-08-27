import React, { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'
import toast from 'react-hot-toast'

interface Shop {
  id: number
  name: string
  status: string
}

const Shops: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([])

  useEffect(() => {
    fetchShops()
  }, [])

  const fetchShops = async () => {
    try {
      const response = await apiClient.get('/shops')
      setShops(response.data)
    } catch (error) {
      toast.error('Failed to fetch shops')
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">My Shop</h1>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {shops.map((shop) => (
          <div key={shop.id} className="bg-white border rounded-lg p-6 shadow">
            <h3 className="font-semibold text-xl">{shop.name}</h3>
            <p className="text-sm text-gray-600 mt-2">Status: <span className={`capitalize font-medium ${shop.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{shop.status}</span></p>
            <p className="text-sm text-gray-600">Shop ID: {shop.id}</p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> As an owner, you have one shop assigned to you. Contact support if you need to modify shop details.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Shops