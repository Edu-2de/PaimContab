'use client';
import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminProtection from '@/components/AdminProtection';
import Link from 'next/link';
import {
  HiMagnifyingGlass,
  HiEye,
  HiUserCircle,
  HiCheckCircle,
  HiXCircle,
  HiPlus,
  HiUserPlus,
  HiAdjustmentsHorizontal,
  HiChevronLeft,
  HiChevronRight,
  HiEllipsisVertical,
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

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UsersPage() {
  return (
    <AdminProtection>
      <UsersPageContent />
    </AdminProtection>
  );
}

function UsersPageContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    // Verificar se usuário é admin
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

      loadUsers();
    } catch (error) {
      console.error('Erro ao verificar dados do usuário:', error);
      window.location.href = '/Login';
    }
  }, []);

  const loadUsers = async (page = 1, searchTerm = '', status = 'all') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      if (!token) {
        window.location.href = '/Login';
        return;
      }

      let url = `/api/admin/users?page=${page}&limit=20&search=${searchTerm}`;
      if (status !== 'all') {
        url += `&status=${status}`;
      }

      const response = await fetch(url, {
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
        const data: UsersResponse = await response.json();
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
    loadUsers(1, search, filterStatus);
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    loadUsers(1, search, status);
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
        loadUsers(pagination.page, search, filterStatus);
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const getPlanStatusBadge = (status: string) => {
    const badges = {
      active: { color: 'bg-emerald-100 text-emerald-800', text: 'Ativo' },
      canceled: { color: 'bg-red-100 text-red-800', text: 'Cancelado' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendente' },
      no_plan: { color: 'bg-slate-100 text-slate-600', text: 'Sem Plano' },
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
        <AdminSidebar currentPage="users" />
        <div className="ml-64 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-700 mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Carregando usuários...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar currentPage="users" />

      <div className="ml-64 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Usuários</h1>
              <p className="text-slate-600 mt-1 font-medium">Gerencie todos os usuários do sistema</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                <HiUserPlus className="w-4 h-4" />
                Novo Usuário
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium">
                <HiPlus className="w-4 h-4" />
                Importar Usuários
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Filtros e Busca */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Filtros e Busca</h2>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="font-medium">Total:</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-semibold">
                  {pagination.total} usuários
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Busca */}
              <form onSubmit={handleSearch} className="lg:col-span-6 flex gap-3">
                <div className="relative flex-1">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
                >
                  Buscar
                </button>
              </form>

              {/* Filtros */}
              <div className="lg:col-span-6 flex gap-3">
                <div className="flex-1">
                  <select
                    value={filterStatus}
                    onChange={e => handleFilterChange(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="active">Usuários Ativos</option>
                    <option value="inactive">Usuários Inativos</option>
                    <option value="with_company">Com Empresa</option>
                    <option value="without_company">Sem Empresa</option>
                  </select>
                </div>
                <button className="px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                  <HiAdjustmentsHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Lista de Usuários</h3>
                <div className="text-sm text-slate-600">
                  Página {pagination.page} de {pagination.totalPages}
                </div>
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
                      Plano Atual
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Data Cadastro
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
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                            <HiUserCircle className="w-8 h-8 text-slate-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                            <div className="text-sm text-slate-600">{user.email}</div>
                            <div className="text-xs text-slate-400 font-medium uppercase">{user.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.company ? (
                          <div>
                            <div className="text-sm font-medium text-slate-900">{user.company.companyName}</div>
                            <div className="text-sm text-slate-600">
                              {user.company.businessSegment || 'Não informado'}
                            </div>
                            <div className="text-xs text-slate-400">
                              {user.company.city && user.company.state
                                ? `${user.company.city}, ${user.company.state}`
                                : 'Localização não informada'}
                            </div>
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
                            <div className="text-sm font-medium text-slate-900">
                              {user.currentSubscription.plan.name}
                            </div>
                            <div className="text-sm text-slate-600 font-semibold">
                              {formatCurrency(user.currentSubscription.amount)}
                            </div>
                            {getPlanStatusBadge(user.currentSubscription.status)}
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-slate-300 rounded-full mr-2"></div>
                            <span className="text-sm text-slate-500 font-medium">Sem plano ativo</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isActive ? (
                          <div className="flex items-center gap-2">
                            <HiCheckCircle className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-700">Ativo</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <HiXCircle className="w-5 h-5 text-red-500" />
                            <span className="text-sm font-semibold text-red-600">Inativo</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 font-medium">{formatDate(user.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="inline-flex items-center gap-1 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
                            title="Ver detalhes"
                          >
                            <HiEye className="w-4 h-4" />
                            Detalhes
                          </Link>
                          <button
                            onClick={() => toggleUserStatus(user.id, user.isActive)}
                            className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                              user.isActive ? 'text-red-700 hover:bg-red-50' : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={user.isActive ? 'Desativar' : 'Ativar'}
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
                          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <HiEllipsisVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-700 font-medium">
                    Mostrando <span className="font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span> a{' '}
                    <span className="font-semibold">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    de <span className="font-semibold">{pagination.total}</span> usuários
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => loadUsers(Math.max(1, pagination.page - 1), search, filterStatus)}
                      disabled={pagination.page === 1}
                      className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <HiChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else {
                        const start = Math.max(1, pagination.page - 2);
                        pageNum = start + i;
                      }

                      if (pageNum > pagination.totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => loadUsers(pageNum, search, filterStatus)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            pagination.page === pageNum
                              ? 'bg-slate-700 text-white'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        loadUsers(Math.min(pagination.totalPages, pagination.page + 1), search, filterStatus)
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <HiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
