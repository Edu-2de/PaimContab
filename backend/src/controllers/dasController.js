const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Função para calcular o DAS baseado na receita bruta
const calculateDAS = (revenue) => {
  // Para MEI: Anexo XI do Simples Nacional
  // Alíquota única de 6% sobre a receita bruta até R$ 6.750 por mês (R$ 81.000 por ano)
  const DAS_RATE = 0.06;
  const MIN_DAS_VALUE = 66.60; // Valor mínimo do DAS MEI 2024
  
  const calculatedDAS = revenue * DAS_RATE;
  return Math.max(calculatedDAS, MIN_DAS_VALUE);
};

// Função para calcular a data de vencimento do DAS
const getDueDate = (competencyMonth) => {
  const [year, month] = competencyMonth.split('-');
  const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
  const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
  
  // DAS vence sempre no dia 20 do mês seguinte
  return new Date(nextYear, nextMonth - 1, 20);
};

// Listar cálculos de DAS
const getDASCalculations = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { year, isPaid, page = 1, limit = 50 } = req.query;
    
    const skip = (page - 1) * limit;
    
    let where = { companyId };
    
    if (year) {
      where.month = {
        contains: year
      };
    }
    
    if (isPaid !== undefined) {
      where.isPaid = isPaid === 'true';
    }

    const [dasCalculations, total] = await Promise.all([
      prisma.dASCalculation.findMany({
        where,
        orderBy: { month: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.dASCalculation.count({ where })
    ]);

    res.json({
      dasCalculations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar cálculos DAS:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar cálculo DAS por ID
const getDASById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const dasCalculation = await prisma.dASCalculation.findUnique({
      where: { id },
      include: {
        company: {
          select: { companyName: true }
        }
      }
    });

    if (!dasCalculation) {
      return res.status(404).json({ error: 'Cálculo DAS não encontrado' });
    }

    res.json(dasCalculation);
  } catch (error) {
    console.error('Erro ao buscar cálculo DAS:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Calcular DAS para um mês específico
const calculateDASForMonth = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { month, customRevenue } = req.body; // month no formato YYYY-MM

    if (!month) {
      return res.status(400).json({ error: 'Mês é obrigatório (formato: YYYY-MM)' });
    }

    // Verificar se a empresa existe
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    let revenue = 0;

    if (customRevenue !== undefined) {
      // Usar receita customizada
      revenue = parseFloat(customRevenue);
    } else {
      // Calcular receita baseada nas receitas registradas
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);

      const receitasAggregate = await prisma.receita.aggregate({
        where: {
          companyId,
          date: {
            gte: startDate,
            lte: endDate
          },
          status: 'Recebido' // Apenas receitas recebidas
        },
        _sum: { value: true }
      });

      revenue = receitasAggregate._sum.value || 0;
    }

    const dasValue = calculateDAS(revenue);
    const dueDate = getDueDate(month);

    // Verificar se já existe um cálculo para este mês
    const existingDAS = await prisma.dASCalculation.findUnique({
      where: {
        companyId_month: {
          companyId,
          month
        }
      }
    });

    let dasCalculation;

    if (existingDAS) {
      // Atualizar cálculo existente
      dasCalculation = await prisma.dASCalculation.update({
        where: { id: existingDAS.id },
        data: {
          revenue,
          dasValue,
          dueDate
        }
      });
    } else {
      // Criar novo cálculo
      dasCalculation = await prisma.dASCalculation.create({
        data: {
          companyId,
          month,
          revenue,
          dasValue,
          dueDate
        }
      });
    }

    res.json(dasCalculation);
  } catch (error) {
    console.error('Erro ao calcular DAS:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Marcar DAS como pago
const markDASAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentDate } = req.body;

    const existingDAS = await prisma.dASCalculation.findUnique({
      where: { id }
    });

    if (!existingDAS) {
      return res.status(404).json({ error: 'Cálculo DAS não encontrado' });
    }

    if (existingDAS.isPaid) {
      return res.status(400).json({ error: 'DAS já foi marcado como pago' });
    }

    const dasCalculation = await prisma.dASCalculation.update({
      where: { id },
      data: {
        isPaid: true,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date()
      }
    });

    res.json(dasCalculation);
  } catch (error) {
    console.error('Erro ao marcar DAS como pago:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Marcar DAS como pendente (desfazer pagamento)
const markDASAsPending = async (req, res) => {
  try {
    const { id } = req.params;

    const existingDAS = await prisma.dASCalculation.findUnique({
      where: { id }
    });

    if (!existingDAS) {
      return res.status(404).json({ error: 'Cálculo DAS não encontrado' });
    }

    const dasCalculation = await prisma.dASCalculation.update({
      where: { id },
      data: {
        isPaid: false,
        paymentDate: null
      }
    });

    res.json(dasCalculation);
  } catch (error) {
    console.error('Erro ao marcar DAS como pendente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter estatísticas de DAS
const getDASStats = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    const where = {
      companyId,
      month: {
        contains: year.toString()
      }
    };

    // Totais gerais
    const totalGeral = await prisma.dASCalculation.aggregate({
      where,
      _sum: { dasValue: true, revenue: true },
      _count: true
    });

    const totalPago = await prisma.dASCalculation.aggregate({
      where: { ...where, isPaid: true },
      _sum: { dasValue: true },
      _count: true
    });

    const totalPendente = await prisma.dASCalculation.aggregate({
      where: { ...where, isPaid: false },
      _sum: { dasValue: true },
      _count: true
    });

    // DAS por mês
    const dasCalculations = await prisma.dASCalculation.findMany({
      where,
      orderBy: { month: 'asc' },
      select: {
        month: true,
        dasValue: true,
        revenue: true,
        isPaid: true,
        dueDate: true
      }
    });

    // Verificar DAS vencidos
    const today = new Date();
    const vencidos = dasCalculations.filter(das => 
      !das.isPaid && new Date(das.dueDate) < today
    );

    // Próximos a vencer (próximos 30 dias)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const proximosVencer = dasCalculations.filter(das => 
      !das.isPaid && 
      new Date(das.dueDate) >= today && 
      new Date(das.dueDate) <= thirtyDaysFromNow
    );

    res.json({
      totais: {
        geral: {
          valorDAS: totalGeral._sum.dasValue || 0,
          receita: totalGeral._sum.revenue || 0,
          quantidade: totalGeral._count
        },
        pago: {
          valorDAS: totalPago._sum.dasValue || 0,
          quantidade: totalPago._count
        },
        pendente: {
          valorDAS: totalPendente._sum.dasValue || 0,
          quantidade: totalPendente._count
        }
      },
      alertas: {
        vencidos: {
          quantidade: vencidos.length,
          valor: vencidos.reduce((sum, das) => sum + das.dasValue, 0)
        },
        proximosVencer: {
          quantidade: proximosVencer.length,
          valor: proximosVencer.reduce((sum, das) => sum + das.dasValue, 0)
        }
      },
      porMes: dasCalculations.map(das => ({
        mes: das.month,
        receita: das.revenue,
        valorDAS: das.dasValue,
        pago: das.isPaid,
        dataVencimento: das.dueDate
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas DAS:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Calcular DAS automaticamente para todos os meses com receitas
const autoCalculateDAS = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    // Verificar se a empresa existe
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Buscar receitas agrupadas por mês
    const receitasPorMes = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(value) as total_revenue
      FROM "Receita" 
      WHERE "companyId" = ${companyId} 
      AND EXTRACT(YEAR FROM date) = ${parseInt(year)}
      AND status = 'Recebido'
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month
    `;

    const results = [];

    for (const receitaData of receitasPorMes) {
      const month = receitaData.month;
      const revenue = parseFloat(receitaData.total_revenue);
      const dasValue = calculateDAS(revenue);
      const dueDate = getDueDate(month);

      // Verificar se já existe um cálculo para este mês
      const existingDAS = await prisma.dASCalculation.findUnique({
        where: {
          companyId_month: {
            companyId,
            month
          }
        }
      });

      let dasCalculation;

      if (existingDAS) {
        // Atualizar apenas se não foi pago
        if (!existingDAS.isPaid) {
          dasCalculation = await prisma.dASCalculation.update({
            where: { id: existingDAS.id },
            data: {
              revenue,
              dasValue,
              dueDate
            }
          });
        } else {
          dasCalculation = existingDAS;
        }
      } else {
        // Criar novo cálculo
        dasCalculation = await prisma.dASCalculation.create({
          data: {
            companyId,
            month,
            revenue,
            dasValue,
            dueDate
          }
        });
      }

      results.push(dasCalculation);
    }

    res.json({
      message: `${results.length} cálculos de DAS processados`,
      calculations: results
    });
  } catch (error) {
    console.error('Erro ao calcular DAS automaticamente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getDASCalculations,
  getDASById,
  calculateDASForMonth,
  markDASAsPaid,
  markDASAsPending,
  getDASStats,
  autoCalculateDAS
};