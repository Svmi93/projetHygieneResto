const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/authRoutes');
const { initializeDatabasePool } = require('../config/db');

process.env.HOST = 'localhost'; // Override DB host for local testing

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

beforeAll(async () => {
  jest.setTimeout(30000); // Increase timeout to 30 seconds for DB connection retries
  await initializeDatabasePool();
});

afterAll(async () => {
  const pool = require('../config/db').getConnection();
  const testUserEmailPattern = /^testuser\d+@example\.com$/;
  try {
    const connection = await pool;
    // Delete test users created during tests
    await connection.execute('DELETE FROM users WHERE email REGEXP ?', [testUserEmailPattern.source]);
    connection.release();
  } catch (error) {
    console.error('Error cleaning up test users:', error);
  }
});

describe('Auth API Endpoints', () => {
  const testUserEmail = 'barfoo@gmail.com';
  const testUserPassword = 'Hichem.123hichem';
  let token = '';

  test('POST /api/auth/register - success', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .field('nom_entreprise', 'Corp')
      .field('nom_client', 'bar')
      .field('prenom_client', 'foo')
      .field('email', testUserEmail)
      .field('password', testUserPassword)
      .field('role', 'admin_client')
      .field('siret', '34567898765678')
      .attach('logo', Buffer.from('fake image content'), 'logo.png');

    // Accept 200 or 201 for idempotent registration
    expect([200, 201]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body).toHaveProperty('message', 'Utilisateur enregistré avec succès.');
    } else {
      expect(res.body).toHaveProperty('message', 'Utilisateur déjà enregistré.');
    }
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', testUserEmail);
  });

  test('POST /api/auth/login - success', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: testUserPassword,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('role');
    token = res.body.token;
  });

  test('POST /api/auth/login - failure wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: 'WrongPassword',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Email ou mot de passe incorrect.');
  });

  test('GET /api/auth/verify-token - success', async () => {
    const res = await request(app)
      .get('/api/auth/verify-token')
      .set('x-auth-token', token);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', testUserEmail);
  });

  test('GET /api/auth/verify-token - failure no token', async () => {
    const res = await request(app)
      .get('/api/auth/verify-token');

    expect(res.statusCode).toBe(401);
  });
});
