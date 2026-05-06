function mockReq(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    user: null,
    ip: '127.0.0.1',
    originalUrl: '/test',
    imageUrl: undefined,
    ...overrides,
  };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

function mockNext() {
  return jest.fn();
}

module.exports = { mockReq, mockRes, mockNext };
