const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testarDatas() {
  try {
    console.log('🔍 Buscando receitas e despesas...\n');

    // Buscar todas as receitas
    const receitas = await prisma.receita.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    console.log('📊 RECEITAS:');
    receitas.forEach(r => {
      console.log({
        id: r.id,
        description: r.description,
        value: r.value,
        date: r.date,
        createdAt: r.createdAt,
        companyId: r.companyId,
      });
    });

    console.log('\n📊 DESPESAS:');
    // Buscar todas as despesas
    const despesas = await prisma.despesa.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    despesas.forEach(d => {
      console.log({
        id: d.id,
        description: d.description,
        value: d.value,
        date: d.date,
        createdAt: d.createdAt,
        companyId: d.companyId,
      });
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testarDatas();
