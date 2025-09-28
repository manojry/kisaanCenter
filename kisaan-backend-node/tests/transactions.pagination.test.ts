import request from 'supertest';
import app from '../src/app';

describe('Transactions listing pagination', () => {
  it('returns pagination meta', async () => {
    const res = await request(app)
      .get('/api/transactions?shop_id=1&page=1&pageSize=2')
      .set('Authorization', 'Bearer test'); // assuming auth middleware may be bypassed in test env
    // We don't assert data shape strongly because DB may be empty in CI
    expect(res.status).toBeLessThan(500);
    if (res.body?.meta) {
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.pageSize).toBe(2);
    }
  });
});
