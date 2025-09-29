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

// Rotas de receitas
router.get('/receitas', async (req, res) => {
  try {
    // Buscar empresa do usuário logado
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const receitas = await prisma.receita.findMany({
      where: { companyId: user.company.id },
      orderBy: { dataRecebimento: 'desc' },
    });

    res.json(receitas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/receitas', async (req, res) => {
  try {
    // Buscar empresa do usuário logado
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const receita = await prisma.receita.create({
      data: {
        ...req.body,
        companyId: user.company.id,
      },
    });

    res.status(201).json(receita);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/company/:companyId/receitas', getReceitas);
router.get('/company/:companyId/receitas/stats', getReceitasStats);
router.get('/receitas/:id', getReceitaById);
router.post('/company/:companyId/receitas', createReceita);
router.put('/receitas/:id', updateReceita);
router.delete('/receitas/:id', deleteReceita);

module.exports = router;
