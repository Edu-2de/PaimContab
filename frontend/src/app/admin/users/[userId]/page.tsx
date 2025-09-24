/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import Link from 'next/link';
import {
  HiArrowLeft,
  HiUserCircle,
  HiPencilSquare,
  HiCheckCircle,
  HiXCircle,
  HiBuildingOffice,
  HiCreditCard,
  HiCalendarDays,
  HiEnvelope,
  HiMapPin,
  HiCurrencyDollar,
  HiUsers,
  HiChartBarSquare,
  HiDocumentText,
  HiCog6Tooth,
} from 'react-icons/hi2';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    companyName: string;
    businessSegment: string;
    mainActivity: string;
    businessType: string;
    cnpj: string | null;
    city: string;
    state: string;
    employeeCount: string;
    monthlyRevenue: number | null;
    createdAt: string;
  };
  subscriptions: Array<{
    id: string;
    status: string;
    amount: number;
    createdAt: string;
    updatedAt: string;
    plan: {
      id: string;
      name: string;
      description: string;
      price: number;
      features: string[];
    };
  }>;
  currentSubscription?: {
    id: string;
    status: string;
    amount: number;
    plan: {
      name: string;
      price: number;
    };
  };
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    isActive: true,
  });

  useEffect(() => {
    if (userId) {
      loadUserDetails();
    }
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/Login');
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/Login');
          return;
        }
        throw new Error('Erro ao carregar dados do usuário');
      }

      const data = await response.json();
      setUser(data);
      setEditForm({
        name: data.name,
        email: data.email,
        isActive: data.isActive,
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/Login');
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar usuário');
      }

      await loadUserDetails();
      setIsEditing(false);
      alert('Usuário atualizado com sucesso!');
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/Login');
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !user?.isActive }),
      });

      if (!response.ok) {
        throw new Error('Erro ao alterar status do usuário');
      }

      await loadUserDetails();
      alert(`Usuário ${!user?.isActive ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { color: 'bg-gray-800 text-white', text: 'Ativo' },
      pending: { color: 'bg-gray-300 text-gray-700', text: 'Pendente' },
      inactive: { color: 'bg-gray-200 text-gray-600', text: 'Inativo' },
      cancelled: { color: 'bg-gray-100 text-gray-500', text: 'Cancelado' },
    };

    const badge = badges[status as keyof typeof badges] || badges.inactive;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex">
        <AdminSidebar currentPage="users" />
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados do usuário...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex">
        <AdminSidebar currentPage="users" />
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <HiXCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">Usuário não encontrado</h3>
            <p className="text-gray-600 mb-6">{error || 'O usuário solicitado não foi encontrado.'}</p>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <HiArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar currentPage="users" />
      
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin/dashboard" 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HiArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-black">Detalhes do Usuário</h1>
                <p className="text-gray-600 mt-1">Informações completas e gerenciamento</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleStatus}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  user.isActive
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                {user.isActive ? (
                  <>
                    <HiXCircle className="w-4 h-4" />
                    Desativar
                  </>
                ) : (
                  <>
                    <HiCheckCircle className="w-4 h-4" />
                    Ativar
                  </>
                )}
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isEditing
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                <HiPencilSquare className="w-4 h-4" />
                {isEditing ? 'Cancelar' : 'Editar'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 overflow-y-auto">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="xl:col-span-2 space-y-8">
              {/* User Profile */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <HiUserCircle className="w-16 h-16 text-gray-400" />
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                            placeholder="Nome do usuário"
                          />
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                            placeholder="Email do usuário"
                          />
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editForm.isActive}
                                onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                                className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                              />
                              <span className="text-sm font-medium text-black">Usuário ativo</span>
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateUser}
                              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => setIsEditing(false)}
                              className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-xl font-bold text-black">{user.name}</h2>
                          <p className="text-gray-600">{user.email}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm font-medium text-gray-500">Função:</span>
                            <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{user.role}</span>
                            {user.isActive ? (
                              <div className="flex items-center gap-1 text-gray-600">
                                <HiCheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Ativo</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-gray-600">
                                <HiXCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Inativo</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Data de Cadastro</h4>
                      <div className="flex items-center gap-2 text-black">
                        <HiCalendarDays className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Última Atualização</h4>
                      <div className="flex items-center gap-2 text-black">
                        <HiCalendarDays className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(user.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Information */}
              {user.company && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                      <HiBuildingOffice className="w-5 h-5 text-gray-600" />
                      Informações da Empresa
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Nome da Empresa</h4>
                          <p className="text-black font-medium">{user.company.companyName}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Segmento</h4>
                          <p className="text-black">{user.company.businessSegment}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Atividade Principal</h4>
                          <p className="text-black">{user.company.mainActivity}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Tipo de Negócio</h4>
                          <p className="text-black">{user.company.businessType}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">CNPJ</h4>
                          <p className="text-black">{user.company.cnpj || 'Não informado'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Localização</h4>
                          <div className="flex items-center gap-2 text-black">
                            <HiMapPin className="w-4 h-4 text-gray-400" />
                            <span>
                              {user.company.city}, {user.company.state}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Número de Funcionários</h4>
                          <div className="flex items-center gap-2 text-black">
                            <HiUsers className="w-4 h-4 text-gray-400" />
                            <span>{user.company.employeeCount}</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Faturamento Mensal</h4>
                          <div className="flex items-center gap-2 text-black">
                            <HiCurrencyDollar className="w-4 h-4 text-gray-400" />
                            <span>
                              {user.company.monthlyRevenue
                                ? formatCurrency(user.company.monthlyRevenue)
                                : 'Não informado'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription History */}
              {user.subscriptions && user.subscriptions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                      <HiCreditCard className="w-5 h-5 text-gray-600" />
                      Histórico de Assinaturas
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {user.subscriptions.map(subscription => (
                        <div key={subscription.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-black">{subscription.plan.name}</h4>
                              <p className="text-sm text-gray-600">{subscription.plan.description}</p>
                            </div>
                            {getStatusBadge(subscription.status)}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Valor:</span>
                              <span className="ml-2 font-medium text-black">
                                {formatCurrency(subscription.amount)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Iniciado em:</span>
                              <span className="ml-2 font-medium text-black">{formatDate(subscription.createdAt)}</span>
                            </div>
                          </div>
                          {subscription.plan.features && subscription.plan.features.length > 0 && (
                            <div className="mt-3">
                              <h5 className="text-sm font-medium text-black mb-1">Recursos:</h5>
                              <ul className="text-sm text-gray-600 list-disc list-inside">
                                {subscription.plan.features.map((feature, index) => (
                                  <li key={index}>{feature}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                    <HiChartBarSquare className="w-5 h-5 text-gray-600" />
                    Estatísticas
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Assinaturas</span>
                    <span className="font-semibold text-black">
                      {user.subscriptions ? user.subscriptions.length : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status Atual</span>
                    <span className={`font-semibold ${user.isActive ? 'text-black' : 'text-gray-500'}`}>
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Plano Atual</span>
                    <span className="font-semibold text-black">
                      {user.currentSubscription ? user.currentSubscription.plan.name : 'Nenhum'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Empresa</span>
                    <span className="font-semibold text-black">{user.company ? 'Cadastrada' : 'Não cadastrada'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                    <HiCog6Tooth className="w-5 h-5 text-gray-600" />
                    Ações Rápidas
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full text-left px-4 py-2 bg-gray-50 text-black rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    <HiPencilSquare className="w-4 h-4" />
                    Editar Informações
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    className="w-full text-left px-4 py-2 bg-gray-50 text-black rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    {user.isActive ? <HiXCircle className="w-4 h-4" /> : <HiCheckCircle className="w-4 h-4" />}
                    {user.isActive ? 'Desativar Usuário' : 'Ativar Usuário'}
                  </button>
                  <Link
                    href={`mailto:${user.email}`}
                    className="w-full text-left px-4 py-2 bg-gray-50 text-black rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    <HiEnvelope className="w-4 h-4" />
                    Enviar Email
                  </Link>
                </div>
              </div>

              {/* Account Summary */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                    <HiDocumentText className="w-5 h-5 text-gray-600" />
                    Resumo da Conta
                  </h3>
                </div>
                <div className="p-6 space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Membro desde:</span>
                    <span className="font-medium text-black">{formatDate(user.createdAt)}</span>
                  </div>
                  {user.currentSubscription && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor mensal:</span>
                        <span className="font-medium text-black">
                          {formatCurrency(user.currentSubscription.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status do plano:</span>
                        {getStatusBadge(user.currentSubscription.status)}
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de assinaturas:</span>
                    <span className="font-medium text-black">
                      {user.subscriptions ? user.subscriptions.length : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}