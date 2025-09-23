const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Dashboard com estatísticas gerais
exports.getDashboard = async (req, res) => {
  try {
    console.log('Executando getDashboard...');

    const totalUsers = await prisma.user.count();
    console.log('Total users:', totalUsers);

    const totalCompanies = await prisma.company.count();
    console.log('Total companies:', totalCompanies);

    // Como pode não ter subscription ainda, vamos fazer um try/catch
    let activeSubscriptions = 0;
    let totalRevenue = 0;

    try {
      activeSubscriptions = await prisma.subscription.count({
        where: { status: 'active' },
      });

      const revenueResult = await prisma.subscription.aggregate({
        where: { status: 'active' },
        _sum: { amount: true },
      });

      totalRevenue = revenueResult._sum.amount || 0;
    } catch (subscriptionError) {
      console.log('Subscription table not found, using default values');
      activeSubscriptions = 0;
      totalRevenue = 0;
    }

    const stats = {
      totalUsers,
      totalCompanies,
      activeSubscriptions,
      totalRevenue,
    };

    console.log('Stats finais:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Erro no getDashboard:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
};

// Listar todos os usuários com suas informações
exports.getAllUsers = async (req, res) => {
  try {
    console.log('Executando getAllUsers...');
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    console.log('Parâmetros:', { page, limit, search, skip });

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    console.log('Where clause:', JSON.stringify(where, null, 2));

    const users = await prisma.user.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        Company: true, // <-- MUDANÇA CRÍTICA: Company com C maiúsculo, não company
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.user.count({ where });

    const usersWithStatus = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      company: user.Company, // <-- Mapeando Company para company (minúsculo)
      currentSubscription: null,
      planStatus: 'no_plan',
    }));

    console.log(`Encontrados ${users.length} usuários de ${total} total`);
    
    // Log detalhado dos primeiros usuários
    usersWithStatus.slice(0, 2).forEach((user, index) => {
      console.log(`Usuário ${index + 1}:`, {
        name: user.name,
        email: user.email,
        hasCompany: !!user.company,
        companyName: user.company?.companyName || 'N/A'
      });
    });

    res.json({
      users: usersWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
};

// Buscar detalhes completos de um usuário
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Buscando detalhes do usuário:', userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Company: true, // <-- Company com C maiúsculo
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Ajustar o nome do campo para o frontend
    const userWithDetails = {
      ...user,
      company: user.Company, // <-- Mapear Company para company
      subscriptions: [],
      consultingSessions: [],
    };

    console.log('Usuário encontrado:', userWithDetails.name);
    res.json(userWithDetails);
  } catch (error) {
    console.error('Erro ao buscar detalhes do usuário:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
};

// Atualizar status do usuário
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    console.log('Atualizando status do usuário:', userId, 'para:', isActive);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: Boolean(isActive) },
    });

    console.log('Status atualizado com sucesso');

    res.json({
      message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      user,
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: error.message,
    });
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
        createdAt: { gte: startDate },
      },
    });

    res.json({
      period: `${days} dias`,
      newUsers,
      newSubscriptions: 0,
      revenue: 0,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
};