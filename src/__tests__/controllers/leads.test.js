jest.mock('../../services/prisma.service', () => ({
  lead: { create: jest.fn(), findMany: jest.fn() },
}));

const prisma = require('../../services/prisma.service');
const { createLead, listLeads } = require('../../controllers/leads.controller');
const { createLeadSchema } = require('../../schemas/index');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const LEAD = {
  id: 'lid-1',
  name: 'Ana Pérez',
  phone: '70000000',
  treatment: 'Botox',
  message: 'Quisiera información',
  preferredDate: '2026-09-02',
  source: 'contact-form',
  createdAt: new Date(),
};

describe('createLeadSchema', () => {
  it('solo exige el nombre: cada campo obligatorio de más es un contacto perdido', () => {
    const r = createLeadSchema.validate({ name: 'Ana' });
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ name: 'Ana' });
  });

  it('rechaza un nombre vacío o de un solo carácter', () => {
    expect(createLeadSchema.validate({ name: 'A' }).success).toBe(false);
    expect(createLeadSchema.validate({}).success).toBe(false);
  });

  it('recorta espacios y descarta los campos vacíos', () => {
    const r = createLeadSchema.validate({ name: '  Ana  ', phone: '   ', message: '' });
    expect(r.data).toEqual({ name: 'Ana' });
  });

  it('ignora una fecha con formato inválido en vez de rechazar el contacto entero', () => {
    const r = createLeadSchema.validate({ name: 'Ana', preferredDate: '02/09/2026' });
    expect(r.success).toBe(true);
    expect(r.data.preferredDate).toBeUndefined();
  });

  it('corta los campos que exceden su límite', () => {
    const r = createLeadSchema.validate({ name: 'Ana', message: 'x'.repeat(2001) });
    expect(r.success).toBe(false);
    expect(r.errors[0].field).toBe('message');
  });
});

describe('createLead', () => {
  beforeEach(() => jest.clearAllMocks());

  it('guarda el contacto y devuelve 201 con su id', async () => {
    prisma.lead.create.mockResolvedValue({ id: LEAD.id, createdAt: LEAD.createdAt });
    const res = mockRes();
    await createLead(mockReq({ body: { name: 'Ana', phone: '70000000' }, ip: '1.2.3.4' }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(201);
    expect(prisma.lead.create.mock.calls[0][0].data.name).toBe('Ana');
  });

  it('guarda el hash de la IP, nunca la IP de la paciente', async () => {
    prisma.lead.create.mockResolvedValue({ id: LEAD.id, createdAt: LEAD.createdAt });
    await createLead(mockReq({ body: { name: 'Ana' }, ip: '1.2.3.4' }), mockRes(), mockNext());
    const { ipHash } = prisma.lead.create.mock.calls[0][0].data;
    expect(ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(ipHash).not.toContain('1.2.3.4');
  });

  it('aplica el origen por defecto cuando el formulario no lo envía', async () => {
    prisma.lead.create.mockResolvedValue({ id: LEAD.id, createdAt: LEAD.createdAt });
    await createLead(mockReq({ body: { name: 'Ana' } }), mockRes(), mockNext());
    expect(prisma.lead.create.mock.calls[0][0].data.source).toBe('contact-form');
  });
});

describe('listLeads', () => {
  beforeEach(() => jest.clearAllMocks());

  it('devuelve los más recientes primero y nunca expone el ipHash', async () => {
    prisma.lead.findMany.mockResolvedValue([LEAD]);
    const res = mockRes();
    await listLeads(mockReq({ query: {} }), res, mockNext());
    const call = prisma.lead.findMany.mock.calls[0][0];
    expect(call.orderBy).toEqual({ createdAt: 'desc' });
    expect(call.select.ipHash).toBeUndefined();
    expect(res.json).toHaveBeenCalledWith([LEAD]);
  });

  it('acota el límite recibido para que nadie pida la tabla entera', async () => {
    prisma.lead.findMany.mockResolvedValue([]);
    await listLeads(mockReq({ query: { limit: '99999' } }), mockRes(), mockNext());
    expect(prisma.lead.findMany.mock.calls[0][0].take).toBe(500);

    await listLeads(mockReq({ query: { limit: 'abc' } }), mockRes(), mockNext());
    expect(prisma.lead.findMany.mock.calls[1][0].take).toBe(100);
  });
});
