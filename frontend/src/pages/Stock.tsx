import React, { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'
import toast from 'react-hot-toast'

interface Stock {
  id: number
  product_name: string
  quantity: number
  unit: string
  farmer_id: number
  shop_id: number
}

const Stock: React.FC = () => {
  const [stock, setStock] = useState<Stock[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingStock, setEditingStock] = useState<Stock | null>(null)
  const [formData, setFormData] = useState({ product_name: '', quantity: 0, unit: 'kg', farmer_id: 2, shop_id: 1 })

  useEffect(() => {
    fetchStock()
  }, [])

  const fetchStock = async () => {
    try {
      const response = await apiClient.get('/stock')
      setStock(response.data as Stock[])
    } catch (error) {
      toast.error('Failed to fetch stock')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingStock) {
        await apiClient.put(`/stock/${editingStock.id}`, formData)
        toast.success('Stock updated successfully')
      } else {
        await apiClient.post('/stock', formData)
        toast.success('Stock added successfully')
      }
      setShowForm(false)
      setEditingStock(null)
      setFormData({ product_name: '', quantity: 0, unit: 'kg', farmer_id: 2, shop_id: 1 })
      fetchStock()
    } catch (error) {
      toast.error('Operation failed')
    }
  }

  const handleEdit = (stockItem: Stock) => {
    setEditingStock(stockItem)
    setFormData({ 
      product_name: stockItem.product_name, 
      quantity: stockItem.quantity, 
      unit: stockItem.unit,
      farmer_id: stockItem.farmer_id,
      shop_id: stockItem.shop_id
    })
    setShowForm(true)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 w-full sm:w-auto"
        >
          Add Stock
        </button>
      </div>
      
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{editingStock ? 'Edit Stock' : 'Add Stock'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="kg">Kilograms</option>
                  <option value="tons">Tons</option>
                  <option value="bags">Bags</option>
                  <option value="pieces">Pieces</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                {editingStock ? 'Update' : 'Add Stock'}
              </button>
              <button 
                type="button" 
                onClick={() => {setShowForm(false); setEditingStock(null)}}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stock.map((stockItem) => (
                <tr key={stockItem.id}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">{stockItem.product_name}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">{stockItem.quantity}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">{stockItem.unit}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => handleEdit(stockItem)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Stock