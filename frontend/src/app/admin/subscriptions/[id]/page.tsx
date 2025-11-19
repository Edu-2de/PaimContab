'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { apiClient } from '@/utils/apiClient';
import {
  HiArrowLeft,
  HiUser,
  HiCreditCard,
  HiCalendar,
  HiTag,
  HiXMark,
  HiCheckCircle,
  HiXCircle,
} from 'react-icons/hi2';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  plan: {
    id: string;
    name: string;
    price: number;
    billingCycle: string;
  };
  amount: number;
  originalAmount: number;
  discount: {
    id: string;
    percentage: number;
    startDate: string;
    endDate: string | null;
    reason: string | null;
    createdBy: string;
    isActive: boolean;
  } | null;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
}

export default function SubscriptionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Formulário de desconto
  const [discountForm, setDiscountForm] = useState({
    percentage: '',
    endDate: '',
    reason: '',
  });
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // Mudança de plano
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [changingPlan, setChangingPlan] = useState(false);

  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`${API_BASE}/admin/subscriptions/${id}`);
      if (response.success && response.data) {
        setSubscription(response.data as Subscription);
        setSelectedPlanId((response.data as Subscription).planId);
        setError('');
      } else {
        setError(response.error || 'Erro ao carregar assinatura');
      }
    } catch (err) {
      console.error('Erro ao carregar assinatura:', err);
      setError('Erro ao carregar assinatura');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadPlans = useCallback(async () => {
    try {
      console.log('🔍 Carregando planos...');
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/plans`;
      console.log('📍 URL:', url);

      const response = await apiClient.get(url);
      console.log('📦 Resposta dos planos:', response);

      if (response.success && response.data) {
        console.log('✅ Planos carregados:', response.data);
        setPlans(response.data as Plan[]);
      } else {
        console.error('❌ Erro ao carregar planos:', response.error);
        setError(response.error || 'Erro ao carregar planos');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar planos:', err);
      setError('Erro ao carregar planos');
    }
  }, []);

  useEffect(() => {
    loadSubscription();
    loadPlans();
  }, [loadSubscription, loadPlans]);

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountForm.percentage || parseFloat(discountForm.percentage) <= 0) {
      setError('Digite uma porcentagem válida');
      return;
    }

    try {
      setApplyingDiscount(true);
      setError('');

      const response = await apiClient.post(`${API_BASE}/admin/subscriptions/${id}/discount`, {
        percentage: parseFloat(discountForm.percentage),
        endDate: discountForm.endDate || null,
        reason: discountForm.reason || null,
      });

      if (response.success) {
        setSuccessMessage('Desconto aplicado com sucesso!');
        setDiscountForm({ percentage: '', endDate: '', reason: '' });
        await loadSubscription();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Erro ao aplicar desconto');
      }
    } catch (err) {
      console.error('Erro ao aplicar desconto:', err);
      setError('Erro ao aplicar desconto');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = async () => {
    if (!confirm('Tem certeza que deseja remover o desconto?')) return;

    try {
      setError('');
      const response = await apiClient.delete(`${API_BASE}/admin/subscriptions/${id}/discount`);

      if (response.success) {
        setSuccessMessage('Desconto removido com sucesso!');
        await loadSubscription();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Erro ao remover desconto');
      }
    } catch (err) {
      console.error('Erro ao remover desconto:', err);
      setError('Erro ao remover desconto');
    }
  };

  const handleChangePlan = async () => {
    if (!selectedPlanId || selectedPlanId === subscription?.planId) {
      setError('Selecione um plano diferente');
      return;
    }

    if (!confirm('Tem certeza que deseja alterar o plano desta assinatura?')) return;

    try {
      setChangingPlan(true);
      setError('');

      const response = await apiClient.patch(`${API_BASE}/admin/subscriptions/${id}/plan`, {
        planId: selectedPlanId,
      });

      if (response.success) {
        setSuccessMessage('Plano alterado com sucesso!');
        await loadSubscription();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Erro ao alterar plano');
      }
    } catch (err) {
      console.error('Erro ao alterar plano:', err);
      setError('Erro ao alterar plano');
    } finally {
      setChangingPlan(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja CANCELAR esta assinatura? Esta ação não pode ser desfeita.')) return;

    try {
      setError('');
      const response = await apiClient.patch(`${API_BASE}/admin/subscriptions/${id}/cancel`);

      if (response.success) {
        setSuccessMessage('Assinatura cancelada com sucesso!');
        await loadSubscription();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Erro ao cancelar assinatura');
      }
    } catch (err) {
      console.error('Erro ao cancelar assinatura:', err);
      setError('Erro ao cancelar assinatura');
    }
  };

  const handleReactivateSubscription = async () => {
    if (!confirm('Tem certeza que deseja REATIVAR esta assinatura?')) return;

    try {
      setError('');
      const response = await apiClient.patch(`${API_BASE}/admin/subscriptions/${id}/reactivate`);

      if (response.success) {
        setSuccessMessage('Assinatura reativada com sucesso!');
        await loadSubscription();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Erro ao reativar assinatura');
      }
    } catch (err) {
      console.error('Erro ao reativar assinatura:', err);
      setError('Erro ao reativar assinatura');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div>
        <AdminSidebar currentPage="subscriptions" />
        <div className="ml-64 flex items-center justify-center bg-white min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando assinatura...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <div>
        <AdminSidebar currentPage="subscriptions" />
        <div className="ml-64 min-h-screen bg-white">
          <div className="p-8">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{error}</div>
            <button
              onClick={() => router.push('/admin/subscriptions')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200"
            >
              <HiArrowLeft className="w-5 h-5" />
              Voltar para Assinaturas
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) return null;

  return (
    <div>
      <AdminSidebar currentPage="subscriptions" />
      <div className="ml-64 min-h-screen bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/subscriptions')}
                className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
              >
                <HiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detalhes da Assinatura</h1>
                <p className="text-gray-500 mt-1 text-sm">Gerencie e visualize informações completas</p>
              </div>
            </div>
            <div className="flex gap-3">
              {subscription.isActive ? (
                <button
                  onClick={handleCancelSubscription}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg transition-all duration-200 font-medium"
                >
                  <HiXCircle className="w-5 h-5" />
                  Cancelar Assinatura
                </button>
              ) : (
                <button
                  onClick={handleReactivateSubscription}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all duration-200 font-medium"
                >
                  <HiCheckCircle className="w-5 h-5" />
                  Reativar Assinatura
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Alerts */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card: Informações do Usuário */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <HiUser className="w-5 h-5 text-gray-500" />
                  Informações do Usuário
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-sm text-gray-500 font-medium block mb-1">Nome</span>
                  <p className="text-gray-900">{subscription.user.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 font-medium block mb-1">Email</span>
                  <p className="text-gray-900">{subscription.user.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 font-medium block mb-1">Cadastrado em</span>
                  <p className="text-gray-900">{formatDate(subscription.user.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Card: Informações do Plano */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <HiCreditCard className="w-5 h-5 text-gray-500" />
                  Plano Atual
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-sm text-gray-500 font-medium block mb-1">Plano</span>
                  <p className="text-gray-900">{subscription.plan.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 font-medium block mb-1">Preço Original</span>
                  <p className="text-gray-900">
                    {formatCurrency(subscription.originalAmount || subscription.plan.price)}
                  </p>
                </div>
                {subscription.discount && (
                  <div>
                    <span className="text-sm text-gray-500 font-medium block mb-1">Desconto</span>
                    <p className="text-emerald-600 font-semibold">{subscription.discount.percentage}% OFF</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500 font-medium block mb-1">Preço Final</span>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(subscription.amount)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 font-medium block mb-1">Ciclo de Cobrança</span>
                  <p className="text-gray-900 capitalize">{subscription.plan.billingCycle}</p>
                </div>
              </div>
            </div>

            {/* Card: Detalhes da Assinatura */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <HiCalendar className="w-5 h-5 text-gray-500" />
                  Detalhes da Assinatura
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-sm text-gray-500 font-medium block mb-1">Status</span>
                  <p className={`font-semibold ${subscription.isActive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {subscription.isActive ? 'Ativa' : 'Inativa'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 font-medium block mb-1">Data de Início</span>
                  <p className="text-gray-900">{formatDate(subscription.startDate)}</p>
                </div>
                {subscription.endDate && (
                  <div>
                    <span className="text-sm text-gray-500 font-medium block mb-1">Data de Término</span>
                    <p className="text-gray-900">{formatDate(subscription.endDate)}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500 font-medium block mb-1">Criada em</span>
                  <p className="text-gray-900">{formatDate(subscription.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Card: Desconto Ativo (se houver) */}
            {subscription.discount && (
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <HiTag className="w-5 h-5 text-emerald-600" />
                      Desconto Ativo
                    </h2>
                    <button
                      onClick={handleRemoveDiscount}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-sm rounded-lg hover:bg-red-100 border border-red-200 transition-all duration-200"
                    >
                      <HiXMark className="w-4 h-4" />
                      Remover
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <span className="text-sm text-gray-500 font-medium block mb-1">Porcentagem</span>
                    <p className="text-2xl font-bold text-emerald-600">{subscription.discount.percentage}%</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 font-medium block mb-1">Início</span>
                    <p className="text-gray-900">{formatDate(subscription.discount.startDate)}</p>
                  </div>
                  {subscription.discount.endDate && (
                    <div>
                      <span className="text-sm text-gray-500 font-medium block mb-1">Término</span>
                      <p className="text-gray-900">{formatDate(subscription.discount.endDate)}</p>
                    </div>
                  )}
                  {subscription.discount.reason && (
                    <div>
                      <span className="text-sm text-gray-500 font-medium block mb-1">Motivo</span>
                      <p className="text-gray-900">{subscription.discount.reason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Formulário: Aplicar Desconto */}
          {!subscription.discount && (
            <div className="mt-6 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Aplicar Desconto</h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleApplyDiscount} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Porcentagem (%)<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={discountForm.percentage}
                        onChange={e => setDiscountForm({ ...discountForm, percentage: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none text-gray-900"
                        required
                        placeholder="Ex: 15"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data de Término (Opcional)</label>
                      <input
                        type="date"
                        value={discountForm.endDate}
                        onChange={e => setDiscountForm({ ...discountForm, endDate: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Motivo (Opcional)</label>
                      <input
                        type="text"
                        value={discountForm.reason}
                        onChange={e => setDiscountForm({ ...discountForm, reason: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none text-gray-900"
                        placeholder="Ex: Cliente fiel"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={applyingDiscount}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    {applyingDiscount ? 'Aplicando...' : 'Aplicar Desconto'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Formulário: Alterar Plano */}
          <div className="mt-6 bg-white border border-gray-100 rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Alterar Plano</h2>
            </div>
            <div className="p-6">
              <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar Novo Plano</label>
                <select
                  value={selectedPlanId}
                  onChange={e => setSelectedPlanId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 font-medium"
                  disabled={plans.length === 0}
                >
                  {plans.length === 0 ? (
                    <option value="">Carregando planos...</option>
                  ) : (
                    plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {formatCurrency(plan.price)}/{plan.billingCycle}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <button
                onClick={handleChangePlan}
                disabled={changingPlan || selectedPlanId === subscription.planId || plans.length === 0}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {changingPlan ? 'Alterando...' : 'Alterar Plano'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
