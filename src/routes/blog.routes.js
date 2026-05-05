const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { upload, compressAndSave, mergeImageUrl } = require('../middlewares/upload.middleware');
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

const router = Router();

router.get('/', listPosts);
router.post('/upload-image', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, uploadImage);

router.get('/:id', getPost);
router.post('/', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, mergeImageUrl, validate(createBlogPostSchema), createPost);
router.put('/:id', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, mergeImageUrl, validate(updateBlogPostSchema), updatePost);
router.delete('/:id', authenticate, requireRole('ADMIN'), deletePost);

module.exports = router;
