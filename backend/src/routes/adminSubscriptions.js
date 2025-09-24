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
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { plan: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Como não temos modelo Subscription ainda, vou simular os dados
    // Em um cenário real, você criaria o modelo no Prisma Schema
    const mockSubscriptions = [
      {
        id: '1',
        userId: '1',
        planId: '1',
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-01-01'),
        amount: 29.9,
        paymentMethod: 'credit_card',
        user: { name: 'João Silva', email: 'joao@example.com' },
        plan: { name: 'Plano Básico', price: 29.9, billingCycle: 'monthly' },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        userId: '2',
        planId: '2',
        status: 'pending',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2025-02-01'),
        amount: 59.9,
        paymentMethod: 'boleto',
        user: { name: 'Maria Santos', email: 'maria@example.com' },
        plan: { name: 'Plano Premium', price: 59.9, billingCycle: 'monthly' },
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
      },
    ];

    const filteredSubscriptions = mockSubscriptions.filter(sub => {
      if (status && sub.status !== status) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          sub.user.name.toLowerCase().includes(searchLower) ||
          sub.user.email.toLowerCase().includes(searchLower) ||
          sub.plan.name.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });

    const total = filteredSubscriptions.length;
    const subscriptions = filteredSubscriptions.slice(skip, skip + parseInt(limit));

    res.json({
      subscriptions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
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

    // Mock data para assinatura específica
    const mockSubscription = {
      id,
      userId: '1',
      planId: '1',
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01'),
      amount: 29.9,
      paymentMethod: 'credit_card',
      user: { name: 'João Silva', email: 'joao@example.com' },
      plan: { name: 'Plano Básico', price: 29.9, billingCycle: 'monthly' },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    res.json(mockSubscription);
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/subscriptions/:id/cancel - Cancelar assinatura
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    // Em um cenário real, você atualizaria o status da assinatura
    // await prisma.subscription.update({
    //   where: { id },
    //   data: { status: 'cancelled' }
    // });

    res.json({ message: 'Assinatura cancelada com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/subscriptions - Criar nova assinatura
router.post('/', async (req, res) => {
  try {
    const { userId, planId, amount, paymentMethod } = req.body;

    // Validações básicas
    if (!userId || !planId || !amount) {
      return res.status(400).json({ error: 'Campos obrigatórios: userId, planId, amount' });
    }

    // Em um cenário real, você criaria a assinatura no banco
    const newSubscription = {
      id: Date.now().toString(),
      userId,
      planId,
      status: 'active',
      startDate: new Date(),
      amount: parseFloat(amount),
      paymentMethod,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    res.status(201).json(newSubscription);
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
