'use client';

import { useState, useEffect } from 'react';
import MeiProtection from '../../../components/MeiProtection';
import MeiSidebar from '../../../components/MeiSidebar';
import {
  HiPlus,
  HiCalendarDays,
  HiClock,
  HiMapPin,
  HiArrowLeft,
  HiArrowRight,
  HiPencil,
  HiTrash,
} from 'react-icons/hi2';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  type: string;
  priority: string;
  status: string;
  location?: string;
  isAllDay: boolean;
  isDasEvent?: boolean;
  dasId?: string;
}

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const EVENT_TYPES = [
  { value: 'appointment', label: 'Compromisso', color: 'blue' },
  { value: 'meeting', label: 'Reunião', color: 'purple' },
  { value: 'deadline', label: 'Prazo', color: 'orange' },
  { value: 'reminder', label: 'Lembrete', color: 'green' },
  { value: 'das_due', label: 'Vencimento DAS', color: 'red' },
];

const PRIORITIES = [
  { value: 'low', label: 'Baixa', color: 'gray' },
  { value: 'medium', label: 'Média', color: 'blue' },
  { value: 'high', label: 'Alta', color: 'red' },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function MeiCalendarContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    type: 'appointment',
    priority: 'medium',
    location: '',
    isAllDay: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL
          }/api/calendar?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const eventsData = await response.json();
          setEvents(eventsData);
        }
      } catch (error) {
        console.error('Erro ao buscar eventos:', error);
      }
    };

    fetchData();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL
        }/api/calendar?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const eventsData = await response.json();
        setEvents(eventsData);
      }
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('authToken');
      const startDateTime = formData.isAllDay
        ? new Date(formData.startDate).toISOString()
        : new Date(`${formData.startDate}T${formData.startTime}`).toISOString();

      const endDateTime = formData.endDate
        ? formData.isAllDay
          ? new Date(formData.endDate).toISOString()
          : new Date(`${formData.endDate}T${formData.endTime || formData.startTime}`).toISOString()
        : startDateTime;

      const eventData = {
        title: formData.title,
        description: formData.description,
        startDate: startDateTime,
        endDate: endDateTime,
        type: formData.type,
        priority: formData.priority,
        location: formData.location,
        isAllDay: formData.isAllDay,
      };

      const url = editingEvent
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calendar/${editingEvent.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calendar`;

      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        fetchEvents();
        setShowEventModal(false);
        setEditingEvent(null);
        resetForm();
      }
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja deletar este evento?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calendar/${eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      type: 'appointment',
      priority: 'medium',
      location: '',
      isAllDay: false,
    });
  };

  const openEventModal = (date?: Date) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        startDate: date.toISOString().split('T')[0],
      }));
    }
    setShowEventModal(true);
  };

  const editEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      startDate: event.startDate.split('T')[0],
      startTime: event.isAllDay ? '' : formatTime(event.startDate),
      endDate: event.endDate ? event.endDate.split('T')[0] : '',
      endTime: event.endDate && !event.isAllDay ? formatTime(event.endDate) : '',
      type: event.type,
      priority: event.priority,
      location: event.location || '',
      isAllDay: event.isAllDay,
    });
    setShowEventModal(true);
  };

  // Gerar calendário
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Dias vazios do mês anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <MeiSidebar currentPage="calendario" />

      <div className="mei-content-wrapper">
        {/* Header */}
        <div className="bg-white border-b border-slate-200/60">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-light text-slate-900 tracking-tight">Calendário</h1>
                <p className="text-slate-500 mt-1">Gerencie seus compromissos e prazos</p>
              </div>
              <button
                onClick={() => openEventModal()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <HiPlus className="w-5 h-5" />
                Novo Evento
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Calendário Principal */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-slate-200/60">
                {/* Navigation */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-200"
                    >
                      <HiArrowLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-200"
                    >
                      <HiArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="p-6">
                  {/* Weekdays */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {WEEKDAYS.map(day => (
                      <div key={day} className="p-3 text-center text-sm font-medium text-slate-500">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendar().map((date, index) => {
                      if (!date) {
                        return <div key={index} className="p-3"></div>;
                      }

                      const dayEvents = getEventsForDate(date);
                      const isToday = date.toDateString() === new Date().toDateString();

                      return (
                        <div
                          key={index}
                          onClick={() => openEventModal(date)}
                          className={`p-3 min-h-[80px] border rounded-lg cursor-pointer transition-colors duration-200 ${
                            isToday ? 'bg-blue-50 border-blue-200' : 'border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                            {date.getDate()}
                          </div>

                          <div className="space-y-1">
                            {dayEvents.slice(0, 2).map(event => (
                              <div
                                key={event.id}
                                onClick={e => {
                                  e.stopPropagation();
                                  if (!event.isDasEvent) {
                                    editEvent(event);
                                  }
                                }}
                                className={`text-xs px-2 py-1 rounded text-white truncate cursor-pointer ${
                                  event.type === 'das_due'
                                    ? 'bg-red-500'
                                    : event.type === 'deadline'
                                    ? 'bg-orange-500'
                                    : event.type === 'meeting'
                                    ? 'bg-purple-500'
                                    : event.type === 'reminder'
                                    ? 'bg-green-500'
                                    : 'bg-blue-500'
                                }`}
                                title={event.title}
                              >
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-slate-500">+{dayEvents.length - 2} mais</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Próximos Eventos */}
            <div>
              <div className="bg-white rounded-xl border border-slate-200/60 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Próximos Eventos</h3>

                <div className="space-y-4">
                  {events
                    .filter(event => new Date(event.startDate) >= new Date())
                    .slice(0, 5)
                    .map(event => (
                      <div
                        key={event.id}
                        className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-slate-900 text-sm">{event.title}</h4>
                          {!event.isDasEvent && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => editEvent(event)}
                                className="p-1 text-slate-400 hover:text-blue-600 transition-colors duration-200"
                              >
                                <HiPencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="p-1 text-slate-400 hover:text-red-600 transition-colors duration-200"
                              >
                                <HiTrash className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                          <HiCalendarDays className="w-4 h-4" />
                          <span>{formatDate(event.startDate)}</span>
                          {!event.isAllDay && (
                            <>
                              <HiClock className="w-4 h-4" />
                              <span>{formatTime(event.startDate)}</span>
                            </>
                          )}
                        </div>

                        {event.location && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <HiMapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              event.type === 'das_due'
                                ? 'bg-red-100 text-red-700'
                                : event.type === 'deadline'
                                ? 'bg-orange-100 text-orange-700'
                                : event.type === 'meeting'
                                ? 'bg-purple-100 text-purple-700'
                                : event.type === 'reminder'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {EVENT_TYPES.find(t => t.value === event.type)?.label}
                          </span>

                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              event.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : event.priority === 'medium'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {PRIORITIES.find(p => p.value === event.priority)?.label}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Evento */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  {editingEvent ? 'Editar Evento' : 'Novo Evento'}
                </h3>

                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isAllDay"
                      checked={formData.isAllDay}
                      onChange={e => setFormData(prev => ({ ...prev, isAllDay: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isAllDay" className="text-sm text-slate-700">
                      Dia inteiro
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Data Início *</label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {!formData.isAllDay && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
                        <input
                          type="time"
                          value={formData.startTime}
                          onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {EVENT_TYPES.filter(t => t.value !== 'das_due').map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
                      <select
                        value={formData.priority}
                        onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {PRIORITIES.map(priority => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Local</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      {editingEvent ? 'Salvar' : 'Criar Evento'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEventModal(false);
                        setEditingEvent(null);
                        resetForm();
                      }}
                      className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MeiCalendarPage() {
  return (
    <MeiProtection>
      <MeiCalendarContent />
    </MeiProtection>
  );
}
