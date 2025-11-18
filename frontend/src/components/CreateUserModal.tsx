'use client';

import { useState } from 'react';
import { apiClient } from '@/utils/apiClient';
import { HiXMark, HiUserPlus } from 'react-icons/hi2';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    isAdmin: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/api/admin/users', formData);
      if (response.success) {
        onSuccess();
        onClose();
        setFormData({ name: '', email: '', password: '', isAdmin: false });
      } else {
        setError(response.error || 'Erro ao criar usuário');
      }
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      setError('Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-40 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-slideUp">
        {/* Header - Clean e minimalista */}
        <div className="px-6 py-5 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#1e2939' }}
              >
                <HiUserPlus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Criar Novo Usuário</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <HiXMark className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Form - Fundo branco */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Nome Completo</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 font-medium text-gray-900 transition-all placeholder:text-gray-400 hover:border-gray-300"
              style={{ ['--tw-ring-color' as string]: '#1e2939' } as React.CSSProperties}
              placeholder="Ex: João Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">E-mail</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 font-medium text-gray-900 transition-all placeholder:text-gray-400 hover:border-gray-300"
              style={{ ['--tw-ring-color' as string]: '#1e2939' } as React.CSSProperties}
              placeholder="Ex: joao@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 font-medium text-gray-900 transition-all placeholder:text-gray-400 hover:border-gray-300"
              style={{ ['--tw-ring-color' as string]: '#1e2939' } as React.CSSProperties}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <input
              type="checkbox"
              id="isAdmin"
              checked={formData.isAdmin}
              onChange={e => setFormData({ ...formData, isAdmin: e.target.checked })}
              className="w-4 h-4 border-gray-300 rounded focus:ring-2"
              style={{ accentColor: '#1e2939' }}
            />
            <label htmlFor="isAdmin" className="text-sm font-medium text-gray-900 select-none cursor-pointer">
              Conceder privilégios de administrador
            </label>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              style={{ backgroundColor: '#1e2939' }}
            >
              {loading ? 'Criando...' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
