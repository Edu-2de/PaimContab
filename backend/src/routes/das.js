const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getDASCalculations,
  getDASById,
  calculateDASForMonth,
  markDASAsPaid,
  markDASAsPending,
  getDASStats,
  autoCalculateDAS
} = require('../controllers/dasController');

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de DAS
router.get('/company/:companyId/das', getDASCalculations);
router.get('/company/:companyId/das/stats', getDASStats);
router.get('/das/:id', getDASById);
router.post('/company/:companyId/das/calculate', calculateDASForMonth);
router.post('/company/:companyId/das/auto-calculate', autoCalculateDAS);
router.patch('/das/:id/mark-paid', markDASAsPaid);
router.patch('/das/:id/mark-pending', markDASAsPending);

module.exports = router;