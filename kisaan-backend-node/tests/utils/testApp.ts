import request from 'supertest';
import app from '../../src/app';

// Wrapper to expose supertest without starting separate server
export const api = () => request(app);

// Helper to create a plan quickly
export async function createTestPlan(overrides: Partial<any> = {}) {
  const base = {
    name: `Plan_${Date.now()}`,
    price: 0,
    billing_cycle: 'monthly',
    features: ['featureA'],
    status: 'active'
  };
  return api().post('/api/plans').send({ ...base, ...overrides });
}
