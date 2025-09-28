'use client';

import { useState } from 'react';
import MeiProtection from '../../../components/MeiProtection';
import MeiSidebar from '../../../components/MeiSidebar';
import {
  HiPlus,
  HiPencilSquare,
  HiTrash,
  HiMagnifyingGlass,
  HiCalendar,
  HiArrowDownRight,
  HiArrowTrendingDown,
  HiArrowDownTray,
  HiReceiptPercent,
} from 'react-icons/hi2';

interface Despesa {
  id: string;
  description: string;
  value: number;
  date: string;
  category: string;
  supplier?: string;
  invoiceNumber?: string;
  paymentMethod: 'Dinheiro' | 'PIX' | 'Cartão Débito' | 'Cartão Crédito' | 'Transferência' | 'Boleto';
  status: 'Pago' | 'Pendente' | 'Cancelado';
  isDeductible: boolean;
}

interface DespesaFormData {
  description: string;
  value: string;
  date: string;
  category: string;
  supplier: string;
  invoiceNumber: string;
  paymentMethod: string;
  status: string;
  isDeductible: boolean;
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
  'Outros'
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
      isDeductible: true
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
      isDeductible: true
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
      isDeductible: true
    }
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
    isDeductible: true
  });

  // Filtragem de despesas
  const filteredDespesas = despesas.filter(despesa => {
    const matchesSearch = despesa.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         despesa.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         despesa.category.toLowerCase().includes(searchTerm.toLowerCase());
    const despesaMonth = despesa.date.slice(0, 7);
    const matchesMonth = selectedMonth === '' || despesaMonth === selectedMonth;
    
    return matchesSearch && matchesMonth;
  });

  // Cálculos de métricas
  const totalDespesas = filteredDespesas.reduce((sum, despesa) => sum + despesa.value, 0);
  const despesasPagas = filteredDespesas.filter(d => d.status === 'Pago').reduce((sum, despesa) => sum + despesa.value, 0);
  const despesasPendentes = filteredDespesas.filter(d => d.status === 'Pendente').reduce((sum, despesa) => sum + despesa.value, 0);
  const despesasDedutiveis = filteredDespesas.filter(d => d.isDeductible).reduce((sum, despesa) => sum + despesa.value, 0);

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
      isDeductible: formData.isDeductible
    };

    if (editingDespesa) {
      setDespesas(prev => prev.map(d => d.id === editingDespesa.id ? newDespesa : d));
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
      isDeductible: true
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
      isDeductible: despesa.isDeductible
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
    <div className="min-h-screen bg-slate-50">
      <MeiSidebar currentPage="despesas" />
      
      <div className="mei-content-wrapper">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Despesas</h1>
                <p className="text-slate-600 mt-1 text-sm">
                  Controle e gerencie todas as suas despesas
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <HiPlus className="w-5 h-5" />
                Nova Despesa
              </button>
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-50 rounded-lg mr-4">
                  <HiArrowDownRight className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Total Despesas</p>
                  <p className="text-2xl font-semibold text-slate-900">{formatCurrency(totalDespesas)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-50 rounded-lg mr-4">
                  <HiArrowTrendingDown className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Pagas</p>
                  <p className="text-2xl font-semibold text-slate-900">{formatCurrency(despesasPagas)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-amber-50 rounded-lg mr-4">
                  <HiCalendar className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Pendentes</p>
                  <p className="text-2xl font-semibold text-slate-900">{formatCurrency(despesasPendentes)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-50 rounded-lg mr-4">
                  <HiReceiptPercent className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Dedutíveis</p>
                  <p className="text-2xl font-semibold text-slate-900">{formatCurrency(despesasDedutiveis)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="px-8 py-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por descrição, fornecedor ou categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Todos os meses</option>
                  <option value="2024-09">Setembro 2024</option>
                  <option value="2024-08">Agosto 2024</option>
                  <option value="2024-07">Julho 2024</option>
                </select>
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">
                <HiArrowDownTray className="w-5 h-5" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Despesas */}
        <div className="px-8 py-4 pb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Despesas ({filteredDespesas.length})
              </h3>
            </div>

            {filteredDespesas.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-500">Nenhuma despesa encontrada.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Dedutível
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredDespesas.map((despesa) => (
                      <tr key={despesa.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-slate-900">{despesa.description}</div>
                            <div className="text-sm text-slate-500">
                              {despesa.supplier} • {despesa.category}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-900">
                            {formatCurrency(despesa.value)}
                          </div>
                          <div className="text-xs text-slate-500">{despesa.paymentMethod}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {formatDate(despesa.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            despesa.status === 'Pago' 
                              ? 'bg-green-100 text-green-800'
                              : despesa.status === 'Pendente'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {despesa.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            despesa.isDeductible 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {despesa.isDeductible ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(despesa)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <HiPencilSquare className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(despesa.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <HiTrash className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Valor *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fornecedor
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Forma Pagamento *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão Débito">Cartão Débito</option>
                    <option value="Cartão Crédito">Cartão Crédito</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Boleto">Boleto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                    checked={formData.isDeductible}
                    onChange={(e) => setFormData({...formData, isDeductible: e.target.checked})}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Esta despesa é dedutível do imposto
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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