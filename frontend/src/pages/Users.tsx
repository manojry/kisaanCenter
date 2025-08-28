import React, { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'
import toast from 'react-hot-toast'

interface User {
  id: number
  username: string
  role: string
  shop_id: number
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({ username: '', role: 'farmer', shop_id: 1 })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/users')
      setUsers(response.data as User[])
    } catch (error) {
      toast.error('Failed to fetch users')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await apiClient.put(`/users/${editingUser.id}`, formData)
        toast.success('User updated successfully')
      } else {
        await apiClient.post('/users', formData)
        toast.success('User created successfully')
      }
      setShowForm(false)
      setEditingUser(null)
      setFormData({ username: '', role: 'farmer', shop_id: 1 })
      fetchUsers()
    } catch (error) {
      toast.error('Operation failed')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({ username: user.username, role: user.role, shop_id: user.shop_id })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure?')) {
      try {
        await apiClient.delete(`/users/${id}`)
        toast.success('User deleted successfully')
        fetchUsers()
      } catch (error) {
        toast.error('Delete failed')
      }
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 w-full sm:w-auto"
        >
          Add User
        </button>
      </div>
      
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{editingUser ? 'Edit User' : 'Add User'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="farmer">Farmer</option>
                <option value="buyer">Buyer</option>
                <option value="employee">Employee</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                {editingUser ? 'Update' : 'Create'}
              </button>
              <button 
                type="button" 
                onClick={() => {setShowForm(false); setEditingUser(null)}}
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
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">{user.username}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm capitalize">{user.role}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
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

export default Users