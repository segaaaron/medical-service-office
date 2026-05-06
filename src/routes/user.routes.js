const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createUserSchema, updateUserSchema } = require('../schemas/index');
const {
  getMe,
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');

const router = Router();

router.get('/me', authenticate, getMe);
router.get('/', listUsers);
router.get('/:id', getUser);
router.post('/', authenticate, requireRole('ADMIN'), validate(createUserSchema), createUser);
router.put('/:id', authenticate, requireRole('ADMIN'), validate(updateUserSchema), updateUser);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteUser);

module.exports = router;
