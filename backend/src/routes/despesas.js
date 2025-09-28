const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getDespesas,
  getDespesaById,
  createDespesa,
  updateDespesa,
  deleteDespesa,
  getDespesasStats,
} = require('../controllers/despesaController');

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de despesas
router.get('/company/:companyId/despesas', getDespesas);
router.get('/company/:companyId/despesas/stats', getDespesasStats);
router.get('/despesas/:id', getDespesaById);
router.post('/company/:companyId/despesas', createDespesa);
router.put('/despesas/:id', updateDespesa);
router.delete('/despesas/:id', deleteDespesa);

module.exports = router;
