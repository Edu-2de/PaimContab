"use client";
import { useState } from "react";
import {
  FiAward, FiTrendingUp, FiPieChart, FiShield, FiZap, FiBarChart2,
  FiUsers, FiBriefcase, FiClock, FiActivity, FiCheckCircle
} from "react-icons/fi";

// Pool of possible features (icon, title, symbol, description)
const ALL_FEATURES = [
  {
    icon: FiAward,
    title: "Especialistas",
    symbol: "π",
    desc: "Equipe experiente em MEI e pequenas empresas."
  },
  {
    icon: FiPieChart,
    title: "Resultados",
    symbol: "Σ",
    desc: "Foco em métricas e melhoria real do seu negócio."
  },
  {
    icon: FiShield,
    title: "Segurança",
    symbol: "Δ",
    desc: "Proteção de dados e processos seguros."
  },
  {
    icon: FiTrendingUp,
    title: "Simulação",
    symbol: "≈",
    desc: "Ferramentas para simular operações e cenários."
  },
  {
    icon: FiZap,
    title: "Rápido",
    symbol: "λ",
    desc: "Atendimento e respostas ágeis para você."
  },
  {
    icon: FiBarChart2,
    title: "Visual",
    symbol: "ƒ",
    desc: "Relatórios e gráficos claros e objetivos."
  },
  {
    icon: FiUsers,
    title: "Comunidade",
    symbol: "Ω",
    desc: "Rede de apoio e troca entre empreendedores."
  },
  {
    icon: FiBriefcase,
    title: "Consultoria",
    symbol: "μ",
    desc: "Soluções personalizadas para o seu caso."
  },
  {
    icon: FiClock,
    title: "Tempo",
    symbol: "τ",
    desc: "Otimização da sua rotina e processos."
  },
  {
    icon: FiActivity,
    title: "Monitoramento",
    symbol: "∞",
    desc: "Acompanhamento contínuo do seu negócio."
  },
  {
    icon: FiCheckCircle,
    title: "Compliance",
    symbol: "∂",
    desc: "Orientação para manter tudo sempre regular."
  }
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Features() {
  const [features, setFeatures] = useState(() =>
    shuffle(ALL_FEATURES).slice(0, 4).map(f => ({ ...f, key: Math.random().toString(36) }))
  );
  const [animating, setAnimating] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  function handleShuffle() {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      const newFeatures = shuffle(ALL_FEATURES)
        .filter(f => !features.some(cur => cur.title === f.title))
        .slice(0, 4);
      setFeatures(newFeatures.map(f => ({ ...f, key: Math.random().toString(36) })));
      setAnimating(false);
    }, 550);
  }

  return (
    <section
      className="relative w-full flex flex-col items-center bg-white dark:bg-neutral-950 py-16 px-2 transition-colors"
      style={{ borderTop: "1.5px solid #e5e7eb" }}
    >
      {/* Subtle dots background */}
      <svg
        className="absolute inset-0 w-full h-full z-0 pointer-events-none"
        style={{ opacity: 0.012 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="tinyDotsBW" x="0" y="0" width="34" height="34" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="1" fill="#222" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tinyDotsBW)" />
      </svg>

      <div className="max-w-2xl mx-auto text-center mb-12 relative z-10 px-2">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
          Nossos Diferenciais
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg mt-2">
          Um resumo dos pontos que tornam nossa consultoria única — focados em tecnologia, eficiência e o melhor da matemática aplicada ao seu negócio.
        </p>
      </div>

      {/* Cards grid */}
      <div
        className={`
          grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto relative z-10 features-section-grid
          transition-all duration-500
        `}
      >
        {features.map((feature, i) => {
          const Icon = feature.icon;
          const isHovered = hoverIdx === i;
          return (
            <div
              key={feature.key}
              className={`
                group relative rounded-3xl border border-neutral-200 dark:border-neutral-800
                bg-white dark:bg-neutral-950 
                shadow-md hover:shadow-2xl transition-all
                flex flex-col items-center justify-center px-6 py-12
                overflow-hidden
                duration-500
                ${animating ? "animate-[shuffleFade_0.55s]" : ""}
                cursor-pointer
                h-[260px] sm:h-[220px] md:h-[250px]
                min-w-[180px] max-w-[290px]
                outline-none
                focus-visible:ring-2 focus-visible:ring-black/10
                hover:z-20
              `}
              tabIndex={0}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{
                boxShadow: animating
                  ? "0 4px 32px #0f172a18"
                  : "0 2px 12px #18181b0b",
                transition: "box-shadow 0.25s, background 0.18s, border 0.18s"
              }}
            >
              {/* Ícone central */}
              <span className={`
                flex items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800
                bg-neutral-50 dark:bg-neutral-900
                w-20 h-20 mb-4
                transition
                shadow
                ${isHovered ? "scale-110 bg-white border-black text-black dark:bg-white dark:text-black dark:border-white shadow-2xl" : "text-neutral-900 dark:text-neutral-100"}
              `}>
                <Icon
                  size={40}
                  color={isHovered ? "#111" : undefined}
                  style={{ transition: "color 0.15s" }}
                />
              </span>
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">
                {feature.title}
              </span>
              <span className="text-gray-500 dark:text-gray-300 text-base text-center font-normal mb-2">
                {feature.desc}
              </span>
              {/* Símbolo matemático, só um detalhe ao fundo */}
              <span
                className={`
                  absolute left-1/2 bottom-6 -translate-x-1/2 select-none pointer-events-none font-mono font-extrabold
                  opacity-5
                  text-black dark:text-white
                  transition
                  group-hover:opacity-15
                  group-focus:opacity-15
                `}
                style={{
                  fontSize: 74,
                  zIndex: 0,
                  lineHeight: 1
                }}
                aria-hidden="true"
              >
                {feature.symbol}
              </span>
              {/* Efeito extra de hover */}
              <span
                className={`
                  absolute -inset-1 z-0 rounded-3xl pointer-events-none
                  ${hoverIdx === i ? "bg-black/5 dark:bg-white/10 opacity-80 blur-[2px] scale-105" : ""}
                  transition-all
                `}
              />
            </div>
          );
        })}
      </div>

      {/* Shuffle button */}
      <div className="flex justify-center mt-14">
        <button
          className={`
            relative px-8 py-3 rounded-full bg-white border border-black/20 text-black font-semibold text-lg
            hover:bg-black hover:text-white hover:shadow-2xl hover:border-black
            active:scale-97 transition-all shadow-md
            flex items-center gap-2
            disabled:opacity-60
            focus:outline-none focus:ring-2 focus:ring-black/10
            ring-inset
          `}
          onClick={handleShuffle}
          disabled={animating}
          aria-label="Trocar diferenciais"
          type="button"
        >
          <svg className="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5m0 0l-8.59 8.59a2 2 0 01-2.83 0L7 13m13-5V3m0 5H16m-4 12h-5v-5m0 0l8.59-8.59a2 2 0 012.83 0L17 11m-9 8v2m0-2h5" />
          </svg>
          Trocar diferenciais
        </button>
      </div>

      {/* Shuffle fade animation */}
      <style>{`
        @keyframes shuffleFade {
          0% { opacity: 1; transform: scale(1) rotate(0deg);}
          50% { opacity: 0; transform: scale(0.7) rotate(3deg);}
          100% { opacity: 1; transform: scale(1) rotate(0deg);}
        }
        .animate-\\[shuffleFade_0\\.55s\\] {
          animation: shuffleFade 0.55s cubic-bezier(.65,.02,.73,.97) both;
        }
        @media (max-width: 1050px) {
          .features-section-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 2rem !important;
          }
        }
        @media (max-width: 700px) {
          .features-section-grid {
            grid-template-columns: 1fr !important;
            gap: 1.4rem !important;
          }
        }
      `}</style>
    </section>
  );
}