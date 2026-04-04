const { Router } = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const treatmentRoutes = require('./treatment.routes');
const blogRoutes = require('./blog.routes');
const appointmentRoutes = require('./appointment.routes');
const siteContentRoutes = require('./site-content.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/treatments', treatmentRoutes);
router.use('/blog', blogRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/site-content', siteContentRoutes);

module.exports = router;
