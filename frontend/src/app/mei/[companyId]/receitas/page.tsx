'use client';

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MeiProtection from '../../../../components/MeiProtection';
import MeiSidebar from '../../../../components/MeiSidebar';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import { MetricsSkeleton, EmptyState } from '../../../../components/Loading';
              <EmptyState
                title="Nenhuma receita encontrada"
                description={
                  debouncedSearchTerm
                    ? `Não encontramos receitas com "${debouncedSearchTerm}"`
                    : "Comece adicionando sua primeira receita"
                }
                actionButton={
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                  >
                    <HiPlus className="w-4 h-4" />
                    Nova Receita
                  </button>
                }
              />OptimizedFilter } from '../../../../components/PerformanceOptimizedComponents';
import { HiPlus, HiXMark, HiMagnifyingGlass, HiArrowPath } from 'react-icons/hi2';
import { sanitizeInput, safeCurrencyFormat, safeDateFormat } from '../../../../utils/validation';
import CompanyAccessManager from '../../../../utils/companyAccess';

interface Receita {
  id: string;
  descricao: string;
  valor: number;
  dataRecebimento: string;
  categoria: string;
  cliente?: string;
  numeroNota?: string;
  metodoPagamento: 'Dinheiro' | 'PIX' | 'Cartão Débito' | 'Cartão Crédito' | 'Transferência' | 'Boleto';
  status: 'Recebido' | 'Pendente' | 'Cancelado';
  observacoes?: string;
  createdAt: string;
}

interface ReceitaFormData {
  descricao: string;
  valor: string;
  dataRecebimento: string;
  categoria: string;
  cliente: string;
  numeroNota: string;
  metodoPagamento: string;
  status: string;
  observacoes: string;
}

const categories = [
  'Vendas de Produtos',
  'Prestação de Serviços',
  'Comissões',
  'Royalties',
  'Consultoria',
  'Licenciamento',
  'Outros',
];

function formatDate(dateStr: string) {
  return safeDateFormat(dateStr);
}

const ReceitasContent = memo(() => {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingReceita, setEditingReceita] = useState<Receita | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [hasAccess, setHasAccess] = useState(false);
  const [accessValidation, setAccessValidation] = useState<{
    hasAccess: boolean;
    isOwner: boolean;
    isAdmin: boolean;
    reason?: string;
  } | null>(null);
  const [formData, setFormData] = useState<ReceitaFormData>({
    descricao: '',
    valor: '',
    dataRecebimento: new Date().toISOString().slice(0, 10),
    categoria: '',
    cliente: '',
    numeroNota: '',
    metodoPagamento: 'PIX',
    status: 'Recebido',
    observacoes: '',
  });

  // Verificar acesso à empresa
  useEffect(() => {
    const validateAccess = async () => {
      const validation = await CompanyAccessManager.validateAndRedirect(companyId, router);
      setAccessValidation(validation);
      setHasAccess(validation.hasAccess);
    };

    if (companyId) {
      validateAccess();
    }
  }, [companyId, router]);

  // Filtro otimizado usando debounce
  const { filteredItems: filteredReceitas, debouncedSearchTerm } = useOptimizedFilter(
    receitas,
    searchTerm,
    useCallback((receita: Receita, term: string) => {
      const searchTermSanitized = sanitizeInput(term);
      return (
        sanitizeInput(receita.descricao).includes(searchTermSanitized) ||
        sanitizeInput(receita.categoria).includes(searchTermSanitized) ||
        sanitizeInput(receita.cliente || '').includes(searchTermSanitized) ||
        sanitizeInput(receita.numeroNota || '').includes(searchTermSanitized)
      );
    }, [])
  );

  // Buscar receitas do backend com Company ID
  const fetchReceitas = useCallback(async () => {
    if (!hasAccess) return;

    try {
      setLoading(true);
      const headers = CompanyAccessManager.getAuthHeaders();
      const apiUrl = CompanyAccessManager.buildApiUrl(
        process.env.NEXT_PUBLIC_BACKEND_URL || '',
        '/api/receitas',
        companyId
      );

      const response = await fetch(apiUrl, { headers });

      if (response.ok) {
        const data = await response.json();
        setReceitas(data);
      } else {
        console.error('Erro ao carregar receitas:', response.status);
      }
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
    } finally {
      setLoading(false);
      setMetricsLoading(false);
    }
  }, [companyId, hasAccess]);

  useEffect(() => {
    if (hasAccess) {
      fetchReceitas();
    }
  }, [fetchReceitas, hasAccess]);

  // Filtro adicional por mês usando useMemo para cache
  const finalFilteredReceitas = useMemo(() => {
    if (!selectedMonth) return filteredReceitas;

    return filteredReceitas.filter((receita: Receita) => {
      const receitaMonth = receita.dataRecebimento?.slice(0, 7);
      return receitaMonth === selectedMonth;
    });
  }, [filteredReceitas, selectedMonth]);

  // Cálculos de métricas memoizados para performance
  const metrics = useMemo(() => {
    const totalReceitas = finalFilteredReceitas.reduce((sum: number, receita: Receita) => sum + receita.valor, 0);
    const receitasRecebidas = finalFilteredReceitas
      .filter((r: Receita) => r.status === 'Recebido')
      .reduce((sum: number, receita: Receita) => sum + receita.valor, 0);
    const receitasPendentes = finalFilteredReceitas
      .filter((r: Receita) => r.status === 'Pendente')
      .reduce((sum: number, receita: Receita) => sum + receita.valor, 0);

    return {
      totalReceitas,
      receitasRecebidas,
      receitasPendentes,
    };
  }, [finalFilteredReceitas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const headers = {
        'Content-Type': 'application/json',
        ...CompanyAccessManager.getAuthHeaders(),
      };

      const receitaData = {
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        dataRecebimento: formData.dataRecebimento,
        categoria: formData.categoria,
        cliente: formData.cliente,
        numeroNota: formData.numeroNota,
        metodoPagamento: formData.metodoPagamento,
        status: formData.status,
        observacoes: formData.observacoes,
        // Para admin, incluir companyId no body
        ...(accessValidation?.isAdmin && { companyId }),
      };

      let response;
      if (editingReceita) {
        response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/receitas/${editingReceita.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(receitaData),
        });
      } else {
        const apiUrl = CompanyAccessManager.buildApiUrl(
          process.env.NEXT_PUBLIC_BACKEND_URL || '',
          '/api/receitas',
          companyId
        );
        response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(receitaData),
        });
      }

      if (response.ok) {
        await fetchReceitas();
        resetForm();
      } else {
        const errorText = await response.text();
        console.error('Erro ao salvar receita:', response.status, errorText);
        alert(`Erro ao salvar receita: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      descricao: '',
      valor: '',
      dataRecebimento: new Date().toISOString().slice(0, 10),
      categoria: '',
      cliente: '',
      numeroNota: '',
      metodoPagamento: 'PIX',
      status: 'Recebido',
      observacoes: '',
    });
    setEditingReceita(null);
    setShowModal(false);
  };

  const handleEdit = (receita: Receita) => {
    setEditingReceita(receita);
    setFormData({
      descricao: receita.descricao,
      valor: receita.valor.toString(),
      dataRecebimento: receita.dataRecebimento?.slice(0, 10) || '',
      categoria: receita.categoria,
      cliente: receita.cliente || '',
      numeroNota: receita.numeroNota || '',
      metodoPagamento: receita.metodoPagamento,
      status: receita.status,
      observacoes: receita.observacoes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) return;

    try {
      const headers = CompanyAccessManager.getAuthHeaders();
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/receitas/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        await fetchReceitas();
      } else {
        alert('Erro ao excluir receita');
      }
    } catch (error) {
      console.error('Erro ao excluir receita:', error);
      alert('Erro ao excluir receita');
    }
  };

  // Se não tem acesso, não renderiza nada (CompanyAccessManager já redirecionou)
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

  return (
    <div className="mei-page-container">
      <MeiSidebar currentPage="receitas" />

      <div className="mei-content-wrapper">
        {/* Header Minimalista */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="max-w-8xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-light text-gray-900">Receitas</h1>
                <p className="text-sm text-gray-500 mt-1">Controle financeiro de entradas</p>
                {accessValidation?.isAdmin && (
                  <p className="text-xs text-blue-600 mt-1">👁️ Visualização administrativa</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchReceitas}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
                  title="Atualizar"
                >
                  <HiArrowPath className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                >
                  <HiPlus className="w-4 h-4" />
                  Nova Receita
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="px-8 py-6 bg-gray-50">
          <div className="max-w-8xl mx-auto">
            {metricsLoading ? (
              <MetricsSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-medium text-gray-500">Total de Receitas</h3>
                  <p className="text-2xl font-light text-gray-900 mt-2">{safeCurrencyFormat(metrics.totalReceitas)}</p>
                  <p className="text-xs text-gray-500 mt-1">{finalFilteredReceitas.length} registros</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-medium text-emerald-600">Recebido</h3>
                  <p className="text-2xl font-light text-emerald-700 mt-2">
                    {safeCurrencyFormat(metrics.receitasRecebidas)}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {finalFilteredReceitas.filter((r: Receita) => r.status === 'Recebido').length} recebidas
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-medium text-amber-600">Pendente</h3>
                  <p className="text-2xl font-light text-amber-700 mt-2">
                    {safeCurrencyFormat(metrics.receitasPendentes)}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {finalFilteredReceitas.filter((r: Receita) => r.status === 'Pendente').length} pendentes
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="px-8 py-4 bg-white border-b border-gray-200">
          <div className="max-w-8xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar receitas..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                />
              </div>

              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
              >
                <option value="">Todos os meses</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(2024, i, 1);
                  const monthStr = date.toISOString().slice(0, 7);
                  return (
                    <option key={monthStr} value={monthStr}>
                      {date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 px-8 py-6">
          <div className="max-w-8xl mx-auto">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : finalFilteredReceitas.length === 0 ? (
              <EmptyState
                title="Nenhuma receita encontrada"
                description={
                  debouncedSearchTerm
                    ? `Não encontramos receitas com "${debouncedSearchTerm}"`
                    : 'Comece adicionando sua primeira receita'
                }
                action={{
                  label: 'Nova Receita',
                  onClick: () => setShowModal(true),
                }}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoria
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {finalFilteredReceitas.map(receita => (
                        <tr key={receita.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{receita.descricao}</div>
                            {receita.cliente && <div className="text-sm text-gray-500">Cliente: {receita.cliente}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {safeCurrencyFormat(receita.valor)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(receita.dataRecebimento)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                receita.status === 'Recebido'
                                  ? 'bg-green-100 text-green-800'
                                  : receita.status === 'Pendente'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {receita.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receita.categoria}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(receita)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(receita.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Nova/Editar Receita */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingReceita ? 'Editar Receita' : 'Nova Receita'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                <HiXMark className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                  <input
                    type="text"
                    required
                    value={formData.descricao}
                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Ex: Venda de produto X"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.valor}
                    onChange={e => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Recebimento *</label>
                  <input
                    type="date"
                    required
                    value={formData.dataRecebimento}
                    onChange={e => setFormData({ ...formData, dataRecebimento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                  <select
                    required
                    value={formData.categoria}
                    onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <input
                    type="text"
                    value={formData.cliente}
                    onChange={e => setFormData({ ...formData, cliente: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Nome do cliente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número da Nota</label>
                  <input
                    type="text"
                    value={formData.numeroNota}
                    onChange={e => setFormData({ ...formData, numeroNota: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Ex: NF-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
                  <select
                    value={formData.metodoPagamento}
                    onChange={e => setFormData({ ...formData, metodoPagamento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão Débito">Cartão Débito</option>
                    <option value="Cartão Crédito">Cartão Crédito</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Boleto">Boleto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="Recebido">Recebido</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-black border border-transparent rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : editingReceita ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

ReceitasContent.displayName = 'ReceitasContent';

export default function ReceitasWithCompanyIdPage() {
  return (
    <ErrorBoundary>
      <MeiProtection>
        <ReceitasContent />
      </MeiProtection>
    </ErrorBoundary>
  );
}
