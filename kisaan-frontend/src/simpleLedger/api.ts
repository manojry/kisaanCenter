// API utility for simple ledger
const API_BASE = 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export async function fetchLedgerEntries(shopId: number, farmerId?: number) {
  const params = new URLSearchParams();
  params.append('shop_id', String(shopId));
  if (farmerId) params.append('farmer_id', String(farmerId));
  const res = await fetch(`${API_BASE}/simple-ledger?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch ledger entries');
  return res.json();
}

export async function createLedgerEntry(data: {
  shop_id: number;
  farmer_id: number;
  type: string;
  category: string;
  amount: number;
  notes?: string;
}) {
  const res = await fetch(`${API_BASE}/simple-ledger`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to create entry' }));
    throw new Error(error.message || 'Failed to create entry');
  }
  return res.json();
}

export async function fetchLedgerSummary(shopId: number) {
  const params = new URLSearchParams();
  params.append('shop_id', String(shopId));
  const res = await fetch(`${API_BASE}/simple-ledger/summary?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
}
