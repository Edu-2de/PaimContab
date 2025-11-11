'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { apiClient } from '@/utils/apiClient';

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

  useEffect(() => {
    loadSubscription();
    loadPlans();
  }, [id]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/subscriptions/${id}`);
      setSubscription(response.data);
      setSelectedPlanId(response.data.planId);
      setError('');
    } catch (err: any) {
      console.error('Erro ao carregar assinatura:', err);
      setError(err.response?.data?.error || 'Erro ao carregar assinatura');
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await api.get('/plans');
      setPlans(response.data);
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
    }
  };

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountForm.percentage || parseFloat(discountForm.percentage) <= 0) {
      setError('Digite uma porcentagem válida');
      return;
    }

    try {
      setApplyingDiscount(true);
      setError('');

      await api.post(`/admin/subscriptions/${id}/discount`, {
        percentage: parseFloat(discountForm.percentage),
        endDate: discountForm.endDate || null,
        reason: discountForm.reason || null,
      });

      setSuccessMessage('Desconto aplicado com sucesso!');
      setDiscountForm({ percentage: '', endDate: '', reason: '' });
      await loadSubscription();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Erro ao aplicar desconto:', err);
      setError(err.response?.data?.error || 'Erro ao aplicar desconto');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = async () => {
    if (!confirm('Tem certeza que deseja remover o desconto?')) return;

    try {
      setError('');
      await api.delete(`/admin/subscriptions/${id}/discount`);
      setSuccessMessage('Desconto removido com sucesso!');
      await loadSubscription();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Erro ao remover desconto:', err);
      setError(err.response?.data?.error || 'Erro ao remover desconto');
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

      await api.patch(`/admin/subscriptions/${id}/plan`, {
        planId: selectedPlanId,
      });

      setSuccessMessage('Plano alterado com sucesso!');
      await loadSubscription();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Erro ao alterar plano:', err);
      setError(err.response?.data?.error || 'Erro ao alterar plano');
    } finally {
      setChangingPlan(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja CANCELAR esta assinatura? Esta ação não pode ser desfeita.')) return;

    try {
      setError('');
      await api.patch(`/admin/subscriptions/${id}/cancel`);
      setSuccessMessage('Assinatura cancelada com sucesso!');
      await loadSubscription();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Erro ao cancelar assinatura:', err);
      setError(err.response?.data?.error || 'Erro ao cancelar assinatura');
    }
  };

  const handleReactivateSubscription = async () => {
    if (!confirm('Tem certeza que deseja REATIVAR esta assinatura?')) return;

    try {
      setError('');
      await api.patch(`/admin/subscriptions/${id}/reactivate`);
      setSuccessMessage('Assinatura reativada com sucesso!');
      await loadSubscription();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Erro ao reativar assinatura:', err);
      setError(err.response?.data?.error || 'Erro ao reativar assinatura');
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
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
          <button
            onClick={() => router.push('/admin/subscriptions')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Voltar para Assinaturas
          </button>
        </div>
      </div>
    );
  }

  if (!subscription) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Detalhes da Assinatura</h1>
            <button
              onClick={() => router.push('/admin/subscriptions')}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              ← Voltar para lista
            </button>
          </div>
          <div className="flex gap-2">
            {subscription.isActive ? (
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Cancelar Assinatura
              </button>
            ) : (
              <button
                onClick={handleReactivateSubscription}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Reativar Assinatura
              </button>
            )}
          </div>
        </div>

        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações do Usuário */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Informações do Usuário</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">Nome:</span>
                <p className="font-medium">{subscription.user.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium">{subscription.user.email}</p>
              </div>
              <div>
                <span className="text-gray-600">Cadastrado em:</span>
                <p className="font-medium">{formatDate(subscription.user.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Informações do Plano */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Plano Atual</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">Plano:</span>
                <p className="font-medium">{subscription.plan.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Preço Original:</span>
                <p className="font-medium">{formatCurrency(subscription.originalAmount || subscription.plan.price)}</p>
              </div>
              {subscription.discount && (
                <div>
                  <span className="text-gray-600">Desconto:</span>
                  <p className="font-medium text-green-600">{subscription.discount.percentage}% OFF</p>
                </div>
              )}
              <div>
                <span className="text-gray-600">Preço Final:</span>
                <p className="font-bold text-lg text-blue-600">{formatCurrency(subscription.amount)}</p>
              </div>
              <div>
                <span className="text-gray-600">Ciclo:</span>
                <p className="font-medium capitalize">{subscription.plan.billingCycle}</p>
              </div>
            </div>
          </div>

          {/* Informações da Assinatura */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Detalhes da Assinatura</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">Status:</span>
                <p className={`font-medium ${subscription.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {subscription.isActive ? 'Ativa' : 'Inativa'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Data de Início:</span>
                <p className="font-medium">{formatDate(subscription.startDate)}</p>
              </div>
              {subscription.endDate && (
                <div>
                  <span className="text-gray-600">Data de Término:</span>
                  <p className="font-medium">{formatDate(subscription.endDate)}</p>
                </div>
              )}
              <div>
                <span className="text-gray-600">Criada em:</span>
                <p className="font-medium">{formatDate(subscription.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Desconto Ativo */}
          {subscription.discount && (
            <div className="bg-green-50 border border-green-200 rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Desconto Ativo</h2>
                <button
                  onClick={handleRemoveDiscount}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  Remover
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">Porcentagem:</span>
                  <p className="font-bold text-green-600">{subscription.discount.percentage}%</p>
                </div>
                <div>
                  <span className="text-gray-600">Início:</span>
                  <p className="font-medium">{formatDate(subscription.discount.startDate)}</p>
                </div>
                {subscription.discount.endDate && (
                  <div>
                    <span className="text-gray-600">Término:</span>
                    <p className="font-medium">{formatDate(subscription.discount.endDate)}</p>
                  </div>
                )}
                {subscription.discount.reason && (
                  <div>
                    <span className="text-gray-600">Motivo:</span>
                    <p className="font-medium">{subscription.discount.reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Aplicar Desconto */}
        {!subscription.discount && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Aplicar Desconto</h2>
            <form onSubmit={handleApplyDiscount} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Porcentagem (%)*</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={discountForm.percentage}
                    onChange={e => setDiscountForm({ ...discountForm, percentage: e.target.value })}
                    className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Data de Término (Opcional)</label>
                  <input
                    type="date"
                    value={discountForm.endDate}
                    onChange={e => setDiscountForm({ ...discountForm, endDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Motivo (Opcional)</label>
                  <input
                    type="text"
                    value={discountForm.reason}
                    onChange={e => setDiscountForm({ ...discountForm, reason: e.target.value })}
                    className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Cliente fiel"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={applyingDiscount}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {applyingDiscount ? 'Aplicando...' : 'Aplicar Desconto'}
              </button>
            </form>
          </div>
        )}

        {/* Alterar Plano */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Alterar Plano</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-gray-700 mb-2">Selecionar Novo Plano</label>
              <select
                value={selectedPlanId}
                onChange={e => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {formatCurrency(plan.price)}/{plan.billingCycle}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleChangePlan}
              disabled={changingPlan || selectedPlanId === subscription.planId}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {changingPlan ? 'Alterando...' : 'Alterar Plano'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
