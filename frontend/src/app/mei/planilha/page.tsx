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
      'Descrição',
      'Categoria',
      'Valor',
      'Resultado',
    ];
    const csvData = rows.map(row => [
      formatDate(row.data),
      row.tipo === 'receita' ? 'Receita' : 'Despesa',
      row.descricao,
      row.categoria,
      row.valor.toFixed(2),
      row.lucro.toFixed(2),
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
        {/* Header Minimalista */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="max-w-8xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-light text-gray-900">Planilha MEI</h1>
                <p className="text-sm text-gray-500 mt-1">Controle financeiro simplificado</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchSpreadsheetData}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Atualizar"
                >
                  <HiArrowPath className="w-4 h-4" />
                </button>
                <button
                  onClick={exportToCSV}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
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
                  className="text-sm border-0 bg-transparent focus:outline-none text-gray-700 font-medium"
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
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-200 w-64"
                  />
                </div>
              </div>

              <button
                onClick={addNewRow}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <HiPlus className="w-4 h-4" />
                Adicionar
              </button>
            </div>
          </div>
        </div>

        {/* Resumo Simplificado */}
        <div className="bg-white border-b border-gray-100 px-8 py-6">
          <div className="max-w-8xl mx-auto">
            <div className="grid grid-cols-5 gap-8">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">RECEITAS</p>
                <p className="text-2xl font-light text-gray-900">{formatCurrency(monthlyTotals.totalReceita)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">DESPESAS</p>
                <p className="text-2xl font-light text-gray-900">{formatCurrency(monthlyTotals.totalDespesa)}</p>
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
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1">
                  <div 
                    className="h-1 bg-gray-900 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(monthlyTotals.limiteMeiUtilizado, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">{monthlyTotals.limiteMeiUtilizado.toFixed(1)}% do limite MEI</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela Principal - Maior e Expandida */}
        <div className="flex-1 px-8 py-6">
          <div className="max-w-none mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 350px)', minHeight: '500px' }}>
                <table className="w-full min-w-[1200px]">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Data</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Tipo</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">Descrição</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-56">Categoria</th>
                      <th className="text-right py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Valor</th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredRows.map((row, index) => (
                      <tr key={row.id} className={`border-b border-gray-100 hover:bg-gray-25 transition-colors ${row.isNew ? 'bg-blue-25' : ''}`}>
                        <td className="py-4 px-6">
                          <input
                            type="date"
                            value={row.data}
                            onChange={e => updateRow(row.id, 'data', e.target.value)}
                            className="text-sm border-0 bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-300 rounded-md px-2 py-1 text-gray-900 w-full"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <select
                            value={row.tipo}
                            onChange={e => updateRow(row.id, 'tipo', e.target.value)}
                            className="text-sm border-0 bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-300 rounded-md px-2 py-1 text-gray-900 w-full"
                          >
                            <option value="">Selecionar</option>
                            <option value="receita">Receita</option>
                            <option value="despesa">Despesa</option>
                          </select>
                        </td>
                        <td className="py-4 px-6">
                          <input
                            type="text"
                            value={row.descricao}
                            onChange={e => updateRow(row.id, 'descricao', e.target.value)}
                            placeholder="Digite a descrição da movimentação..."
                            className="text-sm border-0 bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-300 rounded-md px-2 py-1 text-gray-900 placeholder-gray-400 w-full"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <select
                            value={row.categoria}
                            onChange={e => updateRow(row.id, 'categoria', e.target.value)}
                            className="text-sm border-0 bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-300 rounded-md px-2 py-1 text-gray-900 w-full"
                          >
                            <option value="">Selecionar categoria</option>
                            {row.tipo === 'receita' && CATEGORIAS_RECEITA.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            {row.tipo === 'despesa' && CATEGORIAS_DESPESA.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4 px-6">
                          <input
                            type="number"
                            value={row.valor || ''}
                            onChange={e => updateRow(row.id, 'valor', parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            className="text-sm border-0 bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-300 rounded-md px-2 py-1 text-gray-900 placeholder-gray-400 text-right font-mono w-full"
                          />
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => deleteRow(row.id)}
                            className="p-2 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                            title="Excluir linha"
                          >
                            <HiXMark className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Espaçamento entre dados e totais */}
                    <tr>
                      <td colSpan={6} className="py-6"></td>
                    </tr>

                    {/* Linha DAS - Mais destacada */}
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                      <td className="py-4 px-6 text-sm font-medium text-gray-600">—</td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-600">DAS</td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-600">Documento de Arrecadação do Simples (6% sobre receitas)</td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-600">Impostos Federais</td>
                      <td className="py-4 px-6 text-sm font-mono font-medium text-gray-900 text-right">
                        -{formatCurrency(monthlyTotals.dasTotal)}
                      </td>
                      <td className="py-4 px-6"></td>
                    </tr>

                    {/* Linha Total - Muito mais destacada */}
                    <tr className="bg-gray-900 text-white border-t-4 border-gray-400">
                      <td className="py-6 px-6 text-base font-bold tracking-wide">TOTAL FINAL</td>
                      <td className="py-6 px-6"></td>
                      <td className="py-6 px-6 text-sm font-medium">Resultado líquido mensal (após DAS)</td>
                      <td className="py-6 px-6"></td>
                      <td className="py-6 px-6 text-right font-mono font-bold text-lg">
                        {formatCurrency(monthlyTotals.lucroFinal)}
                      </td>
                      <td className="py-6 px-6"></td>
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
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
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

      {/* Botão Flutuante de Salvar */}
      {hasUnsavedRows && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={saveAllChanges}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            <HiCheckCircle className="w-4 h-4" />
            {saving ? 'Salvando...' : `Salvar ${rows.filter(row => row.isNew).length} ${rows.filter(row => row.isNew).length === 1 ? 'item' : 'itens'}`}
          </button>
        </div>
      )}
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