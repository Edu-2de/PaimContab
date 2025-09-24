'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  HiArrowLeft, 
  HiCreditCard, 
  HiShieldCheck, 
  HiCheckCircle
} from 'react-icons/hi2';

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
      const token = localStorage.getItem('authToken');

      if (stored && token) {
        setUser(JSON.parse(stored));
      } else {
        window.location.href = '/Login';
      }
    }
  }, [searchParams]);

  const handlePayment = async () => {
    if (!user || !plan) return;

    // Verificar se há token
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Sessão expirada. Faça login novamente.');
      window.location.href = '/Login';
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: plan.id,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        alert('Sessão expirada. Faça login novamente.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/Login';
        return;
      }

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ${response.status}: ${errorData}`);
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (error) {
      alert(`Erro ao processar pagamento: ${error instanceof Error ? error.message : String(error)}`);
    }
    setLoading(false);
  };

  if (!plan || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-black mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Benefícios essenciais por plano
  const planBenefits = {
    'essencial': [
      'Controle de receitas e despesas',
      'Relatórios mensais',
      'Suporte via chat',
      'Backup automático'
    ],
    'profissional': [
      'Tudo do Essencial',
      'Relatórios avançados',
      'Integração bancária',
      'Suporte prioritário'
    ],
    'premium': [
      'Tudo do Profissional',
      'Consultoria mensal',
      'API para integrações',
      'Suporte 24/7'
    ]
  };

  const currentBenefits = planBenefits[plan.id as keyof typeof planBenefits] || [];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header Clean */}
        <div className="mb-12">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8 text-sm"
          >
            <HiArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-black mb-4">Finalizar assinatura</h1>
            <p className="text-gray-600">
              Complete sua assinatura do PaimContab e comece a gerenciar seu MEI hoje mesmo.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-3 space-y-8">
            {/* Plano Selecionado */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-black">Plano {plan.name}</h2>
                  <p className="text-gray-500 text-sm">Assinatura mensal</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-black">{plan.priceFormatted}</div>
                  <div className="text-gray-500 text-sm">por mês</div>
                </div>
              </div>

              <div className="space-y-3">
                {currentBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <HiCheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Informações de Cobrança */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-black mb-4">Detalhes da cobrança</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Plano {plan.name}</span>
                  <span className="text-black font-medium">{plan.priceFormatted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Primeiro pagamento</span>
                  <span className="text-black">Hoje</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Próxima cobrança</span>
                  <span className="text-black">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 mt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold text-black">Total</span>
                    <span className="font-bold text-black text-lg">{plan.priceFormatted}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Segurança */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <HiShieldCheck className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-black text-sm">Pagamento seguro</div>
                <div className="text-gray-600 text-xs">Processado via Stripe com criptografia SSL</div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conta */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-black mb-4">Conta</h3>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-black text-sm">{user.name}</div>
                  <div className="text-gray-500 text-xs">{user.email}</div>
                </div>
              </div>
            </div>

            {/* Resumo */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-black mb-4">Resumo</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-black">{plan.priceFormatted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxas</span>
                  <span className="text-black">R$ 0,00</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-black">Total</span>
                    <span className="font-bold text-black">{plan.priceFormatted}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão de Pagamento */}
            <button
              onClick={handlePayment}
              disabled={loading}
              className={`
                w-full bg-black text-white rounded-lg px-6 py-3 font-medium
                flex items-center justify-center gap-3 transition-all duration-200
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'}
              `}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <HiCreditCard className="w-5 h-5" />
                  <span>Finalizar pagamento</span>
                </>
              )}
            </button>

            {/* Garantia */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Garantia de 7 dias. Cancele a qualquer momento.
              </p>
            </div>

            {/* Termos */}
            <div className="text-center">
              <p className="text-xs text-gray-400 leading-relaxed">
                Ao continuar, você concorda com os{' '}
                <a href="#" className="text-black hover:underline">
                  termos de serviço
                </a>
                {' '}e{' '}
                <a href="#" className="text-black hover:underline">
                  política de privacidade
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-black mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}