'use client';

import { useState, useEffect, useCallback } from 'react';
import MeiProtection from '../../../components/MeiProtection';
import MeiSidebar from '../../../components/MeiSidebar';
import { 
  HiPlus, 
  HiXMark, 
  HiArrowDownTray, 
  HiArrowPath,
  HiMagnifyingGlass,
  HiChartBarSquare,
  HiCalculator
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
  // Campos para receitas
  cliente?: string;
  numeroNota?: string;
  // Campos para despesas
  fornecedor?: string;
  numeroNotaFiscal?: string;
  dedutivel?: boolean;
  // Campos comuns
  metodoPagamento?: string;
  status?: string;
  observacoes?: string;
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
  'Royalties',
  'Licenciamento',
  'Outros',
];

const CATEGORIAS_DESPESA = [
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

const METODOS_PAGAMENTO = [
  'Dinheiro',
  'PIX',
  'Cartão Débito',
  'Cartão Crédito',
  'Transferência',
  'Boleto',
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
        numeroNota: '',
        metodoPagamento: 'PIX',
        status: 'Recebido',
        observacoes: '',
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
        numeroNotaFiscal: '',
        dedutivel: true,
        metodoPagamento: 'PIX',
        status: 'Pago',
        observacoes: '',
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
    numeroNota: '',
    numeroNotaFiscal: '',
    metodoPagamento: 'PIX',
    status: '',
    dedutivel: true,
    observacoes: '',
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
              if (!updatedRow.status) updatedRow.status = 'Recebido';
            } else if (updatedRow.tipo === 'despesa') {
              updatedRow.lucro = -updatedRow.valor;
              if (!updatedRow.status) updatedRow.status = 'Pago';
            } else {
              updatedRow.lucro = 0;
            }
          }

          return updatedRow;
        }
        return row;
      });

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

      await fetchSpreadsheetData();
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    } finally {
      setSaving(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Data', 'Tipo', 'Título', 'Descrição', 'Categoria', 'Cliente', 'Fornecedor',
      'Nº Nota', 'Método Pagamento', 'Status', 'Valor', 'Dedutível', 'Observações',
    ];
    const csvData = rows.map(row => [
      formatDate(row.data),
      row.tipo === 'receita' ? 'Receita' : 'Despesa',
      row.titulo, row.descricao, row.categoria,
      row.cliente || '', row.fornecedor || '',
      row.tipo === 'receita' ? (row.numeroNota || '') : (row.numeroNotaFiscal || ''),
      row.metodoPagamento, row.status, row.valor.toFixed(2),
      row.tipo === 'despesa' ? (row.dedutivel ? 'Sim' : 'Não') : 'N/A',
      row.observacoes || '',
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
    row.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.observacoes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasUnsavedRows = rows.some(row => row.isNew);

  // Calcular estatísticas adicionais
  const totalMovimentacoes = filteredRows.length;
  const receitasCount = filteredRows.filter(row => row.tipo === 'receita').length;
  const despesasCount = filteredRows.filter(row => row.tipo === 'despesa').length;
  const margemLucro = monthlyTotals.totalReceita > 0 ? (monthlyTotals.lucroFinal / monthlyTotals.totalReceita) * 100 : 0;

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
        {/* Header Principal */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-8xl mx-auto">
            {/* Título e Ações */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <HiChartBarSquare className="w-6 h-6 text-gray-600" />
                <div>
                  <h1 className="text-2xl font-light text-gray-900">Planilha Financeira MEI</h1>
                  <p className="text-sm text-gray-500">Controle completo de receitas e despesas</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {hasUnsavedRows && (
                  <button
                    onClick={saveAllChanges}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <div className={`w-2 h-2 rounded-full ${saving ? 'bg-emerald-300 animate-pulse' : 'bg-emerald-200'}`}></div>
                    {saving ? 'Salvando...' : `Salvar ${rows.filter(row => row.isNew).length} alterações`}
                  </button>
                )}
                
                <button
                  onClick={fetchSpreadsheetData}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
                  title="Atualizar dados"
                >
                  <HiArrowPath className="w-4 h-4" />
                </button>
                <button
                  onClick={exportToCSV}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
                  title="Exportar CSV"
                >
                  <HiArrowDownTray className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Controles de Filtro */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Período:</label>
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="text-sm border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 cursor-pointer rounded-lg px-3 py-1.5"
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
                </div>

                <div className="relative">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar movimentação..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 w-64 transition-all"
                  />
                </div>
              </div>

              <button
                onClick={addNewRow}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
              >
                <HiPlus className="w-4 h-4" />
                Nova Movimentação
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard de Métricas */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
          <div className="max-w-8xl mx-auto">
            <div className="grid grid-cols-6 gap-6">
              {/* Receitas */}
              <div className="bg-white rounded-lg p-4 border border-emerald-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Receitas</p>
                    <p className="text-lg font-bold text-emerald-800">{formatCurrency(monthlyTotals.totalReceita)}</p>
                    <p className="text-xs text-emerald-600">{receitasCount} movimentações</p>
                  </div>
                </div>
              </div>

              {/* Despesas */}
              <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Despesas</p>
                    <p className="text-lg font-bold text-red-800">{formatCurrency(monthlyTotals.totalDespesa)}</p>
                    <p className="text-xs text-red-600">{despesasCount} movimentações</p>
                  </div>
                </div>
              </div>

              {/* Lucro Bruto */}
              <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Lucro Bruto</p>
                    <p className="text-lg font-bold text-blue-800">{formatCurrency(monthlyTotals.lucroSemDas)}</p>
                    <p className="text-xs text-blue-600">Antes do DAS</p>
                  </div>
                </div>
              </div>

              {/* DAS */}
              <div className="bg-white rounded-lg p-4 border border-amber-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">DAS (6%)</p>
                    <p className="text-lg font-bold text-amber-800">{formatCurrency(monthlyTotals.dasTotal)}</p>
                    <p className="text-xs text-amber-600">Imposto MEI</p>
                  </div>
                </div>
              </div>

              {/* Lucro Líquido */}
              <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Lucro Líquido</p>
                    <p className={`text-lg font-bold ${monthlyTotals.lucroFinal >= 0 ? 'text-purple-800' : 'text-red-800'}`}>
                      {formatCurrency(monthlyTotals.lucroFinal)}
                    </p>
                    <p className={`text-xs ${margemLucro >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                      Margem: {margemLucro.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Limite MEI */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-700"></div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Limite MEI</p>
                    <p className="text-lg font-bold text-gray-800">{monthlyTotals.limiteMeiUtilizado.toFixed(1)}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="h-1.5 bg-gray-700 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(monthlyTotals.limiteMeiUtilizado, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela Principal */}
        <div className="flex-1 px-6 py-4" style={{ paddingBottom: '120px' }}>
          <div className="max-w-none mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '400px' }}>
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">Data</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">Tipo</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-36">Título</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">Descrição</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">Categoria</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">Cliente</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">Fornecedor</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">Nº Nota</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">Pagamento</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">Status</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">Valor</th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">Ded.</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">Observações</th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredRows.map((row) => (
                      <tr key={row.id} className={`hover:bg-gray-50 transition-colors duration-150 ${row.isNew ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''}`}>
                        {/* Data */}
                        <td className="py-2 px-3">
                          <input
                            type="date"
                            value={row.data}
                            onChange={e => updateRow(row.id, 'data', e.target.value)}
                            className="text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded px-2 py-1 text-gray-900 w-full"
                          />
                        </td>

                        {/* Tipo */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            {row.tipo === 'receita' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                            {row.tipo === 'despesa' && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                            {!row.tipo && <div className="w-2 h-2 rounded-full bg-gray-300"></div>}
                            <select
                              value={row.tipo}
                              onChange={e => updateRow(row.id, 'tipo', e.target.value)}
                              className="text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded px-1 py-1 text-gray-900 flex-1 cursor-pointer"
                            >
                              <option value="">Tipo</option>
                              <option value="receita">Receita</option>
                              <option value="despesa">Despesa</option>
                            </select>
                          </div>
                        </td>

                        {/* Título */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.titulo}
                            onChange={e => updateRow(row.id, 'titulo', e.target.value)}
                            placeholder="Título da movimentação..."
                            className="text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded px-2 py-1 text-gray-900 placeholder-gray-400 w-full font-medium"
                          />
                        </td>

                        {/* Descrição */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.descricao}
                            onChange={e => updateRow(row.id, 'descricao', e.target.value)}
                            placeholder="Detalhes..."
                            className="text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded px-2 py-1 text-gray-900 placeholder-gray-400 w-full"
                          />
                        </td>

                        {/* Categoria */}
                        <td className="py-2 px-3">
                          <select
                            value={row.categoria}
                            onChange={e => updateRow(row.id, 'categoria', e.target.value)}
                            className="text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded px-2 py-1 text-gray-900 w-full cursor-pointer"
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

                        {/* Cliente */}
                        <td className="py-2 px-3">
                          {row.tipo === 'receita' ? (
                            <input
                              type="text"
                              value={row.cliente || ''}
                              onChange={e => updateRow(row.id, 'cliente', e.target.value)}
                              placeholder="Nome do cliente..."
                              className="text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded px-2 py-1 text-gray-900 placeholder-gray-400 w-full"
                            />
                          ) : (
                            <div className="text-xs text-gray-400 px-2 py-1 text-center">—</div>
                          )}
                        </td>

                        {/* Fornecedor */}
                        <td className="py-2 px-3">
                          {row.tipo === 'despesa' ? (
                            <input
                              type="text"
                              value={row.fornecedor || ''}
                              onChange={e => updateRow(row.id, 'fornecedor', e.target.value)}
                              placeholder="Nome do fornecedor..."
                              className="text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded px-2 py-1 text-gray-900 placeholder-gray-400 w-full"
                            />
                          ) : (
                            <div className="text-xs text-gray-400 px-2 py-1 text-center">—</div>
                          )}
                        </td>

                        {/* Número da Nota */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.tipo === 'receita' ? (row.numeroNota || '') : (row.numeroNotaFiscal || '')}
                            onChange={e => updateRow(row.id, row.tipo === 'receita' ? 'numeroNota' : 'numeroNotaFiscal', e.target.value)}
                            placeholder="Nº nota..."
                            className="text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded px-2 py-1 text-gray-900 placeholder-gray-400 w-full"
                          />
                        </td>

                        {/* Método de Pagamento */}
                        <td className="py-2 px-3">
                          <select
                            value={row.metodoPagamento || ''}
                            onChange={e => updateRow(row.id, 'metodoPagamento', e.target.value)}
                            className="text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded px-2 py-1 text-gray-900 w-full cursor-pointer"
                          >
                            <option value="">Método</option>
                            {METODOS_PAGAMENTO.map(metodo => (
                              <option key={metodo} value={metodo}>{metodo}</option>
                            ))}
                          </select>
                        </td>

                        {/* Status */}
                        <td className="py-2 px-3">
                          <select
                            value={row.status || ''}
                            onChange={e => updateRow(row.id, 'status', e.target.value)}
                            className="text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded px-2 py-1 text-gray-900 w-full cursor-pointer"
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

                        {/* Valor */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={row.valor || ''}
                            onChange={e => updateRow(row.id, 'valor', parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            className="text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded px-2 py-1 text-gray-900 placeholder-gray-400 text-right font-mono w-full"
                          />
                        </td>

                        {/* Dedutível */}
                        <td className="py-2 px-3 text-center">
                          {row.tipo === 'despesa' ? (
                            <input
                              type="checkbox"
                              checked={row.dedutivel || false}
                              onChange={e => updateRow(row.id, 'dedutivel', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                              title="Dedutível no IR"
                            />
                          ) : (
                            <div className="text-xs text-gray-400">—</div>
                          )}
                        </td>

                        {/* Observações */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.observacoes || ''}
                            onChange={e => updateRow(row.id, 'observacoes', e.target.value)}
                            placeholder="Observações..."
                            className="text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded px-2 py-1 text-gray-900 placeholder-gray-400 w-full"
                          />
                        </td>

                        {/* Ações */}
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => deleteRow(row.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all duration-200"
                            title="Excluir movimentação"
                          >
                            <HiXMark className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Estado vazio */}
                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={14} className="text-center py-16">
                          <div className="flex flex-col items-center gap-4">
                            <HiChartBarSquare className="w-12 h-12 text-gray-300" />
                            <div>
                              <p className="text-gray-500 mb-2 text-lg font-medium">Nenhuma movimentação encontrada</p>
                              <p className="text-gray-400 mb-6 text-sm">
                                {searchTerm ? 'Tente buscar por outro termo ou limpe o filtro' : 'Comece adicionando sua primeira movimentação financeira'}
                              </p>
                              <button
                                onClick={addNewRow}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm text-sm font-medium"
                              >
                                <HiPlus className="w-4 h-4" />
                                Adicionar primeira movimentação
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Melhorado com DAS e Total */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-2xl z-20">
          <div className="mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              {/* DAS */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <HiCalculator className="w-5 h-5 text-amber-600" />
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-sm font-semibold text-amber-700">DAS</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <span>Imposto MEI: 6% sobre receitas</span>
                </div>
                <div className="px-3 py-1 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="text-sm font-bold text-amber-800">-{formatCurrency(monthlyTotals.dasTotal)}</span>
                </div>
              </div>

              {/* Separador */}
              <div className="w-px h-8 bg-gray-300"></div>

              {/* Total */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                  <span className="text-sm font-bold text-gray-900">RESULTADO FINAL</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span>Lucro líquido após impostos</span>
                </div>
                <div className={`px-4 py-2 rounded-lg border-2 ${monthlyTotals.lucroFinal >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <span className={`text-lg font-bold ${monthlyTotals.lucroFinal >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {formatCurrency(monthlyTotals.lucroFinal)}
                  </span>
                </div>
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