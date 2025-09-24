const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware de autenticação para todas as rotas de admin
router.use(adminMiddleware);

// GET /api/admin/companies - Listar empresas
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.company.count({ where }),
    ]);

    res.json({
      companies,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/companies/:id - Buscar empresa por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, isActive: true },
        },
      },
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    res.json(company);
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/admin/companies/:id - Atualizar empresa
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, cnpj, email, phone, address, city, state, zipCode, status } = req.body;

    // Verificar se a empresa existe
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Verificar se o CNPJ já está em uso por outra empresa
    if (cnpj) {
      const cnpjExists = await prisma.company.findFirst({
        where: {
          cnpj,
          id: { not: id },
        },
      });

      if (cnpjExists) {
        return res.status(400).json({ error: 'CNPJ já está sendo usado por outra empresa' });
      }
    }

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        name,
        cnpj,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        status,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(updatedCompany);
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/admin/companies/:id - Excluir empresa
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a empresa existe
    const existingCompany = await prisma.company.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingCompany) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Deletar a empresa
    await prisma.company.delete({
      where: { id },
    });

    res.json({ message: 'Empresa excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/companies - Criar nova empresa
router.post('/', async (req, res) => {
  try {
    const { name, cnpj, email, phone, address, city, state, zipCode, userId } = req.body;

    // Validações básicas
    if (!name) {
      return res.status(400).json({ error: 'Nome da empresa é obrigatório' });
    }

    // Verificar se o CNPJ já está em uso
    if (cnpj) {
      const cnpjExists = await prisma.company.findUnique({
        where: { cnpj },
      });

      if (cnpjExists) {
        return res.status(400).json({ error: 'CNPJ já está sendo usado' });
      }
    }

    // Verificar se o usuário existe (se fornecido)
    if (userId) {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userExists) {
        return res.status(400).json({ error: 'Usuário não encontrado' });
      }
    }

    const newCompany = await prisma.company.create({
      data: {
        name,
        cnpj,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        userId,
        status: 'active',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(newCompany);
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
