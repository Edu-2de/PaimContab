const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_muito_forte_e_unica_para_jwt_2025'; // 🔧 MUDANÇA AQUI

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    console.log('🔐 Auth middleware - Header:', authHeader ? authHeader.substring(0, 30) + '...' : 'ausente');
    
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('❌ Auth middleware - Token não fornecido');
      return res.status(401).json({ message: 'Token not provided' });
    }

    console.log('🎫 Auth middleware - Token:', token.substring(0, 20) + '...');
    console.log('📋 Auth middleware - JWT Secret:', JWT_SECRET.substring(0, 10) + '...');

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        console.log('❌ Auth middleware - JWT Error:', err.name, '-', err.message);
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      
      console.log('✅ Auth middleware - Token válido para:', user.email, '- Role:', user.role);
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('💥 Auth middleware - Erro:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = authenticateToken;