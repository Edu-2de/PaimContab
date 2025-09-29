const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Buscar todos os eventos do calendário
const getCalendarEvents = async (req, res) => {
  try {
    const user = req.user;

    // Buscar a empresa do usuário
    const company = await prisma.company.findUnique({
      where: { userId: user.id },
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const { startDate, endDate, type } = req.query;

    // Filtros opcionais
    const filters = {
      companyId: company.id,
    };

    if (startDate && endDate) {
      filters.startDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (type) {
      filters.type = type;
    }

    const events = await prisma.calendarEvent.findMany({
      where: filters,
      orderBy: { startDate: 'asc' },
    });

    // Adicionar eventos automáticos de DAS
    const dasCalculations = await prisma.dASCalculation.findMany({
      where: {
        companyId: company.id,
        isPaid: false,
        dueDate:
          startDate && endDate
            ? {
                gte: new Date(startDate),
                lte: new Date(endDate),
              }
            : undefined,
      },
    });

    const dasEvents = dasCalculations.map(das => ({
      id: `das-${das.id}`,
      title: `Vencimento DAS - ${das.month}`,
      description: `DAS de ${das.month} - Valor: R$ ${das.dasValue.toFixed(2)}`,
      startDate: das.dueDate,
      endDate: das.dueDate,
      type: 'das_due',
      priority: 'high',
      status: 'scheduled',
      isAllDay: true,
      isDasEvent: true,
      dasId: das.id,
    }));

    const allEvents = [...events, ...dasEvents];

    res.json(allEvents);
  } catch (error) {
    console.error('Erro ao buscar eventos do calendário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar novo evento
const createCalendarEvent = async (req, res) => {
  try {
    const user = req.user;
    const {
      title,
      description,
      startDate,
      endDate,
      type = 'appointment',
      priority = 'medium',
      location,
      isAllDay = false,
      recurrence = 'none',
    } = req.body;

    // Validações
    if (!title || !startDate) {
      return res.status(400).json({ error: 'Título e data de início são obrigatórios' });
    }

    // Buscar a empresa do usuário
    const company = await prisma.company.findUnique({
      where: { userId: user.id },
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        companyId: company.id,
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : new Date(startDate),
        type,
        priority,
        location,
        isAllDay,
        recurrence,
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar evento por ID
const getCalendarEventById = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Buscar a empresa do usuário
    const company = await prisma.company.findUnique({
      where: { userId: user.id },
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const event = await prisma.calendarEvent.findFirst({
      where: {
        id,
        companyId: company.id,
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    res.json(event);
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar evento
const updateCalendarEvent = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { title, description, startDate, endDate, type, priority, status, location, isAllDay, recurrence } = req.body;

    // Buscar a empresa do usuário
    const company = await prisma.company.findUnique({
      where: { userId: user.id },
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Verificar se o evento existe e pertence à empresa
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id,
        companyId: company.id,
      },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (type !== undefined) updateData.type = type;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (location !== undefined) updateData.location = location;
    if (isAllDay !== undefined) updateData.isAllDay = isAllDay;
    if (recurrence !== undefined) updateData.recurrence = recurrence;

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: updateData,
    });

    res.json(event);
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar evento
const deleteCalendarEvent = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Buscar a empresa do usuário
    const company = await prisma.company.findUnique({
      where: { userId: user.id },
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Verificar se o evento existe e pertence à empresa
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id,
        companyId: company.id,
      },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    await prisma.calendarEvent.delete({
      where: { id },
    });

    res.json({ message: 'Evento deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Marcar evento como concluído
const markEventAsCompleted = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Buscar a empresa do usuário
    const company = await prisma.company.findUnique({
      where: { userId: user.id },
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const event = await prisma.calendarEvent.update({
      where: {
        id,
        companyId: company.id,
      },
      data: {
        status: 'completed',
      },
    });

    res.json(event);
  } catch (error) {
    console.error('Erro ao marcar evento como concluído:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar eventos por mês
const getEventsByMonth = async (req, res) => {
  try {
    const user = req.user;
    const { year, month } = req.params;

    // Buscar a empresa do usuário
    const company = await prisma.company.findUnique({
      where: { userId: user.id },
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const events = await prisma.calendarEvent.findMany({
      where: {
        companyId: company.id,
        startDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startDate: 'asc' },
    });

    res.json(events);
  } catch (error) {
    console.error('Erro ao buscar eventos do mês:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getCalendarEvents,
  createCalendarEvent,
  getCalendarEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
  markEventAsCompleted,
  getEventsByMonth,
};
