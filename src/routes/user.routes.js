const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
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
router.get('/', listUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;