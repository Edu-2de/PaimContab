"use client";
import { useState, useEffect } from "react";
import { HiArrowRight, HiArrowLeft, HiCheckCircle, HiSparkles, HiPlay } from "react-icons/hi2";

interface Question {
  id: string;
  title: string;
  type: "text" | "select" | "multiselect" | "number" | "date";
  placeholder?: string;
  options?: string[];
  required: boolean;
}

const questions: Question[] = [
  {
    id: "companyName",
    title: "Qual é o nome da sua empresa ou como você gostaria de chamá-la?",
    type: "text",
    placeholder: "Ex: João Silva Serviços",
    required: true,
  },
  {
    id: "businessSegment",
    title: "Em qual segmento sua empresa atua?",
    type: "select",
    options: ["Comércio", "Serviços", "Indústria", "Tecnologia", "Saúde", "Educação", "Outros"],
    required: true,
  },
  {
    id: "mainActivity",
    title: "Qual é a principal atividade da sua empresa?",
    type: "text",
    placeholder: "Ex: Desenvolvimento de software, Consultoria, Vendas online...",
    required: true,
  },
  {
    id: "businessType",
    title: "Qual é o tipo do seu negócio?",
    type: "select",
    options: ["MEI", "ME (Microempresa)", "EPP (Empresa de Pequeno Porte)", "Ainda não formalizei"],
    required: true,
  },
  {
    id: "cnpj",
    title: "Você já tem CNPJ?",
    type: "text",
    placeholder: "Digite seu CNPJ ou deixe em branco se não tiver",
    required: false,
  },
  {
    id: "monthlyRevenue",
    title: "Qual é aproximadamente seu faturamento mensal?",
    type: "select",
    options: [
      "Até R$ 1.000",
      "R$ 1.001 - R$ 3.000",
      "R$ 3.001 - R$ 6.000",
      "R$ 6.001 - R$ 10.000",
      "Acima de R$ 10.000",
      "Ainda não tenho faturamento",
    ],
    required: true,
  },
  {
    id: "foundationDate",
    title: "Quando sua empresa foi fundada (ou quando pretende fundar)?",
    type: "date",
    required: false,
  },
  {
    id: "city",
    title: "Em qual cidade sua empresa está localizada?",
    type: "text",
    placeholder: "Ex: São Paulo",
    required: true,
  },
  {
    id: "state",
    title: "Em qual estado?",
    type: "select",
    options: [
      "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
      "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
      "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
    ],
    required: true,
  },
  {
    id: "employeeCount",
    title: "Quantos funcionários sua empresa tem?",
    type: "select",
    options: ["Apenas eu", "2-5 funcionários", "6-10 funcionários", "Mais de 10 funcionários"],
    required: true,
  },
];

export default function SetupEmpresa() {
  const [showIntro, setShowIntro] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  interface User {
    id: string;
    [key: string]: unknown;
  }
  const [user, setUser] = useState<User | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      console.log("Usuário no localStorage:", stored);

      if (stored && stored !== "undefined") {
        try {
          const userData = JSON.parse(stored);
          setUser(userData);
        } catch (error) {
          console.error("Erro ao fazer parse do usuário:", error);
          localStorage.removeItem("user");
          window.location.href = "/Login";
        }
      } else {
        console.log("Nenhum usuário encontrado, redirecionando...");
        window.location.href = "/Login";
      }
    }
  }, []);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (value: unknown) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const startQuestions = () => {
    setAnimating(true);
    setTimeout(() => {
      setShowIntro(false);
      setAnimating(false);
    }, 500);
  };

  const nextStep = () => {
    if (currentQuestion.required && !answers[currentQuestion.id]) {
      // Animação de shake nos campos obrigatórios
      const element = document.querySelector(".question-input");
      element?.classList.add("shake");
      setTimeout(() => element?.classList.remove("shake"), 600);
      return;
    }

    setAnimating(true);
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        submitAnswers();
      }
      setAnimating(false);
    }, 400);
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setAnimating(false);
      }, 400);
    }
  };

  const submitAnswers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/company/user/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...answers,
          monthlyRevenue: parseMonthlyRevenue(answers.monthlyRevenue as string),
          employeeCount: parseEmployeeCount(answers.employeeCount as string),
        }),
      });

      if (response.ok) {
        window.location.href = "/?section=plans";
      } else {
        alert("Erro ao salvar informações. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  };

  const parseMonthlyRevenue = (value: string) => {
    const revenueMap: Record<string, number> = {
      "Até R$ 1.000": 1000,
      "R$ 1.001 - R$ 3.000": 3000,
      "R$ 3.001 - R$ 6.000": 6000,
      "R$ 6.001 - R$ 10.000": 10000,
      "Acima de R$ 10.000": 15000,
      "Ainda não tenho faturamento": 0,
    };
    return revenueMap[value] || 0;
  };

  const parseEmployeeCount = (value: string) => {
    const employeeMap: Record<string, number> = {
      "Apenas eu": 0,
      "2-5 funcionários": 3,
      "6-10 funcionários": 8,
      "Mais de 10 funcionários": 15,
    };
    return employeeMap[value] || 0;
  };

  const renderInput = () => {
    const rawValue = answers[currentQuestion.id];
    const value =
      typeof rawValue === "string" || typeof rawValue === "number" || Array.isArray(rawValue) || rawValue === undefined
        ? rawValue
        : "";

    switch (currentQuestion.type) {
      case "text":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder={currentQuestion.placeholder}
            className="question-input w-full px-6 py-5 text-xl border border-slate-200 rounded-xl focus:border-slate-400 focus:outline-none transition-all bg-white text-slate-800 placeholder-slate-400 shadow-sm"
            autoFocus
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleAnswer(Number(e.target.value))}
            placeholder={currentQuestion.placeholder}
            className="question-input w-full px-6 py-5 text-xl border border-slate-200 rounded-xl focus:border-slate-400 focus:outline-none transition-all bg-white text-slate-800 placeholder-slate-400 shadow-sm"
            autoFocus
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleAnswer(e.target.value)}
            className="question-input w-full px-6 py-5 text-xl border border-slate-200 rounded-xl focus:border-slate-400 focus:outline-none transition-all bg-white text-slate-800 shadow-sm"
            autoFocus
          />
        );

      case "select":
        return (
          <div className="question-input space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                className={`w-full p-5 text-left rounded-xl border transition-all duration-300 transform hover:scale-[1.02] ${
                  value === option
                    ? "border-slate-600 bg-slate-50 text-slate-900 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">{option}</span>
                  {value === option && (
                    <HiCheckCircle className="w-6 h-6 text-slate-600 animate-pulse" />
                  )}
                </div>
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div
          className={`max-w-lg w-full transition-all duration-700 ${
            animating ? "opacity-0 transform scale-95" : "opacity-100 transform scale-100"
          }`}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
            {/* Ícone animado */}
            <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <HiSparkles className="w-10 h-10 text-slate-600 animate-pulse" />
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Vamos nos conhecer melhor!
            </h1>

            {/* Descrição */}
            <p className="text-slate-600 leading-relaxed mb-8">
              Agora vamos conhecer um pouco mais da sua empresa. Antes de continuarmos, 
              responda algumas perguntas rápidas para personalizarmos sua experiência.
            </p>

            {/* Botão */}
            <button
              onClick={startQuestions}
              className="inline-flex items-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <HiPlay className="w-5 h-5" />
              Começar
            </button>

            {/* Indicador de perguntas */}
            <p className="text-sm text-slate-400 mt-6">
              {questions.length} perguntas • ~2 minutos
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* Header com progresso */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900">Te conhecendo melhor</h1>
            <span className="text-sm text-slate-500 font-medium">
              {currentStep + 1} de {questions.length}
            </span>
          </div>

          {/* Barra de progresso */}
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-slate-600 to-slate-800 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div
          className={`transition-all duration-500 ${
            animating 
              ? "opacity-0 transform translate-y-12 scale-95" 
              : "opacity-100 transform translate-y-0 scale-100"
          }`}
        >
          {/* Pergunta */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium mb-8 border border-slate-200">
              <span className="w-2 h-2 bg-slate-600 rounded-full animate-pulse"></span>
              Pergunta {currentStep + 1}
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-6 leading-tight max-w-xl mx-auto">
              {currentQuestion.title}
            </h2>
          </div>

          {/* Input */}
          <div className="mb-12">{renderInput()}</div>

          {/* Botões de navegação */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                currentStep === 0
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <HiArrowLeft className="w-5 h-5" />
              Anterior
            </button>

            <button
              onClick={nextStep}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  {currentStep === questions.length - 1 ? "Finalizar" : "Próximo"}
                  <HiArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Animação de fundo */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-slate-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      </div>

      {/* CSS para animações */}
      <style jsx>{`
        .shake {
          animation: shake 0.6s ease-in-out;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}