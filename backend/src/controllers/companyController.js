const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createCompany = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      companyName,
      businessSegment,
      mainActivity,
      businessType,
      cnpj,
      monthlyRevenue,
      foundationDate,
      city,
      state,
      employeeCount
    } = req.body;

    console.log('Dados recebidos:', {
      userId,
      companyName,
      businessSegment,
      mainActivity,
      businessType,
      cnpj,
      monthlyRevenue,
      foundationDate,
      city,
      state,
      employeeCount
    });

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se já existe empresa para este usuário
    const existingCompany = await prisma.company.findUnique({
      where: { userId }
    });

    // Converter foundationDate para DateTime ISO se fornecido
    let foundationDateISO = null;
    if (foundationDate && foundationDate.trim() !== '') {
      try {
        // Criar uma data ISO válida (adicionar horário se necessário)
        const dateObj = new Date(foundationDate + 'T00:00:00.000Z');
        if (!isNaN(dateObj.getTime())) {
          foundationDateISO = dateObj.toISOString();
        }
      } catch (error) {
        console.log('Erro ao converter data:', error);
        foundationDateISO = null;
      }
    }

    console.log('Data convertida:', foundationDateISO);

    const companyData = {
      companyName: companyName || null,
      businessSegment: businessSegment || null,
      mainActivity: mainActivity || null,
      businessType: businessType || null,
      cnpj: (cnpj && cnpj.trim() !== '') ? cnpj : null,
      monthlyRevenue: monthlyRevenue ? parseFloat(monthlyRevenue) : null,
      foundationDate: foundationDateISO,
      city: city || null,
      state: state || null,
      employeeCount: employeeCount ? parseInt(employeeCount) : 0,
      userId
    };

    let company;

    if (existingCompany) {
      // Atualizar empresa existente
      company = await prisma.company.update({
        where: { userId },
        data: {
          ...companyData,
          updatedAt: new Date()
        }
      });
      console.log('Empresa atualizada:', company);
    } else {
      // Criar nova empresa
      company = await prisma.company.create({
        data: companyData
      });
      console.log('Empresa criada:', company);
    }

    res.status(200).json({
      message: 'Empresa salva com sucesso',
      company
    });

  } catch (error) {
    console.error('Erro ao salvar empresa:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

exports.getCompanyByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const company = await prisma.company.findUnique({
      where: { userId }
    });

    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    res.json(company);

  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

exports.updateCompany = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const company = await prisma.company.findUnique({
      where: { id }
    });

    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: updateData
    });

    res.json(updatedCompany);
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
};

exports.deleteCompany = async (req, res) => {
  const { id } = req.params;

  try {
    const company = await prisma.company.findUnique({
      where: { id }
    });

    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    await prisma.company.delete({
      where: { id }
    });

    res.json({ message: 'Empresa deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar empresa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.getAllCompanies = async (req, res) => {
  const { page = 1, limit = 10, search, businessType, businessSegment, isActive } = req.query;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (businessType) where.businessType = businessType;
    if (businessSegment) where.businessSegment = businessSegment;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: { id: true, name: true, email: true, isActive: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.company.count({ where })
    ]);

    res.json({
      companies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.getCompaniesBySegment = async (req, res) => {
  try {
    const segments = await prisma.company.groupBy({
      by: ['businessSegment'],
      _count: {
        businessSegment: true
      },
      where: {
        businessSegment: {
          not: null
        },
        isActive: true
      },
      orderBy: {
        _count: {
          businessSegment: 'desc'
        }
      }
    });

    res.json(segments);
  } catch (error) {
    console.error('Erro ao buscar empresas por segmento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.getCompaniesStats = async (req, res) => {
  try {
    const [
      totalCompanies,
      activeCompanies,
      companiesByType,
      averageRevenue,
      recentCompanies
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { isActive: true } }),
      prisma.company.groupBy({
        by: ['businessType'],
        _count: { businessType: true }
      }),
      prisma.company.aggregate({
        _avg: { monthlyRevenue: true },
        where: { monthlyRevenue: { not: null } }
      }),
      prisma.company.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      totalCompanies,
      activeCompanies,
      inactiveCompanies: totalCompanies - activeCompanies,
      companiesByType,
      averageMonthlyRevenue: averageRevenue._avg.monthlyRevenue || 0,
      recentCompanies
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.validateCNPJ = async (req, res) => {
  const { cnpj } = req.body;

  try {
    if (!cnpj) {
      return res.status(400).json({ message: 'CNPJ é obrigatório' });
    }

    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

    if (cleanCNPJ.length !== 14) {
      return res.status(400).json({ message: 'CNPJ deve ter 14 dígitos' });
    }

    const existingCompany = await prisma.company.findUnique({
      where: { cnpj: cleanCNPJ }
    });

    if (existingCompany) {
      return res.status(409).json({ 
        message: 'CNPJ já cadastrado',
        companyId: existingCompany.id 
      });
    }

    res.json({ message: 'CNPJ disponível', valid: true });
  } catch (error) {
    console.error('Erro ao validar CNPJ:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.toggleCompanyStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const company = await prisma.company.findUnique({
      where: { id }
    });

    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: { isActive: !company.isActive }
    });

    res.json({
      message: `Empresa ${updatedCompany.isActive ? 'ativada' : 'desativada'} com sucesso`,
      company: updatedCompany
    });
  } catch (error) {
    console.error('Erro ao alterar status da empresa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.searchCompanies = async (req, res) => {
  const { query } = req.query;

  try {
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Query deve ter pelo menos 2 caracteres' });
    }

    const companies = await prisma.company.findMany({
      where: {
        OR: [
          { companyName: { contains: query, mode: 'insensitive' } },
          { legalName: { contains: query, mode: 'insensitive' } },
          { cnpj: { contains: query.replace(/[^\d]/g, ''), mode: 'insensitive' } },
          { businessSegment: { contains: query, mode: 'insensitive' } },
          { user: { name: { contains: query, mode: 'insensitive' } } },
          { user: { email: { contains: query, mode: 'insensitive' } } }
        ]
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      take: 20,
      orderBy: { companyName: 'asc' }
    });

    res.json(companies);
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.bulkUpdateCompanies = async (req, res) => {
  const { companyIds, updateData } = req.body;

  try {
    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({ message: 'Lista de IDs de empresas é obrigatória' });
    }

    const updatedCompanies = await prisma.company.updateMany({
      where: {
        id: { in: companyIds }
      },
      data: updateData
    });

    res.json({
      message: `${updatedCompanies.count} empresas atualizadas com sucesso`,
      count: updatedCompanies.count
    });
  } catch (error) {
    console.error('Erro ao atualizar empresas em lote:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};