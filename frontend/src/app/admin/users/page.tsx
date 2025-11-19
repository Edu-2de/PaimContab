'use client';
import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminProtection from '@/components/AdminProtection';
import ExportButton from '@/components/ExportButton';
import ImportExcelButton from '@/components/ImportExcelButton';
import CreateUserModal from '@/components/CreateUserModal';
import Link from 'next/link';
import {
  HiMagnifyingGlass,
  HiEye,
  HiUserCircle,
  HiCheckCircle,
  HiXCircle,
  HiAdjustmentsHorizontal,
  HiChevronLeft,
  HiChevronRight,
  HiEllipsisVertical,
  HiPlus,
} from 'react-icons/hi2';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
  const [filterRole, setFilterRole] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const loadUsers = async (page = 1, searchTerm = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      if (!token) {
        window.location.href = '/Login';
        return;
      }

      const url = `/api/admin/users?page=${page}&limit=20&search=${searchTerm}`;

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

  // Filtrar usuários no frontend
  const getFilteredUsers = () => {
    return users.filter(user => {
      // Filtro de Status da Conta
      if (filterStatus !== 'all') {
        if (filterStatus === 'active' && !user.isActive) return false;
        if (filterStatus === 'inactive' && user.isActive) return false;
      }

      // Filtro de Tipo de Usuário
      if (filterRole !== 'all') {
        if (filterRole === 'admin' && user.role !== 'admin') return false;
        if (filterRole === 'user' && user.role !== 'user') return false;
      }

      // Filtro de Status do Plano
      if (filterPlan !== 'all') {
        if (filterPlan === 'active' && user.currentSubscription?.status !== 'active') return false;
        if (filterPlan === 'canceled' && user.currentSubscription?.status !== 'canceled') return false;
        if (filterPlan === 'pending' && user.currentSubscription?.status !== 'pending') return false;
        if (filterPlan === 'no_plan' && user.currentSubscription) return false;
      }

      return true;
    });
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
              <ExportButton
                endpoint={`${API_BASE}/admin/users/export${search ? `?search=${search}` : ''}`}
                filename="usuarios"
              />
              <ImportExcelButton
                endpoint={`${API_BASE}/admin/users/import`}
                requiredColumns={['Nome', 'Email', 'Senha']}
                onSuccess={() => loadUsers(pagination.page, search)}
                entityName="Usuários"
                templateData={[
                  { Nome: 'João Silva', Email: 'joao@exemplo.com', Senha: 'senha123', Admin: 'Não' },
                  { Nome: 'Maria Santos', Email: 'maria@exemplo.com', Senha: 'senha456', Admin: 'Sim' },
                ]}
              />
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1e2939] text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
              >
                <HiPlus className="w-4 h-4" />
                Novo Usuário
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Filtros e Busca - Redesign Profissional */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl shadow-xl mb-6">
            {/* Header dos Filtros */}
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                    <HiAdjustmentsHorizontal className="w-5 h-5 text-gray-900" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Filtros e Pesquisa</h2>
                    <p className="text-sm text-gray-300">
                      {pagination.total} {pagination.total === 1 ? 'usuário encontrado' : 'usuários encontrados'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <HiAdjustmentsHorizontal className="w-4 h-4" />
                  {showAdvancedFilters ? 'Ocultar Filtros' : 'Mais Filtros'}
                </button>
              </div>
            </div>

            {/* Barra de Pesquisa Principal */}
            <div className="p-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <HiMagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Pesquisar por nome, email ou empresa..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all font-semibold whitespace-nowrap"
                >
                  Buscar
                </button>
              </form>

              {/* Filtros Rápidos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Status da Conta</label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Tipo de Usuário</label>
                  <select
                    value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium"
                  >
                    <option value="all">Todos os Tipos</option>
                    <option value="admin">Administradores</option>
                    <option value="user">Usuários Comuns</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Status do Plano</label>
                  <select
                    value={filterPlan}
                    onChange={e => setFilterPlan(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium"
                  >
                    <option value="all">Todos os Planos</option>
                    <option value="active">Plano Ativo</option>
                    <option value="canceled">Plano Cancelado</option>
                    <option value="pending">Pendente</option>
                    <option value="no_plan">Sem Plano</option>
                  </select>
                </div>
              </div>

              {/* Filtros Avançados (Expansível) */}
              {showAdvancedFilters && (
                <div className="mt-6 pt-6 border-t border-gray-700 animate-slideDown">
                  <h3 className="text-sm font-bold text-white mb-4">Filtros Avançados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Possui Empresa</label>
                      <select className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium">
                        <option value="all">Todos</option>
                        <option value="with_company">Com Empresa</option>
                        <option value="without_company">Sem Empresa</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Data de Cadastro</label>
                      <select className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium">
                        <option value="all">Qualquer Data</option>
                        <option value="today">Hoje</option>
                        <option value="week">Última Semana</option>
                        <option value="month">Último Mês</option>
                        <option value="year">Último Ano</option>
                      </select>
                    </div>
                  </div>

                  {/* Botões de Ação dos Filtros */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setSearch('');
                        setFilterStatus('all');
                        setFilterRole('all');
                        setFilterPlan('all');
                        loadUsers(1, '');
                      }}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Lista de Usuários</h3>
                <div className="text-sm text-slate-600">
                  {getFilteredUsers().length} de {pagination.total} usuários
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
                  {getFilteredUsers().length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <HiUserCircle className="w-16 h-16 text-gray-300 mb-4" />
                          <p className="text-lg font-medium text-gray-600">Nenhum usuário encontrado</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Tente ajustar os filtros ou buscar por outros termos
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    getFilteredUsers().map(user => (
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
                    ))
                  )}
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
                      onClick={() => loadUsers(Math.max(1, pagination.page - 1), search)}
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
                          onClick={() => loadUsers(pageNum, search)}
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
                      onClick={() => loadUsers(Math.min(pagination.totalPages, pagination.page + 1), search)}
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

      {/* Modal de Criação */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadUsers(pagination.page, search);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}
