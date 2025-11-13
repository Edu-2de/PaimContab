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
      const response = await apiClient.get('/api/admin/users?limit=1000');
      const data = response as { users?: Array<{ id: string; name: string; email: string }> };
      if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/api/admin/companies', formData);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div
          className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10"
          style={{ backgroundColor: '#1e2939' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white bg-opacity-10 rounded-lg">
              <HiBuildingOffice2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Criar Nova Empresa</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors">
            <HiXMark className="w-6 h-6 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Usuário Responsável</label>
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
            <label className="block text-sm font-semibold text-gray-900 mb-2">Nome da Empresa</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent font-medium text-gray-900 transition-all"
              style={{ outlineColor: '#1e2939' }}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent font-medium text-gray-900 transition-all"
              style={{ outlineColor: '#1e2939' }}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Endereço</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent font-medium text-gray-900 transition-all"
              style={{ outlineColor: '#1e2939' }}
              placeholder="Rua Exemplo, 123"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Telefone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent font-medium text-gray-900 transition-all"
              style={{ outlineColor: '#1e2939' }}
              placeholder="(00) 0000-0000"
            />
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
              {loading ? 'Criando...' : 'Criar Empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
