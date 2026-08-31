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
// Lectura de usuarios: solo ADMIN. Estas dos rutas estaban abiertas y servían
// correo, nombre y rol de cada cuenta del sistema a cualquiera que pidiera la
// URL. El panel ya las consume con sesión, así que exigirla no cambia nada
// para él y cierra la enumeración de cuentas desde fuera.
router.get('/', authenticate, requireRole('ADMIN'), listUsers);
router.get('/:id', authenticate, requireRole('ADMIN'), getUser);
router.post('/', authenticate, requireRole('ADMIN'), validate(createUserSchema), createUser);
router.put('/:id', authenticate, requireRole('ADMIN'), validate(updateUserSchema), updateUser);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteUser);

module.exports = router;
