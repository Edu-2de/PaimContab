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

    // Mapear campos do schema (inglês) para o frontend (português)
    const despesasMapeadas = despesas.map(d => ({
      id: d.id,
      descricao: d.description,
      valor: d.value,
      dataPagamento: d.date,
      categoria: d.category,
      fornecedor: d.supplier,
      numeroNota: d.invoiceNumber,
      metodoPagamento: d.paymentMethod,
      status: d.status,
      dedutivel: d.isDeductible,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      companyId: d.companyId,
      company: d.company,
    }));

    res.json(despesasMapeadas);
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

    // Mapear campos do frontend (português) para o schema (inglês)
    const dataStr = req.body.dataPagamento || req.body.date;
    const dataComHorario = dataStr.includes('T') ? dataStr : `${dataStr}T12:00:00.000Z`;

    const despesa = await prisma.despesa.create({
      data: {
        companyId,
        description: req.body.descricao || req.body.description,
        value: parseFloat(req.body.valor || req.body.value),
        date: new Date(dataComHorario), // Adiciona horário para evitar mudança de data
        category: req.body.categoria || req.body.category,
        supplier: req.body.fornecedor || req.body.supplier,
        invoiceNumber: req.body.numeroNota || req.body.invoiceNumber,
        paymentMethod: req.body.metodoPagamento || req.body.paymentMethod || 'PIX',
        status: req.body.status || 'Pago',
        isDeductible:
          req.body.dedutivel !== undefined
            ? req.body.dedutivel
            : req.body.isDeductible !== undefined
            ? req.body.isDeductible
            : true,
      },
    });

    // Mapear resposta para português
    const despesaMapeada = {
      id: despesa.id,
      descricao: despesa.description,
      valor: despesa.value,
      dataPagamento: despesa.date,
      categoria: despesa.category,
      fornecedor: despesa.supplier,
      numeroNota: despesa.invoiceNumber,
      metodoPagamento: despesa.paymentMethod,
      status: despesa.status,
      dedutivel: despesa.isDeductible,
      createdAt: despesa.createdAt,
      updatedAt: despesa.updatedAt,
      companyId: despesa.companyId,
    };

    res.status(201).json(despesaMapeada);
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
// router.put('/despesas/:id', updateDespesa); // Removido: duplicado, usando implementação inline abaixo
router.delete('/despesas/:id', deleteDespesa);

// Rota PUT para editar despesas (admin ou owner)
router.put('/despesas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📝 PUT /despesas/:id - Recebido:', {
      id,
      body: req.body,
    });

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

    // Construir objeto de atualização dinamicamente
    const updateData = {};

    // Processar data corretamente
    if (req.body.dataPagamento || req.body.date) {
      const dataStr = req.body.dataPagamento || req.body.date;
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

    if (req.body.fornecedor !== undefined) {
      updateData.supplier = req.body.fornecedor;
    } else if (req.body.supplier !== undefined) {
      updateData.supplier = req.body.supplier;
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

    if (req.body.dedutivel !== undefined) {
      updateData.isDeductible = req.body.dedutivel;
    } else if (req.body.isDeductible !== undefined) {
      updateData.isDeductible = req.body.isDeductible;
    }

    console.log('📝 Dados para atualizar:', updateData);

    const despesa = await prisma.despesa.update({
      where: { id },
      data: updateData,
    });

    // Mapear resposta para português
    const despesaMapeada = {
      id: despesa.id,
      descricao: despesa.description,
      valor: despesa.value,
      dataPagamento: despesa.date,
      categoria: despesa.category,
      fornecedor: despesa.supplier,
      numeroNota: despesa.invoiceNumber,
      metodoPagamento: despesa.paymentMethod,
      status: despesa.status,
      dedutivel: despesa.isDeductible,
      createdAt: despesa.createdAt,
      updatedAt: despesa.updatedAt,
      companyId: despesa.companyId,
    };

    console.log('✅ Despesa atualizada:', despesaMapeada);

    res.json(despesaMapeada);
  } catch (error) {
    console.error('❌ Erro ao atualizar despesa:', error);
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
