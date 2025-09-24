/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import Link from 'next/link';
import {
  HiUsers,
  HiBuildingOffice,
  HiCreditCard,
  HiMagnifyingGlass,
  HiEye,
  HiUserCircle,
  HiCheckCircle,
  HiXCircle,
  HiArrowTrendingUp,
  HiChartBarSquare,
} from 'react-icons/hi2';

interface Company {
  companyName: string;
  businessSegment?: string;
  mainActivity?: string;
  businessType?: string;
  cnpj?: string;
  city?: string;
  state?: string;
  employeeCount?: number;
  monthlyRevenue?: number;
}

interface Subscription {
  id: string;
  plan: {
    name: string;
  };
  amount: number;
  createdAt: string;
  status: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  company?: Company;
  currentSubscription?: Subscription;
  planStatus: string;
  subscriptions?: Subscription[];
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  usersWithCompany: number;
  totalCompanies: number;
  activeSubscriptions: number;
  inactiveUsers: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    // Verificar se usuário é admin antes de carregar dados
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');

    if (!user || !token) {
      window.location.href = '/Login';
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (userData.role !== 'admin') {
        alert('Acesso negado. Esta área é restrita aos administradores.');
        window.location.href = '/';
        return;
      }

      loadDashboardData();
      loadUsers();
    } catch (error) {
      console.error('Erro ao verificar dados do usuário:', error);
      window.location.href = '/Login';
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        window.location.href = '/Login';
        return;
      }

      const response = await fetch('/api/admin/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/Login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  };

  const loadUsers = async (page = 1, searchTerm = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      if (!token) {
        window.location.href = '/Login';
        return;
      }

      const response = await fetch(`/api/admin/users?page=${page}&limit=10&search=${searchTerm}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/Login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(1, search);
  };

  const viewUserDetails = async (userId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        window.location.href = '/Login';
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/Login';
        return;
      }

      if (response.ok) {
        const userData = await response.json();
        setSelectedUser(userData);
        setShowUserModal(true);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do usuário:', error);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        window.location.href = '/Login';
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/Login';
        return;
      }

      if (response.ok) {
        loadUsers(pagination.page, search);
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const getPlanStatusBadge = (status: string) => {
    const badges = {
      active: { color: 'bg-gray-800 text-white', text: 'Ativo' },
      canceled: { color: 'bg-gray-300 text-gray-700', text: 'Cancelado' },
      pending: { color: 'bg-gray-200 text-gray-600', text: 'Pendente' },
      no_plan: { color: 'bg-gray-100 text-gray-500', text: 'Sem Plano' },
    };
    const badge = badges[status as keyof typeof badges] || badges.no_plan;

    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.text}</span>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (loading && !users.length) {
    return (
      <div className="flex">
        <AdminSidebar currentPage="dashboard" />
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar currentPage="dashboard" />
      
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">Dashboard Administrativo</h1>
              <p className="text-gray-600 mt-1">Visão geral do sistema</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Última atualização</p>
              <p className="text-sm font-medium text-black">
                {new Date().toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 overflow-y-auto">
          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Total de Usuários</p>
                    <p className="text-3xl font-bold text-black">{stats.totalUsers}</p>
                    <p className="text-xs text-gray-500 mt-1">{stats.activeUsers} ativos</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <HiUsers className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Empresas Cadastradas</p>
                    <p className="text-3xl font-bold text-black">{stats.totalCompanies}</p>
                    <p className="text-xs text-gray-500 mt-1">{stats.usersWithCompany} com empresa</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <HiBuildingOffice className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Assinaturas Ativas</p>
                    <p className="text-3xl font-bold text-black">{stats.activeSubscriptions}</p>
                    <div className="flex items-center mt-1">
                      <HiArrowTrendingUp className="w-3 h-3 text-gray-500 mr-1" />
                      <span className="text-xs text-gray-500">
                        {Math.round((stats.activeSubscriptions / stats.totalUsers) * 100)}% dos usuários
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <HiCreditCard className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Taxa de Ativação</p>
                    <p className="text-3xl font-bold text-black">
                      {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{stats.inactiveUsers} inativos</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <HiChartBarSquare className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabela de Usuários */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black">Usuários Recentes</h2>

                {/* Busca */}
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative">
                    <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"

                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Buscar usuários..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500 text-gray-800"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Buscar
                  </button>
                </form>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cadastro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <HiUserCircle className="w-8 h-8 text-gray-400" />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-black">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.company ? (
                          <div>
                            <div className="text-sm font-medium text-black">{user.company.companyName}</div>
                            <div className="text-sm text-gray-500">{user.company.businessSegment}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Não cadastrada</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.currentSubscription ? (
                          <div>
                            <div className="text-sm font-medium text-black">{user.currentSubscription.plan.name}</div>
                            <div className="text-sm text-gray-500">{formatCurrency(user.currentSubscription.amount)}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sem plano</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getPlanStatusBadge(user.planStatus)}
                          {user.isActive ? (
                            <HiCheckCircle className="w-4 h-4 text-gray-600" />
                          ) : (
                            <HiXCircle className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => viewUserDetails(user.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <HiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleUserStatus(user.id, user.isActive)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title={user.isActive ? 'Desativar' : 'Ativar'}
                          >
                            {user.isActive ? <HiXCircle className="w-4 h-4" /> : <HiCheckCircle className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {pagination.pages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} usuários
                  </p>
                  <div className="flex gap-1">
                    {Array.from({ length: pagination.pages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => loadUsers(i + 1, search)}
                        className={`px-3 py-1 text-sm rounded ${
                          pagination.page === i + 1
                            ? 'bg-black text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botão Ver Todos */}
          <div className="mt-6 text-center">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Ver Todos os Usuários
              <HiUsers className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Modal de Detalhes do Usuário */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-black">Detalhes do Usuário</h3>
                  <button 
                    onClick={() => setShowUserModal(false)} 
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <HiXCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Informações do Usuário */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-black mb-3">Informações Pessoais</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nome:</span>
                        <span className="text-black font-medium">{selectedUser.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="text-black font-medium">{selectedUser.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Função:</span>
                        <span className="text-black font-medium">{selectedUser.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="text-black font-medium">{selectedUser.isActive ? 'Ativo' : 'Inativo'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cadastro:</span>
                        <span className="text-black font-medium">{formatDate(selectedUser.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Informações da Empresa */}
                  {selectedUser.company && (
                    <div>
                      <h4 className="font-semibold text-black mb-3">Informações da Empresa</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nome:</span>
                          <span className="text-black font-medium">{selectedUser.company.companyName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Segmento:</span>
                          <span className="text-black font-medium">{selectedUser.company.businessSegment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Atividade:</span>
                          <span className="text-black font-medium">{selectedUser.company.mainActivity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">CNPJ:</span>
                          <span className="text-black font-medium">{selectedUser.company.cnpj || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Localização:</span>
                          <span className="text-black font-medium">{selectedUser.company.city}, {selectedUser.company.state}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Funcionários:</span>
                          <span className="text-black font-medium">{selectedUser.company.employeeCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Faturamento:</span>
                          <span className="text-black font-medium">{formatCurrency(selectedUser.company.monthlyRevenue || 0)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Histórico de Assinaturas */}
                {selectedUser.subscriptions && selectedUser.subscriptions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-black mb-3">Histórico de Assinaturas</h4>
                    <div className="space-y-3">
                      {selectedUser.subscriptions.map((sub: any) => (
                        <div key={sub.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-black">{sub.plan.name}</p>
                              <p className="text-sm text-gray-600">
                                {formatCurrency(sub.amount)} • {formatDate(sub.createdAt)}
                              </p>
                            </div>
                            {getPlanStatusBadge(sub.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}