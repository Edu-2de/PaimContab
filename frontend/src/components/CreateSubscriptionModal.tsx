'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/utils/apiClient';
import { HiXMark, HiCreditCard } from 'react-icons/hi2';

interface CreateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSubscriptionModal({ isOpen, onClose, onSuccess }: CreateSubscriptionModalProps) {
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [plans, setPlans] = useState<{ id: string; name: string; price: number }[]>([]);
  const [formData, setFormData] = useState({
    userId: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchPlans();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/admin/users?limit=1000');
      const data = response as { users?: Array<{ id: string; name: string; email: string }> };
      if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await apiClient.get('/api/admin/subscriptions/plans');
      const data = response as { data?: Array<{ id: string; name: string; price: number }> };
      if (data.data && Array.isArray(data.data)) {
        setPlans(data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar planos:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/api/admin/subscriptions', formData);
      if (response.success) {
        onSuccess();
        onClose();
        setFormData({
          userId: '',
          planId: '',
          startDate: new Date().toISOString().split('T')[0],
          isActive: true,
        });
      } else {
        setError(response.error || 'Erro ao criar assinatura');
      }
    } catch (err) {
      console.error('Erro ao criar assinatura:', err);
      setError('Erro ao criar assinatura');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        <div
          className="flex items-center justify-between p-6 border-b border-gray-100"
          style={{ backgroundColor: '#1e2939' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white bg-opacity-10 rounded-lg">
              <HiCreditCard className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Criar Nova Assinatura</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors">
            <HiXMark className="w-6 h-6 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Usuário</label>
            <select
              required
              value={formData.userId}
              onChange={e => setFormData({ ...formData, userId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent font-medium text-gray-900 transition-all"
              style={{ outlineColor: '#1e2939' }}
            >
              <option value="">Selecione um usuário</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Plano</label>
            <select
              required
              value={formData.planId}
              onChange={e => setFormData({ ...formData, planId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent font-medium text-gray-900 transition-all"
              style={{ outlineColor: '#1e2939' }}
            >
              <option value="">Selecione um plano</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - R$ {plan.price.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Data de Início</label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent font-medium text-gray-900 transition-all"
              style={{ outlineColor: '#1e2939' }}
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 border-gray-300 rounded focus:ring-2"
              style={{ accentColor: '#1e2939' }}
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-gray-900">
              Assinatura Ativa
            </label>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-semibold">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-5 py-3 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg"
              style={{ backgroundColor: '#1e2939' }}
            >
              {loading ? 'Criando...' : 'Criar Assinatura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
