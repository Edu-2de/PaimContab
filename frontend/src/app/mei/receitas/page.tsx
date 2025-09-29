'use client';

import { useState } from 'react';
import MeiProtection from '../../../components/MeiProtection';
import MeiSidebar from '../../../components/MeiSidebar';
import {
  HiPlus,
  HiXMark,
  HiMagnifyingGlass,
  HiArrowDownTray,
  HiArrowPath,
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
    <div className="min-h-screen bg-gray-50">
      <MeiSidebar currentPage="receitas" />

      <div className="mei-content-wrapper">
        {/* Header Minimalista */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="max-w-8xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-light text-gray-900">Receitas</h1>
                <p className="text-sm text-gray-500 mt-1">Controle financeiro de entradas</p>
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
                  Nova Receita
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
                    placeholder="Buscar receitas..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-200 w-72"
                  />
                </div>
              </div>

              <div className="text-sm text-gray-500">
                {filteredReceitas.length} receitas encontradas
              </div>
            </div>
          </div>
        </div>

        {/* Resumo Simplificado */}
        <div className="bg-white border-b border-gray-100 px-8 py-6">
          <div className="max-w-8xl mx-auto">
            <div className="grid grid-cols-3 gap-12">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">TOTAL</p>
                  <p className="text-2xl font-light text-gray-900">{formatCurrency(totalReceitas)}</p>
                </div>
               
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">RECEBIDAS</p>
                <p className="text-2xl font-light text-gray-900">{formatCurrency(receitasRecebidas)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">PENDENTES</p>
                <p className="text-2xl font-light text-gray-900">{formatCurrency(receitasPendentes)}</p>
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
                    {filteredReceitas.map((receita) => (
                      <tr key={receita.id} className="border-b border-gray-100 hover:bg-gray-25 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <div className="text-sm font-medium text-gray-900 mb-1">{receita.description}</div>
                            <div className="text-xs text-gray-500">
                              {receita.clientName && `${receita.clientName} • `}
                              {receita.category}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900">{formatDate(receita.date)}</div>
                          <div className="text-xs text-gray-500">{receita.paymentMethod}</div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="text-sm font-mono font-medium text-gray-900">{formatCurrency(receita.value)}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              receita.status === 'Recebido' ? 'bg-emerald-500' :
                              receita.status === 'Pendente' ? 'bg-amber-500' : 'bg-red-500'
                            }`}></div>
                            <span className="text-sm text-gray-700">{receita.status}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(receita)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                              title="Editar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(receita.id)}
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
                    {filteredReceitas.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          <p className="text-gray-500 mb-4">Nenhuma receita encontrada</p>
                          <button
                            onClick={() => setShowModal(true)}
                            className="text-sm text-gray-900 hover:text-gray-700"
                          >
                            Adicionar primeira receita
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
                  {editingReceita ? 'Editar Receita' : 'Nova Receita'}
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
                  placeholder="Digite a descrição da receita..."
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                  placeholder="Nome do cliente (opcional)"
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
                    <option value="Recebido">Recebido</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
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