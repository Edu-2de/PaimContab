const express = require('express');
const { PrismaClient } = require('@prisma/client');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware de autenticação para todas as rotas de admin
router.use(adminMiddleware);

// GET /api/admin/reports - Obter estatísticas do sistema
router.get('/', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Calcular período baseado no parâmetro
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Buscar estatísticas reais do banco de dados
    const [totalUsers, totalCompanies, activeUsers, newUsersThisMonth] = await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
      }),
    ]);

    // Como não temos assinaturas reais ainda, vou usar dados simulados
    // Em um cenário real, você faria queries para o modelo Subscription
    const mockStats = {
      totalUsers,
      totalCompanies,
      totalSubscriptions: 45,
      totalRevenue: 15750.8,
      monthlyRevenue: 3250.9,
      activeUsers,
      newUsersThisMonth,
      subscriptionsByStatus: {
        active: 32,
        inactive: 8,
        pending: 3,
        cancelled: 2,
      },
    };

    res.json(mockStats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/reports/users - Relatório detalhado de usuários
router.get('/users', async (req, res) => {
  try {
    const { period = 'month', format = 'json' } = req.query;

    // Buscar usuários com informações de empresa
    const users = await prisma.user.findMany({
      include: {
        company: {
          select: {
            name: true,
            cnpj: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      // Gerar CSV
      const csvHeader = 'ID,Nome,Email,Ativo,Empresa,CNPJ,Data Criação\n';
      const csvData = users
        .map(
          user =>
            `${user.id},${user.name},${user.email},${user.isActive ? 'Sim' : 'Não'},${user.company?.name || 'N/A'},${
              user.company?.cnpj || 'N/A'
            },${user.createdAt.toISOString().split('T')[0]}`
        )
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio-usuarios.csv"');
      res.send(csvHeader + csvData);
    } else {
      res.json(users);
    }
  } catch (error) {
    console.error('Erro ao gerar relatório de usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/reports/financial - Relatório financeiro
router.get('/financial', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Mock data para relatório financeiro
    // Em um cenário real, você faria queries para transações/pagamentos
    const financialData = {
      period,
      totalRevenue: 15750.8,
      monthlyRecurring: 12500.9,
      oneTimePayments: 3249.9,
      refunds: 250.0,
      netRevenue: 15500.8,
      revenueByPlan: {
        basic: 5250.3,
        premium: 8750.5,
        enterprise: 1750.0,
      },
      monthlyGrowth: 12.5,
      conversionRate: 3.2,
      churnRate: 2.1,
    };

    res.json(financialData);
  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/reports/subscriptions - Relatório de assinaturas
router.get('/subscriptions', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Mock data para relatório de assinaturas
    const subscriptionData = {
      period,
      total: 45,
      active: 32,
      inactive: 8,
      pending: 3,
      cancelled: 2,
      renewals: 28,
      newSubscriptions: 7,
      churnedSubscriptions: 2,
      revenueImpact: {
        newRevenue: 420.3,
        lostRevenue: 119.8,
        netRevenue: 300.5,
      },
      planDistribution: {
        basic: 20,
        premium: 18,
        enterprise: 7,
      },
    };

    res.json(subscriptionData);
  } catch (error) {
    console.error('Erro ao gerar relatório de assinaturas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/reports/export - Exportar relatórios
router.get('/export', async (req, res) => {
  try {
    const { type, format = 'csv' } = req.query;

    switch (type) {
      case 'users':
        // Redirecionar para relatório de usuários com formato CSV
        return res.redirect(`/api/admin/reports/users?format=${format}`);

      case 'financial':
        const financialData = await fetch(`${req.protocol}://${req.get('host')}/api/admin/reports/financial`);
        const financial = await financialData.json();

        if (format === 'csv') {
          const csvData = `Período,Receita Total,Receita Recorrente,Pagamentos Únicos,Reembolsos,Receita Líquida\n${financial.period},${financial.totalRevenue},${financial.monthlyRecurring},${financial.oneTimePayments},${financial.refunds},${financial.netRevenue}`;

          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename="relatorio-financeiro.csv"');
          res.send(csvData);
        } else {
          res.json(financial);
        }
        break;

      default:
        res.status(400).json({ error: 'Tipo de relatório inválido' });
    }
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
