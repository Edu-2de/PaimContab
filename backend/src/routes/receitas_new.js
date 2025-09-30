const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getReceitas,
  getReceitaById,
  createReceita,
  updateReceita,
  deleteReceita,
  getReceitasStats,
} = require('../controllers/receitaController');

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de receitas simplificadas
router.get('/receitas', async (req, res) => {
  try {
    // Buscar companyId do token
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(404).json({ error: 'Empresa não encontrada no token' });
    }

    const receitas = await prisma.receita.findMany({
      where: { companyId },
      orderBy: { dataRecebimento: 'desc' },
    });

    res.json(receitas);
  } catch (error) {
    console.error('Erro ao buscar receitas:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/receitas', async (req, res) => {
  try {
    // Buscar companyId do token
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(404).json({ error: 'Empresa não encontrada no token' });
    }

    const receita = await prisma.receita.create({
      data: {
        ...req.body,
        companyId,
      },
    });

    res.status(201).json(receita);
  } catch (error) {
    console.error('Erro ao criar receita:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rotas de receitas com companyId
router.get('/company/:companyId/receitas', getReceitas);
router.get('/company/:companyId/receitas/stats', getReceitasStats);
router.get('/receitas/:id', getReceitaById);
router.post('/company/:companyId/receitas', createReceita);
router.put('/receitas/:id', updateReceita);
router.delete('/receitas/:id', deleteReceita);

module.exports = router;