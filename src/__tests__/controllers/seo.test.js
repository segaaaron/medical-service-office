// SEO por registro (seoTitle / seoDescription / ogImageUrl) en Treatment y
// BlogPost: validación en schemas + ida y vuelta por los controllers.
jest.mock('../../services/prisma.service', () => {
  const model = () => ({ findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() });
  return { treatment: model(), blogPost: model() };
});
jest.mock('../../middlewares/upload.middleware', () => ({ deleteUploadedFile: jest.fn() }));

const prisma = require('../../services/prisma.service');
const {
  createTreatmentSchema, updateTreatmentSchema, createBlogPostSchema, updateBlogPostSchema,
} = require('../../schemas/index');
const { createTreatment, updateTreatment } = require('../../controllers/treatment.controller');
const { createPost, updatePost, listPosts } = require('../../controllers/blog.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const SEO = { seoTitle: 'Botox', seoDescription: 'Botox en Cochabamba', ogImageUrl: 'https://cdn.example.com/og.jpg' };
const echo = ({ data }) => Promise.resolve({ id: 'x', ...data });

describe('SEO fields — schemas', () => {
  const cases = [
    ['createTreatment', createTreatmentSchema, { name: 'Botox', description: 'd' }],
    ['updateTreatment', updateTreatmentSchema, {}],
    ['createBlogPost', createBlogPostSchema, { title: 'Post', content: 'c' }],
    ['updateBlogPost', updateBlogPostSchema, {}],
  ];

  describe.each(cases)('%s', (_, schema, base) => {
    it('accepts and trims valid values', () => {
      const r = schema.validate({ ...base, seoTitle: '  Botox  ', seoDescription: ' desc ', ogImageUrl: '/uploads/og.webp' });
      expect(r.success).toBe(true);
      expect(r.data).toMatchObject({ seoTitle: 'Botox', seoDescription: 'desc', ogImageUrl: '/uploads/og.webp' });
    });

    it('empty or blank string → null', () => {
      const r = schema.validate({ ...base, seoTitle: '', seoDescription: '   ', ogImageUrl: '' });
      expect(r.success).toBe(true);
      expect(r.data).toMatchObject({ seoTitle: null, seoDescription: null, ogImageUrl: null });
    });

    it('absent → not in output (update leaves column untouched)', () => {
      const r = schema.validate({ ...base, name: 'N', title: 'T' });
      expect('seoTitle' in r.data).toBe(false);
    });

    it('enforces seoTitle ≤70 and seoDescription ≤170', () => {
      expect(schema.validate({ ...base, seoTitle: 'a'.repeat(70), seoDescription: 'b'.repeat(170) }).success).toBe(true);
      const r = schema.validate({ ...base, seoTitle: 'a'.repeat(71), seoDescription: 'b'.repeat(171) });
      expect(r.success).toBe(false);
      expect(r.errors.map((e) => e.field).sort()).toEqual(['seoDescription', 'seoTitle']);
    });

    it('ogImageUrl must be http(s) or /uploads/', () => {
      for (const bad of ['javascript:alert(1)', 'ftp://x.com/a.jpg', '/etc/passwd', 'og.jpg', 'data:image/png;base64,AA', '/uploads/../x', `https://a.com/${'a'.repeat(2048)}`]) {
        expect(schema.validate({ ...base, ogImageUrl: bad }).success).toBe(false);
      }
      expect(schema.validate({ ...base, ogImageUrl: 'http://example.com/a.png' }).success).toBe(true);
    });
  });

  it('collapses whitespace in treatment name and blog title, keeps casing', () => {
    expect(createTreatmentSchema.validate({ name: '  ÁCIDO   HIALURÓNICO \t ', description: 'd' }).data.name)
      .toBe('ÁCIDO HIALURÓNICO');
    expect(updateTreatmentSchema.validate({ name: 'PDRN  (Salmón)' }).data.name).toBe('PDRN (Salmón)');
    expect(createBlogPostSchema.validate({ title: ' Mi   post ', content: 'c' }).data.title).toBe('Mi post');
    expect(updateBlogPostSchema.validate({ title: 'A \n B' }).data.title).toBe('A B');
    expect(createTreatmentSchema.validate({ name: '   ', description: 'd' }).success).toBe(false);
  });
});

describe('SEO fields — controllers round-trip', () => {
  beforeEach(() => jest.clearAllMocks());

  it('treatment create persists and returns SEO fields', async () => {
    prisma.treatment.create.mockImplementation(echo);
    const body = createTreatmentSchema.validate({ name: 'Botox', description: 'd', ...SEO }).data;
    const res = mockRes();
    await createTreatment(mockReq({ body }), res, mockNext());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining(SEO));
  });

  it('treatment create without SEO stores nulls', async () => {
    prisma.treatment.create.mockImplementation(echo);
    await createTreatment(mockReq({ body: { name: 'Botox', description: 'd' } }), mockRes(), mockNext());
    expect(prisma.treatment.create.mock.calls[0][0].data)
      .toMatchObject({ seoTitle: null, seoDescription: null, ogImageUrl: null });
  });

  it('treatment update sets provided SEO, clears with null, ignores absent', async () => {
    prisma.treatment.findUnique.mockResolvedValue({ id: 't1' });
    prisma.treatment.update.mockImplementation(echo);
    const body = updateTreatmentSchema.validate({ seoTitle: 'Nuevo', ogImageUrl: '' }).data;
    await updateTreatment(mockReq({ params: { id: 't1' }, body }), mockRes(), mockNext());
    const { data } = prisma.treatment.update.mock.calls[0][0];
    expect(data).toEqual({ seoTitle: 'Nuevo', ogImageUrl: null });
  });

  it('blog create/update persist SEO fields', async () => {
    prisma.blogPost.create.mockImplementation(echo);
    const res = mockRes();
    await createPost(mockReq({ body: createBlogPostSchema.validate({ title: 'T', content: 'c', ...SEO }).data }), res, mockNext());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining(SEO));

    prisma.blogPost.findUnique.mockResolvedValue({ id: 'p1' });
    prisma.blogPost.update.mockImplementation(echo);
    await updatePost(mockReq({ params: { id: 'p1' }, body: { seoDescription: null } }), mockRes(), mockNext());
    expect(prisma.blogPost.update.mock.calls[0][0].data).toEqual({ seoDescription: null });
  });

  it('public blog list selects SEO fields', async () => {
    prisma.blogPost.findMany.mockResolvedValue([]);
    await listPosts(mockReq({ query: {} }), mockRes(), mockNext());
    expect(prisma.blogPost.findMany.mock.calls[0][0].select)
      .toMatchObject({ seoTitle: true, seoDescription: true, ogImageUrl: true });
  });
});
