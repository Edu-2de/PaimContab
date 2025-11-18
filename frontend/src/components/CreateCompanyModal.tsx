'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/utils/apiClient';
import { HiXMark, HiBuildingOffice2 } from 'react-icons/hi2';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCompanyModal({ isOpen, onClose, onSuccess }: CreateCompanyModalProps) {
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    cnpj: '',
    address: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      console.log('🔍 Buscando usuários para criar empresa...');
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/users?limit=1000`;
      console.log('📍 URL:', url);

      const response = await apiClient.get(url);
      console.log('📦 Resposta:', response);

      if (response.success && response.data) {
        const data = response.data as { users?: Array<{ id: string; name: string; email: string }> };
        if (data.users && Array.isArray(data.users)) {
          console.log('✅ Usuários carregados:', data.users.length);
          setUsers(data.users);
        } else {
          console.warn('⚠️ Formato inesperado:', data);
        }
      } else {
        console.error('❌ Erro na resposta:', response.error);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar usuários:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/companies`;
      const response = await apiClient.post(url, formData);
      if (response.success) {
        onSuccess();
        onClose();
        setFormData({ userId: '', name: '', cnpj: '', address: '', phone: '' });
      } else {
        setError(response.error || 'Erro ao criar empresa');
      }
    } catch (err) {
      console.error('Erro ao criar empresa:', err);
      setError('Erro ao criar empresa');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-40 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden animate-slideUp">
        {/* Header - Clean e minimalista */}
        <div className="px-6 py-5 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#1e2939' }}
              >
                <HiBuildingOffice2 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Criar Nova Empresa</h2>
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
            <label className="block text-sm font-semibold text-gray-900 mb-2">Usuário Responsável</label>
            <select
              required
              value={formData.userId}
              onChange={e => setFormData({ ...formData, userId: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 font-medium text-gray-900 transition-all placeholder:text-gray-400 hover:border-gray-300"
              style={{ ['--tw-ring-color' as string]: '#1e2939' } as React.CSSProperties}
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
            <label className="block text-sm font-semibold text-gray-900 mb-2">Nome da Empresa</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 font-medium text-gray-900 transition-all placeholder:text-gray-400 hover:border-gray-300"
              style={{ ['--tw-ring-color' as string]: '#1e2939' } as React.CSSProperties}
              placeholder="Empresa Ltda"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">CNPJ</label>
            <input
              type="text"
              required
              value={formData.cnpj}
              onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 font-medium text-gray-900 transition-all placeholder:text-gray-400 hover:border-gray-300"
              style={{ ['--tw-ring-color' as string]: '#1e2939' } as React.CSSProperties}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Endereço</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 font-medium text-gray-900 transition-all placeholder:text-gray-400 hover:border-gray-300"
              style={{ ['--tw-ring-color' as string]: '#1e2939' } as React.CSSProperties}
              placeholder="Rua Exemplo, 123"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Telefone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 font-medium text-gray-900 transition-all placeholder:text-gray-400 hover:border-gray-300"
              style={{ ['--tw-ring-color' as string]: '#1e2939' } as React.CSSProperties}
              placeholder="(00) 0000-0000"
            />
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
              {loading ? 'Criando...' : 'Criar Empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
