'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  HiArrowLeft, 
  HiCreditCard, 
  HiShieldCheck, 
  HiCheckCircle,
  HiInformationCircle,
  HiCalendar,
  HiCurrencyDollar
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

      console.log('🔍 Verificando autenticação na página de pagamento');
      console.log('Usuário no localStorage:', !!stored);
      console.log('Token no localStorage:', !!token);

      if (stored && token) {
        setUser(JSON.parse(stored));
      } else {
        console.log('❌ Usuário não logado, redirecionando...');
        window.location.href = '/Login';
      }
    }
  }, [searchParams]);

  const handlePayment = async () => {
    if (!user || !plan) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');

      console.log('💳 Iniciando pagamento...');
      console.log('Token presente:', !!token);
      console.log('Dados do pagamento:', {
        planId: plan.id,
        userEmail: user.email,
        userName: user.name,
      });

      if (!token) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      const response = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: plan.id,
        }),
      });

      console.log('📥 Response status:', response.status);

      if (response.status === 401) {
        console.log('❌ Token inválido, removendo dados e redirecionando...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/Login';
        return;
      }

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erro do servidor:', errorData);
        throw new Error(`Erro ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      console.log('✅ Resposta do servidor:', data);

      if (data.url) {
        console.log('🔗 Redirecionando para Stripe:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (error) {
      console.error('💥 Erro completo:', error);
      alert(`Erro ao processar pagamento: ${error instanceof Error ? error.message : String(error)}`);
    }
    setLoading(false);
  };

  if (!plan || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Carregando informações...</p>
        </div>
      </div>
    );
  }

  // Benefícios do plano baseado no ID
  const planBenefits = {
    'essencial': [
      'Controle básico de receitas e despesas',
      'Relatórios mensais simples',
      'Suporte via chat',
      'Backup automático',
      'Acesso via web'
    ],
    'profissional': [
      'Todas as funcionalidades do Essencial',
      'Relatórios avançados e personalizados',
      'Integração com bancos',
      'Controle de estoque',
      'Suporte prioritário',
      'Aplicativo móvel'
    ],
    'premium': [
      'Todas as funcionalidades do Profissional',
      'Consultoria personalizada mensal',
      'Relatórios fiscais automatizados',
      'API para integrações',
      'Suporte 24/7',
      'Treinamento personalizado'
    ]
  };

  const currentBenefits = planBenefits[plan.id as keyof typeof planBenefits] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-6 font-medium"
          >
            <HiArrowLeft className="w-5 h-5" />
            Voltar aos planos
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Finalizar Assinatura</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Você está a um passo de transformar a gestão do seu MEI com o PaimContab
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Coluna Principal - Dados do Plano */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resumo do Plano */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h2 className="text-2xl font-bold">Plano {plan.name}</h2>
                    <p className="text-blue-100 mt-1">Solução completa para seu MEI</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{plan.priceFormatted}</div>
                    <div className="text-blue-100 text-sm">por mês</div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <HiCheckCircle className="w-6 h-6 text-green-600" />
                  O que está incluso:
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {currentBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <HiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Detalhes da Cobrança */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <HiCurrencyDollar className="w-6 h-6 text-blue-600" />
                Detalhes da Cobrança
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-700 font-medium">Plano {plan.name}</span>
                  <span className="text-gray-900 font-semibold">{plan.priceFormatted}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-700">Tipo de cobrança</span>
                  <span className="text-gray-900 font-medium">Mensal</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-700">Primeiro pagamento</span>
                  <span className="text-gray-900 font-medium">Hoje</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-700">Próxima cobrança</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="text-lg font-semibold text-gray-900">Total hoje</span>
                  <span className="text-2xl font-bold text-blue-600">{plan.priceFormatted}</span>
                </div>
              </div>
            </div>

            {/* Informações de Segurança */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <HiShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">Pagamento 100% Seguro</h4>
                  <p className="text-green-800 text-sm leading-relaxed">
                    Seus dados são protegidos com criptografia SSL de 256 bits. 
                    Processamento seguro via Stripe, usado por milhões de empresas worldwide.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Resumo e Ação */}
          <div className="space-y-6">
            {/* Dados da Conta */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados da Conta</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo da Compra */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo da Compra</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>{plan.priceFormatted}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Taxas</span>
                  <span className="text-green-600">R$ 0,00</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-blue-600">{plan.priceFormatted}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão de Pagamento */}
            <button
              onClick={handlePayment}
              disabled={loading}
              className={`
                w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-4 font-semibold text-lg
                flex items-center justify-center gap-3 transition-all duration-200 shadow-lg
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl transform hover:-translate-y-0.5'}
              `}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <HiCreditCard className="w-6 h-6" />
                  <span>Finalizar Pagamento</span>
                </>
              )}
            </button>

            {/* Garantia */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <HiInformationCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900 text-sm mb-1">Garantia de 7 dias</h4>
                  <p className="text-amber-800 text-xs leading-relaxed">
                    Não ficou satisfeito? Cancele nos primeiros 7 dias e receba 100% do seu dinheiro de volta.
                  </p>
                </div>
              </div>
            </div>

            {/* Termos */}
            <div className="text-center">
              <p className="text-sm text-gray-500 leading-relaxed">
                Ao continuar, você concorda com nossos{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 underline font-medium">
                  Termos de Serviço
                </a>
                {' '}e{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 underline font-medium">
                  Política de Privacidade
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Debug Info (apenas em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && (
          <div className="mt-8 bg-gray-100 border border-gray-300 rounded-lg p-4">
            <div className="text-sm text-gray-700">
              <p><strong>Debug (Desenvolvimento):</strong></p>
              <p>Token: {localStorage.getItem('authToken') ? '✅ Presente' : '❌ Ausente'}</p>
              <p>Usuário: {user.name} ({user.email})</p>
              <p>Plano: {plan.name} - {plan.priceFormatted}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Carregando...</p>
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}