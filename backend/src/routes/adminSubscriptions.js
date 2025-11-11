const express = require('express');
const { PrismaClient } = require('@prisma/client');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware de autenticação para todas as rotas de admin
router.use(adminMiddleware);

// GET /api/admin/subscriptions - Listar assinaturas
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { plan: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.isActive = status === 'active';
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          discount: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    // Transformar dados para o formato esperado pelo frontend
    const formattedSubscriptions = subscriptions.map(sub => {
      const basePrice = sub.plan.price;
      const discountPercentage = sub.discount?.isActive ? sub.discount.percentage : 0;
      const finalPrice = basePrice * (1 - discountPercentage / 100);

      return {
        id: sub.id,
        userId: sub.userId,
        planId: sub.planId,
        status: sub.isActive ? 'active' : 'inactive',
        startDate: sub.startDate,
        endDate: sub.endDate,
        amount: finalPrice,
        originalAmount: basePrice,
        discount: sub.discount,
        stripeSubscriptionId: sub.stripeSubscriptionId,
        user: sub.user,
        plan: {
          ...sub.plan,
          billingCycle: 'monthly',
        },
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      };
    });

    res.json({
      subscriptions: formattedSubscriptions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Erro ao buscar assinaturas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/subscriptions/:id - Buscar assinatura por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        plan: true,
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    const formattedSubscription = {
      id: subscription.id,
      userId: subscription.userId,
      planId: subscription.planId,
      status: subscription.isActive ? 'active' : 'inactive',
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      amount: subscription.plan.price,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      user: subscription.user,
      plan: {
        ...subscription.plan,
        billingCycle: 'monthly',
      },
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };

    res.json(formattedSubscription);
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/subscriptions/:id/cancel - Cancelar assinatura
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });

    res.json({
      message: 'Assinatura cancelada com sucesso',
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/subscriptions/:id/reactivate - Reativar assinatura
router.patch('/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        isActive: true,
        endDate: null,
      },
    });

    res.json({
      message: 'Assinatura reativada com sucesso',
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error('Erro ao reativar assinatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/subscriptions/:id/plan - Alterar plano
router.patch('/:id/plan', async (req, res) => {
  try {
    const { id } = req.params;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'planId é obrigatório' });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: { planId },
      include: {
        plan: true,
        user: { select: { name: true, email: true } },
      },
    });

    res.json({
      message: 'Plano alterado com sucesso',
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error('Erro ao alterar plano:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/subscriptions - Criar nova assinatura
router.post('/', async (req, res) => {
  try {
    const { userId, planId, startDate } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({ error: 'Campos obrigatórios: userId, planId' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId, isActive: true },
    });

    if (existingSubscription) {
      return res.status(400).json({ error: 'Usuário já possui uma assinatura ativa' });
    }

    const newSubscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        startDate: startDate ? new Date(startDate) : new Date(),
        isActive: true,
      },
      include: {
        user: { select: { name: true, email: true } },
        plan: true,
      },
    });

    res.status(201).json({
      message: 'Assinatura criada com sucesso',
      subscription: newSubscription,
    });
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/subscriptions/stats/overview - Estatísticas
router.get('/stats/overview', async (req, res) => {
  try {
    const [totalSubscriptions, activeSubscriptions, inactiveSubscriptions, activeSubs] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { isActive: true } }),
      prisma.subscription.count({ where: { isActive: false } }),
      prisma.subscription.findMany({
        where: { isActive: true },
        include: { plan: true },
      }),
    ]);

    const totalRevenue = activeSubs.reduce((sum, sub) => sum + sub.plan.price, 0);

    const subscriptionsByPlan = await prisma.subscription.groupBy({
      by: ['planId'],
      where: { isActive: true },
      _count: true,
    });

    const plansWithCount = await Promise.all(
      subscriptionsByPlan.map(async item => {
        const plan = await prisma.plan.findUnique({ where: { id: item.planId } });
        return {
          planName: plan?.name || 'Desconhecido',
          count: item._count,
        };
      })
    );

    res.json({
      total: totalSubscriptions,
      active: activeSubscriptions,
      inactive: inactiveSubscriptions,
      monthlyRevenue: totalRevenue,
      byPlan: plansWithCount,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
