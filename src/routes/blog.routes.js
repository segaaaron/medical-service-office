const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { upload, compressAndSave, mergeImageUrl, deleteUploadedFile } = require('../middlewares/upload.middleware');
const {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  uploadImage,
} = require('../controllers/blog.controller');
const { validate } = require('../middlewares/validate.middleware');
const { createBlogPostSchema, updateBlogPostSchema } = require('../schemas/index');

function cleanupOnError(req, res, next) {
  res.on('finish', () => {
    if (res.statusCode >= 400 && req.imageUrl) deleteUploadedFile(req.imageUrl);
  });
  next();
}

const router = Router();

router.get('/', listPosts);
router.post('/upload-image', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, uploadImage);

router.get('/:id', getPost);
router.post('/', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, mergeImageUrl, cleanupOnError, validate(createBlogPostSchema), createPost);
router.put('/:id', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, mergeImageUrl, cleanupOnError, validate(updateBlogPostSchema), updatePost);
router.delete('/:id', authenticate, requireRole('ADMIN'), deletePost);

module.exports = router;
