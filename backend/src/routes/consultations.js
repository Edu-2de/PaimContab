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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'User or company not found' });
    }

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
      return res.status(409).json({ error: 'This date is already booked' });
    }

    const booking = await prisma.consultationBooking.create({
      data: {
        companyId: user.company.id,
        consultationDate: new Date(consultationDate),
        startTime,
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
      return res.status(409).json({ error: 'This date is already booked' });
    }

    res.status(500).json({ error: 'Error creating booking' });
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
      console.log('No admins found to send email');
      return;
    }

    console.log('Email would be sent to admins:', adminEmails);
    console.log('Booking details:', {
      company: booking.companyName,
      user: booking.userName,
      date: booking.consultationDate,
      time: booking.startTime,
      email: booking.userEmail,
    });

    // TODO: Implement actual email sending with nodemailer
  } catch (error) {
    console.error('Error sending email to admins:', error.message);
  }
}

module.exports = router;
