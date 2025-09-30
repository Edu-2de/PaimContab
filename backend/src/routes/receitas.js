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
    let companyId;

    if (req.isAdmin) {
      // Admin pode criar receita para qualquer empresa
      companyId = req.body.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Admin deve especificar companyId na requisição' });
      }
    } else {
      // Usuário comum cria apenas para sua empresa
      companyId = req.user.companyId;

      if (!companyId) {
        return res.status(404).json({ error: 'Empresa não encontrada no token' });
      }
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

// Rotas para admin gerenciar receitas
router.put('/receitas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar receita existente
    const existingReceita = await prisma.receita.findUnique({
      where: { id },
    });

    if (!existingReceita) {
      return res.status(404).json({ error: 'Receita não encontrada' });
    }

    // Verificar permissões
    if (!req.isAdmin && existingReceita.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Sem permissão para editar esta receita' });
    }

    const receita = await prisma.receita.update({
      where: { id },
      data: req.body,
    });

    res.json(receita);
  } catch (error) {
    console.error('Erro ao atualizar receita:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/receitas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar receita existente
    const existingReceita = await prisma.receita.findUnique({
      where: { id },
    });

    if (!existingReceita) {
      return res.status(404).json({ error: 'Receita não encontrada' });
    }

    // Verificar permissões
    if (!req.isAdmin && existingReceita.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Sem permissão para deletar esta receita' });
    }

    await prisma.receita.delete({
      where: { id },
    });

    res.json({ message: 'Receita deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar receita:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
