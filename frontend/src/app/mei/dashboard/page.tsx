'use client';

import { useState, useEffect } from 'react';
import MeiProtection from '../../../components/MeiProtection';
import MeiSidebar from '../../../components/MeiSidebar';
import {
  HiExclamationTriangle,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiPlus,
  HiMinus,
  HiArrowRight,
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

interface Receita {
  id: string;
  descricao: string;
  valor: number;
  dataRecebimento: string;
  categoria: string;
  createdAt: string;
}

interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  dataPagamento: string;
  categoria: string;
  createdAt: string;
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function MeiDashboardContent() {
  const [company, setCompany] = useState<Company | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalReceita: 0,
    totalDespesa: 0,
    lucroLiquido: 0,
    limiteFaturamento: 81000.0,
    faturamentoAtual: 0,
    proximoDAS: '',
    valorDAS: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const userObj = JSON.parse(userData);
      fetchCompanyData(userObj.id);
      fetchDashboardData(userObj.companyId);
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

  const fetchDashboardData = async (companyId: string) => {
    if (!companyId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      // Buscar receitas
      const receitasResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/receitas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const receitas = receitasResponse.ok ? await receitasResponse.json() : [];

      // Buscar despesas
      const despesasResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/despesas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const despesas = despesasResponse.ok ? await despesasResponse.json() : [];

      // Calcular métricas
      const totalReceita = receitas.reduce((sum: number, r: Receita) => sum + (r.valor || 0), 0);
      const totalDespesa = despesas.reduce((sum: number, d: Despesa) => sum + (d.valor || 0), 0);
      const lucroLiquido = totalReceita - totalDespesa;

      // Calcular DAS (6% das receitas, mínimo R$ 66,60)
      const valorDAS = Math.max(totalReceita * 0.06, 66.6);

      // Próximo DAS (20 do próximo mês)
      const proximoMes = new Date();
      proximoMes.setMonth(proximoMes.getMonth() + 1);
      proximoMes.setDate(20);

      setMetrics({
        totalReceita,
        totalDespesa,
        lucroLiquido,
        limiteFaturamento: 81000.0,
        faturamentoAtual: totalReceita,
        proximoDAS: proximoMes.toISOString().split('T')[0],
        valorDAS,
      });

      // Combinar e ordenar transações recentes
      const allTransactions = [
        ...receitas.map((r: Receita) => ({
          id: `receita-${r.id}`,
          type: 'Receita' as const,
          description: r.descricao || 'Receita',
          value: r.valor || 0,
          date: r.dataRecebimento || r.createdAt,
          category: r.categoria || 'Geral',
        })),
        ...despesas.map((d: Despesa) => ({
          id: `despesa-${d.id}`,
          type: 'Despesa' as const,
          description: d.descricao || 'Despesa',
          value: d.valor || 0,
          date: d.dataPagamento || d.createdAt,
          category: d.categoria || 'Geral',
        })),
      ];

      // Ordenar por data (mais recentes primeiro) e pegar apenas os 4 primeiros
      const sortedTransactions = allTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4);

      setRecentTransactions(sortedTransactions);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const percentualLimite = (metrics.faturamentoAtual / metrics.limiteFaturamento) * 100;
  const diasParaDAS = Math.ceil(
    (new Date(metrics.proximoDAS).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <MeiSidebar currentPage="dashboard" />

      <div className="mei-content-wrapper">
        {/* Header Ultra Clean */}
        <div className="bg-white border-b border-slate-200/60">
          <div className="px-8 py-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-light text-slate-900 tracking-tight">Dashboard Financeiro</h1>
                <p className="text-slate-500 mt-2 font-medium">{company?.name || 'Minha Empresa MEI'}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-600">Situação Regular</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerta DAS Profissional */}
        {diasParaDAS <= 7 && (
          <div className="px-8 py-6">
            <div
              className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-6 transition-all duration-300 hover:bg-amber-50/70 hover:border-amber-300/60 cursor-pointer"
              onMouseEnter={() => setHoveredCard('das-alert')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <HiExclamationTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900 mb-1">Vencimento DAS</h4>
                  <p className="text-sm text-amber-800">
                    Pagamento vence em <span className="font-semibold">{diasParaDAS} dias</span> -{' '}
                    {formatCurrency(metrics.valorDAS)}
                  </p>
                </div>
                <HiArrowRight
                  className={`h-5 w-5 text-amber-600 transition-transform duration-300 ${
                    hoveredCard === 'das-alert' ? 'transform translate-x-1' : ''
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Métricas Principais - Design Ultra Profissional */}
        <div className="px-8 py-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white border border-slate-200/60 rounded-xl p-8 animate-pulse">
                  <div className="flex items-center justify-between mb-6">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-8 bg-slate-200 rounded w-32"></div>
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Receita Total */}
              <div
                className={`bg-white border border-slate-200/60 rounded-xl p-8 transition-all duration-300 cursor-pointer ${
                  hoveredCard === 'receita'
                    ? 'border-emerald-300/60 shadow-lg shadow-emerald-100/50 -translate-y-1'
                    : 'hover:border-slate-300/60'
                }`}
                onMouseEnter={() => setHoveredCard('receita')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Receita Total</h3>
                  <div
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      hoveredCard === 'receita' ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  ></div>
                </div>
                <div className="space-y-3">
                  <p className="text-3xl font-light text-slate-900 tracking-tight">
                    {formatCurrency(metrics.totalReceita)}
                  </p>
                  <div className="flex items-center gap-2">
                    <HiArrowTrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-600">+12% este mês</span>
                  </div>
                </div>
              </div>

              {/* Despesas */}
              <div
                className={`bg-white border border-slate-200/60 rounded-xl p-8 transition-all duration-300 cursor-pointer ${
                  hoveredCard === 'despesas'
                    ? 'border-rose-300/60 shadow-lg shadow-rose-100/50 -translate-y-1'
                    : 'hover:border-slate-300/60'
                }`}
                onMouseEnter={() => setHoveredCard('despesas')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Despesas</h3>
                  <div
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      hoveredCard === 'despesas' ? 'bg-rose-500' : 'bg-slate-200'
                    }`}
                  ></div>
                </div>
                <div className="space-y-3">
                  <p className="text-3xl font-light text-slate-900 tracking-tight">
                    {formatCurrency(metrics.totalDespesa)}
                  </p>
                  <div className="flex items-center gap-2">
                    <HiArrowTrendingDown className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-600">-5% este mês</span>
                  </div>
                </div>
              </div>

              {/* Lucro Líquido */}
              <div
                className={`bg-white border border-slate-200/60 rounded-xl p-8 transition-all duration-300 cursor-pointer ${
                  hoveredCard === 'lucro'
                    ? 'border-blue-300/60 shadow-lg shadow-blue-100/50 -translate-y-1'
                    : 'hover:border-slate-300/60'
                }`}
                onMouseEnter={() => setHoveredCard('lucro')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Lucro Líquido</h3>
                  <div
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      hoveredCard === 'lucro' ? 'bg-blue-500' : 'bg-slate-200'
                    }`}
                  ></div>
                </div>
                <div className="space-y-3">
                  <p className="text-3xl font-light text-slate-900 tracking-tight">
                    {formatCurrency(metrics.lucroLiquido)}
                  </p>
                  <div className="flex items-center gap-2">
                    <HiArrowTrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">+18% este mês</span>
                  </div>
                </div>
              </div>

              {/* DAS */}
              <div
                className={`bg-white border border-slate-200/60 rounded-xl p-8 transition-all duration-300 cursor-pointer ${
                  hoveredCard === 'das'
                    ? 'border-orange-300/60 shadow-lg shadow-orange-100/50 -translate-y-1'
                    : 'hover:border-slate-300/60'
                }`}
                onMouseEnter={() => setHoveredCard('das')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Próximo DAS</h3>
                  <div
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      hoveredCard === 'das' ? 'bg-orange-500' : 'bg-slate-200'
                    }`}
                  ></div>
                </div>
                <div className="space-y-3">
                  <p className="text-3xl font-light text-slate-900 tracking-tight">
                    {formatCurrency(metrics.valorDAS)}
                  </p>
                  <p className="text-sm font-medium text-slate-600">{diasParaDAS} dias restantes</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Limite MEI - Design Minimalista */}
        <div className="px-8 pb-8">
          <div
            className={`bg-white border border-slate-200/60 rounded-xl p-8 transition-all duration-300 ${
              hoveredCard === 'limite' ? 'border-slate-300/60 shadow-lg shadow-slate-100/50' : ''
            }`}
            onMouseEnter={() => setHoveredCard('limite')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-medium text-slate-900">Limite Anual MEI</h3>
                <p className="text-sm text-slate-500 mt-1">Faturamento permitido em 2024</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-light text-slate-900 tracking-tight">{percentualLimite.toFixed(1)}%</p>
                <p className="text-sm text-slate-500">utilizado</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-1000 ${
                    percentualLimite > 80
                      ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                      : percentualLimite > 60
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                  }`}
                  style={{ width: `${Math.min(percentualLimite, 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">Faturado: {formatCurrency(metrics.faturamentoAtual)}</span>
                <span className="text-slate-600 font-medium">Limite: {formatCurrency(metrics.limiteFaturamento)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal - Layout Profissional */}
        <div className="px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Movimentações Recentes */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-slate-900">Movimentações Recentes</h3>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 flex items-center gap-2 group">
                      Ver todas
                      <HiArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {recentTransactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className="px-8 py-6 hover:bg-slate-50/50 transition-colors duration-200 cursor-pointer group"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${
                              transaction.type === 'Receita'
                                ? 'bg-emerald-50 group-hover:bg-emerald-100'
                                : 'bg-rose-50 group-hover:bg-rose-100'
                            }`}
                          >
                            {transaction.type === 'Receita' ? (
                              <HiPlus className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <HiMinus className="w-5 h-5 text-rose-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{transaction.description}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-slate-500">{transaction.category}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-sm text-slate-500">{formatDate(transaction.date)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-medium transition-colors duration-200 ${
                              transaction.type === 'Receita' ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {transaction.type === 'Receita' ? '+' : '-'}
                            {formatCurrency(transaction.value)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ações Rápidas - Design Profissional */}
            <div>
              <div className="bg-white border border-slate-200/60 rounded-xl p-8">
                <h3 className="text-lg font-medium text-slate-900 mb-8">Ações Rápidas</h3>

                <div className="space-y-4">
                  {[
                    { label: 'Nova Receita', icon: HiPlus, color: 'emerald' },
                    { label: 'Nova Despesa', icon: HiMinus, color: 'rose' },
                    { label: 'Calcular DAS', color: 'orange' },
                    { label: 'Gerar Relatório', color: 'blue' },
                  ].map((action, index) => (
                    <button
                      key={index}
                      className={`w-full group flex items-center justify-between p-6 border border-slate-200/60 rounded-xl 
                        hover:border-${action.color}-200 hover:bg-${action.color}-50/30 
                        transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-${action.color}-100/50`}
                    >
                      <div className="flex items-center gap-4">
                        {action.icon && (
                          <action.icon
                            className={`w-5 h-5 text-${action.color}-600 transition-transform duration-300 group-hover:scale-110`}
                          />
                        )}
                        <span className="font-medium text-slate-900 group-hover:text-slate-800">{action.label}</span>
                      </div>
                      <HiArrowRight
                        className={`w-4 h-4 text-slate-400 transition-all duration-300 group-hover:text-${action.color}-600 group-hover:translate-x-1`}
                      />
                    </button>
                  ))}
                </div>
              </div>
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
