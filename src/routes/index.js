const { Router } = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const treatmentRoutes = require('./treatment.routes');
const blogRoutes = require('./blog.routes');
const siteContentRoutes = require('./site-content.routes');
const contactRoutes = require('./contact.routes');
const aboutRoutes = require('./about.routes');
const footerRoutes = require('./footer.routes');
const homeRoutes = require('./home.routes');
const promoBannerRoutes = require('./promo-banner.routes');
const reviewsRoutes = require('./reviews.routes');
const logsRoutes = require('./logs.routes');
const adminRoutes = require('./admin.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/treatments', treatmentRoutes);
router.use('/blog', blogRoutes);
router.use('/site-content', siteContentRoutes);
router.use('/contact', contactRoutes);
router.use('/about', aboutRoutes);
router.use('/footer', footerRoutes);
router.use('/home', homeRoutes);
router.use('/promo-banner', promoBannerRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/logs', logsRoutes);
// Superficie de administración: lista completa, autenticación obligatoria.
router.use('/admin', adminRoutes);

module.exports = router;
