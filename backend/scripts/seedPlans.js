const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPlans() {
  // Primeiro, vamos limpar os planos existentes
  await prisma.plan.deleteMany({});
  console.log('Planos existentes removidos');

  const plans = [
    {
      id: 'essencial',
      name: 'Essencial',
      price: 19.0,  // Float simples
      description: 'O básico para começar a organizar seu MEI com autonomia.',
    },
    {
      id: 'profissional',
      name: 'Profissional',
      price: 39.0,
      description: 'Automação, controle avançado e suporte personalizado para crescer.',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 69.0,
      description: 'Solução completa e personalizada, com mentoria e relatórios sob medida.',
    },
  ];

  for (const planData of plans) {
    const plan = await prisma.plan.create({
      data: planData
    });
    console.log(`Plano ${plan.name} criado com preço R$ ${plan.price}`);
  }

  console.log('Todos os planos foram inseridos!');
  await prisma.$disconnect();
}

seedPlans().catch(console.error);