const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { listAllPosts, getPost } = require('../controllers/blog.controller');
const { listAllTreatments, getTreatment } = require('../controllers/treatment.controller');
const { listAllReviews } = require('../controllers/reviews.controller');
const { listAllInvites } = require('../controllers/reviewInvites.controller');

/**
 * Superficie de administración.
 *
 * Las rutas públicas (`/blog`, `/treatments`) usan `optionalAuthenticate`: sirven
 * al sitio y al panel a la vez, y deciden qué mostrar según venga token o no. Ese
 * doble contrato es lo que hizo desaparecer un borrador del dashboard — sin token
 * el panel pasa a ser un visitante y recibe una lista incompleta sin enterarse.
 *
 * Aquí no hay ambigüedad posible: `authenticate` es obligatorio, así que la única
 * respuesta alternativa a la lista completa es un 401. Sin filtros de estado, sin
 * paginación y sin topes de filas. Todo lo que existe en la base de datos se ve:
 * publicado y borrador, activo e inactivo, aprobado y eliminado. Ocultar algo en
 * el panel es una decisión de la interfaz, y una que se toma a la vista, nunca
 * un descarte silencioso del backend.
 *
 * Las lecturas por id viven aquí también para que el panel tenga un camino
 * completo: cuando las rutas públicas dejen de servir borradores, el panel ya
 * no depende de ellas.
 */
const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/blog', listAllPosts);
router.get('/blog/:id', getPost);
router.get('/treatments', listAllTreatments);
router.get('/treatments/:id', getTreatment);
router.get('/reviews', listAllReviews);
router.get('/invites', listAllInvites);

module.exports = router;
