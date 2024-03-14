const request = require('supertest');
const app = require('../app'); 
const User = require('../models/user'); 



describe('Authentication System', () => {
  test('It should register a new user', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'Password123'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('message', 'User created successfully');
  });

  test('It should log in a registered user', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'Password123'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});

