const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
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
router.get('/:id', getPost);

router.post('/', authenticate, upload.single('image'), compressAndSave, mergeImageUrl, validate(createBlogPostSchema), createPost);
router.put('/:id', authenticate, upload.single('image'), compressAndSave, mergeImageUrl, validate(updateBlogPostSchema), updatePost);
router.delete('/:id', authenticate, deletePost);

router.post('/upload-image', authenticate, upload.single('image'), compressAndSave, uploadImage);

module.exports = router;
