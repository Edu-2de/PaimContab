const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Controller function to get dashboard statistics
const getDashboard = async (req, res) => {
  try {
    console.log('� Buscando estatísticas do dashboard...');

    // Get total users
    const totalUsers = await prisma.user.count();
    console.log('� Total de usuários:', totalUsers);

    // Get active users
    const activeUsers = await prisma.user.count({
      where: { isActive: true },
    });
    console.log('✅ Usuários ativos:', activeUsers);

    // Get users with companies (Company é one-to-one, não many)
    const usersWithCompany = await prisma.user.count({
      where: {
        Company: {
          isNot: null,
        },
      },
    });
    console.log('🏢 Usuários com empresa:', usersWithCompany);

    // Get active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: { isActive: true },
    });
    console.log('💳 Assinaturas ativas:', activeSubscriptions);

    // Get total companies
    const totalCompanies = await prisma.company.count();
    console.log('🏢 Total de empresas:', totalCompanies);

    const stats = {
      totalUsers,
      activeUsers,
      usersWithCompany,
      totalCompanies,
      activeSubscriptions,
      inactiveUsers: totalUsers - activeUsers,
    };

    console.log('✅ Dashboard carregado com sucesso');
    res.json(stats);
  } catch (error) {
    console.error('� Erro ao carregar dashboard:', error);
    res.status(500).json({
      message: 'Erro ao carregar dashboard',
      error: error.message,
    });
  }
};

// Controller function to get all users
const getAllUsers = async (req, res) => {
  try {
    console.log('👥 Buscando todos os usuários...');

    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search condition
    const searchCondition = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // Get users with pagination
    const users = await prisma.user.findMany({
      where: searchCondition,
      include: {
        Company: true,
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    });

    // Get total count for pagination
    const totalUsers = await prisma.user.count({
      where: searchCondition,
    });

    // Format users data
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      company: user.Company,
      currentSubscription: user.subscriptions[0] || null,
      planStatus: user.subscriptions[0]?.isActive ? 'active' : 'no_plan',
    }));

    const response = {
      users: formattedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
      },
    };

    console.log(`✅ ${users.length} usuários encontrados`);
    res.json(response);
  } catch (error) {
    console.error('💥 Erro ao buscar usuários:', error);
    res.status(500).json({
      message: 'Erro ao buscar usuários',
      error: error.message,
    });
  }
};

// Controller function to get user details
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🔍 Buscando detalhes do usuário:', userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Company: true,
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return res.status(404).json({
        message: 'Usuário não encontrado',
      });
    }

    // Mapear o campo Company para company (minúsculo) para consistency
    const userResponse = {
      ...user,
      company: user.Company,
      Company: undefined, // Remove o campo Company maiúsculo
    };

    console.log('✅ Detalhes do usuário carregados:', user.name);
    console.log('📊 Empresa encontrada:', user.Company ? 'Sim' : 'Não');
    res.json(userResponse);
  } catch (error) {
    console.error('💥 Erro ao buscar detalhes do usuário:', error);
    res.status(500).json({
      message: 'Erro ao buscar detalhes do usuário',
      error: error.message,
    });
  }
};

// Controller function to update user status
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, planStatus } = req.body;

    console.log('⚡ Atualizando status do usuário:', userId, { isActive, planStatus });

    const updateData = {};
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    if (planStatus) {
      updateData.planStatus = planStatus;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        Company: true,
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    console.log('✅ Status do usuário atualizado:', user.name);
    res.json(user);
  } catch (error) {
    console.error('💥 Erro ao atualizar status do usuário:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        message: 'Usuário não encontrado',
      });
    }

    res.status(500).json({
      message: 'Erro ao atualizar status do usuário',
      error: error.message,
    });
  }
};

// Controller function to update user basic info
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, isActive } = req.body;

    console.log('✏️ Atualizando informações do usuário:', userId);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        isActive,
      },
      include: {
        Company: true,
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Mapear o campo Company para company (minúsculo) para consistency
    const userResponse = {
      ...user,
      company: user.Company,
      Company: undefined,
    };

    console.log('✅ Usuário atualizado com sucesso:', user.name);
    res.json(userResponse);
  } catch (error) {
    console.error('💥 Erro ao atualizar usuário:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        message: 'Usuário não encontrado',
      });
    }

    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(400).json({
        message: 'Este email já está sendo usado por outro usuário',
      });
    }

    res.status(500).json({
      message: 'Erro ao atualizar usuário',
      error: error.message,
    });
  }
};

// Controller function to update user company
const updateUserCompany = async (req, res) => {
  try {
    const { userId } = req.params;
    const companyData = req.body;

    console.log('🏢 Atualizando empresa do usuário:', userId);

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Company: true },
    });

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado',
      });
    }

    let company;
    if (user.Company) {
      // Atualizar empresa existente
      company = await prisma.company.update({
        where: { userId: userId },
        data: companyData,
      });
    } else {
      // Criar nova empresa
      company = await prisma.company.create({
        data: {
          ...companyData,
          userId: userId,
        },
      });
    }

    // Buscar usuário atualizado com a empresa
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Company: true,
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Mapear o campo Company para company (minúsculo)
    const userResponse = {
      ...updatedUser,
      company: updatedUser.Company,
      Company: undefined,
    };

    console.log('✅ Empresa atualizada com sucesso');
    res.json(userResponse);
  } catch (error) {
    console.error('💥 Erro ao atualizar empresa:', error);

    if (error.code === 'P2002' && error.meta?.target?.includes('cnpj')) {
      return res.status(400).json({
        message: 'Este CNPJ já está sendo usado por outra empresa',
      });
    }

    res.status(500).json({
      message: 'Erro ao atualizar empresa',
      error: error.message,
    });
  }
};

// Controller function to delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🗑️ Deletando usuário:', userId);

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Company: true,
        subscriptions: true,
        ConsultingSession: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado',
      });
    }

    // Usar uma transação para garantir que tudo seja deletado corretamente
    await prisma.$transaction(async prisma => {
      // Deletar sessões de consultoria
      if (user.ConsultingSession.length > 0) {
        await prisma.consultingSession.deleteMany({
          where: { userId: userId },
        });
      }

      // Deletar assinaturas
      if (user.subscriptions.length > 0) {
        await prisma.subscription.deleteMany({
          where: { userId: userId },
        });
      }

      // Deletar empresa se existir
      if (user.Company) {
        await prisma.company.delete({
          where: { userId: userId },
        });
      }

      // Deletar usuário
      await prisma.user.delete({
        where: { id: userId },
      });
    });

    console.log('✅ Usuário deletado com sucesso:', user.name);
    res.json({
      message: 'Usuário deletado com sucesso',
      deletedUser: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('💥 Erro ao deletar usuário:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        message: 'Usuário não encontrado',
      });
    }

    res.status(500).json({
      message: 'Erro ao deletar usuário',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboard,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  updateUser,
  updateUserCompany,
  deleteUser,
};
