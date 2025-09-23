const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const requireAdmin = async (req, res, next) => {
  try {
    console.log('🔐 Verificando autenticação admin...');
    
    // Buscar token do header Authorization
    const authHeader = req.header('Authorization');
    console.log('📋 Auth header:', authHeader ? 'presente' : 'ausente');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Token não fornecido ou formato inválido');
      return res.status(401).json({ 
        message: 'Token de acesso requerido',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🎫 Token extraído:', token.substring(0, 20) + '...');
    
    // Verificar se o token é válido
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta_muito_forte');
      console.log('✅ Token decodificado:', decoded);
    } catch (jwtError) {
      console.log('❌ Token inválido:', jwtError.message);
      return res.status(401).json({ 
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
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
      console.log('❌ Usuário não é admin. Role:', user.role);
      return res.status(403).json({ 
        message: 'Acesso negado. Apenas administradores.',
        code: 'NOT_ADMIN'
      });
    }

    console.log('✅ Admin autenticado:', user.name);
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