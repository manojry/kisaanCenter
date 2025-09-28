/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { api, createTestPlan } from '../utils/testApp';

describe('Plan Endpoints (Phase1)', () => {
  it('creates a plan', async () => {
    const res = await createTestPlan();
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data || res.body.plan).toBeDefined();
  });

  it('lists plans and includes count meta', async () => {
    await createTestPlan({ name: 'ListCheckPlan' });
    const res = await api().get('/api/plans');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Backward compatibility: count maybe meta.count or body.count
    const count = res.body.meta?.count ?? res.body.count;
    expect(typeof count).toBe('number');
  });

  it('returns 400 for invalid id', async () => {
    const res = await api().get('/api/plans/abc');
    expect(res.status).toBe(400);
  });

  it('returns 404 for updating missing plan', async () => {
    const res = await api().put('/api/plans/999999').send({ name: 'Nope' });
    expect(res.status).toBe(404);
  });

  it('returns 404 for deleting missing plan', async () => {
    const res = await api().delete('/api/plans/999999');
    expect(res.status).toBe(404);
  });
});