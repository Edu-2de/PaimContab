'use client';

import { useState, useEffect, useCallback } from 'react';
import MeiProtection from '../../../components/MeiProtection';
import MeiSidebar from '../../../components/MeiSidebar';
import {
  HiPlus,
  HiXMark,
  HiMagnifyingGlass,
  HiArrowDownTray,
  HiArrowPath,
} from 'react-icons/hi2';

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
  'Internet e Telefone',
  'Marketing e Publicidade',
  'Combustível',
  'Manutenção',
  'Taxas e Impostos',
  'Consultoria',
  'Treinamentos',
  'Aluguel',
  'Outros',
];

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function DespesasContent() {
  const [despesas, setDespesas] = useState<Despesa[]>([
    {
      id: '1',
      description: 'Internet e telefone mensal',
      value: 150,
      date: '2024-09-24',
      category: 'Internet e Telefone',
      supplier: 'Telecom ABC',
      invoiceNumber: 'TEL-2024-09',
      paymentMethod: 'Cartão Débito',
      status: 'Pago',
      isDeductible: true,
    },
    {
      id: '2',
      description: 'Material de escritório',
      value: 200,
      date: '2024-09-22',
      category: 'Material de Escritório',
      supplier: 'Papelaria XYZ',
      paymentMethod: 'PIX',
      status: 'Pago',
      isDeductible: true,
    },
    {
      id: '3',
      description: 'Software de contabilidade',
      value: 89,
      date: '2024-09-20',
      category: 'Software e Licenças',
      supplier: 'Software Inc',
      paymentMethod: 'Cartão Crédito',
      status: 'Pago',
      isDeductible: true,
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [formData, setFormData] = useState<DespesaFormData>({
    description: '',
    value: '',
    date: new Date().toISOString().slice(0, 10),
    category: '',
    supplier: '',
    invoiceNumber: '',
    paymentMethod: '',
    status: 'Pago',
    isDeductible: true,
  });

  // Filtragem de despesas
  const filteredDespesas = despesas.filter(despesa => {
    const matchesSearch =
      despesa.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      despesa.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      despesa.category.toLowerCase().includes(searchTerm.toLowerCase());
    const despesaMonth = despesa.date.slice(0, 7);
    const matchesMonth = selectedMonth === '' || despesaMonth === selectedMonth;

    return matchesSearch && matchesMonth;
  });

  // Cálculos de métricas
  const totalDespesas = filteredDespesas.reduce((sum, despesa) => sum + despesa.value, 0);
  const despesasPagas = filteredDespesas
    .filter(d => d.status === 'Pago')
    .reduce((sum, despesa) => sum + despesa.value, 0);
  const despesasPendentes = filteredDespesas
    .filter(d => d.status === 'Pendente')
    .reduce((sum, despesa) => sum + despesa.value, 0);
  const despesasDedutiveis = filteredDespesas
    .filter(d => d.isDeductible)
    .reduce((sum, despesa) => sum + despesa.value, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newDespesa: Despesa = {
      id: editingDespesa ? editingDespesa.id : Date.now().toString(),
      description: formData.description,
      value: parseFloat(formData.value),
      date: formData.date,
      category: formData.category,
      supplier: formData.supplier,
      invoiceNumber: formData.invoiceNumber,
      paymentMethod: formData.paymentMethod as Despesa['paymentMethod'],
      status: formData.status as Despesa['status'],
      isDeductible: formData.isDeductible,
    };

    if (editingDespesa) {
      setDespesas(prev => prev.map(d => (d.id === editingDespesa.id ? newDespesa : d)));
    } else {
      setDespesas(prev => [newDespesa, ...prev]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      description: '',
      value: '',
      date: new Date().toISOString().slice(0, 10),
      category: '',
      supplier: '',
      invoiceNumber: '',
      paymentMethod: '',
      status: 'Pago',
      isDeductible: true,
    });
    setEditingDespesa(null);
    setShowModal(false);
  };

  const handleEdit = (despesa: Despesa) => {
    setFormData({
      description: despesa.description,
      value: despesa.value.toString(),
      date: despesa.date,
      category: despesa.category,
      supplier: despesa.supplier || '',
      invoiceNumber: despesa.invoiceNumber || '',
      paymentMethod: despesa.paymentMethod,
      status: despesa.status,
      isDeductible: despesa.isDeductible,
    });
    setEditingDespesa(despesa);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      setDespesas(prev => prev.filter(d => d.id !== id));
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
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg">
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
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="text-sm border-0 bg-transparent focus:outline-none text-gray-700 font-medium cursor-pointer"
                >
                  <option value="">Todos os períodos</option>
                  <option value="2024-09">Setembro 2024</option>
                  <option value="2024-08">Agosto 2024</option>
                  <option value="2024-07">Julho 2024</option>
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

              <div className="text-sm text-gray-500">
                {filteredDespesas.length} despesas encontradas
              </div>
            </div>
          </div>
        </div>

        {/* Resumo Simplificado */}
        <div className="bg-white border-b border-gray-100 px-8 py-6">
          <div className="max-w-8xl mx-auto">
            <div className="grid grid-cols-4 gap-12">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">TOTAL</p>
                  <p className="text-2xl font-light text-gray-900">{formatCurrency(totalDespesas)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">PAGAS</p>
                <p className="text-2xl font-light text-gray-900">{formatCurrency(despesasPagas)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">PENDENTES</p>
                <p className="text-2xl font-light text-gray-900">{formatCurrency(despesasPendentes)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">DEDUTÍVEIS</p>
                <p className="text-2xl font-light text-gray-900">{formatCurrency(despesasDedutiveis)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela Principal */}
        <div className="flex-1 px-8 py-6">
          <div className="max-w-none mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 350px)', minHeight: '500px' }}>
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-80">Descrição</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Data</th>
                      <th className="text-right py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Valor</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Status</th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredDespesas.map((despesa) => (
                      <tr key={despesa.id} className="border-b border-gray-100 hover:bg-gray-25 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <div className="text-sm font-medium text-gray-900 mb-1">{despesa.description}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              {despesa.supplier && `${despesa.supplier} • `}
                              {despesa.category}
                              {despesa.isDeductible && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                                  Dedutível
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900">{formatDate(despesa.date)}</div>
                          <div className="text-xs text-gray-500">{despesa.paymentMethod}</div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="text-sm font-mono font-medium text-gray-900">{formatCurrency(despesa.value)}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              despesa.status === 'Pago' ? 'bg-emerald-500' :
                              despesa.status === 'Pendente' ? 'bg-amber-500' : 'bg-red-500'
                            }`}></div>
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
                          <p className="text-gray-500 mb-4">Nenhuma despesa encontrada</p>
                          <button
                            onClick={() => setShowModal(true)}
                            className="text-sm text-gray-900 hover:text-gray-700"
                          >
                            Adicionar primeira despesa
                          </button>
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
                <button
                  onClick={resetForm}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
                >
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                    placeholder="0,00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fornecedor</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                  placeholder="Nome do fornecedor (opcional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pagamento</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deductible"
                  checked={formData.isDeductible}
                  onChange={e => setFormData({ ...formData, isDeductible: e.target.checked })}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-200"
                />
                <label htmlFor="deductible" className="text-sm text-gray-700">
                  Despesa dedutível para imposto de renda
                </label>
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
                  className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {editingDespesa ? 'Atualizar' : 'Salvar'}
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