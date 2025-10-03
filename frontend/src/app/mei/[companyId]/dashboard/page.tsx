'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MeiProtection from '../../../../components/MeiProtection';
import MeiSidebar from '../../../../components/MeiSidebar';
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
  companyName: string;
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
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

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
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchCompanyData = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/company/${companyId}`, {
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
  }, [companyId]);

  const fetchDashboardData = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      const userObj = userData ? JSON.parse(userData) : null;

      // Se for admin, precisa passar companyId como query parameter
      const queryParam = userObj?.role === 'admin' ? `?companyId=${companyId}` : '';

      // Buscar receitas
      const receitasResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/receitas${queryParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const receitas = receitasResponse.ok ? await receitasResponse.json() : [];

      // Buscar despesas
      const despesasResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/despesas${queryParam}`, {
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
      const allTransactions: RecentTransaction[] = [
        ...receitas.slice(0, 5).map((r: Receita) => ({
          id: r.id,
          type: 'Receita' as const,
          description: r.descricao,
          value: r.valor,
          date: r.dataRecebimento || r.createdAt,
          category: r.categoria,
        })),
        ...despesas.slice(0, 5).map((d: Despesa) => ({
          id: d.id,
          type: 'Despesa' as const,
          description: d.descricao,
          value: d.valor,
          date: d.dataPagamento || d.createdAt,
          category: d.categoria,
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      setRecentTransactions(allTransactions);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Validar acesso e carregar dados iniciais
  useEffect(() => {
    const validateAccess = () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        router.push('/Login');
        return;
      }

      const userObj = JSON.parse(userData);

      // Verificar se é admin ou se é o dono da empresa
      if (userObj.role === 'admin') {
        setIsAdmin(true);
        setHasAccess(true);
      } else if (userObj.companyId === companyId) {
        setHasAccess(true);
      } else {
        // Usuário tentando acessar empresa de outro
        router.push(`/mei/${userObj.companyId}/dashboard`);
        return;
      }

      fetchCompanyData();
      fetchDashboardData();
    };

    if (companyId) {
      validateAccess();
    }
  }, [companyId, router, fetchCompanyData, fetchDashboardData]);

  // Recarregar dados quando a página recebe foco (voltou de outra aba/página)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && hasAccess && companyId) {
        console.log('🔄 Dashboard recebeu foco - recarregando dados...');
        fetchDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [companyId, hasAccess, fetchDashboardData]);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  const usagePercent = (metrics.faturamentoAtual / metrics.limiteFaturamento) * 100;
  const isNearLimit = usagePercent >= 80;

  return (
    <div className="mei-page-container">
      <MeiSidebar currentPage="dashboard" companyId={companyId} />

      <div className="mei-content-wrapper">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="max-w-8xl mx-auto">
            <h1 className="text-2xl font-light text-gray-800">Dashboard MEI</h1>
            {company && (
              <p className="text-sm text-gray-600 mt-1">
                {company.companyName} {company.cnpj && `• ${company.cnpj}`}
              </p>
            )}
            {isAdmin && <p className="text-xs text-blue-600 mt-1">👁️ Visualização administrativa</p>}
          </div>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-gray-800 mx-auto mb-4"></div>
              <p className="text-gray-700">Carregando dados...</p>
            </div>
          </div>
        ) : (
          <div className="px-8 py-6">
            <div className="max-w-8xl mx-auto space-y-6">
              {/* Cards de Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Receitas */}
                <div
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onMouseEnter={() => setHoveredCard('receita')}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => router.push(`/mei/${companyId}/receitas`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Receitas</h3>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <HiArrowTrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-light text-gray-800">{formatCurrency(metrics.totalReceita)}</p>
                  {hoveredCard === 'receita' && (
                    <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                      <span>Ver detalhes</span>
                      <HiArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Total Despesas */}
                <div
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onMouseEnter={() => setHoveredCard('despesa')}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => router.push(`/mei/${companyId}/despesas`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Despesas</h3>
                    <div className="p-2 bg-red-50 rounded-lg">
                      <HiArrowTrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-light text-gray-800">{formatCurrency(metrics.totalDespesa)}</p>
                  {hoveredCard === 'despesa' && (
                    <div className="flex items-center gap-1 text-xs text-red-600 mt-2">
                      <span>Ver detalhes</span>
                      <HiArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Lucro Líquido */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Lucro Líquido</h3>
                    <div className={`p-2 rounded-lg ${metrics.lucroLiquido >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                      {metrics.lucroLiquido >= 0 ? (
                        <HiPlus className="w-5 h-5 text-blue-600" />
                      ) : (
                        <HiMinus className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                  </div>
                  <p
                    className={`text-2xl font-light ${metrics.lucroLiquido >= 0 ? 'text-blue-600' : 'text-orange-600'}`}
                  >
                    {formatCurrency(metrics.lucroLiquido)}
                  </p>
                </div>

                {/* Próximo DAS */}
                <div
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onMouseEnter={() => setHoveredCard('das')}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => router.push(`/mei/${companyId}/das`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Próximo DAS</h3>
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <HiExclamationTriangle className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-light text-gray-800">{formatCurrency(metrics.valorDAS)}</p>
                  <p className="text-xs text-gray-600 mt-1">Vencimento: {formatDate(metrics.proximoDAS)}</p>
                  {hoveredCard === 'das' && (
                    <div className="flex items-center gap-1 text-xs text-purple-600 mt-2">
                      <span>Ver DAS</span>
                      <HiArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>

              {/* Limite de Faturamento */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-800">Limite de Faturamento MEI</h3>
                  {isNearLimit && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      <HiExclamationTriangle className="w-3 h-3" />
                      Atenção
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Faturamento Atual</span>
                    <span className="font-medium text-gray-800">{formatCurrency(metrics.faturamentoAtual)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${isNearLimit ? 'bg-orange-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>R$ 0</span>
                    <span>{formatCurrency(metrics.limiteFaturamento)} (Limite Anual)</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Você utilizou {usagePercent.toFixed(1)}% do limite anual de faturamento MEI
                  </p>
                </div>
              </div>

              {/* Transações Recentes */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-800">Transações Recentes</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {recentTransactions.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-600">
                      <p className="text-gray-700">Nenhuma transação registrada ainda</p>
                      <p className="text-xs mt-1 text-gray-600">Comece adicionando suas receitas e despesas</p>
                    </div>
                  ) : (
                    recentTransactions.map(transaction => (
                      <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                transaction.type === 'Receita' ? 'bg-green-50' : 'bg-red-50'
                              }`}
                            >
                              {transaction.type === 'Receita' ? (
                                <HiPlus className="w-4 h-4 text-green-600" />
                              ) : (
                                <HiMinus className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{transaction.description}</p>
                              <p className="text-xs text-gray-600">
                                {transaction.category} • {formatDate(transaction.date)}
                              </p>
                            </div>
                          </div>
                          <p
                            className={`text-sm font-medium ${
                              transaction.type === 'Receita' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {transaction.type === 'Receita' ? '+' : '-'} {formatCurrency(transaction.value)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
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
