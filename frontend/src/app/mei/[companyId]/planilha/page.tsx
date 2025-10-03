'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MeiProtection from '../../../../components/MeiProtection';
import MeiSidebar from '../../../../components/MeiSidebar';
import {
  HiArrowDownTray,
  HiArrowPath,
  HiMagnifyingGlass,
  HiChartBarSquare,
  HiCheckCircle,
} from 'react-icons/hi2';

// Interface completa da planilha - armazena todos os campos mas exibe simplificado
interface SpreadsheetRow {
  id: string;
  originalId?: string; // ID original do banco de dados (receita ou despesa)
  // Campos exibidos na tabela
  data: string; // date
  descricao: string; // description
  categoria: string; // category
  tipo: 'receita' | 'despesa' | '';
  valor: number; // value
  status: string; // status (Recebido/Pago/Pendente/Cancelado)

  // Campos adicionais (não exibidos na tabela mas salvos no banco)
  cliente?: string; // clientName (receita)
  numeroNota?: string; // invoiceNumber
  metodoPagamento?: string; // paymentMethod
  fornecedor?: string; // supplier (despesa)
  dedutivel?: boolean; // isDeductible (despesa)

  // Controle de edição
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
  cliente?: string;
  numeroNota?: string;
  metodoPagamento?: string;
  status?: string;
  createdAt: string;
}

interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  dataPagamento: string;
  categoria: string;
  fornecedor?: string;
  numeroNota?: string;
  metodoPagamento?: string;
  status?: string;
  dedutivel?: boolean;
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
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

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
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Validar acesso
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
    };

    if (companyId) {
      validateAccess();
    }
  }, [companyId, router]);

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
    descricao: '',
    categoria: '',
    tipo: '',
    valor: 0,
    status: '',
    isEditing: true,
    isNew: true,
  });

  // Adicionar linhas vazias automaticamente - sempre manter pelo menos 1 linha vazia
  const ensureEmptyRows = useCallback((currentRows: SpreadsheetRow[]) => {
    const emptyRows = currentRows.filter(row => !row.descricao && !row.tipo && row.valor === 0);

    // Se não tem nenhuma linha vazia, adicionar 1
    if (emptyRows.length === 0) {
      return [...currentRows, createEmptyRow()];
    }

    return currentRows;
  }, []);

  // Buscar dados do backend e gerar planilha
  const fetchSpreadsheetData = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      const userObj = userData ? JSON.parse(userData) : null;

      // Se for admin, precisa passar companyId como query parameter
      const queryParam = userObj?.role === 'admin' ? `?companyId=${companyId}` : '';

      // Buscar receitas do mês
      const receitasResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/receitas${queryParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const receitas = receitasResponse.ok ? await receitasResponse.json() : [];

      // Buscar despesas do mês
      const despesasResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/despesas${queryParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const despesas = despesasResponse.ok ? await despesasResponse.json() : [];

      console.log('📅 Mês selecionado:', selectedMonth);
      console.log('� Total de receitas recebidas:', receitas.length);
      console.log('📊 Total de despesas recebidas:', despesas.length);

      // DEBUG: Mostrar todas as receitas e despesas
      if (receitas.length > 0) {
        console.log('🔍 Exemplo de receita:', receitas[0]);
        console.log(
          '🔍 Todas as receitas:',
          receitas.map((r: Receita) => ({
            descricao: r.descricao,
            data: r.dataRecebimento,
            valor: r.valor,
          }))
        );
      }
      if (despesas.length > 0) {
        console.log('🔍 Exemplo de despesa:', despesas[0]);
        console.log(
          '🔍 Todas as despesas:',
          despesas.map((d: Despesa) => ({
            descricao: d.descricao,
            data: d.dataPagamento,
            valor: d.valor,
          }))
        );
      }

      // Filtrar por mês selecionado - comparar apenas YYYY-MM
      const filteredReceitas = receitas.filter((r: Receita) => {
        const dataStr = (r.dataRecebimento || r.createdAt || '').substring(0, 7); // Pega YYYY-MM
        const match = dataStr === selectedMonth;
        console.log(
          `🔍 Receita "${r.descricao}" - Data: ${r.dataRecebimento} - Mês extraído: ${dataStr} - Match: ${match}`
        );
        return match;
      });

      const filteredDespesas = despesas.filter((d: Despesa) => {
        const dataStr = (d.dataPagamento || d.createdAt || '').substring(0, 7); // Pega YYYY-MM
        const match = dataStr === selectedMonth;
        console.log(
          `🔍 Despesa "${d.descricao}" - Data: ${d.dataPagamento} - Mês extraído: ${dataStr} - Match: ${match}`
        );
        return match;
      });

      console.log('📊 Receitas filtradas do mês:', filteredReceitas.length);
      console.log('📊 Despesas filtradas do mês:', filteredDespesas.length);

      // Converter receitas para formato da planilha - TODOS os campos
      const receitasRows: SpreadsheetRow[] = filteredReceitas.map((receita: Receita) => ({
        id: `receita-${receita.id}`,
        originalId: receita.id.toString(), // ID original do banco
        data: (receita.dataRecebimento || receita.createdAt).split('T')[0],
        descricao: receita.descricao || '',
        categoria: receita.categoria || '',
        tipo: 'receita' as const,
        valor: receita.valor || 0,
        status: receita.status || 'Recebido',
        // Campos adicionais de receita
        cliente: receita.cliente || '',
        numeroNota: receita.numeroNota || '',
        metodoPagamento: receita.metodoPagamento || 'PIX',
        // Não é linha nova (veio do banco)
        isEditing: false,
        isNew: false,
      }));

      // Converter despesas para formato da planilha - TODOS os campos
      const despesasRows: SpreadsheetRow[] = filteredDespesas.map((despesa: Despesa) => ({
        id: `despesa-${despesa.id}`,
        originalId: despesa.id.toString(), // ID original do banco
        data: (despesa.dataPagamento || despesa.createdAt).split('T')[0],
        descricao: despesa.descricao || '',
        categoria: despesa.categoria || '',
        tipo: 'despesa' as const,
        valor: despesa.valor || 0,
        status: despesa.status || 'Pago',
        // Campos adicionais de despesa
        fornecedor: despesa.fornecedor || '',
        numeroNota: despesa.numeroNota || '',
        metodoPagamento: despesa.metodoPagamento || 'PIX',
        dedutivel: despesa.dedutivel !== undefined ? despesa.dedutivel : true,
        // Não é linha nova (veio do banco)
        isEditing: false,
        isNew: false,
      }));

      // Combinar e ordenar por data
      const allRows = [...receitasRows, ...despesasRows].sort(
        (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
      );

      console.log('📊 Total de linhas combinadas:', allRows.length);

      // Adicionar sempre pelo menos 1 linha vazia
      const rowsWithEmpty = ensureEmptyRows(allRows);

      console.log('📊 Total de linhas com vazias:', rowsWithEmpty.length);

      setRows(rowsWithEmpty);
      setMonthlyTotals(calculateTotals(allRows));
    } catch (error) {
      console.error('Erro ao carregar dados da planilha:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, companyId, ensureEmptyRows]);

  useEffect(() => {
    if (hasAccess) {
      fetchSpreadsheetData();
    }
  }, [fetchSpreadsheetData, hasAccess]);

  // Recarregar dados quando a página recebe foco (voltou de outra aba/página)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && hasAccess) {
        console.log('🔄 Planilha recebeu foco - recarregando dados...');
        fetchSpreadsheetData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchSpreadsheetData, hasAccess]);

  const updateRow = (id: string, field: keyof SpreadsheetRow, value: string | number | boolean) => {
    setRows(prevRows => {
      const updatedRows = prevRows.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };

          // Auto-definir status padrão baseado no tipo
          if (field === 'tipo' && !updatedRow.status) {
            if (updatedRow.tipo === 'receita') {
              updatedRow.status = 'Recebido';
            } else if (updatedRow.tipo === 'despesa') {
              updatedRow.status = 'Pago';
            }
          }

          return updatedRow;
        }
        return row;
      });

      // Garantir pelo menos 1 linha vazia após atualização
      const rowsWithEmpty = ensureEmptyRows(updatedRows);

      // Calcular totais apenas com dados válidos
      const validRows = rowsWithEmpty.filter(row => row.tipo && row.descricao && row.valor > 0);
      setMonthlyTotals(calculateTotals(validRows));

      return rowsWithEmpty;
    });
  };

  // Verificar se uma linha tem todos os campos obrigatórios preenchidos
  const isRowValid = (row: SpreadsheetRow): boolean => {
    // Verificar campos obrigatórios básicos
    if (!row.descricao || row.descricao.trim() === '') return false;
    if (!row.tipo) return false;
    if (!row.valor || row.valor <= 0) return false;
    if (!row.data || row.data === '') return false;
    
    return true;
  };

  // Salvar uma linha individual editada
  const saveIndividualRow = async (row: SpreadsheetRow) => {
    if (!isRowValid(row)) {
      alert('Preencha todos os campos obrigatórios antes de salvar!');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      const userObj = userData ? JSON.parse(userData) : null;

      // Se a linha já existe no banco (não é isNew), fazer PUT
      if (!row.isNew && row.originalId) {
        const endpoint = row.tipo === 'receita' ? 'receitas' : 'despesas';
        
        const bodyData: Record<string, string | number | boolean | null> = {
          descricao: row.descricao,
          valor: row.valor,
          categoria: row.categoria || '',
          status: row.status,
          numeroNota: row.numeroNota || null,
          metodoPagamento: row.metodoPagamento || null,
        };

        if (row.tipo === 'receita') {
          bodyData.dataRecebimento = row.data;
          bodyData.cliente = row.cliente || null;
        } else if (row.tipo === 'despesa') {
          bodyData.dataPagamento = row.data;
          bodyData.fornecedor = row.fornecedor || null;
          bodyData.dedutivel = row.dedutivel || false;
        }

        // Se for admin, enviar companyId
        if (userObj?.role === 'admin') {
          bodyData.companyId = companyId;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/${endpoint}/${row.originalId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro ao atualizar ${row.tipo}:`, response.status, errorText);
          alert(`Erro ao salvar: ${errorText}`);
          return;
        }
      }

      // Desativar modo de edição
      updateRow(row.id, 'isEditing', false);
      
      // Recarregar dados para garantir sincronia
      await fetchSpreadsheetData();
    } catch (error) {
      console.error('Erro ao salvar linha:', error);
      alert('Erro ao salvar alterações!');
    } finally {
      setSaving(false);
    }
  };

  // Deletar linha com confirmação
  const deleteRowWithConfirmation = async (row: SpreadsheetRow) => {
    // Se for linha vazia/nova, apenas remover da interface
    if (row.isNew || !row.originalId) {
      setRows(prevRows => {
        const updatedRows = prevRows.filter(r => r.id !== row.id);
        const rowsWithEmpty = ensureEmptyRows(updatedRows);
        const validRows = rowsWithEmpty.filter(r => r.tipo && r.descricao && r.valor > 0);
        setMonthlyTotals(calculateTotals(validRows));
        return rowsWithEmpty;
      });
      return;
    }

    // Confirmar deleção
    const confirmDelete = window.confirm(
      `Tem certeza que deseja deletar esta ${row.tipo === 'receita' ? 'receita' : 'despesa'}?\n\n` +
      `Descrição: ${row.descricao}\n` +
      `Valor: R$ ${row.valor.toFixed(2)}\n\n` +
      `Esta ação não pode ser desfeita!`
    );

    if (!confirmDelete) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      const endpoint = row.tipo === 'receita' ? 'receitas' : 'despesas';

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/${endpoint}/${row.originalId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ao deletar ${row.tipo}:`, response.status, errorText);
        alert(`Erro ao deletar: ${errorText}`);
        return;
      }

      // Remover da interface
      setRows(prevRows => {
        const updatedRows = prevRows.filter(r => r.id !== row.id);
        const rowsWithEmpty = ensureEmptyRows(updatedRows);
        const validRows = rowsWithEmpty.filter(r => r.tipo && r.descricao && r.valor > 0);
        setMonthlyTotals(calculateTotals(validRows));
        return rowsWithEmpty;
      });

      alert(`${row.tipo === 'receita' ? 'Receita' : 'Despesa'} deletada com sucesso!`);
    } catch (error) {
      console.error('Erro ao deletar linha:', error);
      alert('Erro ao deletar movimentação!');
    } finally {
      setSaving(false);
    }
  };

  // Salvar todas as alterações no banco
  const saveAllChanges = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      const userObj = userData ? JSON.parse(userData) : null;

      const newRows = rows.filter(row => row.isNew && row.tipo && row.descricao && row.valor > 0);

      for (const row of newRows) {
        let response;
        const bodyData: Record<string, string | number> = {
          descricao: row.descricao,
          valor: row.valor,
          categoria: row.categoria,
          status: row.status,
        };

        // Se for admin, precisa enviar companyId
        if (userObj?.role === 'admin') {
          bodyData.companyId = companyId;
        }

        if (row.tipo === 'receita') {
          bodyData.dataRecebimento = row.data;
          response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/receitas`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(bodyData),
          });
        } else if (row.tipo === 'despesa') {
          bodyData.dataPagamento = row.data;
          response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/despesas`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(bodyData),
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
    const validRows = rows.filter(row => row.tipo && row.descricao);

    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Status', 'Valor'];
    const csvData = validRows.map(row => [
      formatDate(row.data),
      row.tipo === 'receita' ? 'Receita' : 'Despesa',
      row.descricao,
      row.categoria,
      row.status,
      row.valor.toFixed(2),
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
    if (!row.descricao && !row.tipo && row.valor === 0) return false;

    // Aplicar filtro de busca
    return (
      row.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(row.data).includes(searchTerm) ||
      row.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const hasUnsavedRows = rows.some(row => row.isNew && row.tipo && row.descricao && row.valor > 0);

  // Linhas válidas para o total
  const validRows = rows.filter(row => row.tipo && row.descricao && row.valor > 0);

  // Calcular estatísticas adicionais
  const totalMovimentacoes = validRows.length;
  const margemLucro =
    monthlyTotals.totalReceita > 0 ? (monthlyTotals.lucroFinal / monthlyTotals.totalReceita) * 100 : 0;

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

  if (loading) {
    return (
      <div className="mei-page-container">
        <MeiSidebar currentPage="planilha" companyId={companyId} />
        <div className="mei-content-wrapper">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mei-page-container">
      <MeiSidebar currentPage="planilha" companyId={companyId} />

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
                  {isAdmin && <p className="text-xs text-blue-600 mt-1">👁️ Visualização administrativa</p>}
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
                            rows.filter(row => row.isNew && row.tipo && row.descricao && row.valor > 0).length
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
                <table className="w-full text-sm min-w-[1600px]">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                        Data
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                        Tipo
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">
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
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                        Nº Nota
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">
                        Método Pag.
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">
                        Valor
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                        Dedutível
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                        Status
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredRows.map(row => (
                      <tr
                        key={row.id}
                        className={`hover:bg-gray-50 transition-colors duration-150 ${
                          row.isNew && row.descricao ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        {/* Data */}
                        <td className="py-3 px-4">
                          {row.isNew || row.isEditing ? (
                            <input
                              type="date"
                              value={row.data}
                              onChange={e => updateRow(row.id, 'data', e.target.value)}
                              className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 w-full"
                            />
                          ) : (
                            <span className="text-sm text-gray-700">{formatDate(row.data)}</span>
                          )}
                        </td>

                        {/* Tipo */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {row.tipo === 'receita' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                            {row.tipo === 'despesa' && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                            {!row.tipo && <div className="w-2 h-2 rounded-full bg-gray-300"></div>}
                            {row.isNew || row.isEditing ? (
                              <select
                                value={row.tipo}
                                onChange={e => updateRow(row.id, 'tipo', e.target.value)}
                                className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-2 py-2 text-gray-900 flex-1 cursor-pointer"
                              >
                                <option value="">Tipo</option>
                                <option value="receita">Receita</option>
                                <option value="despesa">Despesa</option>
                              </select>
                            ) : (
                              <span className="text-sm text-gray-700 capitalize">{row.tipo}</span>
                            )}
                          </div>
                        </td>

                        {/* Descrição */}
                        <td className="py-3 px-4">
                          {row.isNew || row.isEditing ? (
                            <input
                              type="text"
                              value={row.descricao}
                              onChange={e => updateRow(row.id, 'descricao', e.target.value)}
                              placeholder="Descrição da movimentação..."
                              className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 w-full font-medium"
                            />
                          ) : (
                            <span className="text-sm text-gray-700 font-medium">{row.descricao}</span>
                          )}
                        </td>

                        {/* Categoria */}
                        <td className="py-3 px-4">
                          {row.isNew || row.isEditing ? (
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
                          ) : (
                            <span className="text-sm text-gray-700">{row.categoria}</span>
                          )}
                        </td>

                        {/* Cliente (apenas receitas) */}
                        <td className={`py-3 px-4 ${row.tipo === 'despesa' ? 'bg-gray-100' : ''}`}>
                          {row.tipo === 'receita' ? (
                            row.isNew || row.isEditing ? (
                              <input
                                type="text"
                                value={row.cliente || ''}
                                onChange={e => updateRow(row.id, 'cliente', e.target.value)}
                                placeholder="Nome do cliente..."
                                className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 w-full"
                              />
                            ) : (
                              <span className="text-sm text-gray-700">{row.cliente || '—'}</span>
                            )
                          ) : (
                            <span className="text-sm text-gray-400 text-center block">—</span>
                          )}
                        </td>

                        {/* Fornecedor (apenas despesas) */}
                        <td className={`py-3 px-4 ${row.tipo === 'receita' ? 'bg-gray-100' : ''}`}>
                          {row.tipo === 'despesa' ? (
                            row.isNew || row.isEditing ? (
                              <input
                                type="text"
                                value={row.fornecedor || ''}
                                onChange={e => updateRow(row.id, 'fornecedor', e.target.value)}
                                placeholder="Nome do fornecedor..."
                                className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 w-full"
                              />
                            ) : (
                              <span className="text-sm text-gray-700">{row.fornecedor || '—'}</span>
                            )
                          ) : (
                            <span className="text-sm text-gray-400 text-center block">—</span>
                          )}
                        </td>

                        {/* Número da Nota */}
                        <td className="py-3 px-4">
                          {row.isNew || row.isEditing ? (
                            <input
                              type="text"
                              value={row.numeroNota || ''}
                              onChange={e => updateRow(row.id, 'numeroNota', e.target.value)}
                              placeholder="NF-001..."
                              className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 w-full"
                            />
                          ) : (
                            <span className="text-sm text-gray-700">{row.numeroNota || '—'}</span>
                          )}
                        </td>

                        {/* Método de Pagamento */}
                        <td className="py-3 px-4">
                          {row.isNew || row.isEditing ? (
                            <select
                              value={row.metodoPagamento || ''}
                              onChange={e => updateRow(row.id, 'metodoPagamento', e.target.value)}
                              className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 w-full cursor-pointer"
                            >
                              <option value="">Método</option>
                              <option value="PIX">PIX</option>
                              <option value="Dinheiro">Dinheiro</option>
                              <option value="Cartão Débito">Cartão Débito</option>
                              <option value="Cartão Crédito">Cartão Crédito</option>
                              <option value="Transferência">Transferência</option>
                              <option value="Boleto">Boleto</option>
                            </select>
                          ) : (
                            <span className="text-sm text-gray-700">{row.metodoPagamento || '—'}</span>
                          )}
                        </td>

                        {/* Valor */}
                        <td className="py-3 px-4 text-right">
                          {row.isNew || row.isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={row.valor || ''}
                              onChange={e => updateRow(row.id, 'valor', parseFloat(e.target.value) || 0)}
                              placeholder="0,00"
                              className="text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 text-right font-mono w-full"
                            />
                          ) : (
                            <span
                              className={`text-sm font-mono font-semibold ${
                                row.tipo === 'receita' ? 'text-emerald-600' : row.tipo === 'despesa' ? 'text-red-600' : 'text-gray-700'
                              }`}
                            >
                              {formatCurrency(row.valor)}
                            </span>
                          )}
                        </td>

                        {/* Dedutível (apenas despesas) */}
                        <td className={`py-3 px-4 text-center ${row.tipo === 'receita' ? 'bg-gray-100' : ''}`}>
                          {row.tipo === 'despesa' ? (
                            row.isNew || row.isEditing ? (
                              <input
                                type="checkbox"
                                checked={row.dedutivel || false}
                                onChange={e => updateRow(row.id, 'dedutivel', e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                              />
                            ) : (
                              row.dedutivel ? (
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
                                <span className="text-sm text-gray-400">—</span>
                              )
                            )
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {row.isNew || row.isEditing ? (
                            <select
                              value={row.status}
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
                          ) : (
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  row.status === 'Recebido' || row.status === 'Pago'
                                    ? 'bg-emerald-500'
                                    : row.status === 'Pendente'
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                }`}
                              ></div>
                              <span className="text-sm text-gray-700">{row.status}</span>
                            </div>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {!row.isNew && !row.isEditing && (
                              <button
                                onClick={() => updateRow(row.id, 'isEditing', true)}
                                className="p-2 bg-gray-900 text-white hover:bg-gray-800 rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Editar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            {!row.isNew && row.isEditing && (
                              <button
                                onClick={() => saveIndividualRow(row)}
                                disabled={!isRowValid(row)}
                                className={`p-2 rounded-md transition-all duration-200 shadow-sm hover:shadow-md ${
                                  isRowValid(row)
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                                }`}
                                title={isRowValid(row) ? 'Salvar' : 'Preencha todos os campos obrigatórios'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                            {(row.descricao || row.tipo || row.valor > 0) && (
                              <button
                                onClick={() => deleteRowWithConfirmation(row)}
                                className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Excluir"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Estado vazio */}
                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={12} className="text-center py-20">
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
