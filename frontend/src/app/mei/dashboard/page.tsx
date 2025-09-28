'use client';

import { useState, useEffect } from 'react';
import MeiProtection from '../../../components/MeiProtection';
import MeiSidebar from '../../../components/MeiSidebar';
import {
  HiChartBarSquare,
  HiDocumentText,
  HiCalculator,
  HiArrowTrendingUp,
  HiCurrencyDollar,
  HiCalendarDays,
  HiUser,
  HiArrowRightOnRectangle,
  HiExclamationTriangle,
  HiBell,
  HiEye,
  HiArrowUpRight,
  HiArrowDownRight,
  HiChartPie,
  HiClock,
  HiCheckCircle,
  HiXMarkIcon,
} from 'react-icons/hi2';
import { HiReceiptTax } from 'react-icons/hi';
import { FiPlus, FiTrash2, FiTrendingUp, FiTrendingDown, FiCalendar, FiFileText } from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Company {
  id: string;
  name: string;
  cnpj?: string;
}

interface DashboardMetrics {
  totalReceita: number;
  totalDespesa: number;
  lucroLiquido: number;
  limiteFaturamento: number;
  faturamentoAtual: number;
  proximoDAS: string;
  valorDAS: number;
}

interface RecentTransaction {
  id: string;
  type: 'Receita' | 'Despesa';
  description: string;
  value: number;
  date: string;
  category: string;
}

interface NotificationItem {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  date: string;
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function MeiDashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Dados mockados para demonstração - em produção viria da API
  const [metrics] = useState<DashboardMetrics>({
    totalReceita: 45600.0,
    totalDespesa: 12300.0,
    lucroLiquido: 33300.0,
    limiteFaturamento: 81000.0,
    faturamentoAtual: 45600.0,
    proximoDAS: '2024-10-20',
    valorDAS: 456.0,
  });

  const [recentTransactions] = useState<RecentTransaction[]>([
    {
      id: '1',
      type: 'Receita',
      description: 'Serviço de consultoria',
      value: 2500,
      date: '2024-09-25',
      category: 'Serviços',
    },
    {
      id: '2',
      type: 'Despesa',
      description: 'Internet e telefone',
      value: 150,
      date: '2024-09-24',
      category: 'Utilities',
    },
    { id: '3', type: 'Receita', description: 'Venda de produto', value: 800, date: '2024-09-23', category: 'Vendas' },
    {
      id: '4',
      type: 'Despesa',
      description: 'Material de escritório',
      value: 200,
      date: '2024-09-22',
      category: 'Suprimentos',
    },
  ]);

  const [notifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'warning',
      title: 'DAS Vencendo',
      message: 'O DAS de setembro vence em 5 dias',
      date: '2024-09-25',
    },
    {
      id: '2',
      type: 'info',
      title: 'Limite de Faturamento',
      message: 'Você já atingiu 56% do limite anual',
      date: '2024-09-24',
    },
    {
      id: '3',
      type: 'success',
      title: 'Meta Atingida',
      message: 'Parabéns! Meta de setembro foi atingida',
      date: '2024-09-23',
    },
  ]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      fetchCompanyData(userObj.id);
    }
  }, []);

  const fetchCompanyData = async (userId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/company/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const companyData = await response.json();
        setCompany(companyData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados da empresa:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const addRow = (type: 'Receita' | 'Despesa') => {
    const today = new Date().toISOString().split('T')[0];
    setData(d => [...d, { type, desc: '', value: 0, date: today }]);
    setEditIdx(data.length);
  };

  const handleRowChange = (idx: number, key: keyof Row, v: string | number) => {
    setData(d =>
      d.map((row, i) =>
        i === idx
          ? {
              ...row,
              [key]: key === 'value' ? (isNaN(Number(v)) ? 0 : Number(v)) : v,
            }
          : row
      )
    );
  };

  const removeRow = (idx: number) => {
    setData(d => d.filter((_, i) => i !== idx));
    setEditIdx(null);
  };

  const totalReceita = data.filter(x => x.type === 'Receita').reduce((a, b) => a + b.value, 0);
  const totalDespesa = data.filter(x => x.type === 'Despesa').reduce((a, b) => a + b.value, 0);
  const lucro = totalReceita - totalDespesa;
  const imposto = Math.round(totalReceita * 0.06 * 100) / 100; // DAS 6%
  const saldoFinal = lucro - imposto;

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard MEI</h1>
              <p className="text-sm text-gray-600">
                {company?.name || user?.name} • {currentMonth}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <HiUser className="w-4 h-4" />
                {user?.name}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                title="Sair"
              >
                <HiArrowRightOnRectangle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { key: 'overview', label: 'Visão Geral', icon: HiChartBarSquare },
              { key: 'financas', label: 'Finanças', icon: HiCurrencyDollar },
              { key: 'impostos', label: 'Impostos', icon: HiReceiptTax },
              { key: 'relatorios', label: 'Relatórios', icon: HiDocumentText },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`${
                    activeTab === tab.key
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Receita Total</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceita)}</p>
                  </div>
                  <HiArrowTrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Despesas</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDespesa)}</p>
                  </div>
                  <HiCurrencyDollar className="w-8 h-8 text-red-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">DAS a Pagar</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(imposto)}</p>
                  </div>
                  <HiReceiptTax className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Saldo Final</p>
                    <p className={`text-2xl font-bold ${saldoFinal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(saldoFinal)}
                    </p>
                  </div>
                  <HiCalculator className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Próximos Vencimentos */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center gap-2 mb-4">
                <HiCalendarDays className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Próximos Vencimentos</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">DAS - Simples Nacional</p>
                    <p className="text-sm text-gray-600">Vencimento: 20/10/2024</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">{formatCurrency(imposto)}</p>
                    <p className="text-xs text-gray-500">Pendente</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financas' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Controle Financeiro</h3>
                <div className="flex gap-2">
                  <button
                    className="inline-flex items-center gap-1 rounded bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium shadow-sm transition"
                    onClick={() => addRow('Receita')}
                  >
                    <FiPlus /> Receita
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium shadow-sm transition"
                    onClick={() => addRow('Despesa')}
                  >
                    <FiPlus /> Despesa
                  </button>
                </div>
              </div>

              {/* Tabela Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, idx) => (
                      <tr key={idx} className={editIdx === idx ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="date"
                            className="text-sm text-gray-900 border-0 bg-transparent focus:ring-0 p-0"
                            value={row.date}
                            onFocus={() => setEditIdx(idx)}
                            onBlur={() => setEditIdx(null)}
                            onChange={e => handleRowChange(idx, 'date', e.target.value)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            className="text-sm border-0 bg-transparent focus:ring-0 p-0"
                            value={row.type}
                            onChange={e => handleRowChange(idx, 'type', e.target.value as Row['type'])}
                          >
                            <option value="Receita">Receita</option>
                            <option value="Despesa">Despesa</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            className="w-full text-sm text-gray-900 border-0 bg-transparent focus:ring-0 p-0"
                            value={row.desc}
                            placeholder="Descrição..."
                            onFocus={() => setEditIdx(idx)}
                            onBlur={() => setEditIdx(null)}
                            onChange={e => handleRowChange(idx, 'desc', e.target.value)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <input
                            type="number"
                            className="w-24 text-sm text-gray-900 border-0 bg-transparent focus:ring-0 p-0 text-right"
                            value={row.value}
                            step="0.01"
                            onFocus={() => setEditIdx(idx)}
                            onBlur={() => setEditIdx(null)}
                            onChange={e => handleRowChange(idx, 'value', e.target.value)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => removeRow(idx)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right font-semibold text-gray-900">
                        Total Receita
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-green-600">
                        {formatCurrency(totalReceita)}
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right font-semibold text-gray-900">
                        Total Despesa
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-red-600">
                        {formatCurrency(totalDespesa)}
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right font-bold text-gray-900">
                        Lucro
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600">{formatCurrency(lucro)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden p-4 space-y-4">
                {data.map((row, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <select
                        className="text-sm font-medium border-0 bg-transparent focus:ring-0 p-0"
                        value={row.type}
                        onChange={e => handleRowChange(idx, 'type', e.target.value as Row['type'])}
                      >
                        <option value="Receita">Receita</option>
                        <option value="Despesa">Despesa</option>
                      </select>
                      <button
                        onClick={() => removeRow(idx)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                    <input
                      type="text"
                      className="w-full text-sm text-gray-900 border-0 bg-transparent focus:ring-0 p-0 mb-2"
                      value={row.desc}
                      placeholder="Descrição..."
                      onChange={e => handleRowChange(idx, 'desc', e.target.value)}
                    />
                    <div className="flex justify-between items-center">
                      <input
                        type="date"
                        className="text-sm text-gray-600 border-0 bg-transparent focus:ring-0 p-0"
                        value={row.date}
                        onChange={e => handleRowChange(idx, 'date', e.target.value)}
                      />
                      <input
                        type="number"
                        className="w-24 text-sm font-medium border-0 bg-transparent focus:ring-0 p-0 text-right"
                        value={row.value}
                        step="0.01"
                        onChange={e => handleRowChange(idx, 'value', e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <div className="bg-white border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Receita:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(totalReceita)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Despesa:</span>
                    <span className="font-semibold text-red-600">{formatCurrency(totalDespesa)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t pt-2">
                    <span>Lucro:</span>
                    <span className="text-blue-600">{formatCurrency(lucro)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'impostos' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cálculo do DAS</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Resumo do Mês</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Faturamento bruto:</span>
                      <span className="font-medium">{formatCurrency(totalReceita)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Alíquota DAS (6%):</span>
                      <span className="font-medium">6%</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold text-gray-900">Valor do DAS:</span>
                      <span className="font-semibold text-orange-600">{formatCurrency(imposto)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Informações Importantes</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• Vencimento: Todo dia 20 do mês seguinte</p>
                    <p>• Atraso: Multa de 2% + juros de 1% ao mês</p>
                    <p>• Limite anual MEI: R$ 81.000,00</p>
                    <p>• Declaração anual obrigatória até 31/05</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'relatorios' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Relatórios Disponíveis</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <HiDocumentText className="w-6 h-6 text-blue-500 mb-2" />
                  <h4 className="font-medium text-gray-900">Relatório Mensal</h4>
                  <p className="text-sm text-gray-600">Resumo completo do mês</p>
                </button>

                <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <HiReceiptTax className="w-6 h-6 text-orange-500 mb-2" />
                  <h4 className="font-medium text-gray-900">Comprovante DAS</h4>
                  <p className="text-sm text-gray-600">Gerar comprovante de pagamento</p>
                </button>

                <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <HiChartBarSquare className="w-6 h-6 text-green-500 mb-2" />
                  <h4 className="font-medium text-gray-900">Gráfico de Vendas</h4>
                  <p className="text-sm text-gray-600">Visualização dos dados</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MeiDashboardPage() {
  return (
    <MeiProtection>
      <MeiDashboardContent />
    </MeiProtection>
  );
}
