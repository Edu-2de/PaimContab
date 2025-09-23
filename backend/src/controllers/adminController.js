const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Dashboard com estatísticas gerais
exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalCompanies = await prisma.company.count();
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'active' }
    });
    const totalRevenue = await prisma.subscription.aggregate({
      where: { status: 'active' },
      _sum: { amount: true }
    });

    res.json({
      totalUsers,
      totalCompanies,
      activeSubscriptions,
      totalRevenue: totalRevenue._sum.amount || 0
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Listar todos os usuários com suas informações
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const users = await prisma.user.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        company: true,
        subscriptions: {
          include: {
            plan: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where });

    const usersWithStatus = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      company: user.company,
      currentSubscription: user.subscriptions[0] || null,
      planStatus: user.subscriptions[0] ? user.subscriptions[0].status : 'no_plan'
    }));

    res.json({
      users: usersWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Buscar detalhes completos de um usuário
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        subscriptions: {
          include: {
            plan: true
          },
          orderBy: { createdAt: 'desc' }
        },
        consultingSessions: {
          orderBy: { scheduledAt: 'desc' },
          take: 5
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar detalhes do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Atualizar status do usuário
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive }
    });

    res.json({
      message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      user
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Estatísticas por período
exports.getStats = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const newUsers = await prisma.user.count({
      where: {
        createdAt: { gte: startDate }
      }
    });

    const newSubscriptions = await prisma.subscription.count({
      where: {
        createdAt: { gte: startDate }
      }
    });

    const revenueInPeriod = await prisma.subscription.aggregate({
      where: {
        createdAt: { gte: startDate },
        status: 'active'
      },
      _sum: { amount: true }
    });

    res.json({
      period: `${days} dias`,
      newUsers,
      newSubscriptions,
      revenue: revenueInPeriod._sum.amount || 0
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};