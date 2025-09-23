'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { HiArrowLeft, HiCreditCard } from 'react-icons/hi2';

function PaymentContent() {
  const searchParams = useSearchParams();
  type Plan = { id: string; name: string; priceFormatted: string };
  type User = { id?: string; name: string; email: string };

  const [plan, setPlan] = useState<Plan | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Recuperar dados do plano da URL
    const planParam = searchParams.get('plan');
    if (planParam) {
      try {
        const planData = JSON.parse(decodeURIComponent(planParam));
        setPlan(planData);
      } catch (error) {
        console.error('Erro ao decodificar plano:', error);
      }
    }

    // Recuperar usuário do localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Se não estiver logado, redireciona
        window.location.href = '/Login';
      }
    }
  }, [searchParams]);

  const handlePayment = async () => {
    if (!user || !plan) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/payment/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          userId: user.id || user.email, // Ajuste conforme sua estrutura
        }),
      });

      const data = await response.json();
      if (data.url) {
        // Redireciona para o Stripe
        window.location.href = data.url;
      } else {
        alert('Erro ao criar sessão de pagamento');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao processar pagamento');
    }
    setLoading(false);
  };

  if (!plan || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <HiArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Finalizar Assinatura</h1>
          <p className="text-gray-600 mt-2">Confirme os detalhes do seu plano</p>
        </div>

        {/* Resumo do Plano */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Plano {plan.name}</h2>
            <span className="text-3xl font-bold text-gray-900">{plan.priceFormatted}</span>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo de cobrança:</span>
              <span className="font-medium">Mensal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Primeiro pagamento:</span>
              <span className="font-medium">Hoje</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Próxima cobrança:</span>
              <span className="font-medium">
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total hoje:</span>
              <span>{plan.priceFormatted}</span>
            </div>
          </div>
        </div>

        {/* Dados do Cliente */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h3 className="text-lg font-semibold mb-4">Dados da conta</h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">Nome:</span>
              <span className="ml-2 font-medium">{user.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-medium">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Botão de Pagamento */}
        <button
          onClick={handlePayment}
          disabled={loading}
          className={`
            w-full bg-gray-900 text-white rounded-xl px-6 py-4 font-semibold text-lg
            flex items-center justify-center gap-3 transition
            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800 active:scale-95'}
          `}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <HiCreditCard className="w-6 h-6" />
              Pagar com Cartão
            </>
          )}
        </button>

        {/* Termos */}
        <p className="text-sm text-gray-500 text-center mt-6">
          Ao continuar, você concorda com nossos{' '}
          <a href="#" className="text-gray-700 underline">
            Termos de Serviço
          </a>
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
