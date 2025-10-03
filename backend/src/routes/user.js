const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

// Rota para usuário verificar sua própria assinatura
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('🔍 Verificando assinatura do usuário:', userId);

    // Buscar assinatura ativa do usuário
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!subscription) {
      console.log('❌ Nenhuma assinatura ativa encontrada para o usuário:', userId);
      return res.status(404).json({
        message: 'Nenhuma assinatura ativa encontrada',
        hasActiveSubscription: false,
      });
    }

    console.log('✅ Assinatura ativa encontrada:', {
      id: subscription.id,
      plan: subscription.plan.name,
      isActive: subscription.isActive,
    });

    res.json({
      id: subscription.id,
      planId: subscription.planId,
      isActive: subscription.isActive,
      startDate: subscription.startDate,
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        price: subscription.plan.price,
        description: subscription.plan.description,
      },
      hasActiveSubscription: true,
    });
  } catch (error) {
    console.error('💥 Erro ao buscar assinatura:', error);
    res.status(500).json({
      message: 'Erro ao buscar assinatura',
      error: error.message,
    });
  }
});

module.exports = router;
