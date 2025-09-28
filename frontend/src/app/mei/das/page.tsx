'use client';

import { useState } from 'react';
import MeiProtection from '../../../components/MeiProtection';
import MeiSidebar from '../../../components/MeiSidebar';
import {
  HiCalculator,
  HiCalendar,
  HiCurrencyDollar,
  HiExclamationTriangle,
  HiCheckCircle,
  HiArrowDownTray,
  HiPrinter,
  HiInformationCircle,
} from 'react-icons/hi2';

interface DASCalculation {
  month: string;
  revenue: number;
  dasValue: number;
  dueDate: string;
  isPaid: boolean;
  paymentDate?: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

// Função para calcular o DAS baseado na receita bruta
function calculateDAS(revenue: number): number {
  // Para MEI: Anexo XI do Simples Nacional
  // Alíquota única de 6% sobre a receita bruta até R$ 6.750 por mês (R$ 81.000 por ano)
  const DAS_RATE = 0.06;
  const MIN_DAS_VALUE = 66.6; // Valor mínimo do DAS MEI 2024

  const calculatedDAS = revenue * DAS_RATE;
  return Math.max(calculatedDAS, MIN_DAS_VALUE);
}

function DASContent() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [customRevenue, setCustomRevenue] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);

  // Dados mockados de receitas mensais
  const [monthlyRevenues] = useState<MonthlyRevenue[]>([
    { month: '2024-09', revenue: 4500 },
    { month: '2024-08', revenue: 3800 },
    { month: '2024-07', revenue: 5200 },
    { month: '2024-06', revenue: 2900 },
    { month: '2024-05', revenue: 4100 },
    { month: '2024-04', revenue: 3600 },
  ]);

  // Histórico de DAS
  const [dasHistory, setDasHistory] = useState<DASCalculation[]>([
    {
      month: '2024-09',
      revenue: 4500,
      dasValue: 270,
      dueDate: '2024-10-20',
      isPaid: false,
    },
    {
      month: '2024-08',
      revenue: 3800,
      dasValue: 228,
      dueDate: '2024-09-20',
      isPaid: true,
      paymentDate: '2024-09-18',
    },
    {
      month: '2024-07',
      revenue: 5200,
      dasValue: 312,
      dueDate: '2024-08-20',
      isPaid: true,
      paymentDate: '2024-08-15',
    },
    {
      month: '2024-06',
      revenue: 2900,
      dasValue: 174,
      dueDate: '2024-07-20',
      isPaid: true,
      paymentDate: '2024-07-19',
    },
  ]);

  const currentRevenue = monthlyRevenues.find(r => r.month === selectedMonth)?.revenue || 0;
  const calculatedDAS = calculateDAS(currentRevenue);
  const customDAS = customRevenue ? calculateDAS(parseFloat(customRevenue)) : 0;

  // Estatísticas
  const totalDASPaid = dasHistory.filter(d => d.isPaid).reduce((sum, d) => sum + d.dasValue, 0);
  const pendingDAS = dasHistory.filter(d => !d.isPaid).reduce((sum, d) => sum + d.dasValue, 0);
  const averageDAS = dasHistory.length > 0 ? dasHistory.reduce((sum, d) => sum + d.dasValue, 0) / dasHistory.length : 0;

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const markAsPaid = (month: string) => {
    setDasHistory(prev =>
      prev.map(das =>
        das.month === month ? { ...das, isPaid: true, paymentDate: new Date().toISOString().slice(0, 10) } : das
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <MeiSidebar currentPage="das" />

      <div className="mei-content-wrapper">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">DAS e Impostos</h1>
                <p className="text-slate-600 mt-1 text-sm">Calcule e gerencie seus impostos MEI</p>
              </div>
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <HiCalculator className="w-5 h-5" />
                Calculadora DAS
              </button>
            </div>
          </div>
        </div>

        {/* Calculadora DAS */}
        {showCalculator && (
          <div className="px-8 py-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <HiCalculator className="w-5 h-5" />
                Calculadora de DAS
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Receita Bruta Mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={customRevenue}
                    onChange={e => setCustomRevenue(e.target.value)}
                    placeholder="Digite a receita do mês"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">DAS Calculado</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {customRevenue ? formatCurrency(customDAS) : 'R$ 0,00'}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Alíquota: 6% | Vencimento: dia 20 do mês seguinte</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex">
                  <HiInformationCircle className="w-5 h-5 text-amber-500 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-800">Como funciona o cálculo</h4>
                    <p className="text-xs text-amber-700 mt-1">
                      O DAS MEI é calculado com alíquota de 6% sobre a receita bruta mensal, com valor mínimo de R$
                      66,60. O pagamento deve ser feito até o dia 20 do mês seguinte ao da competência.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estatísticas */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-50 rounded-lg mr-4">
                  <HiCheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Pago no Ano</p>
                  <p className="text-2xl font-semibold text-slate-900">{formatCurrency(totalDASPaid)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-amber-50 rounded-lg mr-4">
                  <HiExclamationTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Pendente</p>
                  <p className="text-2xl font-semibold text-slate-900">{formatCurrency(pendingDAS)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-50 rounded-lg mr-4">
                  <HiCurrencyDollar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Média Mensal</p>
                  <p className="text-2xl font-semibold text-slate-900">{formatCurrency(averageDAS)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-50 rounded-lg mr-4">
                  <HiCalendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Próximo DAS</p>
                  <p className="text-2xl font-semibold text-slate-900">{formatCurrency(calculatedDAS)}</p>
                  <p className="text-xs text-slate-500">
                    Venc: 20/{(parseInt(selectedMonth.split('-')[1]) + 1).toString().padStart(2, '0')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DAS Atual */}
        <div className="px-8 py-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">DAS do Mês Atual</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Selecionar Competência</label>
                    <select
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {monthlyRevenues.map(month => (
                        <option key={month.month} value={month.month}>
                          {new Date(month.month + '-01').toLocaleDateString('pt-BR', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Receita Bruta:</span>
                      <span className="text-sm font-medium text-slate-900">{formatCurrency(currentRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Alíquota:</span>
                      <span className="text-sm font-medium text-slate-900">6%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Valor Mínimo:</span>
                      <span className="text-sm font-medium text-slate-900">R$ 66,60</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2">
                      <div className="flex justify-between">
                        <span className="text-base font-medium text-slate-900">Valor DAS:</span>
                        <span className="text-base font-bold text-blue-600">{formatCurrency(calculatedDAS)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-3">Guia de Pagamento</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-800">Código:</span>
                    <span className="font-medium text-blue-900">MEI - Microempreendedor</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800">Competência:</span>
                    <span className="font-medium text-blue-900">{selectedMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800">Vencimento:</span>
                    <span className="font-medium text-blue-900">
                      20/{(parseInt(selectedMonth.split('-')[1]) + 1).toString().padStart(2, '0')}/
                      {selectedMonth.split('-')[0]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800">Valor:</span>
                    <span className="font-bold text-blue-900">{formatCurrency(calculatedDAS)}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                    <HiArrowDownTray className="w-4 h-4" />
                    Baixar
                  </button>
                  <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-white text-blue-600 text-sm border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                    <HiPrinter className="w-4 h-4" />
                    Imprimir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Histórico de DAS */}
        <div className="px-8 py-4 pb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Histórico de DAS</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Competência
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Receita Base
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Valor DAS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Vencimento
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
                  {dasHistory.map(das => {
                    const daysUntilDue = getDaysUntilDue(das.dueDate);

                    return (
                      <tr key={das.month} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            {new Date(das.month + '-01').toLocaleDateString('pt-BR', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">{formatCurrency(das.revenue)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-900">{formatCurrency(das.dasValue)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">{formatDate(das.dueDate)}</div>
                          {!das.isPaid && daysUntilDue <= 7 && daysUntilDue >= 0 && (
                            <div className="text-xs text-amber-600">Vence em {daysUntilDue} dias</div>
                          )}
                          {!das.isPaid && daysUntilDue < 0 && (
                            <div className="text-xs text-red-600">Vencido há {Math.abs(daysUntilDue)} dias</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              das.isPaid
                                ? 'bg-green-100 text-green-800'
                                : daysUntilDue < 0
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {das.isPaid ? 'Pago' : daysUntilDue < 0 ? 'Vencido' : 'Pendente'}
                          </span>
                          {das.isPaid && das.paymentDate && (
                            <div className="text-xs text-slate-500 mt-1">Pago em {formatDate(das.paymentDate)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!das.isPaid ? (
                            <button
                              onClick={() => markAsPaid(das.month)}
                              className="text-green-600 hover:text-green-900 text-sm"
                            >
                              Marcar como Pago
                            </button>
                          ) : (
                            <button className="text-blue-600 hover:text-blue-900 text-sm">Baixar Comprovante</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DASPage() {
  return (
    <MeiProtection>
      <DASContent />
    </MeiProtection>
  );
}
