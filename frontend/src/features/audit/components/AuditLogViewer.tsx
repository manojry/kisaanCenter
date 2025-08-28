import React, { useState, useEffect } from 'react';
import { fetchAuditLogs } from '../api';
import { AuditLog, AuditFilter } from '../types';

interface AuditLogViewerProps {
  shopId?: number;
  userId?: number;
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ shopId, userId }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AuditFilter>({
    page: 1,
    limit: 50
  });

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const auditFilter: AuditFilter = {
        ...filter,
        shop_id: shopId,
        user_id: userId?.toString()
      };

      const result = await fetchAuditLogs(auditFilter);
      setLogs(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AuditFilter, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">System Audit Logs</h3>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entity Type
          </label>
          <select
            value={filter.entity_type || ''}
            onChange={(e) => handleFilterChange('entity_type', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="users">Users</option>
            <option value="shops">Shops</option>
            <option value="products">Products</option>
            <option value="transactions">Transactions</option>
            <option value="subscriptions">Subscriptions</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Action
          </label>
          <select
            value={filter.action || ''}
            onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Actions</option>
            <option value="INSERT">Insert</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Records per page
          </label>
          <select
            value={filter.limit || 50}
            onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading audit logs...</p>
        </div>
      )}

      {/* Logs Table */}
      {!loading && logs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Changes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{log.entity_type}</div>
                      <div className="text-gray-500">ID: {log.entity_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.user_id || 'System'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.shop_id || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    {log.new_data && (
                      <details className="cursor-pointer">
                        <summary className="font-medium text-blue-600 hover:text-blue-800">
                          View Changes
                        </summary>
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <pre className="whitespace-pre-wrap overflow-hidden">
                            {JSON.stringify(log.new_data, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && logs.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-xl mb-2">📋</div>
          <p className="text-gray-600">No audit logs found</p>
        </div>
      )}

      {/* Pagination */}
      {logs.length > 0 && (
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-700">
            Showing {logs.length} records
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('page', (filter.page || 1) - 1)}
              disabled={loading || (filter.page || 1) <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm bg-gray-100 rounded-md">
              Page {filter.page || 1}
            </span>
            <button
              onClick={() => handleFilterChange('page', (filter.page || 1) + 1)}
              disabled={loading || logs.length < (filter.limit || 50)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;
