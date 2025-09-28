const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar receitas de uma empresa
const getReceitas = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { month, category, status, page = 1, limit = 50 } = req.query;

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
    };

    const [receitas, total] = await Promise.all([
      prisma.receita.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
      }),
      prisma.receita.count({ where }),
    ]);

    // Calcular totais
    const totalValue = await prisma.receita.aggregate({
      where,
      _sum: { value: true },
    });

    res.json({
      receitas,
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
    console.error('Erro ao buscar receitas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar receita por ID
const getReceitaById = async (req, res) => {
  try {
    const { id } = req.params;

    const receita = await prisma.receita.findUnique({
      where: { id },
      include: {
        company: {
          select: { companyName: true },
        },
      },
    });

    if (!receita) {
      return res.status(404).json({ error: 'Receita não encontrada' });
    }

    res.json(receita);
  } catch (error) {
    console.error('Erro ao buscar receita:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova receita
const createReceita = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { description, value, date, category, clientName, invoiceNumber, paymentMethod, status } = req.body;

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

    const statusOptions = ['Recebido', 'Pendente', 'Cancelado'];
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

    const receita = await prisma.receita.create({
      data: {
        companyId,
        description,
        value: parseFloat(value),
        date: new Date(date),
        category,
        clientName,
        invoiceNumber,
        paymentMethod: paymentMethod || 'PIX',
        status: status || 'Recebido',
      },
    });

    res.status(201).json(receita);
  } catch (error) {
    console.error('Erro ao criar receita:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar receita
const updateReceita = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, value, date, category, clientName, invoiceNumber, paymentMethod, status } = req.body;

    // Verificar se a receita existe
    const existingReceita = await prisma.receita.findUnique({
      where: { id },
    });

    if (!existingReceita) {
      return res.status(404).json({ error: 'Receita não encontrada' });
    }

    // Validações
    if (value !== undefined && value <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }

    const paymentMethods = ['PIX', 'Dinheiro', 'Cartão Débito', 'Cartão Crédito', 'Transferência', 'Boleto'];
    if (paymentMethod && !paymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Forma de pagamento inválida' });
    }

    const statusOptions = ['Recebido', 'Pendente', 'Cancelado'];
    if (status && !statusOptions.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const receita = await prisma.receita.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(value !== undefined && { value: parseFloat(value) }),
        ...(date && { date: new Date(date) }),
        ...(category && { category }),
        ...(clientName !== undefined && { clientName }),
        ...(invoiceNumber !== undefined && { invoiceNumber }),
        ...(paymentMethod && { paymentMethod }),
        ...(status && { status }),
      },
    });

    res.json(receita);
  } catch (error) {
    console.error('Erro ao atualizar receita:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar receita
const deleteReceita = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a receita existe
    const existingReceita = await prisma.receita.findUnique({
      where: { id },
    });

    if (!existingReceita) {
      return res.status(404).json({ error: 'Receita não encontrada' });
    }

    await prisma.receita.delete({
      where: { id },
    });

    res.json({ message: 'Receita excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir receita:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter estatísticas de receitas
const getReceitasStats = async (req, res) => {
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
    const totalGeral = await prisma.receita.aggregate({
      where,
      _sum: { value: true },
      _count: true,
    });

    const recebidas = await prisma.receita.aggregate({
      where: { ...where, status: 'Recebido' },
      _sum: { value: true },
      _count: true,
    });

    const pendentes = await prisma.receita.aggregate({
      where: { ...where, status: 'Pendente' },
      _sum: { value: true },
      _count: true,
    });

    // Receitas por mês
    const receitasPorMes = await prisma.$queryRaw`
      SELECT 
        EXTRACT(MONTH FROM date) as month,
        SUM(value) as total,
        COUNT(*) as count
      FROM "Receita" 
      WHERE "companyId" = ${companyId} 
      AND EXTRACT(YEAR FROM date) = ${parseInt(year)}
      GROUP BY EXTRACT(MONTH FROM date)
      ORDER BY month
    `;

    // Receitas por categoria
    const receitasPorCategoria = await prisma.receita.groupBy({
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
        recebidas: {
          valor: recebidas._sum.value || 0,
          quantidade: recebidas._count,
        },
        pendentes: {
          valor: pendentes._sum.value || 0,
          quantidade: pendentes._count,
        },
      },
      porMes: receitasPorMes.map(item => ({
        mes: parseInt(item.month),
        total: parseFloat(item.total),
        quantidade: parseInt(item.count),
      })),
      porCategoria: receitasPorCategoria.map(item => ({
        categoria: item.category,
        total: item._sum.value || 0,
        quantidade: item._count,
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de receitas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getReceitas,
  getReceitaById,
  createReceita,
  updateReceita,
  deleteReceita,
  getReceitasStats,
};
