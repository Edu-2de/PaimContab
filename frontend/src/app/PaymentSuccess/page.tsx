"use client";
import { HiCheckCircle, HiArrowRight, HiHome } from "react-icons/hi2";

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Header com logo/nome da empresa */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-black">PaimContab</h2>
        </div>

        {/* Conteúdo principal */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12">
          {/* Ícone de sucesso */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <HiCheckCircle className="w-8 h-8 text-green-600" />
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-black mb-4">
            Pagamento Confirmado
          </h1>

          {/* Descrição */}
          <p className="text-gray-600 text-lg mb-2">
            Sua assinatura foi ativada com sucesso!
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Você receberá um email de confirmação em breve com todos os detalhes.
          </p>

          {/* Informações adicionais */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <div className="text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status da transação:</span>
                <span className="text-green-600 font-medium">✓ Confirmada</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Data da ativação:</span>
                <span className="text-gray-900 font-medium">
                  {new Date().toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status da assinatura:</span>
                <span className="text-green-600 font-medium">✓ Ativa</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Próxima cobrança:</span>
                <span className="text-gray-900 font-medium">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          {/* Próximos passos */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-black mb-3">Próximos Passos</h3>
            <div className="text-left space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                <span>Acesse sua dashboard para começar a usar o PaimContab</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                <span>Configure suas informações empresariais</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                <span>Comece a registrar suas receitas e despesas</span>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-3">
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="w-full bg-black text-white rounded-lg px-6 py-3 font-medium hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <span>Ir para a Dashboard</span>
              <HiArrowRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full bg-white text-black border border-gray-200 rounded-lg px-6 py-3 font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <HiHome className="w-4 h-4" />
              Voltar ao Início
            </button>
          </div>

          {/* Suporte */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">
              Dúvidas ou precisa de ajuda para começar?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <a 
                href="mailto:suporte@paimcontab.com" 
                className="text-black hover:text-gray-600 transition-colors"
              >
                suporte@paimcontab.com
              </a>
              <span className="hidden sm:block text-gray-300">•</span>
              <a 
                href="tel:+5511999999999" 
                className="text-black hover:text-gray-600 transition-colors"
              >
                (11) 99999-9999
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8">
          <p className="text-xs text-gray-400">
            © 2024 PaimContab. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}