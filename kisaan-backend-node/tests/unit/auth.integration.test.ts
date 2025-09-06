import request from 'supertest';
import app from '../../src/index';

describe('POST /api/auth/login', () => {
  it('should return 200 and a token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'testpass' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('username', 'testuser');
  });

  it('should return 401 for invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'wronguser', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });
});
