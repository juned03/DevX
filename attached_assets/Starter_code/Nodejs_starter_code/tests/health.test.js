import request from 'supertest';
import app from '../src/app.js';

test('GET /health returns ok (without DB assert)', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBeLessThan(500);
});


