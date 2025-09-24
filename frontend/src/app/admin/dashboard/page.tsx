/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import Link from 'next/link';
import {
  HiUsers,
  HiBuildingOffice,
  HiCreditCard,
  HiCurrencyDollar,
  HiMagnifyingGlass,
  HiEye,
  HiUserCircle,
  HiCheckCircle,
  HiXCircle,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiCalendarDays,
  HiChartBarSquare,
  HiUserPlus,
  HiBanknotes,
  HiClockIcon,
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

    console.log('🔐 Verificando acesso admin...');
    console.log('Token presente:', !!token);
    console.log('User presente:', !!user);

    if (!user || !token) {
      console.log('❌ Sem token ou usuário, redirecionando para login');
      window.location.href = '/Login';
      return;
    }

    try {
      const userData = JSON.parse(user);
      console.log('👤 Dados do usuário:', userData);
      console.log('🔧 Role do usuário:', userData.role);

      if (userData.role !== 'admin') {
        console.log('❌ Usuário não é admin, redirecionando para home');
        alert('Acesso negado. Esta área é restrita aos administradores.');
        window.location.href = '/';
        return;
      }

      console.log('✅ Usuário é admin, carregando dados...');
      loadDashboardData();
      loadUsers();
    } catch (error) {
      console.error('❌ Erro ao verificar dados do usuário:', error);
      window.location.href = '/Login';
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('🔑 Token para dashboard:', token ? 'Presente' : 'Ausente');

      if (!token) {
        console.log('❌ Sem token, redirecionando para login');
        window.location.href = '/Login';
        return;
      }

      const response = await fetch('/api/admin/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Dashboard response status:', response.status);

      if (response.status === 401) {
        console.log('❌ Token inválido, removendo e redirecionando');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/Login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dashboard data:', data);
        setStats(data);
      } else {
        const errorData = await response.text();
        console.error('❌ Erro dashboard:', errorData);
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
      active: { color: 'bg-green-100 text-green-800', text: 'Ativo' },
      canceled: { color: 'bg-red-100 text-red-800', text: 'Cancelado' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendente' },
      no_plan: { color: 'bg-gray-100 text-gray-800', text: 'Sem Plano' },
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
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar currentPage="dashboard" />
      
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
              <p className="text-gray-600">Visão geral completa do sistema</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Última atualização</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Enhanced Stats Cards */}
          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total de Usuários</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                      <div className="flex items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {stats.activeUsers} ativos
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <HiUsers className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Empresas Cadastradas</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalCompanies}</p>
                      <div className="flex items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {stats.usersWithCompany} usuários com empresa
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <HiBuildingOffice className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Assinaturas Ativas</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
                      <div className="flex items-center mt-2">
                        <HiArrowTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-xs text-green-600">
                          +{Math.round((stats.activeSubscriptions / stats.totalUsers) * 100)}% dos usuários
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <HiCreditCard className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Taxa de Ativação</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
                      </p>
                      <div className="flex items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {stats.inactiveUsers} usuários inativos
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <HiChartBarSquare className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <HiUserPlus className="w-5 h-5 text-blue-600" />
                    Ações Rápidas
                  </h3>
                  <div className="space-y-3">
                    <Link
                      href="/admin/users/new"
                      className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Criar Novo Usuário
                    </Link>
                    <Link
                      href="/admin/companies"
                      className="block w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      Gerenciar Empresas
                    </Link>
                    <Link
                      href="/admin/reports"
                      className="block w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      Ver Relatórios
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <HiCalendarDays className="w-5 h-5 text-green-600" />
                    Atividade Recente
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Hoje: {stats.activeUsers} usuários ativos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">Total: {stats.totalCompanies} empresas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-600">{stats.activeSubscriptions} assinaturas ativas</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <HiBanknotes className="w-5 h-5 text-yellow-600" />
                    Resumo Financeiro
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Assinaturas Ativas</span>
                      <span className="font-medium">{stats.activeSubscriptions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Taxa de Conversão</span>
                      <span className="font-medium text-green-600">
                        {Math.round((stats.activeSubscriptions / stats.totalUsers) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Usuários Ativos</span>
                      <span className="font-medium">{stats.activeUsers}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Usuários</h2>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar usuários..."
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
                >
                  Buscar
                </button>
              </form>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Plano</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cadastro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <HiUserCircle className="w-10 h-10 text-slate-400" />
                        <div className="ml-3">
                          <p className="font-medium text-slate-900">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.company ? (
                        <div>
                          <p className="font-medium text-slate-900">{user.company.companyName}</p>
                          <p className="text-sm text-slate-500">{user.company.businessSegment}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">Não cadastrada</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.currentSubscription ? (
                        <div>
                          <p className="font-medium text-slate-900">{user.currentSubscription.plan.name}</p>
                          <p className="text-sm text-slate-500">{formatCurrency(user.currentSubscription.amount)}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">Sem plano</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getPlanStatusBadge(user.planStatus)}
                        {user.isActive ? (
                          <HiCheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <HiXCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(user.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewUserDetails(user.id)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <HiEye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id, user.isActive)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.isActive ? 'text-red-600 hover:bg-red-100' : 'text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {user.isActive ? <HiXCircle className="w-5 h-5" /> : <HiCheckCircle className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-700">
                  Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} usuários
                </p>
                <div className="flex gap-2">
                  {Array.from({ length: pagination.pages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => loadUsers(i + 1, search)}
                      className={`px-3 py-1 rounded ${
                        pagination.page === i + 1
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Detalhes do Usuário</h3>
                <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <HiXCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Informações Pessoais</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Nome:</span> {selectedUser.name}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span> {selectedUser.email}
                    </p>
                    <p>
                      <span className="font-medium">Função:</span> {selectedUser.role}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span> {selectedUser.isActive ? 'Ativo' : 'Inativo'}
                    </p>
                    <p>
                      <span className="font-medium">Cadastro:</span> {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Company Info */}
                {selectedUser.company && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Informações da Empresa</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Nome:</span> {selectedUser.company.companyName}
                      </p>
                      <p>
                        <span className="font-medium">Segmento:</span> {selectedUser.company.businessSegment}
                      </p>
                      <p>
                        <span className="font-medium">Atividade:</span> {selectedUser.company.mainActivity}
                      </p>
                      <p>
                        <span className="font-medium">Tipo:</span> {selectedUser.company.businessType}
                      </p>
                      <p>
                        <span className="font-medium">CNPJ:</span> {selectedUser.company.cnpj || 'Não informado'}
                      </p>
                      <p>
                        <span className="font-medium">Cidade:</span> {selectedUser.company.city}
                      </p>
                      <p>
                        <span className="font-medium">Estado:</span> {selectedUser.company.state}
                      </p>
                      <p>
                        <span className="font-medium">Funcionários:</span> {selectedUser.company.employeeCount}
                      </p>
                      <p>
                        <span className="font-medium">Faturamento:</span>{' '}
                        {formatCurrency(selectedUser.company.monthlyRevenue || 0)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Subscriptions */}
              {selectedUser.subscriptions && selectedUser.subscriptions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Histórico de Assinaturas</h4>
                  <div className="space-y-3">
                    {selectedUser.subscriptions.map((sub: any) => (
                      <div key={sub.id} className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{sub.plan.name}</p>
                            <p className="text-sm text-slate-600">
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
  );
}
