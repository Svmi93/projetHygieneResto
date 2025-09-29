const request = require('supertest');
const app = require('../src/server'); // Adjust path if needed

describe('Auth API Endpoints', () => {
  let server;
  beforeAll((done) => {
    if (typeof app.listen === 'function') {
      server = app.listen(4000, () => {
        console.log('Test server running on port 4000');
        done();
      });
    } else {
      server = app;
      done();
    }
  });

  afterAll((done) => {
    if (server && typeof server.close === 'function') {
      server.close(done);
    } else {
      done();
    }
  });

  test('POST /api/auth/login - success', async () => {
    const response = await request(server)
      .post('/api/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'TestPassword123!'
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
  });

  test('POST /api/auth/login - fail invalid credentials', async () => {
    const response = await request(server)
      .post('/api/auth/login')
      .send({
        email: 'wrong@example.com',
        password: 'wrongpassword'
      });
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('message');
  });

  test('GET /api/auth/verify-token - success', async () => {
    // First login to get token
    const loginRes = await request(server)
      .post('/api/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'TestPassword123!'
      });
    const token = loginRes.body.token;

    const response = await request(server)
      .get('/api/auth/verify-token')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('user');
  });

  test('GET /api/auth/verify-token - fail no token', async () => {
    const response = await request(server)
      .get('/api/auth/verify-token');
    expect(response.statusCode).toBe(401);
  });
});
