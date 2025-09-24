'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '../../../components/AdminSidebar';
import {
  HiChartBarSquare,
  HiUsers,
  HiCreditCard,
  HiArrowTrendingUp,
  HiDocumentArrowDown,
  HiCurrencyDollar,
} from 'react-icons/hi2';

interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  totalSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeUsers: number;
  newUsersThisMonth: number;
  subscriptionsByStatus: {
    active: number;
    inactive: number;
    pending: number;
    cancelled: number;
  };
}

export default function AdminReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/reports?period=${selectedPeriod}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao carregar estatísticas');

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color = 'gray',
  }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    trend?: { value: number; isPositive: boolean };
    color?: string;
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <HiArrowTrendingUp className={`w-4 h-4 ${trend.isPositive ? '' : 'transform rotate-180'}`} />
              <span className="text-sm font-medium">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div
          className={`p-3 rounded-lg ${
            color === 'blue'
              ? 'bg-blue-100 text-blue-600'
              : color === 'green'
              ? 'bg-green-100 text-green-600'
              : color === 'purple'
              ? 'bg-purple-100 text-purple-600'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div>
        <AdminSidebar currentPage="reports" />
        <div className="ml-64 flex items-center justify-center bg-white min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando relatórios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminSidebar currentPage="reports" />

      <div className="ml-64 min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Relatórios e Analytics</h1>
              <p className="text-gray-600 mt-1">Acompanhe métricas e estatísticas do sistema</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none"
              >
                <option value="week">Última semana</option>
                <option value="month">Último mês</option>
                <option value="quarter">Último trimestre</option>
                <option value="year">Último ano</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                <HiDocumentArrowDown className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {stats ? (
            <div className="space-y-8">
              {/* Overview Stats */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Visão Geral</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Total de Usuários"
                    value={stats.totalUsers.toLocaleString('pt-BR')}
                    icon={HiUsers}
                    color="blue"
                  />
                  <StatCard
                    title="Empresas"
                    value={stats.totalCompanies.toLocaleString('pt-BR')}
                    icon={HiChartBarSquare}
                    color="green"
                  />
                  <StatCard
                    title="Assinaturas"
                    value={stats.totalSubscriptions.toLocaleString('pt-BR')}
                    icon={HiCreditCard}
                    color="purple"
                  />
                  <StatCard
                    title="Receita Total"
                    value={formatCurrency(stats.totalRevenue)}
                    icon={HiCurrencyDollar}
                    color="gray"
                  />
                </div>
              </div>

              {/* Monthly Stats */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas Mensais</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Receita do Mês"
                    value={formatCurrency(stats.monthlyRevenue)}
                    icon={HiCurrencyDollar}
                    color="green"
                  />
                  <StatCard
                    title="Usuários Ativos"
                    value={stats.activeUsers.toLocaleString('pt-BR')}
                    icon={HiUsers}
                    color="blue"
                  />
                  <StatCard
                    title="Novos Usuários"
                    value={stats.newUsersThisMonth.toLocaleString('pt-BR')}
                    icon={HiArrowTrendingUp}
                    color="purple"
                  />
                </div>
              </div>

              {/* Subscription Status */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Status das Assinaturas</h2>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{stats.subscriptionsByStatus.active}</div>
                      <div className="text-sm text-gray-600 mt-1">Ativas</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-gray-800 h-2 rounded-full"
                          style={{
                            width: `${(stats.subscriptionsByStatus.active / stats.totalSubscriptions) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">{stats.subscriptionsByStatus.pending}</div>
                      <div className="text-sm text-gray-600 mt-1">Pendentes</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-gray-400 h-2 rounded-full"
                          style={{
                            width: `${(stats.subscriptionsByStatus.pending / stats.totalSubscriptions) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-500">{stats.subscriptionsByStatus.inactive}</div>
                      <div className="text-sm text-gray-600 mt-1">Inativas</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-gray-300 h-2 rounded-full"
                          style={{
                            width: `${(stats.subscriptionsByStatus.inactive / stats.totalSubscriptions) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-400">{stats.subscriptionsByStatus.cancelled}</div>
                      <div className="text-sm text-gray-600 mt-1">Canceladas</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-gray-200 h-2 rounded-full"
                          style={{
                            width: `${(stats.subscriptionsByStatus.cancelled / stats.totalSubscriptions) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <button className="bg-white border border-gray-200 rounded-lg p-6 text-left hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <HiUsers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Relatório de Usuários</div>
                        <div className="text-sm text-gray-600 mt-1">Gerar relatório detalhado</div>
                      </div>
                    </div>
                  </button>

                  <button className="bg-white border border-gray-200 rounded-lg p-6 text-left hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <HiCurrencyDollar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Relatório Financeiro</div>
                        <div className="text-sm text-gray-600 mt-1">Análise de receitas</div>
                      </div>
                    </div>
                  </button>

                  <button className="bg-white border border-gray-200 rounded-lg p-6 text-left hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <HiCreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Relatório de Assinaturas</div>
                        <div className="text-sm text-gray-600 mt-1">Status e renovações</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <HiChartBarSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar relatórios</h3>
              <p className="text-gray-600">Não foi possível carregar os dados dos relatórios</p>
              <button
                onClick={fetchStats}
                className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
