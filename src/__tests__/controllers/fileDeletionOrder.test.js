jest.mock('../../services/prisma.service', () => ({
  blogPost: { findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
  treatment: { findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
  siteContent: { findUnique: jest.fn(), delete: jest.fn() },
}));
jest.mock('../../middlewares/upload.middleware', () => ({
  deleteUploadedFile: jest.fn(),
}));

const prisma = require('../../services/prisma.service');
const { deleteUploadedFile } = require('../../middlewares/upload.middleware');
const { deletePost, updatePost } = require('../../controllers/blog.controller');
const { deleteTreatment, updateTreatment } = require('../../controllers/treatment.controller');
const { deleteSiteContent } = require('../../controllers/site-content.controller');
const { mockReq, mockRes, mockNext } = require('../helpers/mock-req-res');

const POST = { id: 'pid-1', title: 'T', slug: 't', content: 'c', imageUrl: '/uploads/post.webp' };
const TREATMENT = {
  id: 'tid-1', name: 'Botox', slug: 'botox',
  imageUrl: '/uploads/t.webp', beforeImageUrl: '/uploads/b.webp', afterImageUrl: '/uploads/a.webp',
};

/**
 * Borrar un archivo del disco es irreversible; borrar una fila no lo es hasta
 * que la transacción confirma. Por eso el archivo se borra SIEMPRE después de
 * que la base de datos confirme, nunca antes: si la escritura falla y el
 * archivo ya se fue, queda un registro apuntando a una imagen que no existe y
 * no hay forma de recuperarla.
 */
describe('los archivos se borran solo después de que la base de datos confirme', () => {
  describe('al eliminar', () => {
    it('blog: no toca el disco si el borrado de la fila falla', async () => {
      prisma.blogPost.delete.mockRejectedValue(Object.assign(new Error(), { code: 'P2025' }));
      const res = mockRes();
      await deletePost(mockReq({ params: { id: 'pid-1' } }), res, mockNext());
      expect(deleteUploadedFile).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('blog: borra la imagen cuando la fila sí se borró', async () => {
      prisma.blogPost.delete.mockResolvedValue(POST);
      await deletePost(mockReq({ params: { id: 'pid-1' } }), mockRes(), mockNext());
      expect(deleteUploadedFile).toHaveBeenCalledWith('/uploads/post.webp');
    });

    it('tratamiento: conserva las tres imágenes si el borrado falla', async () => {
      prisma.treatment.delete.mockRejectedValue(Object.assign(new Error(), { code: 'P2003' }));
      const res = mockRes();
      await deleteTreatment(mockReq({ params: { id: 'tid-1' } }), res, mockNext());
      expect(deleteUploadedFile).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('tratamiento: borra las tres imágenes cuando la fila sí se borró', async () => {
      prisma.treatment.delete.mockResolvedValue(TREATMENT);
      await deleteTreatment(mockReq({ params: { id: 'tid-1' } }), mockRes(), mockNext());
      expect(deleteUploadedFile).toHaveBeenCalledWith('/uploads/t.webp');
      expect(deleteUploadedFile).toHaveBeenCalledWith('/uploads/b.webp');
      expect(deleteUploadedFile).toHaveBeenCalledWith('/uploads/a.webp');
    });

    it('site-content: no toca el disco si el borrado de la fila falla', async () => {
      prisma.siteContent.findUnique.mockResolvedValue({ key: 'main', value: { doctorImage: '/uploads/d.webp' } });
      prisma.siteContent.delete.mockRejectedValue(Object.assign(new Error(), { code: 'P2025' }));
      const res = mockRes();
      await deleteSiteContent(mockReq({ params: { key: 'main' } }), res, mockNext());
      expect(deleteUploadedFile).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('al reemplazar una imagen', () => {
    it('blog: conserva la imagen anterior si la actualización falla', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(POST);
      prisma.blogPost.update.mockRejectedValue(Object.assign(new Error(), { code: 'P2025' }));
      const req = mockReq({ params: { id: 'pid-1' }, body: {}, imageUrl: '/uploads/nueva.webp' });
      await updatePost(req, mockRes(), mockNext());
      expect(deleteUploadedFile).not.toHaveBeenCalled();
    });

    it('blog: borra la anterior cuando la actualización sí confirma', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(POST);
      prisma.blogPost.update.mockResolvedValue({ ...POST, imageUrl: '/uploads/nueva.webp' });
      const req = mockReq({ params: { id: 'pid-1' }, body: {}, imageUrl: '/uploads/nueva.webp' });
      await updatePost(req, mockRes(), mockNext());
      expect(deleteUploadedFile).toHaveBeenCalledWith('/uploads/post.webp');
    });

    it('tratamiento: conserva las anteriores si la actualización falla', async () => {
      prisma.treatment.findUnique.mockResolvedValue(TREATMENT);
      prisma.treatment.update.mockRejectedValue(Object.assign(new Error(), { code: 'P2025' }));
      const req = mockReq({
        params: { id: 'tid-1' },
        body: { imageUrl: '/uploads/nueva.webp', beforeImageUrl: '' },
      });
      await updateTreatment(req, mockRes(), mockNext());
      expect(deleteUploadedFile).not.toHaveBeenCalled();
    });

    it('tratamiento: borra las anteriores cuando la actualización sí confirma', async () => {
      prisma.treatment.findUnique.mockResolvedValue(TREATMENT);
      prisma.treatment.update.mockResolvedValue(TREATMENT);
      const req = mockReq({
        params: { id: 'tid-1' },
        body: { imageUrl: '/uploads/nueva.webp', beforeImageUrl: '' },
      });
      await updateTreatment(req, mockRes(), mockNext());
      expect(deleteUploadedFile).toHaveBeenCalledWith('/uploads/t.webp');
      expect(deleteUploadedFile).toHaveBeenCalledWith('/uploads/b.webp');
      expect(deleteUploadedFile).not.toHaveBeenCalledWith('/uploads/a.webp');
    });
  });
});
