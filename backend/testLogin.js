const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔍 Testando sistema de login...');

    // Buscar usuário admin
    const user = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' },
      include: { Company: true },
    });

    if (!user) {
      console.log('❌ Usuário admin não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:', user.email);
    console.log('📍 Empresa:', user.Company ? user.Company.companyName : 'Nenhuma');
    console.log('🆔 CompanyId:', user.Company ? user.Company.id : 'Nenhum');

    // Simular token JWT
    if (user.Company) {
      const token = jwt.sign(
        {
          userId: user.id,
          companyId: user.Company.id,
          email: user.email,
        },
        'seu_jwt_secret',
        { expiresIn: '24h' }
      );

      console.log('🔑 Token gerado com companyId incluído');

      // Decodificar token para verificar
      const decoded = jwt.verify(token, 'seu_jwt_secret');
      console.log('📝 Dados do token:', {
        userId: decoded.userId,
        companyId: decoded.companyId,
        email: decoded.email,
      });
    } else {
      console.log('❌ Usuário não tem empresa associada');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
