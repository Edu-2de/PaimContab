const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
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

// Rotas de despesas simplificadas
router.get('/despesas', async (req, res) => {
  try {
    // Buscar empresa do usuário logado
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const despesas = await prisma.despesa.findMany({
      where: { companyId: user.company.id },
      orderBy: { dataPagamento: 'desc' }
    });

    res.json(despesas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/despesas', async (req, res) => {
  try {
    // Buscar empresa do usuário logado
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const despesa = await prisma.despesa.create({
      data: {
        ...req.body,
        companyId: user.company.id
      }
    });

    res.status(201).json(despesa);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rotas de despesas com companyId
router.get('/company/:companyId/despesas', getDespesas);
router.get('/company/:companyId/despesas/stats', getDespesasStats);
router.get('/despesas/:id', getDespesaById);
router.post('/company/:companyId/despesas', createDespesa);
router.put('/despesas/:id', updateDespesa);
router.delete('/despesas/:id', deleteDespesa);

module.exports = router;
