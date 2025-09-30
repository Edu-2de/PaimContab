const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdminCompany() {
  try {
    // Buscar usuário admin
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' },
      include: { Company: true },
    });

    if (!adminUser) {
      console.log('❌ Usuário admin não encontrado');
      return;
    }

    if (adminUser.Company) {
      console.log('✅ Usuário admin já tem empresa:', adminUser.Company.companyName);
      console.log('CompanyId:', adminUser.Company.id);
      return;
    }

    // Criar empresa para o admin
    const company = await prisma.company.create({
      data: {
        companyName: 'Empresa Admin MEI',
        cnpj: '12345678000190',
        userId: adminUser.id,
        businessType: 'MEI',
      },
    });

    console.log('✅ Empresa criada para admin:', company.name);
    console.log('CompanyId:', company.id);
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminCompany();
