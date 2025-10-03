'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MeiSidebar from '@/components/MeiSidebar';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

interface Booking {
  id: string;
  consultationDate: string;
  startTime: string;
  status: string;
  companyName: string;
  userName: string;
  notes?: string;
}

export default function CalendarioPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Horários disponíveis (19h-22h)
  const availableTimes = ['19:00', '20:00', '21:00'];

  const fetchBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const userObj = JSON.parse(userStr || '{}');
      
      const queryParam = userObj.role === 'admin' ? `?companyId=${companyId}` : '';
      
      const response = await fetch(`${BACKEND_URL}/api/consultations${queryParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const fetchAvailableDates = useCallback(async (year: number, month: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${BACKEND_URL}/api/consultations/available-dates?year=${year}&month=${month}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBookedDates(data.bookedDates || []);
      }
    } catch (error) {
      console.error('Erro ao buscar datas disponíveis:', error);
    }
  };

  useEffect(() => {
    // Validar acesso
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/Login');
      return;
    }

    const userObj = JSON.parse(userStr);
    const userIsAdmin = userObj.role === 'admin';

    // Validar se o usuário tem acesso a esta empresa
    if (!userIsAdmin && userObj.companyId !== companyId) {
      alert('Você não tem permissão para acessar esta empresa');
      router.push(`/mei/${userObj.companyId}/dashboard`);
      return;
    }

    fetchBookings();
    fetchAvailableDates(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
  }, [companyId, router, currentMonth, fetchBookings, fetchAvailableDates]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedDate) {
      setError('Selecione uma data');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/consultations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          consultationDate: selectedDate,
          startTime: selectedTime,
          notes
        })
      });

      if (response.ok) {
        setSuccess('Consultoria agendada com sucesso! Os administradores foram notificados.');
        setSelectedDate('');
        setSelectedTime('19:00');
        setNotes('');
        setShowForm(false);
        fetchBookings();
        fetchAvailableDates(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao agendar consultoria');
      }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      setError('Erro ao agendar consultoria');
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm('Deseja cancelar este agendamento?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/consultations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Agendamento cancelado com sucesso');
        fetchBookings();
        fetchAvailableDates(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao cancelar agendamento');
      }
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      setError('Erro ao cancelar agendamento');
    }
  };

  const changeMonth = (delta: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCurrentMonth(newMonth);
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Preencher dias vazios antes do primeiro dia
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Preencher os dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateBooked = (date: Date | null) => {
    if (!date) return false;
    const dateStr = date.toISOString().split('T')[0];
    return bookedDates.includes(dateStr);
  };

  const isDatePast = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const days = getDaysInMonth();
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (loading) {
    return (
      <div className="flex h-screen">
        <MeiSidebar companyId={companyId} />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-xl">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <MeiSidebar companyId={companyId} />
      
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Calendário de Consultorias</h1>
          <p className="text-gray-600 mb-8">
            Agende sua consultoria personalizada (19h às 22h)
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendário */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => changeMonth(-1)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  ← Anterior
                </button>
                <h2 className="text-xl font-semibold">
                  {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  onClick={() => changeMonth(1)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Próximo →
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {days.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const isBooked = isDateBooked(date);
                  const isPast = isDatePast(date);
                  const dateStr = date.toISOString().split('T')[0];
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (!isBooked && !isPast) {
                          setSelectedDate(dateStr);
                          setShowForm(true);
                        }
                      }}
                      disabled={isBooked || isPast}
                      className={`
                        aspect-square rounded-lg border-2 flex items-center justify-center
                        transition-all text-sm font-medium
                        ${isBooked ? 'bg-red-100 border-red-300 text-red-800 cursor-not-allowed' : ''}
                        ${isPast && !isBooked ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' : ''}
                        ${!isBooked && !isPast && !isSelected ? 'bg-white border-gray-300 hover:border-purple-400 hover:bg-purple-50' : ''}
                        ${isSelected ? 'bg-purple-500 border-purple-600 text-white' : ''}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
                  <span className="text-gray-600">Reservado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 border-2 border-purple-600 rounded"></div>
                  <span className="text-gray-600">Selecionado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
                  <span className="text-gray-600">Disponível</span>
                </div>
              </div>
            </div>

            {/* Formulário de Agendamento */}
            <div>
              {showForm && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-4">Agendar Consultoria</h3>
                  <form onSubmit={handleCreateBooking} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Selecionada
                      </label>
                      <input
                        type="text"
                        value={selectedDate ? formatDate(selectedDate) : ''}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horário de Início
                      </label>
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {availableTimes.map(time => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Duração: 4 horas (até {parseInt(selectedTime.split(':')[0]) + 4}h)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observações (opcional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Descreva os tópicos que gostaria de abordar na consultoria..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition"
                      >
                        Confirmar Agendamento
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setSelectedDate('');
                        }}
                        className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Lista de Agendamentos */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Seus Agendamentos</h3>
                
                {bookings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Nenhuma consultoria agendada ainda
                  </p>
                ) : (
                  <div className="space-y-3">
                    {bookings.map(booking => (
                      <div
                        key={booking.id}
                        className={`p-4 rounded-lg border-2 ${
                          booking.status === 'cancelled'
                            ? 'border-gray-300 bg-gray-50'
                            : 'border-purple-300 bg-purple-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {formatDate(booking.consultationDate)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Horário: {booking.startTime} (4 horas)
                            </p>
                            {booking.notes && (
                              <p className="text-sm text-gray-600 mt-1">
                                Obs: {booking.notes}
                              </p>
                            )}
                            <p className={`text-xs mt-2 font-medium ${
                              booking.status === 'cancelled' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {booking.status === 'cancelled' ? 'Cancelado' : 'Agendado'}
                            </p>
                          </div>
                          
                          {booking.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
