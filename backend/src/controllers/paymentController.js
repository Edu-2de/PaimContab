const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// Função para enviar email aos admins
async function notifyAdmins(user, plan, subscription) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { email: true, name: true },
    });

    const adminEmails = admins.map(admin => admin.email);

    if (adminEmails.length > 0) {
      await resend.emails.send({
        from: 'PaimContab <noreply@paimcontab.com>',
        to: adminEmails,
        subject: `Nova Assinatura - ${plan.name}`,
        html: `
          <h2>🎉 Nova Assinatura Realizada!</h2>
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <p><strong>Cliente:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Plano:</strong> ${plan.name}</p>
            <p><strong>Valor:</strong> R$ ${plan.price.toFixed(2)}</p>
            <p><strong>Data de Início:</strong> ${subscription.startDate.toLocaleDateString('pt-BR')}</p>
            <p><strong>Status:</strong> ${subscription.isActive ? '✅ Ativo' : '❌ Inativo'}</p>
            <hr>
            <p>Acesse o painel administrativo para mais detalhes.</p>
          </div>
        `,
      });

      console.log('Email enviado para admins via Resend:', adminEmails);
    }
  } catch (error) {
    console.error('Erro ao enviar email via Resend:', error);
  }
}

// Criar sessão de checkout
exports.createCheckoutSession = async (req, res) => {
  console.log('🛒 Payment Controller - Iniciando...');
  console.log('📋 User do middleware:', req.user); // Debug
  console.log('📋 Body da requisição:', req.body);

  const { planId } = req.body;

  try {
    // 🔧 USAR O USUÁRIO DO TOKEN (middleware authMiddleware já populou req.user)
    const user = req.user;

    console.log('👤 Dados do token:', {
      userId: user.userId,
      email: user.email,
    });

    // Buscar usuário completo no banco pelo ID do token (incluindo empresa)
    const fullUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { Company: true },
    });

    if (!fullUser) {
      console.log('❌ Usuário não encontrado:', user.userId);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // ⚠️ VERIFICAR SE O USUÁRIO TEM EMPRESA CADASTRADA
    if (!fullUser.Company) {
      console.log('❌ Usuário sem empresa cadastrada:', user.userId);
      return res.status(400).json({ 
        message: 'É necessário cadastrar uma empresa antes de assinar um plano',
        code: 'NO_COMPANY',
        redirectTo: '/setup-company'
      });
    }

    console.log('✅ Empresa encontrada:', { companyId: fullUser.Company.id, companyName: fullUser.Company.companyName });

    // Planos disponíveis (hardcoded por enquanto)
    const plans = {
      essencial: { name: 'Essencial', price: 19.0 },
      profissional: { name: 'Profissional', price: 39.0 },
      premium: { name: 'Premium', price: 69.0 },
    };

    const plan = plans[planId];
    if (!plan) {
      console.log('❌ Plano não encontrado:', planId);
      return res.status(404).json({ message: 'Plano não encontrado' });
    }

    console.log('✅ Plano encontrado:', plan);
    console.log('✅ Usuário encontrado:', { id: fullUser.id, email: fullUser.email });

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: fullUser.email,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Plano ${plan.name} - PaimContab`,
              description: `Assinatura mensal do plano ${plan.name}`,
            },
            unit_amount: Math.round(plan.price * 100), // Converter para centavos
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: fullUser.id,
        planId: planId,
      },
      success_url: `${
        process.env.FRONTEND_URL || 'http://localhost:3001'
      }/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/PaymentCanceled`,
    });

    console.log('✅ Sessão de checkout criada:', session.id);
    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ Erro detalhado ao criar sessão:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
};

// Webhook do Stripe (confirmar pagamento)
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('🔔 WEBHOOK RECEBIDO');
  console.log('📋 Headers:', {
    signature: sig ? 'Presente' : 'Ausente',
    contentType: req.headers['content-type'],
  });

  let event;

  try {
    // Verificar assinatura do webhook
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('✅ Webhook signature verificada com sucesso');
  } catch (err) {
    console.log('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('✅ Webhook recebido:', event.type);
  console.log('📦 Event ID:', event.id);

  // Processar diferentes tipos de eventos
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('💳 ===== CHECKOUT SESSION COMPLETED =====');
      console.log('💳 Session ID:', session.id);
      console.log('💳 Payment Status:', session.payment_status);
      console.log('💳 Customer Email:', session.customer_details?.email);
      console.log('📋 Metadata:', JSON.stringify(session.metadata, null, 2));
      console.log('💰 Amount Total:', session.amount_total / 100, 'BRL');

      try {
        // Buscar usuário pelos metadados
        const user = await prisma.user.findUnique({
          where: { id: session.metadata.userId },
        });

        if (!user) {
          console.error('❌ Usuário não encontrado:', session.metadata.userId);
          break;
        }

        console.log('✅ Usuário encontrado:', { id: user.id, email: user.email, name: user.name });

        // Buscar plano pelo ID fornecido nos metadados (essencial, profissional, premium)
        let plan = await prisma.plan.findFirst({
          where: { id: session.metadata.planId },
        });

        if (!plan) {
          console.error('❌ Plano não encontrado no banco:', session.metadata.planId);
          console.log('⚠️ Tentando criar plano dinamicamente...');
          
          // Planos com IDs fixos
          const planDefinitions = {
            essencial: { name: 'Essencial', price: 19.0, description: 'O básico para começar a organizar seu MEI com autonomia.' },
            profissional: { name: 'Profissional', price: 39.0, description: 'Automação, controle avançado e suporte personalizado para crescer.' },
            premium: { name: 'Premium', price: 69.0, description: 'Solução completa e personalizada, com mentoria e relatórios sob medida.' },
          };

          const planData = planDefinitions[session.metadata.planId];
          if (!planData) {
            console.error('❌ Plano não encontrado nas definições:', session.metadata.planId);
            break;
          }

          console.log('📝 Criando plano:', planData);

          // Criar plano se não existir
          plan = await prisma.plan.create({
            data: {
              id: session.metadata.planId,
              name: planData.name,
              price: planData.price,
              description: planData.description,
            },
          });

          console.log('✅ Plano criado com sucesso:', { id: plan.id, name: plan.name, price: plan.price });
        } else {
          console.log('✅ Plano encontrado no banco:', { id: plan.id, name: plan.name, price: plan.price });
        }

        // Verificar se já existe assinatura ativa para este usuário
        const existingSubscription = await prisma.subscription.findFirst({
          where: {
            userId: user.id,
            isActive: true,
          },
        });

        if (existingSubscription) {
          console.log('⚠️ Usuário já tem assinatura ativa:', existingSubscription.id);
          console.log('🔄 Desativando assinatura anterior...');
          
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: { isActive: false },
          });
          
          console.log('✅ Assinatura anterior desativada');
        }

        // Criar nova assinatura
        console.log('📝 Criando nova assinatura...');
        console.log('📋 Dados:', {
          userId: user.id,
          planId: plan.id,
          isActive: true,
          startDate: new Date().toISOString(),
        });

        const subscription = await prisma.subscription.create({
          data: {
            userId: user.id,
            planId: plan.id,
            isActive: true,
            startDate: new Date(),
          },
          include: {
            user: true,
            plan: true,
          },
        });

        console.log('✅ ===== ASSINATURA CRIADA COM SUCESSO =====');
        console.log('✅ Subscription ID:', subscription.id);
        console.log('✅ User:', subscription.user.name, '-', subscription.user.email);
        console.log('✅ Plan:', subscription.plan.name, '- R$', subscription.plan.price);
        console.log('✅ Status:', subscription.isActive ? 'ATIVA' : 'INATIVA');
        console.log('✅ Start Date:', subscription.startDate);
        console.log('===============================================');

        // Enviar email para admins (descomente quando configurar o email)
        // await notifyAdmins(subscription.user, subscription.plan, subscription);
        console.log('📧 Email para admins desabilitado temporariamente');
      } catch (error) {
        console.error('❌ Erro ao criar assinatura:', error);
        console.error('Stack trace:', error.stack);
      }
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log('💰 Payment succeeded:', invoice.id);

      try {
        // Encontrar assinatura pelo customer
        const customerId = invoice.customer;
        const stripeCustomer = await stripe.customers.retrieve(customerId);

        // Aqui você pode atualizar o status da assinatura se necessário
        // Por exemplo, reativar se estava suspensa por falta de pagamento
        console.log('✅ Pagamento processado para:', stripeCustomer.email);
      } catch (error) {
        console.error('❌ Erro ao processar pagamento:', error);
      }
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log('❌ Payment failed:', failedInvoice.id);

      try {
        // Aqui você pode suspender a assinatura ou enviar email de cobrança
        const customerId = failedInvoice.customer;
        const stripeCustomer = await stripe.customers.retrieve(customerId);

        console.log('⚠️ Falha no pagamento para:', stripeCustomer.email);
        // TODO: Implementar lógica de suspensão ou retry
      } catch (error) {
        console.error('❌ Erro ao processar falha de pagamento:', error);
      }
      break;

    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object;
      console.log('🔄 Subscription updated:', updatedSubscription.id);

      try {
        // Atualizar status da assinatura no banco
        // TODO: Implementar lógica para sincronizar com o banco local
      } catch (error) {
        console.error('❌ Erro ao atualizar assinatura:', error);
      }
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log('🗑️ Subscription deleted:', deletedSubscription.id);

      try {
        // Desativar assinatura no banco
        // TODO: Implementar lógica para desativar assinatura local
      } catch (error) {
        console.error('❌ Erro ao deletar assinatura:', error);
      }
      break;

    default:
      console.log(`🤷 Unhandled event type: ${event.type}`);
  }

  // Sempre retornar 200 para o Stripe saber que o webhook foi processado
  res.json({ received: true });
};

// Listar planos
exports.getPlans = async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' },
    });
    res.json(plans);
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({ message: 'Erro ao buscar planos' });
  }
};

// Rota temporária para criar planos (pode remover depois)
exports.createPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: 'essencial',
        name: 'Essencial',
        price: 19.0,
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
      await prisma.plan.upsert({
        where: { id: planData.id },
        update: planData,
        create: planData,
      });
    }

    res.json({ message: 'Planos criados com sucesso!', plans });
  } catch (error) {
    console.error('Erro ao criar planos:', error);
    res.status(500).json({ message: 'Erro ao criar planos', error: error.message });
  }
};
