const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_muito_forte_e_unica_para_jwt_2025';

const requireAdmin = async (req, res, next) => {
  try {
    console.log('🔐 Verificando autenticação admin...');
    
    // Buscar token do header Authorization
    const authHeader = req.header('Authorization');
    console.log('📋 Auth header:', authHeader ? authHeader.substring(0, 30) + '...' : 'ausente');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Token não fornecido ou formato inválido');
      return res.status(401).json({ 
        message: 'Token de acesso requerido',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🎫 Token extraído:', token.substring(0, 20) + '...');
    console.log('📋 JWT Secret usado:', JWT_SECRET.substring(0, 10) + '...');
    
    // Verificar se o token é válido
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token decodificado com sucesso:', {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        exp: new Date(decoded.exp * 1000),
        timeUntilExpiry: Math.round((decoded.exp * 1000 - Date.now()) / 1000 / 60) + ' minutos'
      });
    } catch (jwtError) {
      console.log('❌ Erro JWT:', jwtError.name, '-', jwtError.message);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(403).json({ 
          message: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(403).json({ 
          message: 'Token inválido',
          code: 'INVALID_TOKEN'
        });
      } else {
        return res.status(403).json({ 
          message: 'Erro na validação do token',
          code: 'TOKEN_ERROR'
        });
      }
    }
    
    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado no banco');
      return res.status(401).json({ 
        message: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      console.log('❌ Usuário inativo');
      return res.status(401).json({ 
        message: 'Usuário inativo',
        code: 'USER_INACTIVE'
      });
    }

    if (user.role !== 'admin') {
      console.log('❌ Usuário não é admin. Role atual:', user.role);
      return res.status(403).json({ 
        message: 'Acesso negado. Apenas administradores.',
        code: 'NOT_ADMIN'
      });
    }

    console.log('✅ Admin autenticado:', user.name, '- ID:', user.id);
    req.user = user;
    next();
  } catch (error) {
    console.error('💥 Erro no middleware admin:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = requireAdmin;