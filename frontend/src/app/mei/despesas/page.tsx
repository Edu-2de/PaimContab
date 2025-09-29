'use client';

import { useState, useEffect, useCallback } from 'react';
import MeiProtection from '../../../components/MeiProtection';
import MeiSidebar from '../../../components/MeiSidebar';
import { HiPlus, HiXMark, HiMagnifyingGlass, HiArrowDownTray, HiArrowPath } from 'react-icons/hi2';

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

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function DespesasContent() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
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

  // Buscar despesas do backend
  const fetchDespesas = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/despesas`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDespesas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDespesas();
  }, [fetchDespesas]);

  // Filtragem de despesas
  const filteredDespesas = despesas.filter(despesa => {
    const matchesSearch =
      despesa.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      despesa.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      despesa.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const despesaMonth = despesa.dataPagamento.slice(0, 7);
    const matchesMonth = selectedMonth === '' || despesaMonth === selectedMonth;

    return matchesSearch && matchesMonth;
  });

  // Cálculos de métricas
  const totalDespesas = filteredDespesas.reduce((sum, despesa) => sum + despesa.valor, 0);
  const despesasPagas = filteredDespesas
    .filter(d => d.status === 'Pago')
    .reduce((sum, despesa) => sum + despesa.valor, 0);
  const despesasPendentes = filteredDespesas
    .filter(d => d.status === 'Pendente')
    .reduce((sum, despesa) => sum + despesa.valor, 0);
  const despesasDedutiveis = filteredDespesas.filter(d => d.dedutivel).reduce((sum, despesa) => sum + despesa.valor, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');

      const despesaData = {
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        dataPagamento: formData.dataPagamento,
        categoria: formData.categoria,
        fornecedor: formData.fornecedor,
        numeroNotaFiscal: formData.numeroNotaFiscal,
        metodoPagamento: formData.metodoPagamento,
        status: formData.status,
        dedutivel: formData.dedutivel,
        observacoes: formData.observacoes,
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
        response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/despesas`, {
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
        console.error('Erro ao salvar despesa');
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
      <MeiSidebar currentPage="despesas" />

      <div className="mei-content-wrapper">
        {/* Header Minimalista */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="max-w-8xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-light text-gray-900">Despesas</h1>
                <p className="text-sm text-gray-500 mt-1">Controle financeiro de saídas</p>
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

        {/* Métricas */}
        <div className="px-8 py-6">
          <div className="max-w-8xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total de Despesas</p>
                    <p className="text-2xl font-light text-gray-900 mt-1">{formatCurrency(totalDespesas)}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Despesas Pagas</p>
                    <p className="text-2xl font-light text-gray-900 mt-1">{formatCurrency(despesasPagas)}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Despesas Pendentes</p>
                    <p className="text-2xl font-light text-gray-900 mt-1">{formatCurrency(despesasPendentes)}</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Dedutíveis</p>
                    <p className="text-2xl font-light text-gray-900 mt-1">{formatCurrency(despesasDedutiveis)}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="px-8 pb-6">
          <div className="max-w-8xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar despesas..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                  >
                    <option value="">Todos os meses</option>
                    <option value="2024-12">Dezembro 2024</option>
                    <option value="2024-11">Novembro 2024</option>
                    <option value="2024-10">Outubro 2024</option>
                    <option value="2024-09">Setembro 2024</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Despesas */}
        <div className="px-8 pb-8">
          <div className="max-w-8xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                        Data / Método
                      </th>
                      <th className="text-right py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Valor
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Status
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredDespesas.map(despesa => (
                      <tr key={despesa.id} className="border-b border-gray-100 hover:bg-gray-25 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <div className="text-sm font-medium text-gray-900 mb-1">{despesa.descricao}</div>
                            <div className="text-xs text-gray-500">
                              {despesa.fornecedor && `${despesa.fornecedor} • `}
                              {despesa.categoria}
                              {despesa.dedutivel && ' • Dedutível'}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900">{formatDate(despesa.dataPagamento)}</div>
                          <div className="text-xs text-gray-500">{despesa.metodoPagamento}</div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="text-sm font-mono font-medium text-gray-900">
                            {formatCurrency(despesa.valor)}
                          </div>
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
                    ))}

                    {/* Estado vazio */}
                    {filteredDespesas.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          <p className="text-gray-500 mb-4">
                            {loading ? 'Carregando despesas...' : 'Nenhuma despesa encontrada'}
                          </p>
                          {!loading && (
                            <button
                              onClick={() => setShowModal(true)}
                              className="text-sm text-gray-900 hover:text-gray-700"
                            >
                              Adicionar primeira despesa
                            </button>
                          )}
                        </td>
                      </tr>
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
}

export default function DespesasPage() {
  return (
    <MeiProtection>
      <DespesasContent />
    </MeiProtection>
  );
}
