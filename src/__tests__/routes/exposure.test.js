/**
 * Contrato de exposición de la API.
 *
 * Estos tests arrancan la aplicación real y llaman por HTTP: no hay mocks de
 * middlewares, así que verifican lo que de verdad ve internet. Existen porque
 * un endpoint quedó abierto sin que ninguna prueba de controlador lo notara —
 * los tests de controlador nunca ejecutan la cadena de rutas.
 *
 * Todo lo que responde algo distinto de 401/403 sin credenciales es, por
 * definición, público. Cada línea de la lista de abajo es una decisión.
 */
const jwt = require('jsonwebtoken');
const app = require('../../app');

let server;
let base;

const sign = (role) => jwt.sign({ sub: 'u1', role }, process.env.JWT_ACCESS_SECRET, {
  algorithm: 'HS256',
  expiresIn: '5m',
});

beforeAll((done) => {
  server = app.listen(0, () => {
    base = `http://127.0.0.1:${server.address().port}`;
    done();
  });
});

afterAll((done) => { server.close(done); });

const get = (path, token) => fetch(base + path, {
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

describe('exposición de la API', () => {
  describe('datos de usuarios — nunca públicos', () => {
    it.each([
      ['/api/users'],
      ['/api/users/1a6454ca-9a37-45e8-b832-9eaf7995477b'],
    ])('%s exige autenticación', async (path) => {
      const res = await get(path);
      expect(res.status).toBe(401);
    });

    it.each([
      ['/api/users'],
      ['/api/users/1a6454ca-9a37-45e8-b832-9eaf7995477b'],
    ])('%s exige rol ADMIN', async (path) => {
      const res = await get(path, sign('EDITOR'));
      expect(res.status).toBe(403);
    });
  });

  describe('superficie de administración', () => {
    it.each([
      ['/api/admin/blog'],
      ['/api/admin/treatments'],
    ])('%s responde 401 sin token, nunca una lista parcial', async (path) => {
      const res = await get(path);
      expect(res.status).toBe(401);
    });

    it.each([
      ['/api/admin/blog'],
      ['/api/admin/treatments'],
    ])('%s responde 403 a un rol que no es ADMIN', async (path) => {
      const res = await get(path, sign('EDITOR'));
      expect(res.status).toBe(403);
    });
  });

  describe('superficies públicas por diseño', () => {
    it.each([
      ['/api/blog'],
      ['/api/treatments'],
      ['/api/site-content'],
      ['/api/reviews/public'],
      ['/health'],
    ])('%s sigue siendo alcanzable sin token', async (path) => {
      const res = await get(path);
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });
  });
});
