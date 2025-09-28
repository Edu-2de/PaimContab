const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar despesas de uma empresa
const getDespesas = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { month, category, status, isDeductible, page = 1, limit = 50 } = req.query;

    const skip = (page - 1) * limit;

    const where = {
      companyId,
      ...(month && {
        date: {
          gte: new Date(`${month}-01`),
          lt: new Date(new Date(`${month}-01`).getFullYear(), new Date(`${month}-01`).getMonth() + 1, 1),
        },
      }),
      ...(category && { category }),
      ...(status && { status }),
      ...(isDeductible !== undefined && { isDeductible: isDeductible === 'true' }),
    };

    const [despesas, total] = await Promise.all([
      prisma.despesa.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
      }),
      prisma.despesa.count({ where }),
    ]);

    // Calcular totais
    const totalValue = await prisma.despesa.aggregate({
      where,
      _sum: { value: true },
    });

    res.json({
      despesas,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
      summary: {
        totalValue: totalValue._sum.value || 0,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar despesa por ID
const getDespesaById = async (req, res) => {
  try {
    const { id } = req.params;

    const despesa = await prisma.despesa.findUnique({
      where: { id },
      include: {
        company: {
          select: { companyName: true },
        },
      },
    });

    if (!despesa) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    res.json(despesa);
  } catch (error) {
    console.error('Erro ao buscar despesa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova despesa
const createDespesa = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { description, value, date, category, supplier, invoiceNumber, paymentMethod, status, isDeductible } =
      req.body;

    // Validações
    if (!description || !value || !date || !category) {
      return res.status(400).json({
        error: 'Campos obrigatórios: description, value, date, category',
      });
    }

    if (value <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }

    const paymentMethods = ['PIX', 'Dinheiro', 'Cartão Débito', 'Cartão Crédito', 'Transferência', 'Boleto'];
    if (paymentMethod && !paymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Forma de pagamento inválida' });
    }

    const statusOptions = ['Pago', 'Pendente', 'Cancelado'];
    if (status && !statusOptions.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    // Verificar se a empresa existe
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const despesa = await prisma.despesa.create({
      data: {
        companyId,
        description,
        value: parseFloat(value),
        date: new Date(date),
        category,
        supplier,
        invoiceNumber,
        paymentMethod: paymentMethod || 'PIX',
        status: status || 'Pago',
        isDeductible: isDeductible !== undefined ? isDeductible : true,
      },
    });

    res.status(201).json(despesa);
  } catch (error) {
    console.error('Erro ao criar despesa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar despesa
const updateDespesa = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, value, date, category, supplier, invoiceNumber, paymentMethod, status, isDeductible } =
      req.body;

    // Verificar se a despesa existe
    const existingDespesa = await prisma.despesa.findUnique({
      where: { id },
    });

    if (!existingDespesa) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    // Validações
    if (value !== undefined && value <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }

    const paymentMethods = ['PIX', 'Dinheiro', 'Cartão Débito', 'Cartão Crédito', 'Transferência', 'Boleto'];
    if (paymentMethod && !paymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Forma de pagamento inválida' });
    }

    const statusOptions = ['Pago', 'Pendente', 'Cancelado'];
    if (status && !statusOptions.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const despesa = await prisma.despesa.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(value !== undefined && { value: parseFloat(value) }),
        ...(date && { date: new Date(date) }),
        ...(category && { category }),
        ...(supplier !== undefined && { supplier }),
        ...(invoiceNumber !== undefined && { invoiceNumber }),
        ...(paymentMethod && { paymentMethod }),
        ...(status && { status }),
        ...(isDeductible !== undefined && { isDeductible }),
      },
    });

    res.json(despesa);
  } catch (error) {
    console.error('Erro ao atualizar despesa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar despesa
const deleteDespesa = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a despesa existe
    const existingDespesa = await prisma.despesa.findUnique({
      where: { id },
    });

    if (!existingDespesa) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    await prisma.despesa.delete({
      where: { id },
    });

    res.json({ message: 'Despesa excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir despesa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter estatísticas de despesas
const getDespesasStats = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59`);

    const where = {
      companyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Totais por status
    const totalGeral = await prisma.despesa.aggregate({
      where,
      _sum: { value: true },
      _count: true,
    });

    const pagas = await prisma.despesa.aggregate({
      where: { ...where, status: 'Pago' },
      _sum: { value: true },
      _count: true,
    });

    const pendentes = await prisma.despesa.aggregate({
      where: { ...where, status: 'Pendente' },
      _sum: { value: true },
      _count: true,
    });

    const dedutiveis = await prisma.despesa.aggregate({
      where: { ...where, isDeductible: true },
      _sum: { value: true },
      _count: true,
    });

    // Despesas por mês
    const despesasPorMes = await prisma.$queryRaw`
      SELECT 
        EXTRACT(MONTH FROM date) as month,
        SUM(value) as total,
        COUNT(*) as count
      FROM "Despesa" 
      WHERE "companyId" = ${companyId} 
      AND EXTRACT(YEAR FROM date) = ${parseInt(year)}
      GROUP BY EXTRACT(MONTH FROM date)
      ORDER BY month
    `;

    // Despesas por categoria
    const despesasPorCategoria = await prisma.despesa.groupBy({
      by: ['category'],
      where,
      _sum: { value: true },
      _count: true,
      orderBy: { _sum: { value: 'desc' } },
    });

    res.json({
      totais: {
        geral: {
          valor: totalGeral._sum.value || 0,
          quantidade: totalGeral._count,
        },
        pagas: {
          valor: pagas._sum.value || 0,
          quantidade: pagas._count,
        },
        pendentes: {
          valor: pendentes._sum.value || 0,
          quantidade: pendentes._count,
        },
        dedutiveis: {
          valor: dedutiveis._sum.value || 0,
          quantidade: dedutiveis._count,
        },
      },
      porMes: despesasPorMes.map(item => ({
        mes: parseInt(item.month),
        total: parseFloat(item.total),
        quantidade: parseInt(item.count),
      })),
      porCategoria: despesasPorCategoria.map(item => ({
        categoria: item.category,
        total: item._sum.value || 0,
        quantidade: item._count,
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de despesas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getDespesas,
  getDespesaById,
  createDespesa,
  updateDespesa,
  deleteDespesa,
  getDespesasStats,
};
