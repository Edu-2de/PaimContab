'use client';

import { useState, useEffect, useCallback } from 'react';
import MeiProtection from '../../../components/MeiProtection';
import MeiSidebar from '../../../components/MeiSidebar';
import { 
  HiPlus, 
  HiXMark, 
  HiArrowDownTray, 
  HiArrowPath,
  HiMagnifyingGlass
} from 'react-icons/hi2';

interface SpreadsheetRow {
  id: string;
  data: string;
  titulo: string;
  descricao: string;
  categoria: string;
  tipo: 'receita' | 'despesa' | '';
  valor: number;
  lucro: number;
  // Novos campos para receitas
  cliente?: string;
  metodoPagamento?: string;
  status?: string;
  numeroNota?: string;
  // Novos campos para despesas
  fornecedor?: string;
  dedutivel?: boolean;
  isEditing?: boolean;
  isNew?: boolean;
}

interface MonthlyTotals {
  totalReceita: number;
  totalDespesa: number;
  lucroSemDas: number;
  dasTotal: number;
  lucroFinal: number;
  limiteMeiUtilizado: number;
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

const CATEGORIAS_RECEITA = [
  'Vendas de Produtos',
  'Prestação de Serviços',
  'Comissões',
  'Consultoria',
  'Freelancer',
  'Outros',
];

const CATEGORIAS_DESPESA = [
  'Matéria-prima',
  'Combustível',
  'Manutenção',
  'Internet/Telefone',
  'Marketing',
  'Impostos',
  'Aluguel',
  'Energia Elétrica',
  'Outros',
];

const METODOS_PAGAMENTO = [
  'Dinheiro',
  'PIX',
  'Cartão Débito',
  'Cartão Crédito',
  'Transferência',
  'Boleto',
];

const STATUS_OPTIONS = [
  'Recebido',
  'Pendente',
  'Cancelado',
  'Pago'
];

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function MeiSpreadsheetContent() {
  const [rows, setRows] = useState<SpreadsheetRow[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals>({
    totalReceita: 0,
    totalDespesa: 0,
    lucroSemDas: 0,
    dasTotal: 0,
    lucroFinal: 0,
    limiteMeiUtilizado: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Detectar se a sidebar está recolhida baseado na largura da tela ou estado
  useEffect(() => {
    const checkSidebarState = () => {
      const sidebarElement = document.querySelector('.mei-sidebar');
      if (sidebarElement) {
        const isCollapsed = sidebarElement.classList.contains('collapsed') || window.innerWidth < 1200;
        setSidebarCollapsed(isCollapsed);
      }
    };

    checkSidebarState();
    window.addEventListener('resize', checkSidebarState);
    
    // Observer para detectar mudanças na sidebar
    const observer = new MutationObserver(checkSidebarState);
    const sidebarElement = document.querySelector('.mei-sidebar');
    if (sidebarElement) {
      observer.observe(sidebarElement, { attributes: true, attributeFilter: ['class'] });
    }

    return () => {
      window.removeEventListener('resize', checkSidebarState);
      observer.disconnect();
    };
  }, []);

  // Calcular totais
  const calculateTotals = (currentRows: SpreadsheetRow[]) => {
    const totalReceita = currentRows
      .filter(row => row.tipo === 'receita')
      .reduce((sum, row) => sum + row.valor, 0);
    
    const totalDespesa = currentRows
      .filter(row => row.tipo === 'despesa')
      .reduce((sum, row) => sum + row.valor, 0);
    
    const lucroSemDas = totalReceita - totalDespesa;
    const dasTotal = Math.max(totalReceita * 0.06, 66.6);
    const lucroFinal = lucroSemDas - dasTotal;
    const receitaAnualEstimada = totalReceita * 12;

    return {
      totalReceita,
      totalDespesa,
      lucroSemDas,
      dasTotal,
      lucroFinal,
      limiteMeiUtilizado: (receitaAnualEstimada / 81000) * 100,
    };
  };

  // Buscar dados do backend e gerar planilha
  const fetchSpreadsheetData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      // Buscar receitas do mês
      const receitasResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/receitas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const receitas = receitasResponse.ok ? await receitasResponse.json() : [];

      // Buscar despesas do mês
      const despesasResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/despesas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const despesas = despesasResponse.ok ? await despesasResponse.json() : [];

      // Filtrar por mês selecionado
      const monthStart = new Date(selectedMonth);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

      const filteredReceitas = receitas.filter((r: Receita) => {
        const date = new Date(r.dataRecebimento || r.createdAt);
        return date >= monthStart && date <= monthEnd;
      });

      const filteredDespesas = despesas.filter((d: Despesa) => {
        const date = new Date(d.dataPagamento || d.createdAt);
        return date >= monthStart && date <= monthEnd;
      });

      // Converter receitas para formato da planilha
      const receitasRows: SpreadsheetRow[] = filteredReceitas.map((receita: Receita) => ({
        id: `receita-${receita.id}`,
        data: new Date(receita.dataRecebimento || receita.createdAt).toISOString().split('T')[0],
        titulo: receita.descricao || 'Receita',
        descricao: '',
        categoria: receita.categoria || 'Vendas de Produtos',
        tipo: 'receita' as const,
        valor: receita.valor || 0,
        lucro: receita.valor || 0,
        cliente: '',
        metodoPagamento: 'PIX',
        status: 'Recebido',
        numeroNota: '',
      }));

      // Converter despesas para formato da planilha
      const despesasRows: SpreadsheetRow[] = filteredDespesas.map((despesa: Despesa) => ({
        id: `despesa-${despesa.id}`,
        data: new Date(despesa.dataPagamento || despesa.createdAt).toISOString().split('T')[0],
        titulo: despesa.descricao || 'Despesa',
        descricao: '',
        categoria: despesa.categoria || 'Outros',
        tipo: 'despesa' as const,
        valor: despesa.valor || 0,
        lucro: -(despesa.valor || 0),
        fornecedor: '',
        metodoPagamento: 'PIX',
        status: 'Pago',
        dedutivel: true,
      }));

      // Combinar e ordenar por data
      const allRows = [...receitasRows, ...despesasRows].sort(
        (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
      );

      setRows(allRows);
      setMonthlyTotals(calculateTotals(allRows));
    } catch (error) {
      console.error('Erro ao carregar dados da planilha:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchSpreadsheetData();
  }, [fetchSpreadsheetData]);

  const createEmptyRow = (): SpreadsheetRow => ({
    id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    data: new Date().toISOString().split('T')[0],
    titulo: '',
    descricao: '',
    categoria: '',
    tipo: '',
    valor: 0,
    lucro: 0,
    cliente: '',
    fornecedor: '',
    metodoPagamento: 'PIX',
    status: '',
    numeroNota: '',
    dedutivel: true,
    isEditing: true,
    isNew: true,
  });

  const addNewRow = () => {
    const newRow = createEmptyRow();
    setRows([...rows, newRow]);
  };

  const updateRow = (id: string, field: keyof SpreadsheetRow, value: string | number | boolean) => {
    setRows(prevRows => {
      const updatedRows = prevRows.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };

          // Recalcular lucro baseado no tipo e valor
          if (field === 'valor' || field === 'tipo') {
            if (updatedRow.tipo === 'receita') {
              updatedRow.lucro = updatedRow.valor;
              // Definir status padrão para receitas
              if (!updatedRow.status) updatedRow.status = 'Recebido';
            } else if (updatedRow.tipo === 'despesa') {
              updatedRow.lucro = -updatedRow.valor;
              // Definir status padrão para despesas
              if (!updatedRow.status) updatedRow.status = 'Pago';
            } else {
              updatedRow.lucro = 0;
            }
          }

          return updatedRow;
        }
        return row;
      });

      // Atualizar totais
      setMonthlyTotals(calculateTotals(updatedRows));
      return updatedRows;
    });
  };

  const deleteRow = (id: string) => {
    const updatedRows = rows.filter(row => row.id !== id);
    setRows(updatedRows);
    setMonthlyTotals(calculateTotals(updatedRows));
  };

  // Salvar todas as alterações no banco
  const saveAllChanges = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');

      // Filtrar apenas linhas novas ou editadas
      const newRows = rows.filter(row => row.isNew && row.tipo && row.titulo && row.valor > 0);

      for (const row of newRows) {
        if (row.tipo === 'receita') {
          await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/receitas`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              descricao: row.titulo,
              valor: row.valor,
              dataRecebimento: row.data,
              categoria: row.categoria,
            }),
          });
        } else if (row.tipo === 'despesa') {
          await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/despesas`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              descricao: row.titulo,
              valor: row.valor,
              dataPagamento: row.data,
              categoria: row.categoria,
            }),
          });
        }
      }

      // Recarregar dados
      await fetchSpreadsheetData();
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    } finally {
      setSaving(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Data',
      'Tipo',
      'Título',
      'Descrição',
      'Categoria',
      'Cliente/Fornecedor',
      'Método Pagamento',
      'Status',
      'Valor',
      'Dedutível',
    ];
    const csvData = rows.map(row => [
      formatDate(row.data),
      row.tipo === 'receita' ? 'Receita' : 'Despesa',
      row.titulo,
      row.descricao,
      row.categoria,
      row.tipo === 'receita' ? row.cliente : row.fornecedor,
      row.metodoPagamento,
      row.status,
      row.valor.toFixed(2),
      row.tipo === 'despesa' ? (row.dedutivel ? 'Sim' : 'Não') : 'N/A',
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planilha-mei-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filtrar linhas pela busca
  const filteredRows = rows.filter(row =>
    row.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatDate(row.data).includes(searchTerm) ||
    row.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasUnsavedRows = rows.some(row => row.isNew);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MeiSidebar currentPage="planilha" />
        <div className="mei-content-wrapper">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MeiSidebar currentPage="planilha" />

      <div className="mei-content-wrapper">
        {/* Header com Botão de Salvar */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="max-w-8xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-light text-gray-900">Planilha MEI</h1>
                <p className="text-sm text-gray-500 mt-1">Controle financeiro simplificado</p>
              </div>

              <div className="flex items-center gap-3">
                {hasUnsavedRows && (
                  <button
                    onClick={saveAllChanges}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <div className={`w-2 h-2 rounded-full ${saving ? 'bg-emerald-300 animate-pulse' : 'bg-emerald-200'}`}></div>
                    {saving ? 'Salvando...' : `Salvar ${rows.filter(row => row.isNew).length} alterações`}
                  </button>
                )}
                
                <button
                  onClick={fetchSpreadsheetData}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
                  title="Atualizar"
                >
                  <HiArrowPath className="w-4 h-4" />
                </button>
                <button
                  onClick={exportToCSV}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
                  title="Exportar"
                >
                  <HiArrowDownTray className="w-4 h-4" />
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
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="text-sm border-0 bg-transparent focus:outline-none text-gray-700 font-medium cursor-pointer hover:text-gray-900 transition-colors"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const value = date.toISOString().slice(0, 7);
                    const label = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
                    return (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>

                <div className="relative">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar movimentação..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 w-72 transition-all"
                  />
                </div>
              </div>

              <button
                onClick={addNewRow}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm hover:shadow-md"
              >
                <HiPlus className="w-4 h-4" />
                Nova Linha
              </button>
            </div>
          </div>
        </div>

        {/* Resumo com Indicadores Visuais */}
        <div className="bg-white border-b border-gray-100 px-8 py-6">
          <div className="max-w-8xl mx-auto">
            <div className="grid grid-cols-5 gap-8">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">RECEITAS</p>
                  <p className="text-2xl font-light text-gray-900">{formatCurrency(monthlyTotals.totalReceita)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">DESPESAS</p>
                  <p className="text-2xl font-light text-gray-900">{formatCurrency(monthlyTotals.totalDespesa)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">SUBTOTAL</p>
                <p className="text-2xl font-light text-gray-900">{formatCurrency(monthlyTotals.lucroSemDas)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">DAS (6%)</p>
                <p className="text-2xl font-light text-gray-900">{formatCurrency(monthlyTotals.dasTotal)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">RESULTADO</p>
                <p className={`text-2xl font-medium ${monthlyTotals.lucroFinal >= 0 ? 'text-gray-900' : 'text-gray-600'}`}>
                  {formatCurrency(monthlyTotals.lucroFinal)}
                </p>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                  <div 
                    className="h-1.5 bg-gray-900 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(monthlyTotals.limiteMeiUtilizado, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">{monthlyTotals.limiteMeiUtilizado.toFixed(1)}% do limite MEI</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela Expandida com Informações Detalhadas */}
        <div className="flex-1 px-8 py-6">
          <div className="max-w-none mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 350px)', minHeight: '500px' }}>
                <table className={`w-full ${sidebarCollapsed ? 'min-w-[1800px]' : 'min-w-[1400px]'}`}>
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Data</th>
                      <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Tipo</th>
                      <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Título</th>
                      <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Descrição</th>
                      <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Categoria</th>
                      {sidebarCollapsed && (
                        <>
                          <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Cliente/Fornecedor</th>
                          <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Pagamento</th>
                          <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Status</th>
                          <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Ded.</th>
                        </>
                      )}
                      <th className="text-right py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Valor</th>
                      <th className="text-center py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredRows.map((row) => (
                      <tr key={row.id} className={`border-b border-gray-100 hover:bg-gray-25 transition-all duration-200 ${row.isNew ? 'bg-blue-25 border-blue-100' : ''}`}>
                        <td className="py-3 px-4">
                          <input
                            type="date"
                            value={row.data}
                            onChange={e => updateRow(row.id, 'data', e.target.value)}
                            className="text-sm border-0 bg-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 rounded-md px-2 py-1 text-gray-900 w-full transition-all"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {row.tipo === 'receita' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></div>}
                            {row.tipo === 'despesa' && <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm"></div>}
                            {!row.tipo && <div className="w-2 h-2 rounded-full bg-gray-300"></div>}
                            <select
                              value={row.tipo}
                              onChange={e => updateRow(row.id, 'tipo', e.target.value)}
                              className="text-xs border-0 bg-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 rounded-md px-1 py-1 text-gray-900 flex-1 transition-all cursor-pointer"
                            >
                              <option value="">Tipo</option>
                              <option value="receita">Receita</option>
                              <option value="despesa">Despesa</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={row.titulo}
                            onChange={e => updateRow(row.id, 'titulo', e.target.value)}
                            placeholder="Título principal..."
                            className="text-sm border-0 bg-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 rounded-md px-2 py-1 text-gray-900 placeholder-gray-400 w-full font-medium transition-all"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={row.descricao}
                            onChange={e => updateRow(row.id, 'descricao', e.target.value)}
                            placeholder="Detalhes..."
                            className="text-sm border-0 bg-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 rounded-md px-2 py-1 text-gray-900 placeholder-gray-400 w-full transition-all"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={row.categoria}
                            onChange={e => updateRow(row.id, 'categoria', e.target.value)}
                            className="text-sm border-0 bg-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 rounded-md px-2 py-1 text-gray-900 w-full transition-all cursor-pointer"
                          >
                            <option value="">Categoria</option>
                            {row.tipo === 'receita' && CATEGORIAS_RECEITA.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            {row.tipo === 'despesa' && CATEGORIAS_DESPESA.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        
                        {/* Campos extras quando sidebar recolhida */}
                        {sidebarCollapsed && (
                          <>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={row.tipo === 'receita' ? (row.cliente || '') : (row.fornecedor || '')}
                                onChange={e => updateRow(row.id, row.tipo === 'receita' ? 'cliente' : 'fornecedor', e.target.value)}
                                placeholder={row.tipo === 'receita' ? 'Cliente...' : 'Fornecedor...'}
                                className="text-sm border-0 bg-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 rounded-md px-2 py-1 text-gray-900 placeholder-gray-400 w-full transition-all"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={row.metodoPagamento || ''}
                                onChange={e => updateRow(row.id, 'metodoPagamento', e.target.value)}
                                className="text-sm border-0 bg-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 rounded-md px-2 py-1 text-gray-900 w-full transition-all cursor-pointer"
                              >
                                <option value="">Método</option>
                                {METODOS_PAGAMENTO.map(metodo => (
                                  <option key={metodo} value={metodo}>{metodo}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={row.status || ''}
                                onChange={e => updateRow(row.id, 'status', e.target.value)}
                                className="text-sm border-0 bg-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 rounded-md px-2 py-1 text-gray-900 w-full transition-all cursor-pointer"
                              >
                                <option value="">Status</option>
                                {row.tipo === 'receita' && (
                                  <>
                                    <option value="Recebido">Recebido</option>
                                    <option value="Pendente">Pendente</option>
                                    <option value="Cancelado">Cancelado</option>
                                  </>
                                )}
                                {row.tipo === 'despesa' && (
                                  <>
                                    <option value="Pago">Pago</option>
                                    <option value="Pendente">Pendente</option>
                                    <option value="Cancelado">Cancelado</option>
                                  </>
                                )}
                              </select>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {row.tipo === 'despesa' && (
                                <input
                                  type="checkbox"
                                  checked={row.dedutivel || false}
                                  onChange={e => updateRow(row.id, 'dedutivel', e.target.checked)}
                                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-200 w-4 h-4"
                                  title="Dedutível"
                                />
                              )}
                            </td>
                          </>
                        )}
                        
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={row.valor || ''}
                            onChange={e => updateRow(row.id, 'valor', parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            className="text-sm border-0 bg-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 rounded-md px-2 py-1 text-gray-900 placeholder-gray-400 text-right font-mono w-full transition-all"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => deleteRow(row.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all duration-200"
                            title="Excluir linha"
                          >
                            <HiXMark className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Espaçamento entre dados e totais */}
                    <tr>
                      <td colSpan={sidebarCollapsed ? 11 : 7} className="py-6"></td>
                    </tr>

                    {/* Linha DAS */}
                    <tr className="bg-amber-50 border-t-2 border-amber-200">
                      <td className="py-4 px-4 text-sm font-medium text-amber-700">—</td>
                      <td className="py-4 px-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-sm font-medium text-amber-700">DAS</span>
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-amber-700">Imposto MEI</td>
                      <td className="py-4 px-4 text-sm font-medium text-amber-700">6% sobre receitas</td>
                      <td className="py-4 px-4 text-sm font-medium text-amber-700">Impostos Federais</td>
                      {sidebarCollapsed && (
                        <>
                          <td className="py-4 px-4"></td>
                          <td className="py-4 px-4"></td>
                          <td className="py-4 px-4"></td>
                          <td className="py-4 px-4"></td>
                        </>
                      )}
                      <td className="py-4 px-4 text-sm font-mono font-medium text-amber-800 text-right">
                        -{formatCurrency(monthlyTotals.dasTotal)}
                      </td>
                      <td className="py-4 px-4"></td>
                    </tr>

                    {/* Linha Total */}
                    <tr className="bg-gray-900 text-white border-t-4 border-gray-500">
                      <td className="py-6 px-4 text-base font-bold tracking-wide">TOTAL</td>
                      <td className="py-6 px-4 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                        <span className="text-sm font-medium">FINAL</span>
                      </td>
                      <td className="py-6 px-4 text-sm font-medium">Resultado Final</td>
                      <td className="py-6 px-4 text-sm font-medium">Líquido após DAS</td>
                      <td className="py-6 px-4"></td>
                      {sidebarCollapsed && (
                        <>
                          <td className="py-6 px-4"></td>
                          <td className="py-6 px-4"></td>
                          <td className="py-6 px-4"></td>
                          <td className="py-6 px-4"></td>
                        </>
                      )}
                      <td className="py-6 px-4 text-right font-mono font-bold text-lg">
                        {formatCurrency(monthlyTotals.lucroFinal)}
                      </td>
                      <td className="py-6 px-4"></td>
                    </tr>
                  </tbody>
                </table>

                {/* Estado vazio */}
                {filteredRows.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-gray-500 mb-4 text-lg">Nenhuma movimentação encontrada</p>
                    <p className="text-gray-400 mb-6 text-sm">
                      {searchTerm ? 'Tente buscar por outro termo ou limpe o filtro' : 'Comece adicionando sua primeira movimentação financeira'}
                    </p>
                    <button
                      onClick={addNewRow}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                    >
                      <HiPlus className="w-4 h-4" />
                      Adicionar primeira movimentação
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeiSpreadsheetPage() {
  return (
    <MeiProtection>
      <MeiSpreadsheetContent />
    </MeiProtection>
  );
}