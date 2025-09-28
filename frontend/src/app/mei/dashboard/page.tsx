'use client';

import { useState, useEffect } from 'react';
import MeiProtection from '../../../components/MeiProtection';
import MeiSidebar from '../../../components/MeiSidebar';
import {
  HiExclamationTriangle,
  HiBell,
  HiArrowTrendingUp,
  HiCurrencyDollar,
  HiArrowDownRight,
  HiChartPie,
  HiClock,
  HiCheckCircle,
  HiCalculator,
  HiDocumentText,
  HiArrowUpRight,
} from 'react-icons/hi2';

interface Company {
  id: string;
  name: string;
  cnpj?: string;
}

interface DashboardMetrics {
  totalReceita: number;
  totalDespesa: number;
  lucroLiquido: number;
  limiteFaturamento: number;
  faturamentoAtual: number;
  proximoDAS: string;
  valorDAS: number;
}

interface RecentTransaction {
  id: string;
  type: 'Receita' | 'Despesa';
  description: string;
  value: number;
  date: string;
  category: string;
}

interface NotificationItem {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  date: string;
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function MeiDashboardContent() {
  const [company, setCompany] = useState<Company | null>(null);

  // Dados mockados para demonstração - em produção viria da API
  const [metrics] = useState<DashboardMetrics>({
    totalReceita: 45600.0,
    totalDespesa: 12300.0,
    lucroLiquido: 33300.0,
    limiteFaturamento: 81000.0,
    faturamentoAtual: 45600.0,
    proximoDAS: '2024-10-20',
    valorDAS: 456.0,
  });

  const [recentTransactions] = useState<RecentTransaction[]>([
    {
      id: '1',
      type: 'Receita',
      description: 'Serviço de consultoria',
      value: 2500,
      date: '2024-09-25',
      category: 'Serviços',
    },
    {
      id: '2',
      type: 'Despesa',
      description: 'Internet e telefone',
      value: 150,
      date: '2024-09-24',
      category: 'Utilities',
    },
    { id: '3', type: 'Receita', description: 'Venda de produto', value: 800, date: '2024-09-23', category: 'Vendas' },
    {
      id: '4',
      type: 'Despesa',
      description: 'Material de escritório',
      value: 200,
      date: '2024-09-22',
      category: 'Suprimentos',
    },
  ]);

  const [notifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'warning',
      title: 'DAS Vencendo',
      message: 'O DAS de setembro vence em 5 dias',
      date: '2024-09-25',
    },
    {
      id: '2',
      type: 'info',
      title: 'Limite de Faturamento',
      message: 'Você já atingiu 56% do limite anual',
      date: '2024-09-24',
    },
    {
      id: '3',
      type: 'success',
      title: 'Meta Atingida',
      message: 'Parabéns! Meta de setembro foi atingida',
      date: '2024-09-23',
    },
  ]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const userObj = JSON.parse(userData);
      fetchCompanyData(userObj.id);
    }
  }, []);

  const fetchCompanyData = async (userId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/company/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const companyData = await response.json();
        setCompany(companyData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados da empresa:', error);
    }
  };

  // Cálculos principais
  const percentualLimite = (metrics.faturamentoAtual / metrics.limiteFaturamento) * 100;
  const diasParaDAS = Math.ceil(
    (new Date(metrics.proximoDAS).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <MeiSidebar currentPage="dashboard" />

      <div className="mei-content-wrapper">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard MEI</h1>
                <p className="text-gray-600 mt-1">
                  {company?.name || 'Minha Empresa'} •{' '}
                  {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Último acesso</p>
                  <p className="text-sm font-medium text-gray-900">{new Date().toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas importantes */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {diasParaDAS <= 7 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <HiExclamationTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">DAS Vencendo!</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        O DAS vence em {diasParaDAS} dias. Valor: {formatCurrency(metrics.valorDAS)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {percentualLimite > 80 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <HiExclamationTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Atenção ao Limite</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>Você já atingiu {percentualLimite.toFixed(1)}% do limite anual</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Métricas principais */}
        <div className="px-6 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Receita Total */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Receita Total</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(metrics.totalReceita)}</p>
                  <p className="text-xs text-green-500 flex items-center mt-1">
                    <HiArrowTrendingUp className="w-3 h-3 mr-1" />
                    +12% vs mês anterior
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <HiCurrencyDollar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Despesas */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Despesas</p>
                  <p className="text-3xl font-bold text-red-600">{formatCurrency(metrics.totalDespesa)}</p>
                  <p className="text-xs text-red-500 flex items-center mt-1">
                    <HiArrowDownRight className="w-3 h-3 mr-1" />
                    -5% vs mês anterior
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <HiArrowDownRight className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* Lucro Líquido */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Lucro Líquido</p>
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(metrics.lucroLiquido)}</p>
                  <p className="text-xs text-blue-500 flex items-center mt-1">
                    <HiArrowTrendingUp className="w-3 h-3 mr-1" />
                    +18% vs mês anterior
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <HiChartPie className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Próximo DAS */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Próximo DAS</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(metrics.valorDAS)}</p>
                  <p className="text-xs text-purple-500 flex items-center mt-1">
                    <HiClock className="w-3 h-3 mr-1" />
                    Vence em {diasParaDAS} dias
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <HiCalculator className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Limite de Faturamento */}
        <div className="px-6 py-4">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Limite de Faturamento Anual</h3>
                <p className="text-sm text-gray-600">Acompanhe seu faturamento vs limite MEI</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{percentualLimite.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">do limite utilizado</p>
              </div>
            </div>

            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${
                    percentualLimite > 90 ? 'bg-red-500' : percentualLimite > 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(percentualLimite, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>{formatCurrency(metrics.faturamentoAtual)}</span>
                <span>{formatCurrency(metrics.limiteFaturamento)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transações Recentes e Notificações */}
        <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transações Recentes */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Transações Recentes</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Ver todas</button>
            </div>

            <div className="space-y-4">
              {recentTransactions.map(transaction => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-full ${
                        transaction.type === 'Receita' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {transaction.type === 'Receita' ? (
                        <HiArrowUpRight className="w-4 h-4" />
                      ) : (
                        <HiArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {transaction.category} • {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${transaction.type === 'Receita' ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {transaction.type === 'Receita' ? '+' : '-'}
                      {formatCurrency(transaction.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notificações */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
              <HiBell className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {notifications.map(notification => (
                <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div
                    className={`p-1 rounded-full mt-1 ${
                      notification.type === 'warning'
                        ? 'bg-yellow-100 text-yellow-600'
                        : notification.type === 'success'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {notification.type === 'warning' ? (
                      <HiExclamationTriangle className="w-3 h-3" />
                    ) : notification.type === 'success' ? (
                      <HiCheckCircle className="w-3 h-3" />
                    ) : (
                      <HiBell className="w-3 h-3" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(notification.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions rápidas */}
        <div className="px-6 py-4">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Ações Rápidas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
                <div className="p-3 bg-green-500 rounded-full group-hover:bg-green-600 transition-colors">
                  <HiCurrencyDollar className="w-6 h-6 text-white" />
                </div>
                <span className="mt-2 text-sm font-medium text-green-700">Nova Receita</span>
              </button>

              <button className="flex flex-col items-center p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group">
                <div className="p-3 bg-red-500 rounded-full group-hover:bg-red-600 transition-colors">
                  <HiArrowDownRight className="w-6 h-6 text-white" />
                </div>
                <span className="mt-2 text-sm font-medium text-red-700">Nova Despesa</span>
              </button>

              <button className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group">
                <div className="p-3 bg-purple-500 rounded-full group-hover:bg-purple-600 transition-colors">
                  <HiCalculator className="w-6 h-6 text-white" />
                </div>
                <span className="mt-2 text-sm font-medium text-purple-700">Calcular DAS</span>
              </button>

              <button className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
                <div className="p-3 bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors">
                  <HiDocumentText className="w-6 h-6 text-white" />
                </div>
                <span className="mt-2 text-sm font-medium text-blue-700">Gerar Relatório</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeiDashboardPage() {
  return (
    <MeiProtection>
      <MeiDashboardContent />
    </MeiProtection>
  );
}
