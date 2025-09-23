const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// Criar sessão de checkout
exports.createCheckoutSession = async (req, res) => {
  const { planId, userId } = req.body;

  console.log('Dados recebidos:', { planId, userId });

  try {
    // Buscar plano
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      console.log('Plano não encontrado:', planId);
      return res.status(404).json({ message: 'Plano não encontrado' });
    }

    // Buscar usuário por ID ou email
    let user = null;
    if (userId.includes('@')) {
      // É um email
      user = await prisma.user.findUnique({ where: { email: userId } });
    } else {
      // É um ID
      user = await prisma.user.findUnique({ where: { id: userId } });
    }

    if (!user) {
      console.log('Usuário não encontrado:', userId);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    console.log('Plano encontrado:', plan);
    console.log('Usuário encontrado:', { id: user.id, email: user.email });

    // Criar produto e preço no Stripe
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description || `Plano ${plan.name} - PaimContab`,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(parseFloat(plan.price) * 100), // Stripe usa centavos
      currency: 'brl',
      recurring: { interval: 'month' },
    });

    console.log('Produto e preço criados no Stripe');

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
      success_url: `${process.env.FRONTEND_URL}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/PaymentCanceled`,
    });

    console.log('Sessão de checkout criada:', session.id);
    res.json({ url: session.url });

  } catch (error) {
    console.error('Erro detalhado ao criar sessão:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

// Resto do código...
exports.stripeWebhook = async (req, res) => {
  // ...código anterior...
};

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