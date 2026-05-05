const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const {
  getMe,
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');

const router = Router();

router.use(authenticate);

router.get('/me', getMe);
router.get('/', requireRole('ADMIN'), listUsers);
router.get('/:id', requireRole('ADMIN'), getUser);
router.post('/', requireRole('ADMIN'), createUser);
router.put('/:id', requireRole('ADMIN'), updateUser);
router.delete('/:id', requireRole('ADMIN'), deleteUser);

module.exports = router;
