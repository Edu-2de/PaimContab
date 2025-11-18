'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '../../../components/AdminSidebar';
import AdminProtection from '../../../components/AdminProtection';
import ExportButton from '../../../components/ExportButton';
import ImportExcelButton from '../../../components/ImportExcelButton';
import CreateSubscriptionModal from '../../../components/CreateSubscriptionModal';
import Link from 'next/link';
import {
  HiMagnifyingGlass,
  HiEye,
  HiTrash,
  HiPlus,
  HiAdjustmentsHorizontal,
  HiChevronLeft,
  HiChevronRight,
  HiCreditCard,
} from 'react-icons/hi2';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'inactive' | 'pending' | 'cancelled';
  startDate: string;
  endDate?: string;
  amount: number;
  paymentMethod?: string;
  user?: {
    name: string;
    email: string;
  };
  plan?: {
    name: string;
    price: number;
    billingCycle: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminSubscriptionsPage() {
  return (
    <AdminProtection>
      <AdminSubscriptionsContent />
    </AdminProtection>
  );
}

function AdminSubscriptionsContent() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const itemsPerPage = 10;

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus && filterStatus !== 'all' && { status: filterStatus }),
      });

      const response = await fetch(`${API_BASE}/admin/subscriptions?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        throw new Error('Erro ao carregar assinaturas');
      }

      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (error) {
      console.error('Erro:', error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterStatus]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta assinatura?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/subscriptions/${subscriptionId}/cancel`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Erro ao cancelar assinatura');

      await fetchSubscriptions();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao cancelar assinatura');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { color: 'bg-gray-800 text-white', text: 'Ativa' },
      inactive: { color: 'bg-gray-300 text-gray-700', text: 'Inativa' },
      pending: { color: 'bg-gray-200 text-gray-600', text: 'Pendente' },
      cancelled: { color: 'bg-gray-100 text-gray-500', text: 'Cancelada' },
    };

    const badge = badges[status as keyof typeof badges] || badges.inactive;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.text}</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch =
      !searchTerm ||
      subscription.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.plan?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || subscription.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div>
        <AdminSidebar currentPage="subscriptions" />
        <div className="ml-64 flex items-center justify-center bg-white min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando assinaturas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminSidebar currentPage="subscriptions" />

      <div className="ml-64 min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assinaturas</h1>
              <p className="text-gray-600 mt-1">Gerencie todas as assinaturas e planos do sistema</p>
            </div>
            <div className="flex gap-2">
              <ExportButton
                endpoint={`${API_BASE}/admin/subscriptions/export${
                  filterStatus !== 'all' ? `?status=${filterStatus}` : ''
                }${searchTerm ? `${filterStatus !== 'all' ? '&' : '?'}search=${searchTerm}` : ''}`}
                filename="assinaturas"
              />
              <ImportExcelButton
                endpoint={`${API_BASE}/admin/subscriptions/import`}
                requiredColumns={['Email', 'Plano']}
                onSuccess={() => fetchSubscriptions()}
                entityName="Assinaturas"
                templateData={[
                  {
                    Email: 'usuario@exemplo.com',
                    Plano: 'Plano Básico',
                    'Data Inicio': new Date().toLocaleDateString('pt-BR'),
                    Status: 'Ativa',
                  },
                ]}
              />
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <HiPlus className="w-4 h-4" />
                Nova Assinatura
              </button>
            </div>
          </div>
        </div>

        {/* Filtros e Busca - Padrão Profissional */}
        <div className="p-8">
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
                      {filteredSubscriptions.length}{' '}
                      {filteredSubscriptions.length === 1 ? 'assinatura encontrada' : 'assinaturas encontradas'}
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
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <HiMagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar por usuário, plano ou email..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium"
                  />
                </div>
                <button
                  type="button"
                  className="px-6 py-3 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all font-semibold whitespace-nowrap"
                >
                  Buscar
                </button>
              </div>

              {/* Filtros Rápidos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="active">Ativas</option>
                    <option value="inactive">Inativas</option>
                    <option value="pending">Pendentes</option>
                    <option value="cancelled">Canceladas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Plano</label>
                  <select
                    value={filterPlan}
                    onChange={e => setFilterPlan(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium"
                  >
                    <option value="all">Todos os Planos</option>
                    <option value="basic">Básico</option>
                    <option value="professional">Profissional</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Empresarial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Método de Pagamento</label>
                  <select className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium">
                    <option value="all">Todos</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="boleto">Boleto</option>
                    <option value="pix">PIX</option>
                  </select>
                </div>
              </div>

              {/* Filtros Avançados */}
              {showAdvancedFilters && (
                <div className="mt-6 pt-6 border-t border-gray-700 animate-slideDown">
                  <h3 className="text-sm font-bold text-white mb-4">Filtros Avançados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Valor da Assinatura</label>
                      <select className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium">
                        <option value="all">Qualquer Valor</option>
                        <option value="0-50">Até R$ 50</option>
                        <option value="50-100">R$ 50 - R$ 100</option>
                        <option value="100-200">R$ 100 - R$ 200</option>
                        <option value="200+">Acima de R$ 200</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Data de Início</label>
                      <select className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium">
                        <option value="all">Qualquer Data</option>
                        <option value="today">Hoje</option>
                        <option value="week">Última Semana</option>
                        <option value="month">Último Mês</option>
                        <option value="year">Último Ano</option>
                      </select>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                        setFilterPlan('all');
                        fetchSubscriptions();
                      }}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
                    >
                      Limpar Filtros
                    </button>
                    <button
                      onClick={() => fetchSubscriptions()}
                      className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
                    >
                      Aplicar Filtros
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <HiCreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma assinatura encontrada</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus
                  ? 'Tente ajustar os filtros de busca'
                  : 'Não há assinaturas cadastradas no sistema'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plano
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Início
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vencimento
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSubscriptions.map(subscription => (
                      <tr key={subscription.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{subscription.user?.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{subscription.user?.email || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{subscription.plan?.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{subscription.plan?.billingCycle || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(subscription.amount)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(subscription.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(subscription.startDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subscription.endDate ? formatDate(subscription.endDate) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/subscriptions/${subscription.id}`}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Ver detalhes"
                            >
                              <HiEye className="w-4 h-4" />
                            </Link>
                            {subscription.status === 'active' && (
                              <button
                                onClick={() => handleCancelSubscription(subscription.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="Cancelar assinatura"
                              >
                                <HiTrash className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-700">
                      Página {currentPage} de {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <HiChevronLeft className="w-4 h-4" />
                        Anterior
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próximo
                        <HiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação */}
      <CreateSubscriptionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchSubscriptions();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}
