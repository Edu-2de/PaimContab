"use client";
import { useState } from "react";
import { HiCheckCircle, HiOutlineChevronRight, HiSparkles } from "react-icons/hi2";

// Cor de destaque: azul moderno e suave
const accent = "#5bbcff";
const accentLight = "#eaf6fd";
const accentStrong = "#2699c6";
const bgHighlight = "bg-[#f6fbff]";
const borderHighlight = "border-[#5bbcff]";
const textAccent = "text-[#2699c6]";
const ringAccent = "ring-[#5bbcff]";

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
    desc: "Ideal para quem está começando e precisa do básico para organizar o MEI.",
    features: [
      "Planilhas básicas de receitas e despesas",
      "Suporte por e-mail",
      "Acesso a materiais gratuitos"
    ]
  },
  {
    name: "Profissional",
    price: "R$ 39/mês",
    desc: "Para quem quer automação, controle e suporte personalizado.",
    features: [
      "Todas as planilhas Essencial",
      "Planilhas avançadas: gráficos, metas, clientes",
      "Suporte prioritário",
      "Consultoria mensal com especialista"
    ],
    highlight: true,
    badge: "Mais popular"
  },
  {
    name: "Premium",
    price: "R$ 69/mês",
    desc: "Solução completa para crescer com segurança e acompanhamento próximo.",
    features: [
      "Tudo do Profissional",
      "Planilhas ilimitadas e personalizáveis",
      "Mentoria individual",
      "Relatórios automáticos",
      "Canal exclusivo de dúvidas"
    ],
    badge: "VIP"
  }
];

export default function Plans() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="relative bg-neutral-50 w-full px-4 py-20 flex flex-col items-center transition">
      {/* Overlay escurecido ao hover em qualquer card, com z-20 */}
      <div
        className={`fixed inset-0 bg-black/40 z-20 pointer-events-none transition-opacity duration-500 ${
          hovered !== null ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />
      <div className="max-w-2xl mx-auto text-center mb-12 relative z-30">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-800 mb-2 drop-shadow-[0_2px_0_rgba(0,0,0,0.03)]">
          Escolha seu plano
        </h2>
        <p className="text-neutral-600 text-base sm:text-lg">
          Flexibilidade para o seu momento: comece simples ou vá além com automação, suporte e consultoria.
        </p>
      </div>
      <div className="relative z-30 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl w-full">
        {PLANS.map((plan, idx) => {
          const isHovered = hovered === idx;
          const isOther = hovered !== null && hovered !== idx;
          const isHighlight = !!plan.highlight;
          return (
            <div
              key={plan.name}
              className={`
                group relative flex flex-col items-center justify-between
                border border-neutral-200 rounded-3xl bg-white
                px-7 sm:px-9 py-12 transition-all duration-500 cursor-pointer
                overflow-visible
                ${isHighlight ? `${bgHighlight} ${borderHighlight} shadow-lg` : "shadow-sm"}
                ${isHovered ? `scale-110 z-40 border-2 ${borderHighlight} shadow-2xl` : ""}
                ${isOther ? "blur-[2px] opacity-40" : ""}
                ${!isHighlight && isHovered ? "bg-neutral-100" : ""}
                hover:shadow-2xl hover:-translate-y-2
                focus:outline-none
                before:absolute before:-inset-2 before:rounded-[1.7rem] before:z-[-1] before:transition-all before:duration-500
                ${
                  isHovered
                    ? "before:bg-[radial-gradient(circle_at_50%_50%,rgba(91,188,255,0.07)_0%,rgba(91,188,255,0.00)_80%)]"
                    : ""
                }
              `}
              style={{
                minHeight: 440,
                boxShadow: isHovered
                  ? "0 10px 42px #0005"
                  : isHighlight
                  ? "0 4px 20px #5bbcff22"
                  : undefined,
                borderColor: isHovered || isHighlight ? accent : undefined,
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
                    className="flex items-center gap-1 px-4 py-1 rounded-full text-xs font-semibold shadow
                      bg-white border"
                    style={{
                      borderColor: accent,
                      color: accentStrong,
                      background: isHighlight
                        ? accentLight
                        : plan.badge === "VIP"
                        ? "#fff9ea"
                        : "#fff"
                    }}
                  >
                    {plan.badge === "VIP" && (
                      <HiSparkles className="w-4 h-4 text-yellow-400 inline-block" />
                    )}
                    {plan.badge || "Mais popular"}
                  </span>
                </div>
              )}
              {/* Nome e preço */}
              <div className="flex flex-col items-center w-full relative">
                <span
                  className={`text-base font-bold uppercase tracking-wider mt-2
                    ${isHighlight || isHovered ? textAccent : "text-neutral-600"}`}
                >
                  {plan.name}
                </span>
                <span
                  className={`mt-3 text-[2rem] sm:text-3xl font-black transition-colors duration-300
                    ${isHighlight || isHovered ? textAccent : "text-neutral-900"}
                    drop-shadow-[0_2px_0_rgba(36,155,198,0.07)]`}
                >
                  {plan.price}
                </span>
                <span className="mt-2 text-sm text-neutral-500 text-center min-h-[42px]">{plan.desc}</span>
              </div>
              {/* Detalhes interativos */}
              <div
                className={`mt-8 w-full transition-all duration-300
                ${isHovered ? "opacity-100 translate-y-0 pointer-events-auto visible" : "opacity-0 translate-y-2 h-0 overflow-hidden pointer-events-none"}
                flex flex-col items-center`}
              >
                <ul className="mb-8 w-full text-neutral-700 text-[1rem] space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <HiCheckCircle className="min-w-5 min-h-5" style={{ color: accent }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`
                    w-full rounded-xl px-5 py-3 font-semibold flex items-center justify-center gap-2
                    transition
                    bg-[${accent}] text-white shadow
                    hover:bg-[#409ccf] active:scale-95
                    focus:outline-none focus:ring-2 ${ringAccent}
                    duration-200
                    text-lg
                  `}
                  style={{
                    background: accent
                  }}
                >
                  Escolher plano
                  <HiOutlineChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
              {/* Dica para interação */}
              {!isHovered && (
                <div className="absolute left-0 right-0 bottom-6 flex justify-center opacity-80 pointer-events-none select-none">
                  <span className="bg-neutral-100 text-neutral-500 text-xs px-3 py-1 rounded-full shadow-sm transition-all">
                    Passe o mouse ou toque para ver detalhes
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    
    </section>
  );
}