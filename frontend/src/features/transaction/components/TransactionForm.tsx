import React, { useState, useEffect } from 'react'
import { TransactionFormData } from '@/types/transaction'
import './TransactionForm.css'

interface User {
  id: number
  username: string
  role: string
}

interface Product {
  id: number
  name: string
  price: number
}

interface TransactionFormProps {
  formData: TransactionFormData
  users: User[]
  products: Product[]
  loading: boolean
  onSubmit: (data: TransactionFormData) => void
  onCancel: () => void
  onChange: (data: TransactionFormData) => void
  isEditing: boolean
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  formData,
  users,
  products,
  loading,
  onSubmit,
  onCancel,
  onChange,
  isEditing
}) => {
  const [localFormData, setLocalFormData] = useState<TransactionFormData>(formData)

  useEffect(() => {
    setLocalFormData(formData)
  }, [formData])

  const handleInputChange = (field: keyof TransactionFormData, value: any) => {
    const updatedData = { ...localFormData, [field]: value }
    setLocalFormData(updatedData)
    onChange(updatedData)
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...localFormData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    const updatedData = { ...localFormData, items: updatedItems }
    setLocalFormData(updatedData)
    onChange(updatedData)
  }

  const addItem = () => {
    const newItem = { product_id: 0, quantity: 0, price: 0, farmer_user_id: 0 }
    const updatedData = {
      ...localFormData,
      items: [...localFormData.items, newItem]
    }
    setLocalFormData(updatedData)
    onChange(updatedData)
  }

  const removeItem = (index: number) => {
    const updatedItems = localFormData.items.filter((_, i) => i !== index)
    const updatedData = { ...localFormData, items: updatedItems }
    setLocalFormData(updatedData)
    onChange(updatedData)
  }

  const calculateTotal = () => {
    return localFormData.items.reduce((total, item) => {
      return total + (item.quantity * item.price)
    }, 0)
  }

  const calculateCommission = () => {
    const total = calculateTotal()
    return total * (localFormData.commission_rate / 100)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(localFormData)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl mx-auto">
      <div className="section-header mb-6">
        <h3>{isEditing ? 'Edit Transaction' : 'Create New Transaction'}</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buyer *
            </label>
            <select
              value={localFormData.buyer_user_id}
              onChange={(e) => handleInputChange('buyer_user_id', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Buyer</option>
              {(Array.isArray(users) ? users : []).filter(user => user.role === 'buyer').map(user => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type *
            </label>
            <select
              value={localFormData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="sale">Sale</option>
              <option value="return">Return</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission Rate (%) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={localFormData.commission_rate}
              onChange={(e) => handleInputChange('commission_rate', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={localFormData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="items-section">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Transaction Items</h4>
            <button
              type="button"
              onClick={addItem}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {localFormData.items.map((item, index) => (
              <div key={index} className="item-row bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product *
                    </label>
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price per Unit *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Farmer *
                    </label>
                    <select
                      value={item.farmer_user_id}
                      onChange={(e) => handleItemChange(index, 'farmer_user_id', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Farmer</option>
                      {users.filter(user => user.role === 'farmer').map(user => (
                        <option key={user.id} value={user.id}>{user.username}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="w-full bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-right">
                  <span className="text-sm text-gray-600">
                    Subtotal: {formatCurrency(item.quantity * item.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {localFormData.items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No items added yet. Click "Add Item" to get started.</p>
            </div>
          )}
        </div>

        {/* Summary Section */}
        {localFormData.items.length > 0 && (
          <div className="commission-summary bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h4>
            
            <div className="space-y-2">
              <div className="commission-item">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(calculateTotal())}</span>
              </div>
              
              <div className="commission-item">
                <span>Commission ({localFormData.commission_rate}%):</span>
                <span className="font-semibold">{formatCurrency(calculateCommission())}</span>
              </div>
              
              <div className="commission-total">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total Amount:</span>
                  <span className="text-xl font-bold">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment/Commission Status Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Farmer Paid</label>
            <select
              value={localFormData.farmer_paid_amount > 0 ? 'paid' : 'pending'}
              onChange={e => handleInputChange('farmer_paid_amount', e.target.value === 'paid' ? calculateTotal() : 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Commission Received</label>
            <select
              value={localFormData.commission_confirmed ? 'received' : 'pending'}
              onChange={e => handleInputChange('commission_confirmed', e.target.value === 'received')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="pending">Pending</option>
              <option value="received">Received</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buyer Paid</label>
            <select
              value={localFormData.buyer_paid_amount > 0 ? 'paid' : 'pending'}
              onChange={e => handleInputChange('buyer_paid_amount', e.target.value === 'paid' ? calculateTotal() : 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <button
            type="submit"
            disabled={loading || localFormData.items.length === 0}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isEditing ? 'Update Transaction' : 'Create Transaction'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default TransactionForm
