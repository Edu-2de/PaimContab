const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticateToken = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.use('/webhook', express.raw({ type: 'application/json' }));

router.get('/plans', paymentController.getPlans);

router.post('/create-checkout', authenticateToken, paymentController.createCheckoutSession);

router.post('/webhook', paymentController.stripeWebhook);

router.post('/create-plans', requireAdmin, paymentController.createPlans);

module.exports = router;
