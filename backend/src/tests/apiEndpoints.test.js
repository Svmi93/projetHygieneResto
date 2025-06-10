const request = require('supertest');
const app = require('../server'); // Assurez-vous que server.js exporte l'app Express

describe('API Endpoints', () => {
  let token;

  beforeAll(async () => {
    // Optionnel : initialiser la base de données ou autres setups
  });

  describe('Auth Endpoints', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'testuser@example.com',
          password: 'Password123!'
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
    });

    it('should login and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'Password123!'
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      token = res.body.token;
    });
  });

  describe('User Profile Endpoints', () => {
    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('email', 'testuser@example.com');
    });

    it('should not get user profile without token', async () => {
      const res = await request(app)
        .get('/api/user/profile');
      expect(res.statusCode).toEqual(401);
    });
  });

  // Ajoutez ici d'autres tests pour equipment, employer, temperature, etc.

  afterAll(async () => {
    // Optionnel : nettoyer la base de données ou autres teardowns
  });
});
