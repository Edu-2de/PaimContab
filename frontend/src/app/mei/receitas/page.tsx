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
  HiCurrencyDollar,
  HiArrowTrendingUp,
  HiArrowDownTray,
} from 'react-icons/hi2';

interface Receita {
  id: string;
  description: string;
  value: number;
  date: string;
  category: string;
  clientName?: string;
  invoiceNumber?: string;
  paymentMethod: 'Dinheiro' | 'PIX' | 'Cartão Débito' | 'Cartão Crédito' | 'Transferência' | 'Boleto';
  status: 'Recebido' | 'Pendente' | 'Cancelado';
}

interface ReceitaFormData {
  description: string;
  value: string;
  date: string;
  category: string;
  clientName: string;
  invoiceNumber: string;
  paymentMethod: string;
  status: string;
}

const categories = [
  'Vendas de Produtos',
  'Prestação de Serviços',
  'Comissões',
  'Royalties',
  'Consultoria',
  'Licenciamento',
  'Outros',
];

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function ReceitasContent() {
  const [receitas, setReceitas] = useState<Receita[]>([
    {
      id: '1',
      description: 'Serviço de consultoria em TI',
      value: 2500,
      date: '2024-09-25',
      category: 'Prestação de Serviços',
      clientName: 'Empresa ABC Ltda',
      invoiceNumber: 'NF-001',
      paymentMethod: 'PIX',
      status: 'Recebido',
    },
    {
      id: '2',
      description: 'Venda de produto digital',
      value: 800,
      date: '2024-09-23',
      category: 'Vendas de Produtos',
      clientName: 'João Silva',
      paymentMethod: 'Cartão Crédito',
      status: 'Recebido',
    },
    {
      id: '3',
      description: 'Curso online de programação',
      value: 1200,
      date: '2024-09-20',
      category: 'Licenciamento',
      clientName: 'Maria Santos',
      paymentMethod: 'Transferência',
      status: 'Pendente',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingReceita, setEditingReceita] = useState<Receita | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [formData, setFormData] = useState<ReceitaFormData>({
    description: '',
    value: '',
    date: new Date().toISOString().slice(0, 10),
    category: '',
    clientName: '',
    invoiceNumber: '',
    paymentMethod: '',
    status: 'Recebido',
  });

  // Filtragem de receitas
  const filteredReceitas = receitas.filter(receita => {
    const matchesSearch =
      receita.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receita.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receita.category.toLowerCase().includes(searchTerm.toLowerCase());
    const receitaMonth = receita.date.slice(0, 7);
    const matchesMonth = selectedMonth === '' || receitaMonth === selectedMonth;

    return matchesSearch && matchesMonth;
  });

  // Cálculos de métricas
  const totalReceitas = filteredReceitas.reduce((sum, receita) => sum + receita.value, 0);
  const receitasRecebidas = filteredReceitas
    .filter(r => r.status === 'Recebido')
    .reduce((sum, receita) => sum + receita.value, 0);
  const receitasPendentes = filteredReceitas
    .filter(r => r.status === 'Pendente')
    .reduce((sum, receita) => sum + receita.value, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newReceita: Receita = {
      id: editingReceita ? editingReceita.id : Date.now().toString(),
      description: formData.description,
      value: parseFloat(formData.value),
      date: formData.date,
      category: formData.category,
      clientName: formData.clientName,
      invoiceNumber: formData.invoiceNumber,
      paymentMethod: formData.paymentMethod as Receita['paymentMethod'],
      status: formData.status as Receita['status'],
    };

    if (editingReceita) {
      setReceitas(prev => prev.map(r => (r.id === editingReceita.id ? newReceita : r)));
    } else {
      setReceitas(prev => [newReceita, ...prev]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      description: '',
      value: '',
      date: new Date().toISOString().slice(0, 10),
      category: '',
      clientName: '',
      invoiceNumber: '',
      paymentMethod: '',
      status: 'Recebido',
    });
    setEditingReceita(null);
    setShowModal(false);
  };

  const handleEdit = (receita: Receita) => {
    setFormData({
      description: receita.description,
      value: receita.value.toString(),
      date: receita.date,
      category: receita.category,
      clientName: receita.clientName || '',
      invoiceNumber: receita.invoiceNumber || '',
      paymentMethod: receita.paymentMethod,
      status: receita.status,
    });
    setEditingReceita(receita);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta receita?')) {
      setReceitas(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <MeiSidebar currentPage="receitas" />

      <div className="mei-content-wrapper">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Receitas</h1>
                <p className="text-slate-600 mt-1 text-sm">Controle e gerencie todas as suas receitas</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                <HiPlus className="w-5 h-5" />
                Nova Receita
              </button>
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-emerald-50 rounded-lg mr-4">
                  <HiCurrencyDollar className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Total Receitas</p>
                  <p className="text-2xl font-semibold text-slate-900">{formatCurrency(totalReceitas)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-50 rounded-lg mr-4">
                  <HiArrowTrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Recebidas</p>
                  <p className="text-2xl font-semibold text-slate-900">{formatCurrency(receitasRecebidas)}</p>
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
                  <p className="text-2xl font-semibold text-slate-900">{formatCurrency(receitasPendentes)}</p>
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
                    placeholder="Buscar por descrição, cliente ou categoria..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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

        {/* Lista de Receitas */}
        <div className="px-8 py-4 pb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Receitas ({filteredReceitas.length})</h3>
            </div>

            {filteredReceitas.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-500">Nenhuma receita encontrada.</p>
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
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredReceitas.map(receita => (
                      <tr key={receita.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-slate-900">{receita.description}</div>
                            <div className="text-sm text-slate-500">
                              {receita.clientName} • {receita.category}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-900">{formatCurrency(receita.value)}</div>
                          <div className="text-xs text-slate-500">{receita.paymentMethod}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {formatDate(receita.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              receita.status === 'Recebido'
                                ? 'bg-green-100 text-green-800'
                                : receita.status === 'Pendente'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {receita.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button onClick={() => handleEdit(receita)} className="text-blue-600 hover:text-blue-900">
                              <HiPencilSquare className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(receita.id)}
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
                {editingReceita ? 'Editar Receita' : 'Nova Receita'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Descrição *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Data *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Categoria *</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cliente</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Forma Pagamento *</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="Recebido">Recebido</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                  {editingReceita ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReceitasPage() {
  return (
    <MeiProtection>
      <ReceitasContent />
    </MeiProtection>
  );
}
