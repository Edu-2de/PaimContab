'use client';

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MeiProtection from '../../../../components/MeiProtection';
import MeiSidebar from '../../../../components/MeiSidebar';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import { MetricsSkeleton, EmptyState } from '../../../../components/Loading';
import { useOptimizedFilter } from '../../../../components/PerformanceOptimizedComponents';
import { HiPlus, HiXMark, HiMagnifyingGlass, HiArrowDownTray, HiArrowPath } from 'react-icons/hi2';
import { sanitizeInput, safeCurrencyFormat, safeDateFormat, useDebouncedValue } from '../../../../utils/validation';

interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  dataPagamento: string;
  categoria: string;
  fornecedor?: string;
  numeroNotaFiscal?: string;
  metodoPagamento: 'Dinheiro' | 'PIX' | 'Cartão Débito' | 'Cartão Crédito' | 'Transferência' | 'Boleto';
  status: 'Pago' | 'Pendente' | 'Cancelado';
  dedutivel: boolean;
  observacoes?: string;
  createdAt: string;
}

interface DespesaFormData {
  descricao: string;
  valor: string;
  dataPagamento: string;
  categoria: string;
  fornecedor: string;
  numeroNotaFiscal: string;
  metodoPagamento: string;
  status: string;
  dedutivel: boolean;
  observacoes: string;
}

const categories = [
  'Material de Escritório',
  'Equipamentos',
  'Software e Licenças',
  'Internet/Telefone',
  'Marketing/Publicidade',
  'Combustível',
  'Manutenção',
  'Taxas/Impostos',
  'Consultoria',
  'Treinamentos',
  'Aluguel',
  'Energia Elétrica',
  'Matéria-prima',
  'Outros',
];

function formatDate(dateStr: string) {
  return safeDateFormat(dateStr);
}

const DespesasContent = memo(() => {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(''); // Vazio = todos os períodos
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState<DespesaFormData>({
    descricao: '',
    valor: '',
    dataPagamento: new Date().toISOString().slice(0, 10),
    categoria: '',
    fornecedor: '',
    numeroNotaFiscal: '',
    metodoPagamento: 'PIX',
    status: 'Pago',
    dedutivel: true,
    observacoes: '',
  });

  // Verificar acesso à empresa
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
        router.push(`/mei/${userObj.companyId}/despesas`);
      }
    };

    if (companyId) {
      validateAccess();
    }
  }, [companyId, router]);

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // Função de filtro otimizada usando useCallback para evitar re-criações
  const filterDespesas = useCallback((despesa: Despesa, searchTerm: string) => {
    const searchTermSanitized = sanitizeInput(searchTerm);
    if (!searchTermSanitized) return true;

    const searchFields = [despesa.descricao, despesa.fornecedor, despesa.categoria];
    return searchFields.some(field => field && field.toLowerCase().includes(searchTermSanitized.toLowerCase()));
  }, []);

  // Usar hook otimizado para filtros
  useOptimizedFilter(despesas, searchTerm, filterDespesas);

  // Buscar despesas do backend
  const fetchDespesas = useCallback(async () => {
    if (!hasAccess || !companyId) {
      console.log('⚠️ fetchDespesas bloqueado:', { hasAccess, companyId });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');

      if (!userData) return;

      const userObj = JSON.parse(userData);
      const adminMode = userObj.role === 'admin';

      // Se for admin, passar companyId como query parameter
      const queryParam = adminMode ? `?companyId=${companyId}` : '';
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/despesas${queryParam}`;

      console.log('🔄 Buscando despesas:', { url, adminMode, companyId });

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('📡 Resposta despesas:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Despesas carregadas:', data.length);
        // Mapear numeroNota do backend para numeroNotaFiscal no frontend
        const despesasMapeadas = data.map((d: Despesa & { numeroNota?: string }) => ({
          ...d,
          numeroNotaFiscal: d.numeroNota || d.numeroNotaFiscal, // Mapear campo do backend
        }));
        setDespesas(despesasMapeadas);
      } else {
        const errorText = await response.text();
        console.error('❌ Erro ao carregar despesas:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
      setMetricsLoading(false);
    }
  }, [companyId, hasAccess]);

  useEffect(() => {
    if (hasAccess) {
      fetchDespesas();
    }
  }, [fetchDespesas, hasAccess]);

  // Recarregar dados quando a página recebe foco (voltou de outra aba/página)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && hasAccess) {
        console.log('🔄 Página de despesas recebeu foco - recarregando...');
        fetchDespesas();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchDespesas, hasAccess]);

  // Filtragem de despesas usando validação segura
  const filteredDespesas = despesas.filter(despesa => {
    // Busca segura por texto
    const searchTermSanitized = sanitizeInput(debouncedSearchTerm);
    if (searchTermSanitized) {
      const searchFields = [despesa.descricao, despesa.fornecedor, despesa.categoria];
      const matchesSearch = searchFields.some(
        field => field && field.toLowerCase().includes(searchTermSanitized.toLowerCase())
      );
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Filtro adicional por mês/ano usando useMemo para cache
  const finalFilteredDespesas = useMemo(() => {
    let filtered = filteredDespesas;

    // Filtrar por ano
    if (selectedYear) {
      filtered = filtered.filter(despesa => {
        const despesaYear = despesa.dataPagamento?.slice(0, 4);
        return despesaYear === selectedYear;
      });
    }

    // Filtrar por mês (se selecionado)
    if (selectedMonth) {
      filtered = filtered.filter(despesa => {
        const despesaMonth = despesa.dataPagamento?.slice(5, 7);
        return despesaMonth === selectedMonth;
      });
    }

    return filtered;
  }, [filteredDespesas, selectedMonth, selectedYear]);

  // Gerar lista de anos disponíveis (últimos 5 anos)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  // Nomes dos meses
  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  // Cálculos de métricas memoizados para performance
  const metrics = useMemo(() => {
    const totalDespesas = finalFilteredDespesas.reduce((sum, despesa) => sum + despesa.valor, 0);
    const despesasPagas = finalFilteredDespesas
      .filter(d => d.status === 'Pago')
      .reduce((sum, despesa) => sum + despesa.valor, 0);
    const despesasPendentes = finalFilteredDespesas
      .filter(d => d.status === 'Pendente')
      .reduce((sum, despesa) => sum + despesa.valor, 0);
    const despesasDedutiveis = finalFilteredDespesas
      .filter(d => d.dedutivel)
      .reduce((sum, despesa) => sum + despesa.valor, 0);

    return {
      totalDespesas,
      despesasPagas,
      despesasPendentes,
      despesasDedutiveis,
    };
  }, [finalFilteredDespesas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');

      if (!userData) return;

      const userObj = JSON.parse(userData);
      const adminMode = userObj.role === 'admin';

      const despesaData = {
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        dataPagamento: formData.dataPagamento,
        categoria: formData.categoria,
        fornecedor: formData.fornecedor,
        numeroNota: formData.numeroNotaFiscal, // Mapeamento correto para o backend
        metodoPagamento: formData.metodoPagamento,
        status: formData.status,
        dedutivel: formData.dedutivel,
        observacoes: formData.observacoes,
        // Se for admin, incluir companyId no body
        ...(adminMode && { companyId }),
      };

      let response;
      if (editingDespesa) {
        response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/despesas/${editingDespesa.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(despesaData),
        });
      } else {
        const queryParam = adminMode ? `?companyId=${companyId}` : '';
        response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/despesas${queryParam}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(despesaData),
        });
      }

      if (response.ok) {
        await fetchDespesas(); // Recarregar dados
        resetForm();
      } else {
        const errorText = await response.text();
        console.error('Erro ao salvar despesa:', response.status, errorText);
        alert(`Erro ao salvar despesa: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      descricao: '',
      valor: '',
      dataPagamento: new Date().toISOString().slice(0, 10),
      categoria: '',
      fornecedor: '',
      numeroNotaFiscal: '',
      metodoPagamento: 'PIX',
      status: 'Pago',
      dedutivel: true,
      observacoes: '',
    });
    setEditingDespesa(null);
    setShowModal(false);
  };

  const handleEdit = (despesa: Despesa) => {
    setFormData({
      descricao: despesa.descricao,
      valor: despesa.valor.toString(),
      dataPagamento: despesa.dataPagamento,
      categoria: despesa.categoria,
      fornecedor: despesa.fornecedor || '',
      numeroNotaFiscal: despesa.numeroNotaFiscal || '',
      metodoPagamento: despesa.metodoPagamento,
      status: despesa.status,
      dedutivel: despesa.dedutivel,
      observacoes: despesa.observacoes || '',
    });
    setEditingDespesa(despesa);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/despesas/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          await fetchDespesas(); // Recarregar dados
        } else {
          console.error('Erro ao excluir despesa');
        }
      } catch (error) {
        console.error('Erro ao excluir despesa:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MeiSidebar currentPage="despesas" companyId={companyId} />

      <div className="mei-content-wrapper">
        {/* Header Minimalista */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="max-w-8xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-light text-gray-900">Despesas</h1>
                <p className="text-sm text-gray-500 mt-1">Controle financeiro de saídas</p>
                {isAdmin && <p className="text-xs text-blue-600 mt-1">👁️ Visualização administrativa</p>}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchDespesas}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
                  title="Atualizar"
                >
                  <HiArrowPath className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg">
                  <HiArrowDownTray className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <HiPlus className="w-4 h-4" />
                  Nova Despesa
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Controles de Filtro */}
        <div className="bg-white border-b border-gray-100 px-8 py-4">
          <div className="max-w-8xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="text-sm border-0 bg-transparent focus:outline-none text-gray-700 font-medium cursor-pointer"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="text-sm border-0 bg-transparent focus:outline-none text-gray-700 font-medium cursor-pointer"
                >
                  <option value="">Todos os meses</option>
                  {monthNames.map((month, index) => (
                    <option key={index} value={(index + 1).toString().padStart(2, '0')}>
                      {month}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar despesas..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-200 w-72"
                  />
                </div>
              </div>

              <div className="text-sm text-gray-500">{finalFilteredDespesas.length} despesas encontradas</div>
            </div>
          </div>
        </div>

        {/* Resumo Simplificado */}
        <div className="bg-white border-b border-gray-100 px-8 py-6">
          <div className="max-w-8xl mx-auto">
            {metricsLoading ? (
              <MetricsSkeleton count={3} />
            ) : (
              <div className="grid grid-cols-3 gap-12">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">TOTAL</p>
                    <p className="text-2xl font-light text-gray-900">{safeCurrencyFormat(metrics.totalDespesas)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">PAGAS</p>
                  <p className="text-2xl font-light text-gray-900">{safeCurrencyFormat(metrics.despesasPagas)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">PENDENTES</p>
                  <p className="text-2xl font-light text-gray-900">{safeCurrencyFormat(metrics.despesasPendentes)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabela Principal */}
        <div className="flex-1 px-8 py-6">
          <div className="max-w-none mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 350px)', minHeight: '500px' }}>
                <table className="w-full min-w-[1400px]">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-56">
                        Descrição
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                        Fornecedor
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Categoria
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Nº Nota
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Data
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Método Pagamento
                      </th>
                      <th className="text-right py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Valor
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Dedutível
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                        Status
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {loading ? (
                      // Skeleton rows durante o carregamento
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={`skeleton-${index}`} className="border-b border-gray-100">
                          <td className="py-4 px-6">
                            <div className="animate-pulse">
                              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="animate-pulse">
                              <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="animate-pulse">
                              <div className="h-4 bg-gray-200 rounded w-24 ml-auto"></div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="animate-pulse">
                              <div className="h-4 bg-gray-200 rounded w-16"></div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="animate-pulse">
                              <div className="h-6 w-6 bg-gray-200 rounded mx-auto"></div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : filteredDespesas.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center">
                          <EmptyState
                            title={debouncedSearchTerm ? 'Nenhuma despesa encontrada' : 'Nenhuma despesa cadastrada'}
                            description={
                              debouncedSearchTerm
                                ? `Não encontramos despesas que correspondem ao filtro "${debouncedSearchTerm}".`
                                : 'Você ainda não cadastrou nenhuma despesa. Comece adicionando sua primeira despesa.'
                            }
                            action={
                              !debouncedSearchTerm ? (
                                <button
                                  onClick={() => setShowModal(true)}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Adicionar Despesa
                                </button>
                              ) : undefined
                            }
                            icon={
                              <svg fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredDespesas.map(despesa => (
                        <tr key={despesa.id} className="border-b border-gray-100 hover:bg-gray-25 transition-colors">
                          <td className="py-4 px-6">
                            <div className="text-sm font-medium text-gray-900">{despesa.descricao}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-700">{despesa.fornecedor || '—'}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-700">{despesa.categoria}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-700">{despesa.numeroNotaFiscal || '—'}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-900">{formatDate(despesa.dataPagamento)}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-700">{despesa.metodoPagamento}</div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="text-sm font-mono font-medium text-gray-900">
                              {safeCurrencyFormat(despesa.valor)}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {despesa.dedutivel ? (
                              <div className="flex items-center justify-center">
                                <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  despesa.status === 'Pago'
                                    ? 'bg-emerald-500'
                                    : despesa.status === 'Pendente'
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                }`}
                              ></div>
                              <span className="text-sm text-gray-700">{despesa.status}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEdit(despesa)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                title="Editar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(despesa.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Excluir"
                              >
                                <HiXMark className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Simplificado */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}
                </h3>
                <button onClick={resetForm} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                  placeholder="Digite a descrição da despesa..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={e => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                    placeholder="0,00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Pagamento</label>
                  <input
                    type="date"
                    value={formData.dataPagamento}
                    onChange={e => setFormData({ ...formData, dataPagamento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={formData.categoria}
                  onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fornecedor</label>
                  <input
                    type="text"
                    value={formData.fornecedor}
                    onChange={e => setFormData({ ...formData, fornecedor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                    placeholder="Nome do fornecedor (opcional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número da Nota Fiscal</label>
                  <input
                    type="text"
                    value={formData.numeroNotaFiscal}
                    onChange={e => setFormData({ ...formData, numeroNotaFiscal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                    placeholder="NF-001 (opcional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pagamento</label>
                  <select
                    value={formData.metodoPagamento}
                    onChange={e => setFormData({ ...formData, metodoPagamento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                    required
                  >
                    <option value="">Forma de pagamento</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão Débito">Cartão Débito</option>
                    <option value="Cartão Crédito">Cartão Crédito</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Boleto">Boleto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                    required
                  >
                    <option value="Pago">Pago</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.dedutivel}
                    onChange={e => setFormData({ ...formData, dedutivel: e.target.checked })}
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-200"
                  />
                  <span className="text-sm text-gray-700">Despesa dedutível</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                  placeholder="Observações adicionais (opcional)"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingDespesa ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

DespesasContent.displayName = 'DespesasContent';

export default function DespesasPage() {
  return (
    <MeiProtection>
      <ErrorBoundary>
        <DespesasContent />
      </ErrorBoundary>
    </MeiProtection>
  );
}
