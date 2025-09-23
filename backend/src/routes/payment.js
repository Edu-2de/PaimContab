const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.use('/webhook', express.raw({ type: 'application/json' }));

// Rotas
router.post('/create-checkout', paymentController.createCheckoutSession);
router.post('/webhook', paymentController.stripeWebhook);
router.get('/plans', paymentController.getPlans);

module.exports = router;