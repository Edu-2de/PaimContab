'use client';

import { useState, useEffect, useCallback } from 'react';
import MeiProtection from '../../../components/MeiProtection';
import MeiSidebar from '../../../components/MeiSidebar';
import { 
  HiPlus, 
  HiTrash, 
  HiArrowDownTray, 
  HiArrowPath,
  HiMagnifyingGlass,
  HiTableCells,
  HiCalendar,
  HiInformationCircle,
  HiCheck,
  HiArrowTrendingUp,
  HiArrowTrendingDown
} from 'react-icons/hi2';

interface SpreadsheetRow {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  tipo: 'receita' | 'despesa';
  valor: number;
  isEditing?: boolean;
  isSaved?: boolean;
  isNew?: boolean;
}

interface MonthlyTotals {
  totalReceita: number;
  totalDespesa: number;
  totalLucro: number;
  dasTotal: number;
  lucroLiquidoComDas: number;
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
    totalLucro: 0,
    dasTotal: 0,
    lucroLiquidoComDas: 0,
    limiteMeiUtilizado: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

      // Combinar e organizar dados por dia
      const dailyData: { [key: string]: SpreadsheetRow } = {};

      // Processar receitas
      filteredReceitas.forEach((receita: Receita) => {
        const date = new Date(receita.dataRecebimento || receita.createdAt).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = createEmptyRow(date);
        }
        dailyData[date].receita += receita.valor || 0;
        if (!dailyData[date].descricao) {
          dailyData[date].descricao = receita.descricao || 'Receita';
        }
        dailyData[date].categoria = receita.categoria || 'Vendas de Produtos';
      });

      // Processar despesas
      filteredDespesas.forEach((despesa: Despesa) => {
        const date = new Date(despesa.dataPagamento || despesa.createdAt).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = createEmptyRow(date);
        }
        dailyData[date].despesa += despesa.valor || 0;
        if (!dailyData[date].descricao) {
          dailyData[date].descricao = despesa.descricao || 'Despesa';
        }
        dailyData[date].categoria = despesa.categoria || 'Outros';
      });

      // Converter para array e ordenar por data
      const sortedRows = Object.values(dailyData).sort(
        (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
      );

      // Calcular valores
      const calculatedRows = sortedRows.map(row => {
        row.lucro = row.receita - row.despesa;
        return row;
      });

      setRows(calculatedRows);

      // Calcular totais mensais
      const totalReceita = calculatedRows.reduce((sum, row) => sum + row.receita, 0);
      const totalDespesa = calculatedRows.reduce((sum, row) => sum + row.despesa, 0);
      const totalLucro = totalReceita - totalDespesa;
      
      // Calcular DAS (6% da receita, mínimo R$ 66,60)
      const dasTotal = Math.max(totalReceita * 0.06, 66.6);
      
      // Lucro líquido já descontando o DAS
      const lucroLiquidoComDas = totalLucro - dasTotal;

      // Calcular receita anual estimada para verificar limite MEI
      const receitaAnualEstimada = totalReceita * 12;

      const totals: MonthlyTotals = {
        totalReceita,
        totalDespesa,
        totalLucro,
        dasTotal,
        lucroLiquidoComDas,
        limiteMeiUtilizado: (receitaAnualEstimada / 81000) * 100,
      };
      setMonthlyTotals(totals);
    } catch (error) {
      console.error('Erro ao carregar dados da planilha:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchSpreadsheetData();
  }, [fetchSpreadsheetData]);

  const createEmptyRow = (date: string): SpreadsheetRow => ({
    id: `${date}-${Math.random().toString(36).substr(2, 9)}`,
    data: date,
    descricao: '',
    categoria: '',
    receita: 0,
    despesa: 0,
    lucro: 0,
  });

  const addNewRow = () => {
    const today = new Date().toISOString().split('T')[0];
    const newRow = createEmptyRow(today);
    newRow.isEditing = true;
    setRows([...rows, newRow]);
  };

  const updateRow = (id: string, field: keyof SpreadsheetRow, value: string | number) => {
    setRows(prevRows => {
      const updatedRows = prevRows.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };

          // Recalcular automaticamente
          if (field === 'receita' || field === 'despesa') {
            updatedRow.lucro = updatedRow.receita - updatedRow.despesa;
          }

          return updatedRow;
        }
        return row;
      });

      // Atualizar totais
      const totalReceita = updatedRows.reduce((sum, row) => sum + row.receita, 0);
      const totalDespesa = updatedRows.reduce((sum, row) => sum + row.despesa, 0);
      const totalLucro = totalReceita - totalDespesa;
      const dasTotal = Math.max(totalReceita * 0.06, 66.6);
      const lucroLiquidoComDas = totalLucro - dasTotal;
      const receitaAnualEstimada = totalReceita * 12;

      setMonthlyTotals({
        totalReceita,
        totalDespesa,
        totalLucro,
        dasTotal,
        lucroLiquidoComDas,
        limiteMeiUtilizado: (receitaAnualEstimada / 81000) * 100,
      });

      return updatedRows;
    });
  };

  const deleteRow = (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta linha?')) return;
    setRows(rows.filter(row => row.id !== id));
  };

  const exportToCSV = () => {
    const headers = [
      'Data',
      'Descrição',
      'Categoria',
      'Receita',
      'Despesa',
      'Lucro Bruto',
      'DAS',
      'Lucro Líquido',
    ];
    
    const csvData = rows.map(row => [
      formatDate(row.data),
      row.descricao,
      row.categoria,
      row.receita.toFixed(2),
      row.despesa.toFixed(2),
      row.lucro.toFixed(2),
      // DAS proporcional por linha (se houver receita)
      row.receita > 0 ? (Math.max(row.receita * 0.06, 0)).toFixed(2) : '0.00',
      // Lucro líquido por linha
      row.receita > 0 ? (row.lucro - Math.max(row.receita * 0.06, 0)).toFixed(2) : row.lucro.toFixed(2),
    ]);

    // Adicionar linha de totais
    csvData.push([
      'TOTAL',
      '',
      '',
      monthlyTotals.totalReceita.toFixed(2),
      monthlyTotals.totalDespesa.toFixed(2),
      monthlyTotals.totalLucro.toFixed(2),
      monthlyTotals.dasTotal.toFixed(2),
      monthlyTotals.lucroLiquidoComDas.toFixed(2),
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
    row.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatDate(row.data).includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MeiSidebar currentPage="planilha" />
        <div className="mei-content-wrapper">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MeiSidebar currentPage="planilha" />

      <div className="mei-content-wrapper">
        {/* Header Simples */}
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HiTableCells className="w-7 h-7 text-gray-700" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Planilha MEI</h1>
                <p className="text-sm text-gray-600 mt-1">Gerencie suas receitas e despesas com DAS automatizado</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchSpreadsheetData}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Atualizar dados"
              >
                <HiArrowPath className="w-4 h-4" />
                Atualizar
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
                title="Exportar planilha com DAS incluído"
              >
                <HiArrowDownTray className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Filtros e Controles */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <HiCalendar className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
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

              <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 bg-white">
                <HiMagnifyingGlass className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar movimentação..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="text-sm bg-transparent border-0 focus:outline-none w-48 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            <button
              onClick={addNewRow}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <HiPlus className="w-4 h-4" />
              Nova Linha
            </button>
          </div>
        </div>

        {/* Resumo Mensal Atualizado */}
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Receitas</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(monthlyTotals.totalReceita)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Despesas</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(monthlyTotals.totalDespesa)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Lucro Bruto</p>
              <p className={`text-xl font-semibold ${
                monthlyTotals.totalLucro >= 0 ? 'text-gray-900' : 'text-red-600'
              }`}>
                {formatCurrency(Math.abs(monthlyTotals.totalLucro))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">DAS</p>
              <p className="text-xl font-semibold text-orange-600">{formatCurrency(monthlyTotals.dasTotal)}</p>
              <p className="text-xs text-gray-500">6% da receita</p>
            </div>
            <div className="text-center relative group">
              <div className="flex items-center justify-center gap-1 mb-1">
                <p className="text-sm text-gray-600">Lucro Líquido</p>
                <HiInformationCircle 
                  className="w-3 h-3 text-gray-400 cursor-help" 
                  title="Lucro já descontado o DAS automaticamente"
                />
              </div>
              <p className={`text-xl font-semibold ${
                monthlyTotals.lucroLiquidoComDas >= 0 ? 'text-green-700' : 'text-red-600'
              }`}>
                {formatCurrency(Math.abs(monthlyTotals.lucroLiquidoComDas))}
                <span className="text-xs ml-1">*</span>
              </p>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Valor já com DAS descontado automaticamente
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Limite Anual</p>
              <p className="text-xl font-semibold text-gray-900">{monthlyTotals.limiteMeiUtilizado.toFixed(1)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    monthlyTotals.limiteMeiUtilizado > 80 ? 'bg-red-500' : 
                    monthlyTotals.limiteMeiUtilizado > 60 ? 'bg-yellow-500' : 'bg-gray-600'
                  }`}
                  style={{ width: `${Math.min(monthlyTotals.limiteMeiUtilizado, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Planilha */}
        <div className="flex-1 bg-white m-6 rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-320px)]">
            {/* Headers */}
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="w-14 h-11 bg-gray-100 border-r border-gray-200 text-xs font-medium text-gray-700 text-center">#</th>
                    <th className="w-32 h-11 border-r border-gray-200 text-xs font-medium text-gray-700 text-left px-4">Data</th>
                    <th className="w-80 h-11 border-r border-gray-200 text-xs font-medium text-gray-700 text-left px-4">Descrição</th>
                    <th className="w-48 h-11 border-r border-gray-200 text-xs font-medium text-gray-700 text-left px-4">Categoria</th>
                    <th className="w-32 h-11 border-r border-gray-200 text-xs font-medium text-gray-700 text-right px-4">Receita</th>
                    <th className="w-32 h-11 border-r border-gray-200 text-xs font-medium text-gray-700 text-right px-4">Despesa</th>
                    <th className="w-32 h-11 border-r border-gray-200 text-xs font-medium text-gray-700 text-right px-4 relative group">
                      <div className="flex items-center justify-end gap-1">
                        <span>Lucro Bruto</span>
                        <HiInformationCircle className="w-3 h-3 text-gray-400" />
                      </div>
                      {/* Tooltip no header */}
                      <div className="absolute bottom-full right-4 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Antes do desconto do DAS
                      </div>
                    </th>
                    <th className="w-16 h-11 text-xs font-medium text-gray-700 text-center"></th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Dados */}
            <table className="w-full">
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-25 border-b border-gray-100">
                    {/* Número */}
                    <td className="w-14 h-12 bg-gray-50 border-r border-gray-200 text-center text-xs text-gray-600">
                      {index + 1}
                    </td>

                    {/* Data */}
                    <td className="w-32 h-12 border-r border-gray-200 p-0">
                      <input
                        type="date"
                        value={row.data}
                        onChange={e => updateRow(row.id, 'data', e.target.value)}
                        className="w-full h-full px-3 text-sm border-0 focus:outline-none focus:bg-blue-50 text-gray-900"
                      />
                    </td>

                    {/* Descrição */}
                    <td className="w-80 h-12 border-r border-gray-200 p-0">
                      <input
                        type="text"
                        value={row.descricao}
                        onChange={e => updateRow(row.id, 'descricao', e.target.value)}
                        placeholder="Digite a descrição..."
                        className="w-full h-full px-3 text-sm border-0 focus:outline-none focus:bg-blue-50 text-gray-900 placeholder-gray-400"
                      />
                    </td>

                    {/* Categoria */}
                    <td className="w-48 h-12 border-r border-gray-200 p-0">
                      <select
                        value={row.categoria}
                        onChange={e => updateRow(row.id, 'categoria', e.target.value)}
                        className="w-full h-full px-3 text-sm border-0 focus:outline-none focus:bg-blue-50 text-gray-900"
                      >
                        <option value="">Selecione...</option>
                        <optgroup label="Receitas">
                          {CATEGORIAS_RECEITA.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Despesas">
                          {CATEGORIAS_DESPESA.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </optgroup>
                      </select>
                    </td>

                    {/* Receita */}
                    <td className="w-32 h-12 border-r border-gray-200 p-0">
                      <input
                        type="number"
                        value={row.receita || ''}
                        onChange={e => updateRow(row.id, 'receita', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        className="w-full h-12 px-3 text-sm text-right font-mono border-0 focus:outline-none focus:bg-blue-50 text-gray-900 placeholder-gray-400"
                      />
                    </td>

                    {/* Despesa */}
                    <td className="w-32 h-12 border-r border-gray-200 p-0">
                      <input
                        type="number"
                        value={row.despesa || ''}
                        onChange={e => updateRow(row.id, 'despesa', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        className="w-full h-12 px-3 text-sm text-right font-mono border-0 focus:outline-none focus:bg-blue-50 text-gray-900 placeholder-gray-400"
                      />
                    </td>

                    {/* Lucro Bruto */}
                    <td className="w-32 h-12 border-r border-gray-200 bg-gray-50 px-3">
                      <div className={`h-full flex items-center justify-end text-sm font-mono font-medium ${
                        row.lucro >= 0 ? 'text-gray-900' : 'text-red-600'
                      }`}>
                        {formatCurrency(row.lucro)}
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="w-16 h-12">
                      <div className="h-full flex items-center justify-center">
                        <button
                          onClick={() => deleteRow(row.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Deletar linha"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Linha de DAS Automático */}
                <tr className="bg-orange-50 border-t border-orange-200">
                  <td className="w-14 h-11 bg-orange-100 border-r border-orange-200 text-center text-xs text-orange-700">DAS</td>
                  <td className="w-32 h-11 border-r border-orange-200 px-3 text-xs text-orange-700 font-medium">AUTO</td>
                  <td className="w-80 h-11 border-r border-orange-200 px-3 text-xs text-orange-700">DAS - Documento de Arrecadação do Simples (6% da receita)</td>
                  <td className="w-48 h-11 border-r border-orange-200 px-3 text-xs text-orange-700">Impostos</td>
                  <td className="w-32 h-11 border-r border-orange-200"></td>
                  <td className="w-32 h-11 border-r border-orange-200 px-3 text-right text-xs font-mono text-orange-700 font-medium">
                    {formatCurrency(monthlyTotals.dasTotal)}
                  </td>
                  <td className="w-32 h-11 border-r border-orange-200 px-3 text-right text-xs font-mono text-orange-700 font-medium">
                    -{formatCurrency(monthlyTotals.dasTotal)}
                  </td>
                  <td className="w-16 h-11"></td>
                </tr>

                {/* Totais */}
                <tr className="bg-gray-100 border-t border-gray-300 font-medium">
                  <td className="w-14 h-11 bg-gray-200 border-r border-gray-300 text-center text-xs text-gray-700">∑</td>
                  <td className="w-32 h-11 border-r border-gray-300 px-3 text-xs text-gray-700">TOTAL</td>
                  <td className="w-80 h-11 border-r border-gray-300"></td>
                  <td className="w-48 h-11 border-r border-gray-300"></td>
                  <td className="w-32 h-11 border-r border-gray-300 px-3 text-right text-xs font-mono text-gray-900">
                    {formatCurrency(monthlyTotals.totalReceita)}
                  </td>
                  <td className="w-32 h-11 border-r border-gray-300 px-3 text-right text-xs font-mono text-gray-900">
                    {formatCurrency(monthlyTotals.totalDespesa + monthlyTotals.dasTotal)}
                  </td>
                  <td className={`w-32 h-11 border-r border-gray-300 px-3 text-right text-xs font-mono font-semibold relative group ${
                    monthlyTotals.lucroLiquidoComDas >= 0 ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {formatCurrency(monthlyTotals.lucroLiquidoComDas)}
                    <span className="ml-1">*</span>
                    {/* Tooltip na linha de total */}
                    <div className="absolute bottom-full right-3 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Lucro líquido com DAS já descontado
                    </div>
                  </td>
                  <td className="w-16 h-11"></td>
                </tr>
              </tbody>
            </table>

            {/* Estado vazio */}
            {filteredRows.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <HiTableCells className="w-12 h-12 mb-3 text-gray-400" />
                <p className="text-base text-gray-900 mb-1">Nenhuma movimentação encontrada</p>
                <p className="text-sm text-gray-600 mb-4">
                  {searchTerm ? 'Tente buscar por outro termo' : 'Adicione sua primeira movimentação'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={addNewRow}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Adicionar movimentação
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com legenda */}
        <div className="bg-gray-100 border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span>{filteredRows.length} movimentações</span>
              <span className="flex items-center gap-1">
                <span>*</span>
                <span>Valor já com DAS descontado automaticamente</span>
              </span>
            </div>
            <span>Planilha MEI - Automatizada</span>
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