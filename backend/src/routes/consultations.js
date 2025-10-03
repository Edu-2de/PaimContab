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

    // Buscar informações do usuário e empresa
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'Usuário ou empresa não encontrada' });
    }

    // Verificar se a data já está ocupada
    const dateObj = new Date(consultationDate);
    const existingBooking = await prisma.consultationBooking.findFirst({
      where: {
        consultationDate: {
          gte: new Date(dateObj.setHours(0, 0, 0, 0)),
          lt: new Date(dateObj.setHours(23, 59, 59, 999)),
        },
      },
    });

    if (existingBooking) {
      return res.status(409).json({ error: 'Esta data já está reservada' });
    }

    // Criar agendamento
    const booking = await prisma.consultationBooking.create({
      data: {
        companyId: user.company.id,
        consultationDate: new Date(consultationDate),
        startTime,
        companyName: user.company.name,
        userName: user.name,
        userEmail: user.email,
        notes: notes || '',
      },
    });

    // Enviar email para admins (será implementado)
    await sendEmailToAdmins(booking);

    res.status(201).json(booking);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);

    // Erro de unique constraint
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Esta data já está reservada' });
    }

    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// GET /api/consultations - Listar agendamentos
router.get('/', authMiddleware, adminOrOwnerMiddleware, async (req, res) => {
  try {
    const companyId = req.query.companyId || req.user.companyId;

    // Se é admin sem companyId, retorna todos
    if (req.isAdmin && !req.query.companyId) {
      const bookings = await prisma.consultationBooking.findMany({
        orderBy: { consultationDate: 'desc' },
      });
      return res.json(bookings);
    }

    // Retorna apenas da empresa específica
    const bookings = await prisma.consultationBooking.findMany({
      where: { companyId },
      orderBy: { consultationDate: 'desc' },
    });

    res.json(bookings);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

// DELETE /api/consultations/:id - Cancelar agendamento
router.delete('/:id', authMiddleware, adminOrOwnerMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar agendamento
    const booking = await prisma.consultationBooking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Verificar permissão (admin ou dono)
    if (!req.isAdmin && booking.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Sem permissão para cancelar este agendamento' });
    }

    // Atualizar status para cancelado
    const updated = await prisma.consultationBooking.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    res.status(500).json({ error: 'Erro ao cancelar agendamento' });
  }
});

// Função auxiliar para enviar email aos admins
async function sendEmailToAdmins(booking) {
  try {
    // Buscar todos os admins
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
    });

    const adminEmails = admins.map(admin => admin.email);

    if (adminEmails.length === 0) {
      console.log('Nenhum admin encontrado para enviar email');
      return;
    }

    console.log('📧 Email seria enviado para admins:', adminEmails);
    console.log('📅 Agendamento:', {
      empresa: booking.companyName,
      usuario: booking.userName,
      data: booking.consultationDate,
      horario: booking.startTime,
      email: booking.userEmail,
    });

    // TODO: Implementar envio real de email com nodemailer
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({ ... });
  } catch (error) {
    console.error('Erro ao enviar email para admins:', error);
    // Não falhar a requisição se o email falhar
  }
}

module.exports = router;
