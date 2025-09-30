const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_muito_forte_e_unica_para_jwt_2025';

const adminOrOwnerMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Token de acesso requerido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // Se for admin, pode acessar tudo
    if (decoded.role === 'admin') {
      console.log('🔑 Admin detectado - acesso total liberado');
      req.isAdmin = true;
      return next();
    }

    // Se não for admin, precisa ter companyId
    if (!decoded.companyId) {
      return res.status(403).json({ message: 'Usuário não possui empresa associada' });
    }

    req.isAdmin = false;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(401).json({ message: 'Token inválido' });
  }
};

module.exports = adminOrOwnerMiddleware;