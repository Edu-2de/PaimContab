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
  HiCalendarDays,
  HiArrowUpRight,
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
      active: { color: 'bg-slate-700 text-white', text: 'Ativo' },
      canceled: { color: 'bg-slate-200 text-slate-700', text: 'Cancelado' },
      pending: { color: 'bg-slate-100 text-slate-600', text: 'Pendente' },
      no_plan: { color: 'bg-gray-100 text-gray-500', text: 'Sem Plano' },
    };
    const badge = badges[status as keyof typeof badges] || badges.no_plan;

    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.text}</span>;
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
      <div className="min-h-screen bg-slate-50">
        <AdminSidebar currentPage="dashboard" />
        <div className="ml-64 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-700 mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar currentPage="dashboard" />
      
      <div className="ml-64 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600 mt-1 font-medium">Visão geral do sistema administrativo</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <HiCalendarDays className="w-4 h-4" />
                <span className="text-sm font-medium">Atualização em tempo real</span>
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {new Date().toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 - Total Usuários */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-2">Total de Usuários</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-slate-600 font-medium">{stats.activeUsers} ativos</span>
                      <div className="ml-2 w-1 h-1 bg-slate-300 rounded-full"></div>
                      <span className="text-sm text-slate-500 ml-2">{stats.inactiveUsers} inativos</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                    <HiUsers className="w-7 h-7 text-slate-700" />
                  </div>
                </div>
              </div>

              {/* Card 2 - Empresas */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-2">Empresas Cadastradas</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalCompanies}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-slate-600 font-medium">{stats.usersWithCompany} usuários</span>
                      <div className="ml-2 w-1 h-1 bg-slate-300 rounded-full"></div>
                      <span className="text-sm text-slate-500 ml-2">com empresa</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                    <HiBuildingOffice className="w-7 h-7 text-slate-700" />
                  </div>
                </div>
              </div>

              {/* Card 3 - Assinaturas */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-2">Assinaturas Ativas</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.activeSubscriptions}</p>
                    <div className="flex items-center mt-2">
                      <HiArrowTrendingUp className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-600 font-medium ml-1">
                        {Math.round((stats.activeSubscriptions / stats.totalUsers) * 100)}% dos usuários
                      </span>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                    <HiCreditCard className="w-7 h-7 text-slate-700" />
                  </div>
                </div>
              </div>

              {/* Card 4 - Taxa de Ativação */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-2">Taxa de Ativação</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
                    </p>
                    <div className="flex items-center mt-2">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-slate-700 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                    <HiChartBarSquare className="w-7 h-7 text-slate-700" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabela de Usuários */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Usuários Recentes</h2>
                  <p className="text-sm text-slate-600 mt-1">Gerencie e visualize todos os usuários do sistema</p>
                </div>

                {/* Busca */}
                <form onSubmit={handleSearch} className="flex gap-3">
                  <div className="relative">
                    <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Buscar usuários..."
                      className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white text-gray-800"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Cadastro
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <HiUserCircle className="w-6 h-6 text-slate-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                            <div className="text-sm text-slate-600">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.company ? (
                          <div>
                            <div className="text-sm font-medium text-slate-900">{user.company.companyName}</div>
                            <div className="text-sm text-slate-600">{user.company.businessSegment || 'Não informado'}</div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-slate-300 rounded-full mr-2"></div>
                            <span className="text-sm text-slate-500 font-medium">Não cadastrada</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.currentSubscription ? (
                          <div>
                            <div className="text-sm font-medium text-slate-900">{user.currentSubscription.plan.name}</div>
                            <div className="text-sm text-slate-600 font-medium">{formatCurrency(user.currentSubscription.amount)}</div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-slate-300 rounded-full mr-2"></div>
                            <span className="text-sm text-slate-500 font-medium">Sem plano</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {getPlanStatusBadge(user.planStatus)}
                          {user.isActive ? (
                            <div className="flex items-center gap-1">
                              <HiCheckCircle className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm font-medium text-emerald-600">Ativo</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <HiXCircle className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-medium text-slate-500">Inativo</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 font-medium">{formatDate(user.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
                            title="Ver detalhes"
                          >
                            <HiEye className="w-4 h-4" />
                            <span>Ver</span>
                          </Link>
                          <button
                            onClick={() => toggleUserStatus(user.id, user.isActive)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                              user.isActive 
                                ? 'text-slate-700 hover:bg-slate-100' 
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={user.isActive ? 'Desativar' : 'Ativar'}
                          >
                            {user.isActive ? (
                              <>
                                <HiXCircle className="w-4 h-4" />
                                <span>Desativar</span>
                              </>
                            ) : (
                              <>
                                <HiCheckCircle className="w-4 h-4" />
                                <span>Ativar</span>
                              </>
                            )}
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
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-700 font-medium">
                    Mostrando <span className="font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span> a{' '}
                    <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> de{' '}
                    <span className="font-semibold">{pagination.total}</span> usuários
                  </p>
                  <div className="flex gap-1">
                    {Array.from({ length: pagination.pages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => loadUsers(i + 1, search)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          pagination.page === i + 1
                            ? 'bg-slate-700 text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
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
          <div className="flex justify-center">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-3 px-8 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-sm"
            >
              <span>Ver Todos os Usuários</span>
              <HiArrowUpRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}