const express = require('express');
const { PrismaClient } = require('@prisma/client');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware de autenticação para todas as rotas de admin
router.use(adminMiddleware);

// GET /api/admin/reports/overview - Relatório geral do sistema
router.get('/overview', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalCompanies,
      totalSubscriptions,
      activeSubscriptions,
      totalReceitas,
      totalDespesas,
      totalPlans,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.company.count(),
      prisma.subscription.count(),
      prisma.subscription.count({ where: { isActive: true } }),
      prisma.receita.count(),
      prisma.despesa.count(),
      prisma.plan.count(),
    ]);

    // Receita total do sistema
    const receitas = await prisma.receita.findMany({
      select: { value: true },
    });
    const receitaTotal = receitas.reduce((sum, r) => sum + r.value, 0);

    // Despesa total do sistema
    const despesas = await prisma.despesa.findMany({
      select: { value: true },
    });
    const despesaTotal = despesas.reduce((sum, d) => sum + d.value, 0);

    // Receita mensal de assinaturas
    const activeSubs = await prisma.subscription.findMany({
      where: { isActive: true },
      include: { plan: true },
    });
    const monthlyRevenue = activeSubs.reduce((sum, sub) => sum + sub.plan.price, 0);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      companies: {
        total: totalCompanies,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        inactive: totalSubscriptions - activeSubscriptions,
        monthlyRevenue,
      },
      finances: {
        totalReceitas: receitaTotal,
        totalDespesas: despesaTotal,
        lucro: receitaTotal - despesaTotal,
      },
      plans: {
        total: totalPlans,
      },
      transactions: {
        totalReceitas,
        totalDespesas,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar relatório geral:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/reports/subscriptions - Relatório de assinaturas
router.get('/subscriptions', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        plan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Agrupar por plano
    const byPlan = await prisma.subscription.groupBy({
      by: ['planId'],
      where: { ...where, isActive: true },
      _count: true,
    });

    const plansData = await Promise.all(
      byPlan.map(async item => {
        const plan = await prisma.plan.findUnique({
          where: { id: item.planId },
        });
        return {
          planId: item.planId,
          planName: plan?.name || 'Desconhecido',
          count: item._count,
          price: plan?.price || 0,
          revenue: (plan?.price || 0) * item._count,
        };
      })
    );

    // Estatísticas
    const totalActive = subscriptions.filter(s => s.isActive).length;
    const totalInactive = subscriptions.filter(s => !s.isActive).length;
    const totalRevenue = plansData.reduce((sum, p) => sum + p.revenue, 0);

    res.json({
      summary: {
        total: subscriptions.length,
        active: totalActive,
        inactive: totalInactive,
        totalRevenue,
      },
      byPlan: plansData,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        userName: sub.user.name,
        userEmail: sub.user.email,
        planName: sub.plan.name,
        planPrice: sub.plan.price,
        status: sub.isActive ? 'active' : 'inactive',
        startDate: sub.startDate,
        endDate: sub.endDate,
        createdAt: sub.createdAt,
      })),
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de assinaturas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/reports/finances - Relatório financeiro
router.get('/finances', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [receitas, despesas] = await Promise.all([
      prisma.receita.findMany({
        where,
        include: {
          company: {
            select: {
              companyName: true,
              cnpj: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      }),
      prisma.despesa.findMany({
        where,
        include: {
          company: {
            select: {
              companyName: true,
              cnpj: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      }),
    ]);

    const totalReceitas = receitas.reduce((sum, r) => sum + r.value, 0);
    const totalDespesas = despesas.reduce((sum, d) => sum + d.value, 0);

    // Agrupar receitas por categoria
    const receitasByCategory = receitas.reduce((acc, r) => {
      const cat = r.category || 'Outros';
      if (!acc[cat]) acc[cat] = { count: 0, total: 0 };
      acc[cat].count++;
      acc[cat].total += r.value;
      return acc;
    }, {});

    // Agrupar despesas por categoria
    const despesasByCategory = despesas.reduce((acc, d) => {
      const cat = d.category || 'Outros';
      if (!acc[cat]) acc[cat] = { count: 0, total: 0 };
      acc[cat].count++;
      acc[cat].total += d.value;
      return acc;
    }, {});

    res.json({
      summary: {
        totalReceitas,
        totalDespesas,
        lucro: totalReceitas - totalDespesas,
        receitasCount: receitas.length,
        despesasCount: despesas.length,
      },
      receitasByCategory: Object.entries(receitasByCategory).map(([category, data]) => ({
        category,
        ...data,
      })),
      despesasByCategory: Object.entries(despesasByCategory).map(([category, data]) => ({
        category,
        ...data,
      })),
    });
  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
