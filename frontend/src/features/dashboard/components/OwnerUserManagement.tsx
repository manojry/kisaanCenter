import React, { useState, useEffect } from 'react';
import './Dashboard.css';

interface User {
  id: number;
  username: string;
  role: 'farmer' | 'buyer' | 'employee';
  contact?: string;
  credit_limit: number;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

interface UserAnalytics {
  total_users: number;
  farmers: number;
  buyers: number;
  employees: number;
  active_users: number;
  inactive_users: number;
}

interface CreateUserRequest {
  username: string;
  password: string;
  role: 'farmer' | 'buyer' | 'employee';
  contact?: string;
  credit_limit?: number;
}

interface UpdateUserRequest {
  username?: string;
  contact?: string;
  credit_limit?: number;
  status?: 'active' | 'inactive' | 'suspended';
}

const OwnerUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and pagination states
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    username: '',
    password: '',
    role: 'farmer',
    contact: '',
    credit_limit: 0
  });
  
  const [editForm, setEditForm] = useState<UpdateUserRequest>({});

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('auth_token');
  };

  useEffect(() => {
    fetchUsers();
    fetchAnalytics();
  }, [currentPage, filterRole, filterStatus, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString()
      });
      
      if (filterRole !== 'all') params.append('role', filterRole);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`${API_BASE}/api/v1/owner/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE}/api/v1/owner/users/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE}/api/v1/owner/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create user');
      }
      
      setShowCreateModal(false);
      setCreateForm({
        username: '',
        password: '',
        role: 'farmer',
        contact: '',
        credit_limit: 0
      });
      fetchUsers();
      fetchAnalytics();
    } catch (error) {
      console.error('Failed to create user:', error);
      setError(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE}/api/v1/owner/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update user');
      }
      
      setShowEditModal(false);
      setSelectedUser(null);
      setEditForm({});
      fetchUsers();
      fetchAnalytics();
    } catch (error) {
      console.error('Failed to update user:', error);
      setError(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: number, newStatus: string) => {
    try {
      setLoading(true);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE}/api/v1/owner/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update user status');
      }
      
      fetchUsers();
      fetchAnalytics();
    } catch (error) {
      console.error('Failed to update status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      contact: user.contact,
      credit_limit: user.credit_limit,
      status: user.status
    });
    setShowEditModal(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'farmer': return '👨‍🌾';
      case 'buyer': return '🛒';
      case 'employee': return '👥';
      default: return '👤';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'status-badge status-active',
      inactive: 'status-badge status-inactive',
      suspended: 'status-badge status-suspended'
    };
    
    return (
      <span className={statusClasses[status as keyof typeof statusClasses] || 'status-badge'}>
        {status}
      </span>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>User Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <span>➕</span>
          Add New User
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      {/* Analytics Cards */}
      {analytics && (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon" style={{ backgroundColor: '#3b82f6' }}>
              👥
            </div>
            <div className="card-content">
              <h3 className="card-title">Total Users</h3>
              <p className="card-number">{analytics.total_users}</p>
              <span className="card-subtitle">All Roles</span>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon" style={{ backgroundColor: '#10b981' }}>
              👨‍🌾
            </div>
            <div className="card-content">
              <h3 className="card-title">Farmers</h3>
              <p className="card-number">{analytics.farmers}</p>
              <span className="card-subtitle">Registered</span>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon" style={{ backgroundColor: '#8b5cf6' }}>
              🛒
            </div>
            <div className="card-content">
              <h3 className="card-title">Buyers</h3>
              <p className="card-number">{analytics.buyers}</p>
              <span className="card-subtitle">Active</span>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon" style={{ backgroundColor: '#f59e0b' }}>
              👷
            </div>
            <div className="card-content">
              <h3 className="card-title">Employees</h3>
              <p className="card-number">{analytics.employees}</p>
              <span className="card-subtitle">Working</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Role:</label>
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="farmer">Farmers</option>
            <option value="buyer">Buyers</option>
            <option value="employee">Employees</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        {loading && users.length === 0 ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Credit Limit</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <span className="user-icon">{getRoleIcon(user.role)}</span>
                      <div>
                        <div className="user-name">{user.username}</div>
                        <div className="user-id">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.contact || 'N/A'}</td>
                  <td>${user.credit_limit.toLocaleString()}</td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => openEditModal(user)}
                      >
                        ✏️
                      </button>
                      <select
                        value={user.status}
                        onChange={(e) => handleStatusChange(user.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {users.length === 0 && !loading && (
          <div className="empty-state">
            <h3>No users found</h3>
            <p>Try adjusting your filters or create a new user.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New User</h2>
              <button
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  required
                  value={createForm.username}
                  onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Role:</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({...createForm, role: e.target.value as any})}
                >
                  <option value="farmer">Farmer</option>
                  <option value="buyer">Buyer</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              <div className="form-group">
                <label>Contact:</label>
                <input
                  type="text"
                  value={createForm.contact}
                  onChange={(e) => setCreateForm({...createForm, contact: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Credit Limit:</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.credit_limit}
                  onChange={(e) => setCreateForm({...createForm, credit_limit: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit User: {selectedUser.username}</h2>
              <button
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  value={editForm.username || ''}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Contact:</label>
                <input
                  type="text"
                  value={editForm.contact || ''}
                  onChange={(e) => setEditForm({...editForm, contact: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Credit Limit:</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.credit_limit || 0}
                  onChange={(e) => setEditForm({...editForm, credit_limit: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="form-group">
                <label>Status:</label>
                <select
                  value={editForm.status || ''}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerUserManagement;