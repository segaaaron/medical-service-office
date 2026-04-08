const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { getFooter, upsertFooter } = require('../controllers/footer.controller');

const router = Router();

router.get('/', getFooter);
router.put('/', authenticate, upsertFooter);

module.exports = router;
