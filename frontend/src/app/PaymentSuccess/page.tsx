"use client";
import { useState, useEffect } from "react";
import { HiCheckCircle, HiArrowRight, HiCalendar, HiClock, HiSparkles } from "react-icons/hi2";

export default function PaymentSuccess() {
  const [user, setUser] = useState<{ companyId?: string; name?: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleGoToDashboard = () => {
    if (user?.companyId) {
      window.location.href = `/mei/${user.companyId}/dashboard`;
    } else {
      window.location.href = '/setup-company';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header com logo/nome da empresa */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-black">PaimContab</h2>
        </div>

        {/* Conteúdo principal */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Banner de sucesso */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <HiCheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              🎉 Parabéns, {user?.name || 'Empresário'}!
            </h1>
            <p className="text-green-50 text-lg">
              Seu pagamento foi confirmado e sua assinatura está ativa!
            </p>
          </div>

          <div className="p-8 space-y-8">
            {/* Informações da Dashboard MEI */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <HiSparkles className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Bem-vindo à Dashboard MEI Completa
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Você agora tem acesso a uma plataforma profissional e completa para gestão do seu MEI. 
                    Nossa dashboard oferece controle total de receitas, despesas, DAS, relatórios, 
                    e muito mais - tudo em um só lugar, de forma simples e intuitiva.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      <span>Controle completo de receitas e despesas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      <span>Cálculo automático do DAS</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      <span>Relatórios financeiros detalhados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      <span>Calendário de obrigações fiscais</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Consultoria Gratuita */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <HiCalendar className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Consultoria Gratuita Inclusa
                    </h3>
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                      GRÁTIS
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Como parte do seu plano, você tem direito a <strong>4 horas de consultoria personalizada</strong> por mês 
                    com nossos especialistas em gestão MEI. Agende sua sessão e tire todas as suas dúvidas!
                  </p>
                  
                  <div className="bg-white rounded-lg p-4 mb-4 border border-purple-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <HiClock className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">Horários disponíveis:</span>
                    </div>
                    <p className="text-sm text-gray-700 pl-6">
                      Das <strong>19h às 22h</strong>, de segunda a sexta-feira
                    </p>
                    <p className="text-xs text-gray-500 pl-6 mt-1">
                      * Vagas limitadas - apenas 1 MEI por dia
                    </p>
                  </div>

                  <button
                    onClick={() => window.location.href = `/mei/${user?.companyId}/calendario`}
                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    <HiCalendar className="w-4 h-4" />
                    Agendar Consultoria
                  </button>
                </div>
              </div>
            </div>

            {/* Informações da transação */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Detalhes da Assinatura</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status da transação:</span>
                  <span className="text-green-600 font-medium">✓ Confirmada</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data da ativação:</span>
                  <span className="text-gray-900 font-medium">
                    {new Date().toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status da assinatura:</span>
                  <span className="text-green-600 font-medium">✓ Ativa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Próxima cobrança:</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-3 pt-4">
              <button
                onClick={handleGoToDashboard}
                className="w-full bg-black text-white rounded-xl px-6 py-4 font-semibold hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <span>Acessar Minha Dashboard MEI</span>
                <HiArrowRight className="w-5 h-5" />
              </button>
              
              <p className="text-center text-sm text-gray-500">
                Você receberá um email de confirmação com todos os detalhes em breve
              </p>
            </div>

            {/* Suporte */}
            <div className="pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-3">
                Precisa de ajuda para começar?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                <a 
                  href="mailto:suporte@paimcontab.com" 
                  className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
                >
                  suporte@paimcontab.com
                </a>
                <span className="hidden sm:block text-gray-300">•</span>
                <a 
                  href="tel:+5511999999999" 
                  className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
                >
                  (11) 99999-9999
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2024 PaimContab. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}