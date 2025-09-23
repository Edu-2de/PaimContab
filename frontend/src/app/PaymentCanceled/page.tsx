"use client";
import { HiXCircle } from "react-icons/hi2";

export default function PaymentCanceled() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <HiXCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Pagamento Cancelado
          </h1>
          <p className="text-gray-600 mb-6">
            Seu pagamento foi cancelado. Nenhuma cobrança foi realizada.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-900 text-white rounded-xl px-6 py-3 font-semibold hover:bg-gray-800 transition"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full bg-gray-200 text-gray-800 rounded-xl px-6 py-3 font-semibold hover:bg-gray-300 transition"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}