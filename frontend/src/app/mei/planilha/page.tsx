'use client';

import { useState, useEffect, useCallback } from 'react';
import MeiProtection from '../../../components/MeiProtection';
import MeiSidebar from '../../../components/MeiSidebar';
import {
  HiXMark,
  HiArrowDownTray,
  HiArrowPath,
  HiMagnifyingGlass,
  HiChartBarSquare,
  HiCheckCircle,
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

const METODOS_PAGAMENTO = ['Dinheiro', 'PIX', 'Cartão Débito', 'Cartão Crédito', 'Transferência', 'Boleto'];

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
    const totalReceita = currentRows.filter(row => row.tipo === 'receita').reduce((sum, row) => sum + row.valor, 0);

    const totalDespesa = currentRows.filter(row => row.tipo === 'despesa').reduce((sum, row) => sum + row.valor, 0);

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

  // Criar linha vazia
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

  // Adicionar linhas vazias automaticamente (mínimo 3, ideal 10)
  const ensureEmptyRows = (currentRows: SpreadsheetRow[], minEmpty = 3, idealEmpty = 10) => {
    const emptyRows = currentRows.filter(row => !row.titulo && !row.tipo && row.valor === 0);

    // Se tem menos que o mínimo, adicionar até o ideal
    if (emptyRows.length < minEmpty) {
      const rowsToAdd = idealEmpty;
      const newRows = Array.from({ length: rowsToAdd }, () => createEmptyRow());
      return [...currentRows, ...newRows];
    }

    // Se tem menos que o ideal mas mais que o mínimo, adicionar algumas
    if (emptyRows.length < idealEmpty) {
      const rowsToAdd = idealEmpty - emptyRows.length;
      const newRows = Array.from({ length: rowsToAdd }, () => createEmptyRow());
      return [...currentRows, ...newRows];
    }

    return currentRows;
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

      // Adicionar linhas vazias (sempre começar com pelo menos 10)
      const rowsWithEmpty = ensureEmptyRows(allRows, 3, 10);

      setRows(rowsWithEmpty);
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

      // Garantir linhas vazias após atualização
      const rowsWithEmpty = ensureEmptyRows(updatedRows, 3, 5);

      // Calcular totais apenas com dados válidos
      const validRows = rowsWithEmpty.filter(row => row.tipo && row.titulo && row.valor > 0);
      setMonthlyTotals(calculateTotals(validRows));

      return rowsWithEmpty;
    });
  };

  const deleteRow = (id: string) => {
    setRows(prevRows => {
      const updatedRows = prevRows.filter(row => row.id !== id);

      // Garantir linhas vazias após deleção
      const rowsWithEmpty = ensureEmptyRows(updatedRows, 3, 5);

      // Calcular totais apenas com dados válidos
      const validRows = rowsWithEmpty.filter(row => row.tipo && row.titulo && row.valor > 0);
      setMonthlyTotals(calculateTotals(validRows));

      return rowsWithEmpty;
    });
  };

  // Salvar todas as alterações no banco
  const saveAllChanges = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');

      const newRows = rows.filter(row => row.isNew && row.tipo && row.titulo && row.valor > 0);

      for (const row of newRows) {
        let response;
        if (row.tipo === 'receita') {
          response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/receitas`, {
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
          response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/despesas`, {
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

        if (response && !response.ok) {
          const errorText = await response.text();
          console.error(`Erro ao salvar ${row.tipo}:`, response.status, errorText);
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
    const validRows = rows.filter(row => row.tipo && row.titulo);

    const headers = [
      'Data',
      'Tipo',
      'Título',
      'Descrição',
      'Categoria',
      'Cliente',
      'Fornecedor',
      'Nº Nota',
      'Método Pagamento',
      'Status',
      'Valor',
      'Dedutível',
      'Observações',
    ];
    const csvData = validRows.map(row => [
      formatDate(row.data),
      row.tipo === 'receita' ? 'Receita' : 'Despesa',
      row.titulo,
      row.descricao,
      row.categoria,
      row.cliente || '',
      row.fornecedor || '',
      row.tipo === 'receita' ? row.numeroNota || '' : row.numeroNotaFiscal || '',
      row.metodoPagamento,
      row.status,
      row.valor.toFixed(2),
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

  // Filtrar linhas pela busca (excluir linhas completamente vazias)
  const filteredRows = rows.filter(row => {
    // Se a busca estiver vazia, mostrar todas as linhas
    if (!searchTerm) return true;

    // Se for uma linha vazia, não mostrar na busca
    if (!row.titulo && !row.tipo && row.valor === 0) return false;

    // Aplicar filtro de busca
    return (
      row.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(row.data).includes(searchTerm) ||
      row.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.observacoes?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const hasUnsavedRows = rows.some(row => row.isNew && row.tipo && row.titulo && row.valor > 0);

  // Calcular estatísticas adicionais
  const validRows = rows.filter(row => row.tipo && row.titulo && row.valor > 0);
  const totalMovimentacoes = validRows.length;
  const margemLucro =
    monthlyTotals.totalReceita > 0 ? (monthlyTotals.lucroFinal / monthlyTotals.totalReceita) * 100 : 0;

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
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="max-w-8xl mx-auto">
            {/* Título e Ações */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <HiChartBarSquare className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Planilha Financeira</h1>
                  <p className="text-sm text-gray-600">Controle de receitas e despesas MEI</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {hasUnsavedRows && (
                  <button
                    onClick={saveAllChanges}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                    title={
                      saving
                        ? 'Salvando alterações...'
                        : `Salvar ${
                            rows.filter(row => row.isNew && row.tipo && row.titulo && row.valor > 0).length
                          } alterações`
                    }
                  >
                    <HiCheckCircle className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                )}

                <button
                  onClick={fetchSpreadsheetData}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Atualizar dados"
                >
                  <HiArrowPath className="w-5 h-5" />
                </button>
                <button
                  onClick={exportToCSV}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Exportar CSV"
                >
                  <HiArrowDownTray className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Controles e Métricas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Período:</label>
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="text-sm border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 cursor-pointer rounded-lg px-3 py-2"
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
                    className="pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 w-64 transition-all"
                  />
                </div>

                {/* Métricas Compactas */}
                <div className="flex items-center gap-6 ml-6 pl-6 border-l border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-sm text-gray-600">Receitas:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(monthlyTotals.totalReceita)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-600">Despesas:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(monthlyTotals.totalDespesa)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                    <span className="text-sm text-gray-600">Movimentações:</span>
                    <span className="text-sm font-semibold text-gray-900">{totalMovimentacoes}</span>

                    {/* Indicador DAS */}
                    <div className="relative group">
                      <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-full cursor-help">
                        <div className="w-1 h-1 rounded-full bg-white"></div>
                        <span>-{formatCurrency(monthlyTotals.dasTotal)}</span>
                      </div>

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-30">
                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                          <div className="font-semibold mb-1">DAS - Documento de Arrecadação</div>
                          <div className="text-gray-300">Imposto mensal MEI (6% das receitas)</div>
                          <div className="text-gray-300">
                            Mínimo: R$ 66,60 | Atual: {formatCurrency(monthlyTotals.dasTotal)}
                          </div>
                          {/* Seta do tooltip */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-500">Novas linhas são adicionadas automaticamente</div>
            </div>
          </div>
        </div>

        {/* Tabela Principal */}
        <div className="flex-1 px-6 py-6" style={{ paddingBottom: '100px' }}>
          <div className="max-w-none mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '500px' }}>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">
                        Data
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                        Tipo
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">
                        Título
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                        Descrição
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                        Categoria
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                        Cliente
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                        Fornecedor
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">
                        Nº Nota
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">
                        Pagamento
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">
                        Valor
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                        Ded.
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-36">
                        Observações
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredRows.map(row => (
                      <tr
                        key={row.id}
                        className={`hover:bg-gray-50 transition-colors duration-150 ${
                          row.isNew && row.titulo ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        {/* Data */}
                        <td className="py-3 px-4">
                          <input
                            type="date"
                            value={row.data}
                            onChange={e => updateRow(row.id, 'data', e.target.value)}
                            className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 w-full"
                          />
                        </td>

                        {/* Tipo */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {row.tipo === 'receita' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                            {row.tipo === 'despesa' && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                            {!row.tipo && <div className="w-2 h-2 rounded-full bg-gray-300"></div>}
                            <select
                              value={row.tipo}
                              onChange={e => updateRow(row.id, 'tipo', e.target.value)}
                              className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-2 py-2 text-gray-900 flex-1 cursor-pointer"
                            >
                              <option value="">Tipo</option>
                              <option value="receita">Receita</option>
                              <option value="despesa">Despesa</option>
                            </select>
                          </div>
                        </td>

                        {/* Título */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={row.titulo}
                            onChange={e => updateRow(row.id, 'titulo', e.target.value)}
                            placeholder="Título da movimentação..."
                            className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 w-full font-medium"
                          />
                        </td>

                        {/* Descrição */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={row.descricao}
                            onChange={e => updateRow(row.id, 'descricao', e.target.value)}
                            placeholder="Detalhes..."
                            className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 w-full"
                          />
                        </td>

                        {/* Categoria */}
                        <td className="py-3 px-4">
                          <select
                            value={row.categoria}
                            onChange={e => updateRow(row.id, 'categoria', e.target.value)}
                            className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 w-full cursor-pointer"
                          >
                            <option value="">Categoria</option>
                            {row.tipo === 'receita' &&
                              CATEGORIAS_RECEITA.map(cat => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            {row.tipo === 'despesa' &&
                              CATEGORIAS_DESPESA.map(cat => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                          </select>
                        </td>

                        {/* Cliente */}
                        <td className="py-3 px-4">
                          {row.tipo === 'receita' ? (
                            <input
                              type="text"
                              value={row.cliente || ''}
                              onChange={e => updateRow(row.id, 'cliente', e.target.value)}
                              placeholder="Nome do cliente..."
                              className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 w-full"
                            />
                          ) : (
                            <div className="text-sm text-gray-400 px-3 py-2 text-center">—</div>
                          )}
                        </td>

                        {/* Fornecedor */}
                        <td className="py-3 px-4">
                          {row.tipo === 'despesa' ? (
                            <input
                              type="text"
                              value={row.fornecedor || ''}
                              onChange={e => updateRow(row.id, 'fornecedor', e.target.value)}
                              placeholder="Nome do fornecedor..."
                              className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 w-full"
                            />
                          ) : (
                            <div className="text-sm text-gray-400 px-3 py-2 text-center">—</div>
                          )}
                        </td>

                        {/* Número da Nota */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={row.tipo === 'receita' ? row.numeroNota || '' : row.numeroNotaFiscal || ''}
                            onChange={e =>
                              updateRow(
                                row.id,
                                row.tipo === 'receita' ? 'numeroNota' : 'numeroNotaFiscal',
                                e.target.value
                              )
                            }
                            placeholder="Nº nota..."
                            className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 w-full"
                          />
                        </td>

                        {/* Método de Pagamento */}
                        <td className="py-3 px-4">
                          <select
                            value={row.metodoPagamento || ''}
                            onChange={e => updateRow(row.id, 'metodoPagamento', e.target.value)}
                            className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 w-full cursor-pointer"
                          >
                            <option value="">Método</option>
                            {METODOS_PAGAMENTO.map(metodo => (
                              <option key={metodo} value={metodo}>
                                {metodo}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <select
                            value={row.status || ''}
                            onChange={e => updateRow(row.id, 'status', e.target.value)}
                            className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 w-full cursor-pointer"
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
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={row.valor || ''}
                            onChange={e => updateRow(row.id, 'valor', parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 text-right font-mono w-full"
                          />
                        </td>

                        {/* Dedutível */}
                        <td className="py-3 px-4 text-center">
                          {row.tipo === 'despesa' ? (
                            <input
                              type="checkbox"
                              checked={row.dedutivel || false}
                              onChange={e => updateRow(row.id, 'dedutivel', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                              title="Dedutível no IR"
                            />
                          ) : (
                            <div className="text-sm text-gray-400">—</div>
                          )}
                        </td>

                        {/* Observações */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={row.observacoes || ''}
                            onChange={e => updateRow(row.id, 'observacoes', e.target.value)}
                            placeholder="Observações..."
                            className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 w-full"
                          />
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-center">
                          {(row.titulo || row.tipo || row.valor > 0) && (
                            <button
                              onClick={() => deleteRow(row.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all duration-200"
                              title="Excluir movimentação"
                            >
                              <HiXMark className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Estado vazio */}
                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={14} className="text-center py-20">
                          <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-gray-100 rounded-full">
                              <HiChartBarSquare className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-gray-600 mb-2 text-lg font-medium">Nenhuma movimentação encontrada</p>
                              <p className="text-gray-500 mb-6 text-sm">
                                {searchTerm
                                  ? 'Tente buscar por outro termo ou limpe o filtro'
                                  : 'Comece preenchendo uma linha da planilha'}
                              </p>
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

        {/* Footer com Total Líquido */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
          <div className="mx-auto px-6 py-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-900"></div>
                  <span className="text-lg font-semibold text-gray-900">Resultado Líquido:</span>
                </div>
                <div
                  className={`px-6 py-3 rounded-lg border-2 ${
                    monthlyTotals.lucroFinal >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <span
                    className={`text-2xl font-bold ${
                      monthlyTotals.lucroFinal >= 0 ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {formatCurrency(monthlyTotals.lucroFinal)}
                  </span>
                  <span className="text-sm text-gray-600 ml-2">(margem: {margemLucro.toFixed(1)}%)</span>
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
