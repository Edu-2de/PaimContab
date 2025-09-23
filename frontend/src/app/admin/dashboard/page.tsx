/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { 
  HiUsers, 
  HiBuildingOffice, 
  HiCreditCard, 
  HiCurrencyDollar,
  HiMagnifyingGlass,
  HiEye,
  HiUserCircle,
  HiCheckCircle,
  HiXCircle} from "react-icons/hi2";

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
  totalCompanies: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadDashboardData();
    loadUsers();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  };

  const loadUsers = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/users?page=${page}&limit=10&search=${searchTerm}`
      );
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
      const response = await fetch(`/api/admin/users/${userId}`);
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
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
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
      no_plan: { color: 'bg-gray-100 text-gray-800', text: 'Sem Plano' }
    };
    const badge = badges[status as keyof typeof badges] || badges.no_plan;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (loading && !users.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-slate-900">
              Painel Administrativo
            </h1>
            <p className="text-slate-600 mt-2">
              Gerencie usuários, planos e acompanhe estatísticas
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <HiUsers className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-slate-600">Total de Usuários</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <HiBuildingOffice className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-slate-600">Empresas Cadastradas</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalCompanies}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <HiCreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-slate-600">Assinaturas Ativas</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.activeSubscriptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <HiCurrencyDollar className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-slate-600">Receita Total</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
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
                    onChange={(e) => setSearch(e.target.value)}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Plano
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Cadastro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
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
                          <p className="font-medium text-slate-900">
                            {user.company.companyName}
                          </p>
                          <p className="text-sm text-slate-500">
                            {user.company.businessSegment}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">Não cadastrada</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.currentSubscription ? (
                        <div>
                          <p className="font-medium text-slate-900">
                            {user.currentSubscription.plan.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatCurrency(user.currentSubscription.amount)}
                          </p>
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
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(user.createdAt)}
                    </td>
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
                            user.isActive
                              ? 'text-red-600 hover:bg-red-100'
                              : 'text-green-600 hover:bg-green-100'
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
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} usuários
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
                <h3 className="text-xl font-bold text-slate-900">
                  Detalhes do Usuário
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
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
                    <p><span className="font-medium">Nome:</span> {selectedUser.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                    <p><span className="font-medium">Função:</span> {selectedUser.role}</p>
                    <p><span className="font-medium">Status:</span> {selectedUser.isActive ? 'Ativo' : 'Inativo'}</p>
                    <p><span className="font-medium">Cadastro:</span> {formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>

                {/* Company Info */}
                {selectedUser.company && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Informações da Empresa</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Nome:</span> {selectedUser.company.companyName}</p>
                      <p><span className="font-medium">Segmento:</span> {selectedUser.company.businessSegment}</p>
                      <p><span className="font-medium">Atividade:</span> {selectedUser.company.mainActivity}</p>
                      <p><span className="font-medium">Tipo:</span> {selectedUser.company.businessType}</p>
                      <p><span className="font-medium">CNPJ:</span> {selectedUser.company.cnpj || 'Não informado'}</p>
                      <p><span className="font-medium">Cidade:</span> {selectedUser.company.city}</p>
                      <p><span className="font-medium">Estado:</span> {selectedUser.company.state}</p>
                      <p><span className="font-medium">Funcionários:</span> {selectedUser.company.employeeCount}</p>
                      <p><span className="font-medium">Faturamento:</span> {formatCurrency(selectedUser.company.monthlyRevenue || 0)}</p>
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