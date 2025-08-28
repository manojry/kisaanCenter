import { AuditLog, AuditFilter, AuditSummary } from './types';
import { apiClient } from '../../services/api';

export async function fetchAuditLogs(filter?: AuditFilter): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }
  const url = params.toString() ? `/audit-logs?${params.toString()}` : '/audit-logs';
  const response = await apiClient.get<AuditLog[]>(url);
  if (!response.data) throw new Error('No audit log data returned');
  return response.data;
}

export async function fetchAuditLogById(logId: string): Promise<AuditLog> {
  const response = await apiClient.get<AuditLog>(`/audit-logs/${logId}`);
  if (!response.data) throw new Error('No audit log found');
  return response.data;
}

export async function fetchAuditLogsByUser(userId: string, limit = 50): Promise<AuditLog[]> {
  const response = await apiClient.get<AuditLog[]>(`/audit-logs/user/${userId}?limit=${limit}`);
  if (!response.data) throw new Error('No audit log data returned');
  return response.data;
}

export async function fetchAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
  const response = await apiClient.get<AuditLog[]>(`/audit-logs/entity/${entityType}/${entityId}`);
  if (!response.data) throw new Error('No audit log data returned');
  return response.data;
}

export async function getAuditSummary(dateFrom?: string, dateTo?: string): Promise<AuditSummary> {
  const params = new URLSearchParams();
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);
  const url = params.toString() ? `/audit-logs/summary?${params.toString()}` : '/audit-logs/summary';
  const response = await apiClient.get<AuditSummary>(url);
  if (!response.data) throw new Error('Failed to get audit summary');
  return response.data;
}
