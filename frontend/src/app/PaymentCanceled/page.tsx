"use client";
import { HiArrowLeft, HiXCircle, HiHome } from "react-icons/hi2";

export default function PaymentCanceled() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Header com logo/nome da empresa */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-black">PaimContab</h2>
        </div>

        {/* Conteúdo principal */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12">
          {/* Ícone de cancelamento */}
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <HiXCircle className="w-8 h-8 text-gray-400" />
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-black mb-4">
            Pagamento Cancelado
          </h1>

          {/* Descrição */}
          <p className="text-gray-600 text-lg mb-2">
            Sua transação foi cancelada com segurança.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Nenhuma cobrança foi realizada em seu cartão.
          </p>

          {/* Informações adicionais */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <div className="text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status da transação:</span>
                <span className="text-gray-900 font-medium">Cancelada</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Data e hora:</span>
                <span className="text-gray-900 font-medium">
                  {new Date().toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Valor:</span>
                <span className="text-gray-900 font-medium">R$ 0,00</span>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full bg-black text-white rounded-lg px-6 py-3 font-medium hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <HiArrowLeft className="w-4 h-4" />
              Tentar Novamente
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
              Precisa de ajuda? Entre em contato conosco
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