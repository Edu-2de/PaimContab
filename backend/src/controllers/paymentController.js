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
      select: { email: true, name: true }
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
        `
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

  const { planId, userId } = req.body;

  try {
    // 🔧 USAR O USUÁRIO DO TOKEN AO INVÉS DO BODY
    const userIdFromToken = req.user.userId; // Do JWT
    const userEmailFromToken = req.user.email; // Do JWT
    
    console.log('👤 Dados do token:', { 
      userId: userIdFromToken, 
      email: userEmailFromToken 
    });

    // Buscar usuário pelo ID do token
    const user = await prisma.user.findUnique({ 
      where: { id: userIdFromToken } 
    });

    if (!user) {
      console.log('❌ Usuário não encontrado:', userIdFromToken);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Buscar plano por ID simples (string)
    const plans = {
      'essencial': { name: 'Essencial', price: 19.0 },
      'profissional': { name: 'Profissional', price: 39.0 },
      'premium': { name: 'Premium', price: 69.0 }
    };

    const plan = plans[planId];
    if (!plan) {
      console.log('❌ Plano não encontrado:', planId);
      return res.status(404).json({ message: 'Plano não encontrado' });
    }

    console.log('✅ Plano encontrado:', plan);
    console.log('✅ Usuário encontrado:', { id: user.id, email: user.email });

    // Criar sessão de checkout diretamente com dados hardcoded
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email,
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
        userId: user.id,
        planId: planId,
      },
      success_url: `${process.env.FRONTEND_URL}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/PaymentCanceled`,
    });

    console.log('✅ Sessão de checkout criada:', session.id);
    res.json({ url: session.url });

  } catch (error) {
    console.error('❌ Erro detalhado ao criar sessão:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Webhook do Stripe (confirmar pagamento)
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verificar assinatura do webhook
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('✅ Webhook recebido:', event.type);

  // Processar diferentes tipos de eventos
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('💳 Checkout session completed:', session.id);
      
      try {
        // Buscar usuário e plano pelos metadados
        const user = await prisma.user.findUnique({
          where: { id: session.metadata.userId }
        });
        
        const plan = await prisma.plan.findUnique({
          where: { id: session.metadata.planId }
        });

        if (!user || !plan) {
          console.error('❌ Usuário ou plano não encontrado nos metadados');
          break;
        }

        // Criar assinatura no banco
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
          }
        });

        console.log('✅ Assinatura criada:', subscription.id);

        // Enviar email para admins (descomente quando configurar o email)
        // await notifyAdmins(subscription.user, subscription.plan, subscription);
        console.log('📧 Email para admins desabilitado temporariamente');
        
      } catch (error) {
        console.error('❌ Erro ao criar assinatura:', error);
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
      orderBy: { price: 'asc' }
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