const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testReceitas() {
  try {
    console.log('🧪 Testando operações de receitas...');

    // Simular token do usuário admin
    const token = jwt.sign(
      { 
        userId: '7c9494d2-296c-4bc7-8360-3d30e51f4e0d',
        companyId: 'd3926a06-c27f-432e-bec3-02729879068b',
        email: 'admin@admin.com' 
      },
      'seu_jwt_secret',
      { expiresIn: '24h' }
    );

    // Decodificar para simular middleware de auth
    const decoded = jwt.verify(token, 'seu_jwt_secret');
    console.log('🔑 Token validado - CompanyId:', decoded.companyId);

    // Buscar receitas existentes
    const receitas = await prisma.receita.findMany({
      where: { companyId: decoded.companyId }
    });

    console.log(`📊 Receitas encontradas: ${receitas.length}`);

    // Criar uma receita teste
    const novaReceita = await prisma.receita.create({
      data: {
        description: 'Receita Teste API',
        value: 1500.00,
        date: new Date(),
        category: 'Vendas',
        companyId: decoded.companyId
      }
    });

    console.log('✅ Receita criada:', {
      id: novaReceita.id,
      description: novaReceita.description,
      value: novaReceita.value,
      companyId: novaReceita.companyId
    });

    // Buscar receitas novamente
    const receitasAtualizadas = await prisma.receita.findMany({
      where: { companyId: decoded.companyId }
    });

    console.log(`📈 Total de receitas após criação: ${receitasAtualizadas.length}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testReceitas();