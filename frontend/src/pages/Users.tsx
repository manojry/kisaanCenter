import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useUsers, useCreateUser, useDeleteUser } from '@/features/user/hooks/useUsers'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { User, Plus, Search, Edit, Trash2, UserCheck } from 'lucide-react'
import { UserRole } from '@/types/enums'
import { User as UserType } from '@/types/entities'

const UserCard: React.FC<{ 
  user: UserType
  onEdit: (user: UserType) => void
  onDelete: (id: number) => void
}> = ({ user, onEdit, onDelete }) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case UserRole.SUPERADMIN:
        return 'bg-purple-100 text-purple-800'
      case UserRole.OWNER:
        return 'bg-blue-100 text-blue-800'
      case UserRole.EMPLOYEE:
        return 'bg-gray-100 text-gray-800'
      case UserRole.FARMER:
        return 'bg-green-100 text-green-800'
      case UserRole.BUYER:
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{user.username}</h3>
            <p className="text-sm text-gray-500">{user.contact}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                {user.role.toUpperCase()}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.status}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(user)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(user.id)}
            className="text-danger-600 hover:text-danger-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {user.credit_limit && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Credit Limit: <span className="font-medium">₹{user.credit_limit.toLocaleString()}</span>
          </p>
        </div>
      )}
    </div>
  )
}

const CreateUserModal: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const { user: currentUser } = useAuth()
  const createUser = useCreateUser()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: UserRole.FARMER,
    contact: '',
    credit_limit: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createUser.mutateAsync({
        ...formData,
        shop_id: currentUser?.shop_id,
        credit_limit: formData.credit_limit || undefined
      })
      onClose()
      setFormData({
        username: '',
        password: '',
        role: UserRole.FARMER,
        contact: '',
        credit_limit: 0
      })
    } catch (error) {
      // Error handled by hook
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New User</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            required
          />
          
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={UserRole.FARMER}>Farmer</option>
              <option value={UserRole.BUYER}>Buyer</option>
              <option value={UserRole.EMPLOYEE}>Employee</option>
            </select>
          </div>
          
          <Input
            label="Contact"
            value={formData.contact}
            onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
          />
          
          {(formData.role === UserRole.FARMER || formData.role === UserRole.BUYER) && (
            <Input
              label="Credit Limit"
              type="number"
              value={formData.credit_limit}
              onChange={(e) => setFormData(prev => ({ ...prev, credit_limit: Number(e.target.value) }))}
            />
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createUser.isLoading}>
              Create User
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Users: React.FC = () => {
  const { user: currentUser, hasPermission } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  const { data: usersResponse, isLoading } = useUsers({
    shop_id: currentUser?.shop_id,
    search: search || undefined,
    role: selectedRole || undefined,
    page: 1,
    limit: 20
  })
  
  const deleteUser = useDeleteUser()

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await deleteUser.mutateAsync(id)
    }
  }

  const handleEdit = (user: UserType) => {
    // TODO: Implement edit modal
    console.log('Edit user:', user)
  }

  if (!hasPermission('read', 'user')) {
    return (
      <div className="text-center py-12">
        <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">You don't have permission to view users.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage users in your shop</p>
        </div>
        
        {hasPermission('create', 'user') && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="w-full sm:w-48">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Roles</option>
              <option value={UserRole.FARMER}>Farmer</option>
              <option value={UserRole.BUYER}>Buyer</option>
              <option value={UserRole.EMPLOYEE}>Employee</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usersResponse?.data?.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {usersResponse?.data?.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
        </div>
      )}

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}

export default Users