jest.mock('../../services/prisma.service', () => ({
  blogPost: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
}));
jest.mock('../../middlewares/upload.middleware', () => ({
  deleteUploadedFile: jest.fn(),
}));

const prisma = require('../../services/prisma.service');
const { deleteUploadedFile } = require('../../middlewares/upload.middleware');
const { listPosts, getPost, createPost, updatePost, deletePost } = require('../../controllers/blog.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const POST = { id: 'pid-1', title: 'Mi Post', slug: 'mi-post', content: 'Contenido', published: false, publishedAt: null };

describe('blog.controller', () => {
  describe('listPosts', () => {
    it('returns paginated posts', async () => {
      prisma.blogPost.findMany.mockResolvedValue([POST]);
      prisma.blogPost.count.mockResolvedValue(1);
      const req = mockReq({ query: {} });
      const res = mockRes();
      await listPosts(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [POST], total: 1 }));
    });
  });

  describe('getPost', () => {
    it('returns 404 when not found', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      const req = mockReq({ params: { id: 'pid-x' } });
      const res = mockRes();
      await getPost(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns post', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(POST);
      const req = mockReq({ params: { id: 'pid-1' } });
      const res = mockRes();
      await getPost(req, res, mockNext());
      expect(res.json).toHaveBeenCalledWith(POST);
    });
  });

  describe('createPost', () => {
    it('returns 400 when title cannot generate slug', async () => {
      const req = mockReq({ body: { title: '@@@', content: 'x' } });
      const res = mockRes();
      await createPost(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 409 on duplicate slug', async () => {
      prisma.blogPost.create.mockRejectedValue(Object.assign(new Error(), { code: 'P2002' }));
      const req = mockReq({ body: { title: 'Título', content: 'Texto' } });
      const res = mockRes();
      await createPost(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('creates post with 201', async () => {
      prisma.blogPost.create.mockResolvedValue(POST);
      const req = mockReq({ body: { title: 'Mi Post', content: 'Contenido' } });
      const res = mockRes();
      await createPost(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(POST);
    });

    it('sets publishedAt when published is true', async () => {
      prisma.blogPost.create.mockResolvedValue({ ...POST, published: true });
      const req = mockReq({ body: { title: 'Mi Post', content: 'Contenido', published: true } });
      const res = mockRes();
      await createPost(req, res, mockNext());
      const createCall = prisma.blogPost.create.mock.calls[0][0];
      expect(createCall.data.publishedAt).toBeInstanceOf(Date);
    });
  });

  describe('updatePost', () => {
    it('returns 404 when not found', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      const req = mockReq({ params: { id: 'pid-x' }, body: {} });
      const res = mockRes();
      await updatePost(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('sets publishedAt to Date when publishing', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(POST);
      prisma.blogPost.update.mockResolvedValue({ ...POST, published: true });
      const req = mockReq({ params: { id: 'pid-1' }, body: { published: true } });
      const res = mockRes();
      await updatePost(req, res, mockNext());
      const updateCall = prisma.blogPost.update.mock.calls[0][0];
      expect(updateCall.data.publishedAt).toBeInstanceOf(Date);
    });

    it('sets publishedAt to null when unpublishing', async () => {
      prisma.blogPost.findUnique.mockResolvedValue({ ...POST, published: true, publishedAt: new Date() });
      prisma.blogPost.update.mockResolvedValue(POST);
      const req = mockReq({ params: { id: 'pid-1' }, body: { published: false } });
      const res = mockRes();
      await updatePost(req, res, mockNext());
      const updateCall = prisma.blogPost.update.mock.calls[0][0];
      expect(updateCall.data.publishedAt).toBeNull();
    });

    it('deletes old image when new image uploaded', async () => {
      const current = { ...POST, imageUrl: '/uploads/old.webp' };
      prisma.blogPost.findUnique.mockResolvedValue(current);
      prisma.blogPost.update.mockResolvedValue(current);
      const req = mockReq({ params: { id: 'pid-1' }, body: {}, imageUrl: '/uploads/new.webp' });
      const res = mockRes();
      await updatePost(req, res, mockNext());
      expect(deleteUploadedFile).toHaveBeenCalledWith('/uploads/old.webp');
    });
  });

  describe('deletePost', () => {
    it('returns 404 on P2025', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      prisma.blogPost.delete.mockRejectedValue(Object.assign(new Error(), { code: 'P2025' }));
      const req = mockReq({ params: { id: 'pid-x' } });
      const res = mockRes();
      await deletePost(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deletes post with 204', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(POST);
      prisma.blogPost.delete.mockResolvedValue(POST);
      const req = mockReq({ params: { id: 'pid-1' } });
      const res = mockRes();
      await deletePost(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
