const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminOrOwnerMiddleware = require('../middleware/adminOrOwnerMiddleware');
const { validateConsultation } = require('../middleware/validationMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/consultations/available-dates
router.get('/available-dates', authMiddleware, async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const bookedDates = await prisma.consultationBooking.findMany({
      where: {
        consultationDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: 'cancelled' },
      },
      select: {
        consultationDate: true,
      },
    });

    const bookedDateStrings = bookedDates.map(booking => {
      const date = new Date(booking.consultationDate);
      return date.toISOString().split('T')[0];
    });

    res.json({ bookedDates: bookedDateStrings });
  } catch (error) {
    console.error('Error fetching available dates:', error.message);
    res.status(500).json({ error: 'Error fetching available dates' });
  }
});

// POST /api/consultations
router.post('/', authMiddleware, validateConsultation, async (req, res) => {
  try {
    const { consultationDate, startTime, notes } = req.body;
    const userId = req.user.userId;

    // Validar horário de início (máximo 21:00)
    const startHour = parseInt(startTime.split(':')[0]);
    if (startHour < 19 || startHour > 21) {
      return res.status(400).json({ error: 'Horário de início deve ser entre 19:00 e 21:00' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        subscriptions: {
          where: { isActive: true },
          include: { plan: true },
        },
      },
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'Usuário ou empresa não encontrada' });
    }

    // Verificar se o usuário tem plano Premium ativo
    const hasPremiumPlan = user.subscriptions.some(
      sub => sub.isActive && (sub.plan.id === 'premium' || sub.plan.name === 'Premium')
    );

    if (!hasPremiumPlan) {
      return res.status(403).json({
        error: 'Apenas usuários com plano Premium podem agendar consultorias',
      });
    }

    // Verificar limite mensal (2 consultorias por mês)
    const consultationDateObj = new Date(consultationDate);
    const startOfMonth = new Date(consultationDateObj.getFullYear(), consultationDateObj.getMonth(), 1);
    const endOfMonth = new Date(consultationDateObj.getFullYear(), consultationDateObj.getMonth() + 1, 0, 23, 59, 59);

    const monthlyBookings = await prisma.consultationBooking.count({
      where: {
        companyId: user.company.id,
        consultationDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: { not: 'cancelled' },
      },
    });

    if (monthlyBookings >= 2) {
      return res.status(409).json({
        error: 'Você já atingiu o limite de 2 consultorias por mês',
      });
    }

    // Verificar se a data já está reservada (independente do horário)
    const dateObj = new Date(consultationDate);
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBooking = await prisma.consultationBooking.findFirst({
      where: {
        consultationDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: 'cancelled' },
      },
    });

    if (existingBooking) {
      console.log('❌ Data já reservada:', {
        data: dateObj.toISOString().split('T')[0],
        empresaExistente: existingBooking.companyName,
        horarioExistente: existingBooking.startTime,
      });
      return res.status(409).json({
        error: 'Esta data já está reservada por outra empresa. Apenas 1 consultoria por dia é permitida.',
      });
    }

    const booking = await prisma.consultationBooking.create({
      data: {
        companyId: user.company.id,
        consultationDate: new Date(consultationDate),
        startTime,
        duration: 2, // 2 horas
        companyName: user.company.companyName,
        userName: user.name,
        userEmail: user.email,
        notes: notes || '',
      },
    });

    await sendEmailToAdmins(booking);

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error.message);

    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Esta data já está reservada' });
    }

    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// GET /api/consultations
router.get('/', authMiddleware, adminOrOwnerMiddleware, async (req, res) => {
  try {
    const companyId = req.query.companyId || req.user.companyId;

    if (req.isAdmin && !req.query.companyId) {
      const bookings = await prisma.consultationBooking.findMany({
        orderBy: { consultationDate: 'desc' },
      });
      return res.json(bookings);
    }

    const bookings = await prisma.consultationBooking.findMany({
      where: { companyId },
      orderBy: { consultationDate: 'desc' },
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error.message);
    res.status(500).json({ error: 'Error fetching bookings' });
  }
});

// DELETE /api/consultations/:id
router.delete('/:id', authMiddleware, adminOrOwnerMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.consultationBooking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!req.isAdmin && booking.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'No permission to cancel this booking' });
    }

    const updated = await prisma.consultationBooking.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error cancelling booking:', error.message);
    res.status(500).json({ error: 'Error cancelling booking' });
  }
});

async function sendEmailToAdmins(booking) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
    });

    const adminEmails = admins.map(admin => admin.email);

    if (adminEmails.length === 0) {
      console.log('⚠️ Nenhum admin encontrado para enviar email');
      return;
    }

    console.log('📧 Preparando email para admins:', adminEmails);

    // Configurar nodemailer
    const nodemailer = require('nodemailer');

    // Criar transporter com as credenciais do .env
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true para porta 465, false para outras
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verificar se as credenciais de email estão configuradas
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️ Credenciais de email não configuradas no .env');
      console.log('📋 Detalhes do agendamento que seria enviado:');
      console.log('   Empresa:', booking.companyName);
      console.log('   Usuário:', booking.userName);
      console.log('   Email:', booking.userEmail);
      console.log('   Data:', new Date(booking.consultationDate).toLocaleDateString('pt-BR'));
      console.log('   Horário:', booking.startTime);
      console.log('   Observações:', booking.notes || 'Nenhuma');
      return;
    }

    // Formatar data
    const dataFormatada = new Date(booking.consultationDate).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // HTML do email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
          .info-label { font-weight: bold; color: #667eea; min-width: 120px; }
          .info-value { color: #333; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          h1 { margin: 0; font-size: 24px; }
          h2 { color: #667eea; margin-top: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🗓️ Nova Consultoria Agendada</h1>
          </div>
          <div class="content">
            <h2>Um cliente Premium agendou uma consultoria!</h2>
            <p>Os detalhes do agendamento estão abaixo:</p>
            
            <div class="info-box">
              <div class="info-row">
                <div class="info-label">📅 Data:</div>
                <div class="info-value">${dataFormatada}</div>
              </div>
              <div class="info-row">
                <div class="info-label">🕐 Horário:</div>
                <div class="info-value">${booking.startTime} (2 horas de duração)</div>
              </div>
              <div class="info-row">
                <div class="info-label">🏢 Empresa:</div>
                <div class="info-value">${booking.companyName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">👤 Usuário:</div>
                <div class="info-value">${booking.userName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">📧 Email:</div>
                <div class="info-value">${booking.userEmail}</div>
              </div>
              ${
                booking.notes
                  ? `
              <div class="info-row">
                <div class="info-label">📝 Observações:</div>
                <div class="info-value">${booking.notes}</div>
              </div>
              `
                  : ''
              }
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Entre em contato com o cliente para confirmar os detalhes e preparar a consultoria.
            </p>
          </div>
          <div class="footer">
            <p>PaimContab - Sistema de Gestão MEI</p>
            <p>Este é um email automático, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email para todos os admins
    const mailOptions = {
      from: `"PaimContab - Agendamentos" <${process.env.EMAIL_USER}>`,
      to: adminEmails.join(', '),
      subject: `🗓️ Nova Consultoria Agendada - ${booking.companyName}`,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado com sucesso para admins:', adminEmails);
  } catch (error) {
    console.error('❌ Erro ao enviar email para admins:', error.message);
    // Não propagar o erro para não bloquear o agendamento
  }
}

module.exports = router;
