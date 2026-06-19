jest.mock('../../services/prisma.service', () => ({
  errorLog: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
}));

const prisma = require('../../services/prisma.service');
const { listErrorLogs } = require('../../controllers/logs.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const LOG = { id: 'e1', statusCode: 500, message: 'boom', method: 'POST', path: '/api/x' };

describe('logs.controller › listErrorLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.errorLog.findMany.mockResolvedValue([LOG]);
    prisma.errorLog.count.mockResolvedValue(1);
  });

  it('returns paginated logs', async () => {
    const req = mockReq({ query: {} });
    const res = mockRes();
    await listErrorLogs(req, res, mockNext());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: [LOG], total: 1, page: 1, totalPages: 1,
    }));
  });

  it('runs findMany and count in parallel (one Promise.all)', async () => {
    const req = mockReq({ query: { page: '2', limit: '10' } });
    const res = mockRes();
    await listErrorLogs(req, res, mockNext());
    expect(prisma.errorLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10, orderBy: { createdAt: 'desc' } })
    );
  });

  it('filters by statusCode and method', async () => {
    const req = mockReq({ query: { statusCode: '500', method: 'post' } });
    const res = mockRes();
    await listErrorLogs(req, res, mockNext());
    expect(prisma.errorLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ statusCode: 500, method: 'POST' }) })
    );
  });

  it('filters by date range', async () => {
    const req = mockReq({ query: { from: '2026-01-01', to: '2026-02-01' } });
    const res = mockRes();
    await listErrorLogs(req, res, mockNext());
    const arg = prisma.errorLog.findMany.mock.calls[0][0];
    expect(arg.where.createdAt.gte).toBeInstanceOf(Date);
    expect(arg.where.createdAt.lte).toBeInstanceOf(Date);
  });

  it('ignores invalid statusCode / dates', async () => {
    const req = mockReq({ query: { statusCode: 'abc', from: 'notadate' } });
    const res = mockRes();
    await listErrorLogs(req, res, mockNext());
    const arg = prisma.errorLog.findMany.mock.calls[0][0];
    expect(arg.where.statusCode).toBeUndefined();
    expect(arg.where.createdAt).toBeUndefined();
  });

  it('passes errors to next', async () => {
    const dbErr = new Error('db down');
    prisma.errorLog.findMany.mockRejectedValue(dbErr);
    const req = mockReq({ query: {} });
    const res = mockRes();
    const next = mockNext();
    await listErrorLogs(req, res, next);
    expect(next).toHaveBeenCalledWith(dbErr);
  });
});
