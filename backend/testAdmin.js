const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = 'sua_chave_secreta_muito_forte_e_unica_para_jwt_2025';

async function testLoginCompleto() {
  try {
    console.log('🧪 Testando sistema completo de login e permissões...\n');

    // 1. Buscar usuário admin
    console.log('1️⃣ Buscando usuário admin...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' },
    });

    if (!adminUser) {
      console.log('❌ Usuário admin não encontrado');
      return;
    }
    console.log('✅ Admin encontrado:', adminUser.email, '- Role:', adminUser.role);

    // 2. Buscar empresa do admin
    console.log('\n2️⃣ Buscando empresa do admin...');
    const adminCompany = await prisma.company.findUnique({
      where: { userId: adminUser.id },
    });

    if (adminCompany) {
      console.log('✅ Empresa do admin:', adminCompany.companyName, '- ID:', adminCompany.id);
    } else {
      console.log('ℹ️ Admin não tem empresa associada');
    }

    // 3. Simular login (gerar token)
    console.log('\n3️⃣ Simulando login...');
    const tokenPayload = {
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      isActive: adminUser.isActive,
      companyId: adminCompany?.id || null,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    console.log('✅ Token gerado com sucesso');
    console.log('📝 Payload do token:', tokenPayload);

    // 4. Testar permissões de admin
    console.log('\n4️⃣ Testando permissões...');
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role === 'admin') {
      console.log('🔑 Admin detectado - pode acessar tudo');

      // Buscar todas as receitas (como admin)
      const todasReceitas = await prisma.receita.findMany({
        include: { company: { select: { companyName: true } } },
        orderBy: { date: 'desc' },
      });

      console.log(`📊 Total de receitas no sistema: ${todasReceitas.length}`);

      if (todasReceitas.length > 0) {
        console.log('📋 Receitas encontradas:');
        todasReceitas.forEach((receita, index) => {
          console.log(`   ${index + 1}. ${receita.description} - R$ ${receita.value} (${receita.company.companyName})`);
        });
      }
    } else {
      console.log('👤 Usuário comum - acesso limitado à sua empresa');
    }

    // 5. Testar criação de receita para outra empresa (só admin pode)
    console.log('\n5️⃣ Testando criação de receita como admin...');

    if (adminCompany) {
      const novaReceita = await prisma.receita.create({
        data: {
          description: 'Receita criada pelo Admin',
          value: 2500.0,
          date: new Date(),
          category: 'Teste Admin',
          companyId: adminCompany.id,
        },
      });

      console.log('✅ Receita criada pelo admin:', {
        id: novaReceita.id,
        description: novaReceita.description,
        value: novaReceita.value,
        companyId: novaReceita.companyId,
      });
    }

    console.log('\n🎉 Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLoginCompleto();
