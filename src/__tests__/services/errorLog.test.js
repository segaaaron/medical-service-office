jest.mock('../../services/prisma.service', () => ({
  errorLog: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

const prisma = require('../../services/prisma.service');
const { recordError, buildRecord, hashIp } = require('../../services/errorLog.service');

function fakeReq(overrides = {}) {
  return {
    method: 'POST',
    originalUrl: '/api/treatments',
    ip: '203.0.113.5',
    body: {},
    query: {},
    params: {},
    user: null,
    headers: {},
    ...overrides,
  };
}

describe('errorLog.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.errorLog.create.mockResolvedValue({});
    prisma.errorLog.deleteMany.mockResolvedValue({ count: 0 });
  });

  describe('hashIp', () => {
    it('hashes ip to 64-char sha256 hex, null on missing', () => {
      expect(hashIp('1.2.3.4')).toMatch(/^[a-f0-9]{64}$/);
      expect(hashIp(null)).toBeNull();
    });
  });

  describe('buildRecord', () => {
    it('maps error + request fields and sanitizes payloads', () => {
      const err = Object.assign(new Error('boom'), { name: 'TypeError', code: 'X1' });
      const req = fakeReq({
        body: { password: 'p', email: 'a@b.com', name: 'Ana', treatmentId: 't1' },
        user: { id: 'u-1' },
        headers: { 'x-request-id': 'req-9' },
      });
      const rec = buildRecord(err, req, 500);

      expect(rec.statusCode).toBe(500);
      expect(rec.name).toBe('TypeError');
      expect(rec.code).toBe('X1');
      expect(rec.message).toBe('boom');
      expect(rec.method).toBe('POST');
      expect(rec.path).toBe('/api/treatments');
      expect(rec.userId).toBe('u-1');
      expect(rec.requestId).toBe('req-9');
      expect(rec.ipHash).toMatch(/^[a-f0-9]{64}$/);
      // PII redactado, no-PII intacto
      expect(rec.body.password).toBe('[REDACTED]');
      expect(rec.body.email).toBe('[REDACTED]');
      expect(rec.body.treatmentId).toBe('t1');
    });

    it('handles missing/empty fields without throwing', () => {
      const rec = buildRecord({}, fakeReq({ body: {}, query: {}, params: {} }), 500);
      expect(rec.body).toBeNull();
      expect(rec.userId).toBeNull();
      expect(rec.requestId).toBeNull();
    });

    it('strips the raw query-string from path (PII leak guard)', () => {
      const rec = buildRecord({}, fakeReq({ originalUrl: '/api/x?email=a@b.com&token=secret' }), 500);
      expect(rec.path).toBe('/api/x');
    });
  });

  describe('recordError', () => {
    it('persists the record', async () => {
      await recordError(new Error('x'), fakeReq(), 500);
      expect(prisma.errorLog.create).toHaveBeenCalledTimes(1);
    });

    it('never rejects when the DB write fails (anti-recursion)', async () => {
      prisma.errorLog.create.mockRejectedValue(new Error('db down'));
      await expect(recordError(new Error('x'), fakeReq(), 500)).resolves.toBeUndefined();
    });

    it('never rejects when buildRecord throws', async () => {
      // req without method/headers getters could throw inside build; force via null req props
      const brokenReq = null;
      await expect(recordError(new Error('x'), brokenReq, 500)).resolves.toBeUndefined();
    });

    it('drops writes under backpressure (caps in-flight creates)', async () => {
      // create nunca resuelve → simula DB lenta y satura el contador in-flight
      prisma.errorLog.create.mockImplementation(() => new Promise(() => {}));
      const pending = [];
      for (let i = 0; i < 70; i++) pending.push(recordError(new Error('storm'), fakeReq(), 500));
      // El excedente sobre MAX_INFLIGHT (50) se descarta sin tocar la DB.
      expect(prisma.errorLog.create.mock.calls.length).toBeLessThanOrEqual(50);
      // Las llamadas descartadas resuelven inmediatamente (no cuelgan).
      await Promise.race([pending[69], new Promise((r) => setImmediate(() => r('dropped')))]);
    });
  });
});
