const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const adminOrOwnerMiddleware = require('../middleware/adminOrOwnerMiddleware');
const {
  getDespesas,
  getDespesaById,
  createDespesa,
  updateDespesa,
  deleteDespesa,
  getDespesasStats,
} = require('../controllers/despesaController');

// Aplicar middleware de autenticação em todas as rotas
router.use(adminOrOwnerMiddleware);

// Rotas de despesas simplificadas
router.get('/despesas', async (req, res) => {
  try {
    let despesas;

    if (req.isAdmin) {
      // Admin pode ver todas as despesas
      const { companyId } = req.query; // Admin pode filtrar por empresa via query

      if (companyId) {
        despesas = await prisma.despesa.findMany({
          where: { companyId },
          include: { company: { select: { companyName: true } } },
          orderBy: { date: 'desc' },
        });
      } else {
        despesas = await prisma.despesa.findMany({
          include: { company: { select: { companyName: true } } },
          orderBy: { date: 'desc' },
        });
      }
    } else {
      // Usuário comum vê apenas suas despesas
      const companyId = req.user.companyId;

      if (!companyId) {
        return res.status(404).json({ error: 'Empresa não encontrada no token' });
      }

      despesas = await prisma.despesa.findMany({
        where: { companyId },
        orderBy: { date: 'desc' },
      });
    }

    res.json(despesas);
  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/despesas', async (req, res) => {
  try {
    let companyId;

    if (req.isAdmin) {
      // Admin pode criar despesa para qualquer empresa
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

    const despesa = await prisma.despesa.create({
      data: {
        ...req.body,
        companyId,
      },
    });

    res.status(201).json(despesa);
  } catch (error) {
    console.error('Erro ao criar despesa:', error);
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

// Rotas para admin gerenciar despesas
router.put('/despesas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar despesa existente
    const existingDespesa = await prisma.despesa.findUnique({
      where: { id },
    });

    if (!existingDespesa) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    // Verificar permissões
    if (!req.isAdmin && existingDespesa.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Sem permissão para editar esta despesa' });
    }

    const despesa = await prisma.despesa.update({
      where: { id },
      data: req.body,
    });

    res.json(despesa);
  } catch (error) {
    console.error('Erro ao atualizar despesa:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/despesas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar despesa existente
    const existingDespesa = await prisma.despesa.findUnique({
      where: { id },
    });

    if (!existingDespesa) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    // Verificar permissões
    if (!req.isAdmin && existingDespesa.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Sem permissão para deletar esta despesa' });
    }

    await prisma.despesa.delete({
      where: { id },
    });

    res.json({ message: 'Despesa deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar despesa:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
