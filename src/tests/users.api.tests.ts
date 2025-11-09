import request from 'supertest';
import { mockUsers } from '../helpers/user.helper';
import { server } from '../server';

const userData = {
  username: 'Alice',
  age: 25,
  hobbies: ['reading'],
};

describe('Users API', () => {
  beforeEach(() => {
    mockUsers.length = 0;
  });

  test('GET /api/users → empty array', async () => {
    const res = await request(server).get('/api/users');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('POST /api/users → create new user', async () => {
    const newUser = {
      username: 'John',
      age: 30,
      hobbies: ['music', 'coding'],
    };

    const res = await request(server).post('/api/users').send(newUser);

    expect(res.status).toBe(201);
    expect(res.body.username).toBe(newUser.username);
    expect(res.body.age).toBe(newUser.age);
    expect(res.body.hobbies).toEqual(newUser.hobbies);
    expect(res.body.id).toBeDefined();
  });


  test('CREATE user', async () => {
    const res = await request(server).post('/api/users').send(userData);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  test('GET user by id', async () => {
    const createRes = await request(server).post('/api/users').send(userData);

    const id = createRes.body.id;

    const getRes = await request(server).get(`/api/users/${id}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.username).toBe('Alice');
  });

  test('UPDATE user', async () => {
    const createRes = await request(server).post('/api/users').send(userData);

    const id = createRes.body.id;

    const updateRes = await request(server).put(`/api/users/${id}`).send({
      ...userData,
      username: 'Updated',
    });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.username).toBe('Updated');
  });

  test('DELETE user', async () => {
    const createRes = await request(server).post('/api/users').send(userData);

    const id = createRes.body.id;

    const deleteRes = await request(server).delete(`/api/users/${id}`);

    expect(deleteRes.status).toBe(204);
  });

  test('GET deleted user → 404', async () => {
    const createRes = await request(server).post('/api/users').send(userData);

    const id = createRes.body.id;

    await request(server).delete(`/api/users/${id}`);

    const res = await request(server).get(`/api/users/${id}`);

    expect(res.status).toBe(404);
  });
});
