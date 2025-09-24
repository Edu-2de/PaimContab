const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_muito_forte';

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log('Dados enviados para registro:', { name, email, password });

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe com esse email' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'customer', // Por padrão é customer
        isActive: true
      }
    });

    console.log('Status da resposta do backend:', 201);
    console.log('Dados retornados do backend:', {
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Tentativa de login:', { email });

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    if (!user.isActive) {
      console.log('❌ Usuário inativo');
      return res.status(401).json({ message: 'Usuário inativo' });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log('❌ Senha inválida');
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    // Gerar JWT com mais tempo (7 dias ao invés de 24h)
    const tokenPayload = { 
      userId: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      iat: Math.floor(Date.now() / 1000), // Issued at
    };

    console.log('🎫 Gerando token com payload:', tokenPayload);

    const token = jwt.sign(
      tokenPayload,
      JWT_SECRET,
      { expiresIn: '7d' } // 7 dias ao invés de 24h
    );

    console.log('✅ Token gerado com sucesso');
    console.log('📋 JWT Secret usado:', JWT_SECRET.substring(0, 10) + '...');

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    };

    console.log('✅ Login bem-sucedido para:', userResponse.name, '- Role:', userResponse.role);

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('💥 Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};