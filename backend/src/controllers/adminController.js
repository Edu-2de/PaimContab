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

    const { page = 1, limit = 10, search = '', withoutCompany, withoutSubscription } = req.query;
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

    // Build filter conditions
    const filterConditions = [];

    // Filtrar usuários sem empresa
    if (withoutCompany === 'true') {
      filterConditions.push({ Company: null });
    }

    // Filtrar usuários sem assinatura ativa
    if (withoutSubscription === 'true') {
      filterConditions.push({
        subscriptions: {
          none: {
            isActive: true,
          },
        },
      });
    }

    // Combine all conditions
    const whereCondition = {
      ...searchCondition,
      ...(filterConditions.length > 0 && { AND: filterConditions }),
    };

    // Get users with pagination
    const users = await prisma.user.findMany({
      where: whereCondition,
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
      where: whereCondition,
    });

    // Format users data
    const formattedUsers = users.map(user => {
      const latestSubscription = user.subscriptions[0];

      // Determinar status do plano baseado na assinatura mais recente
      let planStatus = 'no_plan';
      if (latestSubscription) {
        if (latestSubscription.isActive) {
          planStatus = 'active';
        } else {
          planStatus = 'canceled';
        }
      }

      // Formatar currentSubscription com dados corretos
      let currentSubscription = null;
      if (latestSubscription) {
        currentSubscription = {
          id: latestSubscription.id,
          plan: {
            name: latestSubscription.plan.name,
            price: latestSubscription.plan.price,
          },
          amount: latestSubscription.plan.price, // Pegar preço do plano
          status: latestSubscription.isActive ? 'active' : 'canceled',
          createdAt: latestSubscription.createdAt,
          isActive: latestSubscription.isActive,
        };
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        company: user.Company,
        currentSubscription: currentSubscription,
        planStatus: planStatus,
      };
    });

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

    // Formatar subscriptions com preço do plano
    const formattedSubscriptions = user.subscriptions.map(sub => ({
      id: sub.id,
      plan: {
        id: sub.plan.id,
        name: sub.plan.name,
        description: sub.plan.description,
        price: sub.plan.price,
        features: [], // Adicionar features se existir no schema
      },
      amount: sub.plan.price, // Pegar preço do plano
      status: sub.isActive ? 'active' : 'canceled',
      isActive: sub.isActive,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }));

    // Mapear o campo Company para company (minúsculo) para consistency
    const userResponse = {
      ...user,
      company: user.Company,
      Company: undefined, // Remove o campo Company maiúsculo
      subscriptions: formattedSubscriptions,
      currentSubscription: formattedSubscriptions[0] || null, // Adicionar assinatura atual
    };

    console.log('✅ Detalhes do usuário carregados:', user.name);
    console.log('📊 Empresa encontrada:', user.Company ? 'Sim' : 'Não');
    console.log('💳 Assinaturas:', formattedSubscriptions.length);
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
    console.log('📋 Dados recebidos:', JSON.stringify(companyData, null, 2));

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Company: true },
    });

    if (!user) {
      console.log('❌ Usuário não encontrado:', userId);
      return res.status(404).json({
        message: 'Usuário não encontrado',
      });
    }

    console.log('✅ Usuário encontrado:', user.name);
    console.log('🏢 Empresa existente:', user.Company ? 'Sim' : 'Não');

    // Limpar dados vazios e preparar para o Prisma
    const cleanData = {};

    // Campos de texto - converter string vazia para null
    const textFields = [
      'companyName',
      'legalName',
      'cnpj',
      'businessType',
      'mainActivity',
      'secondaryActivity',
      'businessSegment',
      'address',
      'addressNumber',
      'complement',
      'neighborhood',
      'city',
      'state',
      'zipCode',
      'businessPhone',
      'businessEmail',
      'website',
      'taxRegime',
      'notes',
    ];

    textFields.forEach(field => {
      if (companyData[field] !== undefined) {
        cleanData[field] = companyData[field] && companyData[field].trim() !== '' ? companyData[field].trim() : null;
      }
    });

    // Campo numérico - monthlyRevenue
    if (companyData.monthlyRevenue !== undefined) {
      cleanData.monthlyRevenue = companyData.monthlyRevenue ? parseFloat(companyData.monthlyRevenue) : null;
    }

    // Campo numérico - employeeCount
    if (companyData.employeeCount !== undefined) {
      cleanData.employeeCount = companyData.employeeCount ? parseInt(companyData.employeeCount) : 0;
    }

    // Campo de data - foundationDate
    if (companyData.foundationDate !== undefined && companyData.foundationDate !== null) {
      if (companyData.foundationDate.trim() !== '') {
        try {
          cleanData.foundationDate = new Date(companyData.foundationDate + 'T00:00:00.000Z');
        } catch (error) {
          console.log('⚠️ Erro ao converter data de fundação, será definida como null');
          cleanData.foundationDate = null;
        }
      } else {
        cleanData.foundationDate = null;
      }
    }

    console.log('🧹 Dados limpos:', JSON.stringify(cleanData, null, 2));

    let company;
    if (user.Company) {
      // Atualizar empresa existente
      console.log('🔄 Atualizando empresa existente...');
      company = await prisma.company.update({
        where: { userId: userId },
        data: cleanData,
      });
      console.log('✅ Empresa atualizada:', company.id);
    } else {
      // Criar nova empresa
      console.log('➕ Criando nova empresa...');
      company = await prisma.company.create({
        data: {
          ...cleanData,
          userId: userId,
        },
      });
      console.log('✅ Empresa criada:', company.id);
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
    console.error('Stack trace:', error.stack);

    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'campo';
      return res.status(400).json({
        message: `Este ${field} já está sendo usado por outra empresa`,
        error: error.message,
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        message: 'Empresa não encontrada',
        error: error.message,
      });
    }

    res.status(500).json({
      message: 'Erro ao atualizar empresa',
      error: error.message,
      details: error.stack,
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

// Controller function to get user subscription status (for admin use)
const getUserSubscriptionStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🔍 Verificando status de assinatura para usuário:', userId);

    // Buscar a assinatura mais recente do usuário
    const subscription = await prisma.subscription.findFirst({
      where: { userId: userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      console.log('❌ Nenhuma assinatura encontrada para o usuário');
      return res.json({
        hasActiveSubscription: false,
        subscription: null,
      });
    }

    console.log('✅ Status da assinatura:', subscription.isActive ? 'Ativa' : 'Inativa');
    res.json({
      hasActiveSubscription: subscription.isActive,
      subscription: subscription,
    });
  } catch (error) {
    console.error('💥 Erro ao verificar status de assinatura:', error);
    res.status(500).json({
      message: 'Erro ao verificar status de assinatura',
      error: error.message,
    });
  }
};

// Controller function to export users
const exportUsers = async (req, res) => {
  try {
    const { search = '' } = req.query;

    console.log('📤 Exportando usuários...');

    // Build search condition
    const searchCondition = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // Get all users without pagination for export
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
    });

    // Format users data for Excel
    const exportData = users.map(user => {
      const latestSubscription = user.subscriptions[0];

      return {
        ID: user.id,
        Nome: user.name,
        Email: user.email,
        Tipo: user.role === 'admin' ? 'Administrador' : user.role === 'mei' ? 'MEI' : 'Usuário',
        Status: user.isActive ? 'Ativo' : 'Inativo',
        Empresa: user.Company?.companyName || 'Sem empresa',
        CNPJ: user.Company?.cnpj || '',
        Plano: latestSubscription?.plan?.name || 'Sem plano',
        'Assinatura Ativa': latestSubscription?.isActive ? 'Sim' : 'Não',
        'Cadastrado Em': new Date(user.createdAt).toLocaleDateString('pt-BR'),
      };
    });

    console.log(`✅ ${exportData.length} usuários exportados`);
    res.json({ data: exportData });
  } catch (error) {
    console.error('💥 Erro ao exportar usuários:', error);
    res.status(500).json({
      message: 'Erro ao exportar usuários',
      error: error.message,
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;

    // Validations
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isAdmin: isAdmin || false,
        isActive: true,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Import users from Excel
const importUsers = async (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const requiredColumns = ['Nome', 'Email', 'Senha'];
    const errors = [];
    const created = [];
    const bcrypt = require('bcryptjs');

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Excel row (1-indexed + header)

      // Validate required columns
      const missingColumns = requiredColumns.filter(col => !row[col]);
      if (missingColumns.length > 0) {
        errors.push(`Linha ${rowNum}: Faltando colunas ${missingColumns.join(', ')}`);
        continue;
      }

      try {
        // Check if email already exists
        const emailExists = await prisma.user.findUnique({
          where: { email: row['Email'] },
        });

        if (emailExists) {
          errors.push(`Linha ${rowNum}: Email ${row['Email']} já está em uso`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(row['Senha'], 10);

        // Create user
        const user = await prisma.user.create({
          data: {
            name: row['Nome'],
            email: row['Email'],
            password: hashedPassword,
            isAdmin: row['Admin'] === 'Sim' || row['Admin'] === 'TRUE' || false,
            isActive: true,
          },
        });

        created.push(user.id);
      } catch (error) {
        console.error(`Erro na linha ${rowNum}:`, error);
        errors.push(`Linha ${rowNum}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      created: created.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${created.length} usuários criados${errors.length > 0 ? `, ${errors.length} erros` : ''}`,
    });
  } catch (error) {
    console.error('Erro ao importar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
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
  getUserSubscriptionStatus,
  exportUsers,
  createUser,
  importUsers,
};
