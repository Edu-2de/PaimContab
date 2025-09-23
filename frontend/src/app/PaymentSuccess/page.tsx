"use client";
import { HiCheckCircle } from "react-icons/hi2";

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <HiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Pagamento Confirmado!
          </h1>
          <p className="text-gray-600 mb-6">
            Sua assinatura foi ativada com sucesso. Você receberá um email de confirmação em breve.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-green-600 text-white rounded-xl px-6 py-3 font-semibold hover:bg-green-700 transition"
          >
            Ir para o Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}