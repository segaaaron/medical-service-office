const { Router } = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const treatmentRoutes = require('./treatment.routes');
const blogRoutes = require('./blog.routes');
const appointmentRoutes = require('./appointment.routes');
const siteContentRoutes = require('./site-content.routes');
const contactRoutes = require('./contact.routes');
const aboutRoutes = require('./about.routes');
const footerRoutes = require('./footer.routes');
const homeRoutes = require('./home.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/treatments', treatmentRoutes);
router.use('/blog', blogRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/site-content', siteContentRoutes);
router.use('/contact', contactRoutes);
router.use('/about', aboutRoutes);
router.use('/footer', footerRoutes);
router.use('/home', homeRoutes);

module.exports = router;
