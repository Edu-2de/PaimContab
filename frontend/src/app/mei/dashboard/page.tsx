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
    <div className="min-h-screen bg-slate-50">
      <MeiSidebar currentPage="dashboard" />

      <div className="mei-content-wrapper">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
                <p className="text-slate-600 mt-1 text-sm">
                  {company?.name || 'Minha Empresa'} • {' '}
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <p className="text-sm font-medium text-slate-700">Em dia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas importantes */}
        {(diasParaDAS <= 7 || percentualLimite > 80) && (
          <div className="px-8 py-4">
            <div className="flex gap-4">
              {diasParaDAS <= 7 && (
                <div className="flex-1 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex">
                    <HiExclamationTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">DAS Próximo do Vencimento</h3>
                      <p className="mt-1 text-sm text-amber-700">
                        Vence em {diasParaDAS} dias • {formatCurrency(metrics.valorDAS)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {percentualLimite > 80 && (
                <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <HiExclamationTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Atenção ao Limite MEI</h3>
                      <p className="mt-1 text-sm text-red-700">
                        {percentualLimite.toFixed(1)}% do limite anual atingido
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Métricas principais */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Receita Total */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Receita</p>
                  <p className="text-2xl font-semibold text-slate-900 mt-2">{formatCurrency(metrics.totalReceita)}</p>
                  <div className="flex items-center mt-3">
                    <HiArrowTrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
                    <span className="text-sm text-emerald-600 font-medium">+12%</span>
                    <span className="text-xs text-slate-500 ml-1">vs mês anterior</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <HiCurrencyDollar className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Despesas */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Despesas</p>
                  <p className="text-2xl font-semibold text-slate-900 mt-2">{formatCurrency(metrics.totalDespesa)}</p>
                  <div className="flex items-center mt-3">
                    <HiArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600 font-medium">-5%</span>
                    <span className="text-xs text-slate-500 ml-1">vs mês anterior</span>
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <HiArrowDownRight className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* Lucro Líquido */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Lucro</p>
                  <p className="text-2xl font-semibold text-slate-900 mt-2">{formatCurrency(metrics.lucroLiquido)}</p>
                  <div className="flex items-center mt-3">
                    <HiArrowTrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-sm text-blue-600 font-medium">+18%</span>
                    <span className="text-xs text-slate-500 ml-1">vs mês anterior</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <HiChartPie className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Próximo DAS */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Próximo DAS</p>
                  <p className="text-2xl font-semibold text-slate-900 mt-2">{formatCurrency(metrics.valorDAS)}</p>
                  <div className="flex items-center mt-3">
                    <HiClock className="w-4 h-4 text-amber-500 mr-1" />
                    <span className="text-sm text-amber-600 font-medium">{diasParaDAS} dias</span>
                    <span className="text-xs text-slate-500 ml-1">para vencer</span>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <HiCalculator className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Limite de Faturamento */}
        <div className="px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Limite Anual MEI</h3>
                <p className="text-sm text-slate-600 mt-1">Acompanhe seu faturamento em relação ao limite</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-slate-900">{percentualLimite.toFixed(1)}%</p>
                <p className="text-sm text-slate-600">utilizado</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      percentualLimite > 90 ? 'bg-red-500' :
                      percentualLimite > 80 ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(percentualLimite, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <div className="text-slate-600">
                  <span className="font-medium text-slate-900">{formatCurrency(metrics.faturamentoAtual)}</span>
                  <span className="ml-1">faturado</span>
                </div>
                <div className="text-slate-600">
                  <span>limite </span>
                  <span className="font-medium text-slate-900">{formatCurrency(metrics.limiteFaturamento)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Restante</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {formatCurrency(metrics.limiteFaturamento - metrics.faturamentoAtual)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Meta Mensal</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {formatCurrency(metrics.limiteFaturamento / 12)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Margem Segura</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {formatCurrency(metrics.limiteFaturamento * 0.8)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transações e Atividade */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transações Recentes */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Movimentações Recentes</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Ver todas
                </button>
              </div>
              
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'Receita' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {transaction.type === 'Receita' ? 
                          <HiArrowUpRight className="w-5 h-5" /> : 
                          <HiArrowDownRight className="w-5 h-5" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{transaction.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-slate-500">{transaction.category}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">{formatDate(transaction.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'Receita' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'Receita' ? '+' : '-'}{formatCurrency(transaction.value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Atividades e Notificações */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Atividades</h3>
                <HiBell className="w-5 h-5 text-slate-400" />
              </div>
              
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="relative">
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        notification.type === 'warning' 
                          ? 'bg-amber-50 text-amber-600' 
                          : notification.type === 'success'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        {notification.type === 'warning' ? 
                          <HiExclamationTriangle className="w-4 h-4" /> :
                          notification.type === 'success' ?
                          <HiCheckCircle className="w-4 h-4" /> :
                          <HiBell className="w-4 h-4" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-slate-500 mt-2">{formatDate(notification.date)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions rápidas */}
        <div className="px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Ações Rápidas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="group flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200">
                <div className="p-3 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                  <HiCurrencyDollar className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="mt-3 text-sm font-medium text-slate-700 group-hover:text-emerald-700">
                  Adicionar Receita
                </span>
              </button>
              
              <button className="group flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all duration-200">
                <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <HiArrowDownRight className="w-6 h-6 text-red-600" />
                </div>
                <span className="mt-3 text-sm font-medium text-slate-700 group-hover:text-red-700">
                  Registrar Despesa
                </span>
              </button>
              
              <button className="group flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all duration-200">
                <div className="p-3 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                  <HiCalculator className="w-6 h-6 text-amber-600" />
                </div>
                <span className="mt-3 text-sm font-medium text-slate-700 group-hover:text-amber-700">
                  Calcular DAS
                </span>
              </button>
              
              <button className="group flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <HiDocumentText className="w-6 h-6 text-blue-600" />
                </div>
                <span className="mt-3 text-sm font-medium text-slate-700 group-hover:text-blue-700">
                  Gerar Relatório
                </span>
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
