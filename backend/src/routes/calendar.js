const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getCalendarEvents,
  createCalendarEvent,
  getCalendarEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
  markEventAsCompleted,
  getEventsByMonth,
} = require('../controllers/calendarController');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas principais
router.get('/', getCalendarEvents);
router.post('/', createCalendarEvent);
router.get('/month/:year/:month', getEventsByMonth);
router.get('/:id', getCalendarEventById);
router.put('/:id', updateCalendarEvent);
router.delete('/:id', deleteCalendarEvent);
router.patch('/:id/complete', markEventAsCompleted);

module.exports = router;
