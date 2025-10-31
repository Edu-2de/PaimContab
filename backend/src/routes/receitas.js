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

    // Mapear campos do schema (inglês) para o frontend (português)
    const receitasMapeadas = receitas.map(r => ({
      id: r.id,
      descricao: r.description,
      valor: r.value,
      dataRecebimento: r.date,
      categoria: r.category,
      cliente: r.clientName,
      numeroNota: r.invoiceNumber,
      metodoPagamento: r.paymentMethod,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      companyId: r.companyId,
      company: r.company,
    }));

    res.json(receitasMapeadas);
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

    // Mapear campos do frontend (português) para o schema (inglês)
    const dataStr = req.body.dataRecebimento || req.body.date;
    const dataComHorario = dataStr.includes('T') ? dataStr : `${dataStr}T12:00:00.000Z`;

    const receita = await prisma.receita.create({
      data: {
        companyId,
        description: req.body.descricao || req.body.description,
        value: parseFloat(req.body.valor || req.body.value),
        date: new Date(dataComHorario), // Adiciona horário para evitar mudança de data
        category: req.body.categoria || req.body.category,
        clientName: req.body.cliente || req.body.clientName,
        invoiceNumber: req.body.numeroNota || req.body.invoiceNumber,
        paymentMethod: req.body.metodoPagamento || req.body.paymentMethod || 'PIX',
        status: req.body.status || 'Recebido',
      },
    });

    // Mapear resposta para português
    const receitaMapeada = {
      id: receita.id,
      descricao: receita.description,
      valor: receita.value,
      dataRecebimento: receita.date,
      categoria: receita.category,
      cliente: receita.clientName,
      numeroNota: receita.invoiceNumber,
      metodoPagamento: receita.paymentMethod,
      status: receita.status,
      createdAt: receita.createdAt,
      updatedAt: receita.updatedAt,
      companyId: receita.companyId,
    };

    res.status(201).json(receitaMapeada);
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
// router.put('/receitas/:id', updateReceita); // Removido: duplicado, usando implementação inline abaixo
router.delete('/receitas/:id', deleteReceita);

// Rota PUT para editar receitas (admin ou owner)
router.put('/receitas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📝 PUT /receitas/:id - Recebido:', {
      id,
      body: req.body,
    });

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

    // Construir objeto de atualização dinamicamente
    const updateData = {};

    // Processar data corretamente
    if (req.body.dataRecebimento || req.body.date) {
      const dataStr = req.body.dataRecebimento || req.body.date;
      const dataComHorario = dataStr.includes('T') ? dataStr : `${dataStr}T12:00:00.000Z`;
      updateData.date = new Date(dataComHorario);
    }

    // Adicionar campos apenas se foram enviados (aceita strings vazias)
    if (req.body.descricao !== undefined) {
      updateData.description = req.body.descricao;
    } else if (req.body.description !== undefined) {
      updateData.description = req.body.description;
    }

    if (req.body.valor !== undefined) {
      updateData.value = parseFloat(req.body.valor);
    } else if (req.body.value !== undefined) {
      updateData.value = parseFloat(req.body.value);
    }

    if (req.body.categoria !== undefined) {
      updateData.category = req.body.categoria;
    } else if (req.body.category !== undefined) {
      updateData.category = req.body.category;
    }

    if (req.body.cliente !== undefined) {
      updateData.clientName = req.body.cliente;
    } else if (req.body.clientName !== undefined) {
      updateData.clientName = req.body.clientName;
    }

    if (req.body.numeroNota !== undefined) {
      updateData.invoiceNumber = req.body.numeroNota;
    } else if (req.body.invoiceNumber !== undefined) {
      updateData.invoiceNumber = req.body.invoiceNumber;
    }

    if (req.body.metodoPagamento !== undefined) {
      updateData.paymentMethod = req.body.metodoPagamento;
    } else if (req.body.paymentMethod !== undefined) {
      updateData.paymentMethod = req.body.paymentMethod;
    }

    if (req.body.status !== undefined) {
      updateData.status = req.body.status;
    }

    console.log('📝 Dados para atualizar:', updateData);

    const receita = await prisma.receita.update({
      where: { id },
      data: updateData,
    });

    // Mapear resposta para português
    const receitaMapeada = {
      id: receita.id,
      descricao: receita.description,
      valor: receita.value,
      dataRecebimento: receita.date,
      categoria: receita.category,
      cliente: receita.clientName,
      numeroNota: receita.invoiceNumber,
      metodoPagamento: receita.paymentMethod,
      status: receita.status,
      createdAt: receita.createdAt,
      updatedAt: receita.updatedAt,
      companyId: receita.companyId,
    };

    console.log('✅ Receita atualizada:', receitaMapeada);

    res.json(receitaMapeada);
  } catch (error) {
    console.error('❌ Erro ao atualizar receita:', error);
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
