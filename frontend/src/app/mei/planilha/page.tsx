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
  HiCheckCircle
} from 'react-icons/hi2';

interface SpreadsheetRow {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  tipo: 'receita' | 'despesa' | '';
  valor: number;
  lucro: number;
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
        descricao: receita.descricao || 'Receita',
        categoria: receita.categoria || 'Vendas de Produtos',
        tipo: 'receita' as const,
        valor: receita.valor || 0,
        lucro: receita.valor || 0,
      }));

      // Converter despesas para formato da planilha
      const despesasRows: SpreadsheetRow[] = filteredDespesas.map((despesa: Despesa) => ({
        id: `despesa-${despesa.id}`,
        data: new Date(despesa.dataPagamento || despesa.createdAt).toISOString().split('T')[0],
        descricao: despesa.descricao || 'Despesa',
        categoria: despesa.categoria || 'Outros',
        tipo: 'despesa' as const,
        valor: despesa.valor || 0,
        lucro: -(despesa.valor || 0),
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
    descricao: '',
    categoria: '',
    tipo: '',
    valor: 0,
    lucro: 0,
    isEditing: true,
    isNew: true,
  });

  const addNewRow = () => {
    const newRow = createEmptyRow();
    setRows([...rows, newRow]);
  };

  const updateRow = (id: string, field: keyof SpreadsheetRow, value: string | number) => {
    setRows(prevRows => {
      const updatedRows = prevRows.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };

          // Recalcular lucro baseado no tipo e valor
          if (field === 'valor' || field === 'tipo') {
            if (updatedRow.tipo === 'receita') {
              updatedRow.lucro = updatedRow.valor;
            } else if (updatedRow.tipo === 'despesa') {
              updatedRow.lucro = -updatedRow.valor;
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
    if (!confirm('Tem certeza que deseja deletar esta linha?')) return;
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
      const newRows = rows.filter(row => row.isNew && row.tipo && row.descricao && row.valor > 0);

      for (const row of newRows) {
        if (row.tipo === 'receita') {
          await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/receitas`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              descricao: row.descricao,
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
              descricao: row.descricao,
              valor: row.valor,
              dataPagamento: row.data,
              categoria: row.categoria,
            }),
          });
        }
      }

      // Recarregar dados
      await fetchSpreadsheetData();
      alert('Dados salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      alert('Erro ao salvar dados. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Data',
      'Tipo',
      'Descrição',
      'Categoria',
      'Valor',
      'Lucro/Prejuízo',
    ];
    const csvData = rows.map(row => [
      formatDate(row.data),
      row.tipo === 'receita' ? 'Receita' : 'Despesa',
      row.descricao,
      row.categoria,
      row.valor.toFixed(2),
      row.lucro.toFixed(2),
    ]);

    // Adicionar linha de totais
    csvData.push([
      'TOTAIS',
      '',
      '',
      '',
      '',
      monthlyTotals.lucroFinal.toFixed(2),
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
    formatDate(row.data).includes(searchTerm) ||
    row.tipo.toLowerCase().includes(searchTerm.toLowerCase())
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
                <p className="text-sm text-gray-600 mt-1">Centro de controle financeiro completo</p>
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
                title="Exportar planilha"
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

            <div className="flex items-center gap-3">
              <button
                onClick={addNewRow}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <HiPlus className="w-4 h-4" />
                Nova Linha
              </button>
              
              <button
                onClick={saveAllChanges}
                disabled={saving || !rows.some(row => row.isNew)}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                  saving || !rows.some(row => row.isNew)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <HiCheckCircle className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar Tudo'}
              </button>
            </div>
          </div>
        </div>

        {/* Resumo Mensal */}
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Receitas</p>
              <p className="text-xl font-semibold text-green-700">{formatCurrency(monthlyTotals.totalReceita)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Despesas</p>
              <p className="text-xl font-semibold text-red-600">{formatCurrency(monthlyTotals.totalDespesa)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Lucro s/ DAS</p>
              <p className={`text-xl font-semibold ${
                monthlyTotals.lucroSemDas >= 0 ? 'text-gray-900' : 'text-red-600'
              }`}>
                {formatCurrency(Math.abs(monthlyTotals.lucroSemDas))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">DAS</p>
              <p className="text-xl font-semibold text-orange-600">{formatCurrency(monthlyTotals.dasTotal)}</p>
              <p className="text-xs text-gray-500">6% da receita</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Lucro Final</p>
              <p className={`text-xl font-semibold ${
                monthlyTotals.lucroFinal >= 0 ? 'text-green-700' : 'text-red-600'
              }`}>
                {formatCurrency(Math.abs(monthlyTotals.lucroFinal))}
              </p>
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
          <div className="overflow-auto max-h-[calc(100vh-380px)]">
            {/* Headers */}
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="w-14 h-11 bg-gray-100 border-r border-gray-200 text-xs font-medium text-gray-700 text-center">#</th>
                    <th className="w-32 h-11 border-r border-gray-200 text-xs font-medium text-gray-700 text-left px-4">Data</th>
                    <th className="w-32 h-11 border-r border-gray-200 text-xs font-medium text-gray-700 text-left px-4">Tipo</th>
                    <th className="w-64 h-11 border-r border-gray-200 text-xs font-medium text-gray-700 text-left px-4">Descrição</th>
                    <th className="w-48 h-11 border-r border-gray-200 text-xs font-medium text-gray-700 text-left px-4">Categoria</th>
                    <th className="w-32 h-11 border-r border-gray-200 text-xs font-medium text-gray-700 text-right px-4">Valor</th>
                    <th className="w-32 h-11 border-r border-gray-200 text-xs font-medium text-gray-700 text-right px-4">Resultado</th>
                    <th className="w-16 h-11 text-xs font-medium text-gray-700 text-center"></th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Dados */}
            <table className="w-full">
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr key={row.id} className={`hover:bg-gray-25 border-b border-gray-100 ${
                    row.isNew ? 'bg-blue-50' : ''
                  }`}>
                    {/* Número */}
                    <td className="w-14 h-12 bg-gray-50 border-r border-gray-200 text-center text-xs text-gray-600">
                      {row.isNew ? 'N' : index + 1}
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

                    {/* Tipo */}
                    <td className="w-32 h-12 border-r border-gray-200 p-0">
                      <select
                        value={row.tipo}
                        onChange={e => updateRow(row.id, 'tipo', e.target.value)}
                        className="w-full h-full px-3 text-sm border-0 focus:outline-none focus:bg-blue-50 text-gray-900"
                      >
                        <option value="">Selecione...</option>
                        <option value="receita">Receita</option>
                        <option value="despesa">Despesa</option>
                      </select>
                    </td>

                    {/* Descrição */}
                    <td className="w-64 h-12 border-r border-gray-200 p-0">
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
                        {row.tipo === 'receita' && (
                          <optgroup label="Categorias de Receita">
                            {CATEGORIAS_RECEITA.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </optgroup>
                        )}
                        {row.tipo === 'despesa' && (
                          <optgroup label="Categorias de Despesa">
                            {CATEGORIAS_DESPESA.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </td>

                    {/* Valor */}
                    <td className="w-32 h-12 border-r border-gray-200 p-0">
                      <input
                        type="number"
                        value={row.valor || ''}
                        onChange={e => updateRow(row.id, 'valor', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        className="w-full h-12 px-3 text-sm text-right font-mono border-0 focus:outline-none focus:bg-blue-50 text-gray-900 placeholder-gray-400"
                      />
                    </td>

                    {/* Resultado */}
                    <td className="w-32 h-12 border-r border-gray-200 bg-gray-50 px-3">
                      <div className={`h-full flex items-center justify-end text-sm font-mono font-medium ${
                        row.lucro >= 0 ? 'text-green-700' : 'text-red-600'
                      }`}>
                        {row.tipo === 'receita' && '+'}
                        {row.tipo === 'despesa' && '-'}
                        {formatCurrency(Math.abs(row.lucro))}
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

                {/* Linha DAS Automático */}
                <tr className="bg-orange-50 border-t border-orange-200">
                  <td className="w-14 h-11 bg-orange-100 border-r border-orange-200 text-center text-xs text-orange-700">DAS</td>
                  <td className="w-32 h-11 border-r border-orange-200 px-3 text-xs text-orange-700 font-medium">AUTO</td>
                  <td className="w-32 h-11 border-r border-orange-200 px-3 text-xs text-orange-700 font-medium">Imposto</td>
                  <td className="w-64 h-11 border-r border-orange-200 px-3 text-xs text-orange-700">DAS - 6% sobre receitas</td>
                  <td className="w-48 h-11 border-r border-orange-200 px-3 text-xs text-orange-700">Impostos</td>
                  <td className="w-32 h-11 border-r border-orange-200 px-3 text-right text-xs font-mono text-orange-700 font-medium">
                    {formatCurrency(monthlyTotals.dasTotal)}
                  </td>
                  <td className="w-32 h-11 border-r border-orange-200 px-3 text-right text-xs font-mono text-orange-700 font-medium">
                    -{formatCurrency(monthlyTotals.dasTotal)}
                  </td>
                  <td className="w-16 h-11"></td>
                </tr>

                {/* Totais */}
                <tr className="bg-gray-100 border-t-2 border-gray-300 font-medium">
                  <td className="w-14 h-11 bg-gray-200 border-r border-gray-300 text-center text-xs text-gray-700">∑</td>
                  <td className="w-32 h-11 border-r border-gray-300 px-3 text-xs text-gray-700 font-semibold">TOTAL</td>
                  <td className="w-32 h-11 border-r border-gray-300"></td>
                  <td className="w-64 h-11 border-r border-gray-300"></td>
                  <td className="w-48 h-11 border-r border-gray-300"></td>
                  <td className="w-32 h-11 border-r border-gray-300"></td>
                  <td className={`w-32 h-11 border-r border-gray-300 px-3 text-right text-sm font-mono font-bold ${
                    monthlyTotals.lucroFinal >= 0 ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {formatCurrency(Math.abs(monthlyTotals.lucroFinal))}
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

        {/* Rodapé com informações */}
        <div className="bg-gray-100 border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-6">
              <span>{filteredRows.length} movimentações</span>
              {rows.some(row => row.isNew) && (
                <span className="text-blue-600 font-medium">
                  {rows.filter(row => row.isNew).length} não salvas
                </span>
              )}
            </div>
            <span>Planilha MEI - DAS Automatizado</span>
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