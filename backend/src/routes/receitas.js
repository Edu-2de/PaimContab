const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const adminOrOwnerMiddleware = require('../middleware/adminOrOwnerMiddleware');
const {
  getReceitas,
  getReceitaById,
  createReceita,
  updateReceita,
  deleteReceita,
  getReceitasStats,
} = require('../controllers/receitaController');

// Aplicar middleware de autenticação em todas as rotas
router.use(adminOrOwnerMiddleware);

// Rotas de receitas simplificadas
router.get('/receitas', async (req, res) => {
  try {
    let receitas;

    if (req.isAdmin) {
      // Admin pode ver todas as receitas
      const { companyId } = req.query; // Admin pode filtrar por empresa via query
      
      if (companyId) {
        receitas = await prisma.receita.findMany({
          where: { companyId },
          include: { company: { select: { companyName: true } } },
          orderBy: { date: 'desc' },
        });
      } else {
        receitas = await prisma.receita.findMany({
          include: { company: { select: { companyName: true } } },
          orderBy: { date: 'desc' },
        });
      }
    } else {
      // Usuário comum vê apenas suas receitas
      const companyId = req.user.companyId;

      if (!companyId) {
        return res.status(404).json({ error: 'Empresa não encontrada no token' });
      }

      receitas = await prisma.receita.findMany({
        where: { companyId },
        orderBy: { date: 'desc' },
      });
    }

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
