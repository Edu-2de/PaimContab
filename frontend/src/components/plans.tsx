"use client";
import { useState, RefObject } from "react";
import { HiCheckCircle, HiOutlineChevronRight, HiSparkles } from "react-icons/hi2";

// Cores neutras e modernas
const accent = "#23272f";
const accentStrong = "#010409";
const bgHighlight = "bg-[#f7f7fa]";
const borderHighlight = "border-[#23272f]";
const textAccent = "text-[#23272f]";
const ringAccent = "ring-[#23272f]";
const glassBg = "backdrop-blur-md bg-white/80";

type Plan = {
  name: string;
  price: string;
  desc: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
};

const PLANS: Plan[] = [
  {
    name: "Essencial",
    price: "R$ 19/mês",
    desc: "O básico para começar a organizar seu MEI com autonomia.",
    features: [
      "Planilhas de receitas e despesas",
      "Suporte por e-mail",
      "Materiais gratuitos"
    ]
  },
  {
    name: "Profissional",
    price: "R$ 39/mês",
    desc: "Automação, controle avançado e suporte personalizado para crescer.",
    features: [
      "Tudo do Essencial",
      "Planilhas avançadas e dashboards",
      "Suporte prioritário",
      "Consultoria mensal"
    ],
    highlight: true,
    badge: "Mais buscado"
  },
  {
    name: "Premium",
    price: "R$ 69/mês",
    desc: "Solução completa e personalizada, com mentoria e relatórios sob medida.",
    features: [
      "Tudo do Profissional",
      "Planilhas ilimitadas",
      "Mentoria individual",
      "Relatórios automáticos",
      "Canal VIP de dúvidas"
    ],
    badge: "Exclusivo"
  }
];

interface PlansProps {
  plansRef: RefObject<HTMLDivElement | null>;
}

export default function Plans({ plansRef }: PlansProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section ref={plansRef} className="relative w-full min-h-[70vh] px-4 py-20 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-200 transition">
      {/* Fundo geométrico animado, sutil */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg width="100%" height="100%" className="absolute inset-0" style={{opacity: 0.13}}>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#c6c9d6" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g1)" />
          <circle cx="10%" cy="20%" r="90" fill="#e0e1e7" />
          <circle cx="85%" cy="15%" r="60" fill="#e0e1e7" />
          <circle cx="50%" cy="90%" r="110" fill="#e0e1e7" />
        </svg>
      </div>
      <div className="max-w-2xl mx-auto text-center mb-12 relative z-10">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mb-3 tracking-tight drop-shadow-[0_2px_0_rgba(0,0,0,0.03)]">
          <span className="inline-block bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-400 bg-clip-text text-transparent">
            Planos para transformar sua rotina
          </span>
        </h2>
        <p className="text-neutral-600 text-base sm:text-lg font-medium">
          Descubra a experiência de organização que valoriza seu tempo. Dê o próximo passo com um plano sob medida para você.
        </p>
      </div>
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-9 max-w-6xl w-full">
        {PLANS.map((plan, idx) => {
          const isHovered = hovered === idx;
          const isOther = hovered !== null && hovered !== idx;
          const isHighlight = !!plan.highlight;
          return (
            <div
              key={plan.name}
              className={`
                group relative flex flex-col items-center justify-between
                border rounded-2xl
                ${glassBg}
                px-8 py-12 transition-all duration-500 cursor-pointer
                overflow-visible
                ${isHighlight ? `${bgHighlight} ${borderHighlight} ring-2 ${ringAccent}` : "border-neutral-200"}
                ${isHovered ? `scale-105 z-30 border-2 ${borderHighlight} shadow-xl` : ""}
                ${isOther ? "opacity-50 blur-[1.5px]" : ""}
                shadow-md hover:shadow-2xl hover:-translate-y-2
                before:absolute before:-inset-2 before:rounded-[1.5rem] before:z-[-1] before:transition-all before:duration-500
                ${
                  isHovered
                    ? "before:bg-[radial-gradient(circle_at_50%_50%,rgba(36,39,47,0.07)_0%,rgba(36,39,47,0.00)_90%)]"
                    : ""
                }
              `}
              style={{
                minHeight: 480,
                borderColor: isHovered || isHighlight ? accent : undefined,
                boxShadow: isHovered
                  ? "0 10px 30px #0003"
                  : isHighlight
                  ? "0 4px 20px #23272f18"
                  : undefined,
                transition: "all 0.38s cubic-bezier(.77,.1,.24,.93)"
              }}
              tabIndex={0}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(idx)}
              onBlur={() => setHovered(null)}
            >
              {/* Selo destaque */}
              {(plan.badge || isHighlight) && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20">
                  <span
                    className="flex items-center gap-1 px-4 py-1 rounded-full text-xs font-semibold shadow bg-neutral-100 border"
                    style={{
                      borderColor: accent,
                      color: isHighlight ? "#fff" : accentStrong,
                      background: isHighlight
                        ? "#23272f"
                        : plan.badge === "Exclusivo"
                        ? "#fff9ea"
                        : "#f1f3f7"
                    }}
                  >
                    {plan.badge === "Exclusivo" && (
                      <HiSparkles className="w-4 h-4 text-yellow-400 inline-block" />
                    )}
                    {plan.badge || "Destaque"}
                  </span>
                </div>
              )}
              {/* Nome e preço */}
              <div className="flex flex-col items-center w-full relative">
                <span
                  className={`
                    text-base font-bold uppercase tracking-wider mt-2
                    ${isHighlight || isHovered ? "text-white bg-[#23272f] px-2 py-1 rounded" : "text-neutral-600"}
                  `}
                >
                  {plan.name}
                </span>
                <span
                  className={`
                    mt-3 text-[2.2rem] sm:text-4xl font-black transition-colors duration-300
                    ${isHighlight || isHovered ? textAccent : "text-neutral-900"}
                    drop-shadow-[0_2px_0_rgba(36,39,47,0.04)]
                  `}
                >
                  {plan.price}
                </span>
                <span className="mt-2 text-[15px] text-neutral-500 text-center min-h-[44px]">{plan.desc}</span>
              </div>
              {/* Detalhes interativos */}
              <div
                className={`mt-9 w-full transition-all duration-300
                  ${isHovered ? "opacity-100 translate-y-0 pointer-events-auto visible" : "opacity-0 translate-y-2 h-0 overflow-hidden pointer-events-none"}
                  flex flex-col items-center`}
              >
                <ul className="mb-8 w-full text-neutral-700 text-[1rem] space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <HiCheckCircle className={`min-w-5 min-h-5 ${isHighlight ? "text-[#23272f]" : "text-neutral-400"}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`
                    w-full rounded-xl px-5 py-3 font-semibold flex items-center justify-center gap-2
                    transition
                    bg-neutral-900 text-white shadow
                    hover:bg-neutral-800 active:scale-95
                    focus:outline-none focus:ring-2 ${ringAccent}
                    duration-200
                    text-lg cursor-pointer
                  `}
                >
                  Escolher plano
                  <HiOutlineChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
              {/* Dica para interação */}
              {!isHovered && (
                <div className="absolute left-0 right-0 bottom-6 flex justify-center opacity-80 pointer-events-none select-none">
                  <span className="bg-neutral-200 text-neutral-700 text-xs px-3 py-1 rounded-full shadow-sm transition-all">
                    Passe o mouse ou toque para detalhes
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Ornamento geométrico flutuante */}
      <div className="pointer-events-none absolute z-0 right-0 top-0 w-[180px] h-[180px] md:w-[210px] md:h-[210px] opacity-30">
        <svg width="100%" height="100%">
          <rect
            x="30"
            y="30"
            width="120"
            height="120"
            rx="35"
            fill="#ebeef4"
            stroke="#d1d5db"
            strokeWidth="2"
          />
        </svg>
      </div>
    </section>
  );
}