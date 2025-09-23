const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

// Configurar nodemailer (ajuste conforme seu provedor de email)
const transporter = nodemailer.createTransporter({
  service: 'gmail', // ou outro provedor
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Função para enviar email aos admins
async function notifyAdmins(user, plan, subscription) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { email: true, name: true }
    });

    const adminEmails = admins.map(admin => admin.email);
    
    if (adminEmails.length > 0) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: adminEmails,
        subject: `Nova Assinatura - ${plan.name}`,
        html: `
          <h2>Nova Assinatura Realizada!</h2>
          <p><strong>Cliente:</strong> ${user.name}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Plano:</strong> ${plan.name}</p>
          <p><strong>Valor:</strong> R$ ${plan.price}</p>
          <p><strong>Data de Início:</strong> ${subscription.startDate.toLocaleDateString('pt-BR')}</p>
          <p><strong>Status:</strong> ${subscription.isActive ? 'Ativo' : 'Inativo'}</p>
          <hr>
          <p>Acesse o painel administrativo para mais detalhes.</p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('Email enviado para admins:', adminEmails);
    }
  } catch (error) {
    console.error('Erro ao enviar email para admins:', error);
  }
}

// Criar sessão de checkout
exports.createCheckoutSession = async (req, res) => {
  const { planId, userId } = req.body;

  try {
    // Buscar plano e usuário
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!plan || !user) {
      return res.status(404).json({ message: 'Plano ou usuário não encontrado' });
    }

    // Criar produto e preço no Stripe (ou usar IDs salvos)
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description || `Plano ${plan.name}`,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(parseFloat(plan.price) * 100), // Stripe usa centavos
      currency: 'brl',
      recurring: { interval: 'month' },
    });

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email,
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
      success_url: `${process.env.FRONTEND_URL}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pagamento/cancelado`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Webhook do Stripe (confirmar pagamento)
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Criar assinatura no banco
      try {
        const subscription = await prisma.subscription.create({
          data: {
            userId: session.metadata.userId,
            planId: session.metadata.planId,
            isActive: true,
          },
          include: {
            user: true,
            plan: true,
          }
        });

        // Enviar email para admins
        await notifyAdmins(subscription.user, subscription.plan, subscription);
        
        console.log('Assinatura criada:', subscription.id);
      } catch (error) {
        console.error('Erro ao criar assinatura:', error);
      }
      break;

    case 'invoice.payment_succeeded':
      // Renovação mensal bem-sucedida
      console.log('Pagamento de renovação bem-sucedido');
      break;

    case 'invoice.payment_failed':
      // Pagamento falhou
      console.log('Pagamento falhou');
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

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
    res.status(500).json({ message: 'Erro ao buscar planos' });
  }
};