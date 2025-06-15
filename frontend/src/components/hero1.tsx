"use client";
import { useState, useEffect, useRef, useCallback, RefObject } from "react";
import { FiTrendingUp, FiUserCheck } from "react-icons/fi";

// Efeito de descriptografar o título
function decryptEffect(str: string, progress: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(str)
    .map((c, i) =>
      i < progress || !/[A-Za-z0-9]/.test(c)
        ? c
        : chars[Math.floor(Math.random() * chars.length)]
    )
    .join("");
}

// Gerador de operações matemáticas/contábeis
function gerarOperacao() {
  const contas = [
    "Receita", "Despesa", "Imposto", "Lucro",
    "Investimento", "Folha", "Tributo", "Caixa", "Pro Labore"
  ];
  const operacoes = ["+", "-", "×", "÷"];
  const conta = contas[Math.floor(Math.random() * contas.length)];
  const op = operacoes[Math.floor(Math.random() * operacoes.length)];
  const valor1 = (Math.random() * 9000 + 100).toFixed(0);
  const valor2 = (Math.random() * 900 + 10).toFixed(0);
  let resultado;
  switch (op) {
    case "+": resultado = (parseInt(valor1) + parseInt(valor2)).toLocaleString("pt-BR"); break;
    case "-": resultado = (parseInt(valor1) - parseInt(valor2)).toLocaleString("pt-BR"); break;
    case "×": resultado = (parseInt(valor1) * parseInt(valor2)).toLocaleString("pt-BR"); break;
    case "÷": resultado = Math.floor(parseInt(valor1) / parseInt(valor2)).toLocaleString("pt-BR"); break;
    default: resultado = valor1;
  }
  return { conta, op, valor1, valor2, resultado };
}

// Embaralhador para animação das contas
function embaralhar(str: string) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return str
    .split("")
    .map((c) => (c === " " ? " " : chars[Math.floor(Math.random() * chars.length)]))
    .join("");
}

// Distribui contas animadas de ambos os lados
function useContasAnimadas(qtd = 24, ativo = true) {
  const [contas, setContas] = useState(() =>
    Array.from({ length: qtd }, (_, idx) => {
      const isLeft = idx % 2 === 0;
      return {
        ...gerarOperacao(),
        fase: "embaralhando",
        texto: "",
        left: isLeft
          ? Math.random() * 35 + 2
          : Math.random() * 35 + 63,
        top: Math.random() * 70 + 10,
        size: Math.random() * 0.32 + 0.75,
        duration: 5 + Math.random() * 1.8,
        delay: Math.random() * 1.2,
        key: Math.random().toString(36).slice(2),
        isLeft,
      };
    })
  );

  useEffect(() => {
    if (!ativo) return;
    const timers: (NodeJS.Timeout | number)[] = [];
    contas.forEach((item, i) => {
      timers.push(
        setTimeout(() => {
          let embaralhaCount = 0;
          const linhaOriginal = `${item.conta}: ${item.valor1} ${item.op} ${item.valor2} = ${item.resultado}`;
          const embaralha = setInterval(() => {
            setContas((prev) => {
              const novo = [...prev];
              novo[i].texto = embaralhar(linhaOriginal);
              return novo;
            });
            embaralhaCount++;
            if (embaralhaCount > 6) {
              clearInterval(embaralha);
              setContas((prev) => {
                const novo = [...prev];
                novo[i].texto = linhaOriginal;
                novo[i].fase = "resultado";
                return novo;
              });
            }
          }, 40);

          timers.push(
            setTimeout(() => {
              setContas((prev) => {
                const novo = [...prev];
                const isLeft = item.isLeft;
                novo[i] = {
                  ...gerarOperacao(),
                  fase: "embaralhando",
                  texto: embaralhar(linhaOriginal),
                  left: isLeft
                    ? Math.random() * 35 + 2
                    : Math.random() * 35 + 63,
                  top: 100,
                  size: Math.random() * 0.32 + 0.75,
                  duration: 5 + Math.random() * 1.8,
                  delay: Math.random() * 1.2,
                  key: Math.random().toString(36).slice(2),
                  isLeft,
                };
                return novo;
              });
            }, (item.duration + 1) * 1000)
          );
        }, item.delay * 1000)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [contas, contas.length, ativo]);
  return contas;
}

interface Hero1Props {
  plansRef: RefObject<HTMLDivElement | null>;
}

export default function Hero1({ plansRef }: Hero1Props) {
  const titulo = "Gestão M.E.I.";
  const tituloFull = Array.from(titulo);
  // const [decrypted, setDecrypted] = useState(decryptEffect(titulo, 0));
  const [decryptStep, setDecryptStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showFound, setShowFound] = useState(false);
  const [finalWave, setFinalWave] = useState(false);
  const cicloTimeout = useRef<NodeJS.Timeout | null>(null);
  const waveTimeout = useRef<NodeJS.Timeout | null>(null);

  const [hovered, setHovered] = useState(false);
  const titleRef = useRef<HTMLSpanElement>(null);

  const scrollToPlans = () => {
    if (plansRef?.current) {
      plansRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };


  // Controle de hover real (nunca deixa "travado")
  const checkMouseIn = useCallback((event: MouseEvent) => {
    if (!titleRef.current) return;
    const rect = titleRef.current.getBoundingClientRect();
    if (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    ) {
      setIsPaused(true);
      setHovered(true);
    }
  }, []);
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!titleRef.current) return;
      const rect = titleRef.current.getBoundingClientRect();
      const inBounds =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inBounds && hovered) {
        setIsPaused(false);
        setHovered(false);
      }
    };
    if (hovered) window.addEventListener("mousemove", onMouseMove);
    else window.removeEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [hovered]);
  useEffect(() => {
    const onVisibility = () => {
      setIsPaused(false);
      setHovered(false);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Onda percorre todo o título (inclusive espaços, acentos e ponto final)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let step = 0;
    let finished = false;
    function startCycle() {
      interval = setInterval(() => {
        if (isPaused) return;
        if (!finished) {
          step++;
          setDecryptStep(step);
          // setDecrypted(decryptEffect(titulo, step));
          if (step >= tituloFull.length) {
            finished = true;
            setShowFound(true);
            waveTimeout.current = setTimeout(() => setFinalWave(true), 1100);
            cicloTimeout.current = setTimeout(() => {
              setShowFound(false);
              setFinalWave(false);
              finished = false;
              step = 0;
              setDecryptStep(0);
              // setDecrypted(decryptEffect(titulo, 0));
            }, 4000);
          }
        }
      }, 110);
    }
    startCycle();
    return () => {
      if (interval) clearInterval(interval);
      if (cicloTimeout.current) clearTimeout(cicloTimeout.current);
      if (waveTimeout.current) clearTimeout(waveTimeout.current);
    };
    // eslint-disable-next-line
  }, [titulo, isPaused]);

  // Fundo matemático
  const [contasAtivas, setContasAtivas] = useState(true);
  const heroRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    function onScroll() {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setContasAtivas(rect.bottom > 120 && rect.top < window.innerHeight - 120);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : false;
  const contasBg = useContasAnimadas(isMobile ? 32 : 100, contasAtivas);

  // Estado para hover dos itens do fundo
  const [hoverContaKey, setHoverContaKey] = useState<string | null>(null);


  

  function renderDecrypted() {
    return (
      <span
        ref={titleRef}
        className="font-mono cursor-pointer relative select-none transition-all"
        tabIndex={0}
        style={{
          fontSize: "clamp(2.2rem, 6vw, 4.7rem)",
          fontWeight: 800,
          background: "none",
          color: "#23272f",
          letterSpacing: "0.04em",
          filter: hovered
            ? "drop-shadow(0 2px 12px #818cf888)"
            : "drop-shadow(0 2px 5px #cbd5e1)",
          transition: "filter 0.2s",
          lineHeight: 1.07,
          padding: "0.08em 0.12em",
        }}
        onMouseEnter={e => checkMouseIn(e.nativeEvent)}
        aria-label="Descriptografar título"
      >
        {tituloFull.map((c, idx) => {
          let waveAnim = "";
          let animDelay = "";
          if (showFound && !finalWave) {
            waveAnim = "letter-wave-fluid-long";
            animDelay = `${idx * 0.16 + 0.12}s`;
          }
          if (finalWave) {
            waveAnim = "final-wave-fluid-long";
            animDelay = "0s";
          }
          const colorBg =
            showFound
              ? "#e0e7ef"
              : hovered
                ? "#f3f4f6"
                : "none";
          let showChar = c;
          if (decryptStep < tituloFull.length && idx >= decryptStep) {
            showChar = decryptEffect(titulo, decryptStep)[idx] || c;
          }
          return (
            <span
              key={idx}
              className={waveAnim}
              style={{
                transition: "color 0.19s, border 0.19s, filter 0.18s, background 0.19s, transform 0.22s",
                color: showFound || finalWave
                  ? "#23272f"
                  : idx < decryptStep
                    ? "#23272f"
                    : "#a1a1aa",
                textShadow: idx < decryptStep || showFound
                  ? "0 2px 8px #e2e8f080"
                  : "0 1px 3px #e0e7ef55",
                fontWeight: idx < decryptStep || showFound ? 900 : 400,
                borderBottom: hovered
                  ? "3px solid #818cf8"
                  : idx < decryptStep
                    ? "2.7px solid #a5b4fc"
                    : "2px dotted #e0e7ef22",
                borderRadius: "2.7px",
                padding: "0 0.03em",
                background: (showFound || hovered) ? colorBg : "none",
                filter: hovered && idx < decryptStep ? "brightness(1.05)" : "none",
                position: "relative",
                zIndex: 2,
                animation: waveAnim
                  ? `${waveAnim} 1.5s cubic-bezier(.45,1.75,.38,.9) both`
                  : undefined,
                animationDelay: animDelay,
                willChange: "transform, color, background"
              }}
            >
              {c === " " ? "\u00A0" : showChar}
            </span>
          );
        })}
        {hovered && (
          <span
            style={{
              position: "absolute",
              left: 0,
              bottom: -14,
              height: 6,
              width: "100%",
              background: "repeating-linear-gradient(90deg,#818cf8 0 8px, transparent 8px 20px)",
              borderRadius: 8,
              opacity: 0.12,
              transition: "opacity 0.14s,width 0.2s",
              animation: "math-underline-move 2s linear infinite"
            }}
          />
        )}
        <style>{`
          @keyframes math-underline-move {
            0% { background-position-x: 0; }
            100% { background-position-x: 28px; }
          }
          @keyframes letter-wave-fluid-long {
            0%   { transform: translateY(0) scale(1); background: #f3f4f6; }
            16%  { transform: translateY(-26%) scale(1.07); background: #f0f1f3; }
            32%  { transform: translateY(-52%) scale(1.13); background: #e0e7ef; }
            54%  { transform: translateY(-35%) scale(1.09); background: #f4f5f6;}
            100% { transform: translateY(0) scale(1); background: #fafbfc; }
          }
          @keyframes final-wave-fluid-long {
            0%   { transform: translateY(0) scale(1); background: #f4f4f5; }
            19%  { transform: translateY(-40%) scale(1.16); background: #e0e7ef; }
            60%  { transform: translateY(-85%) scale(1.22); background: #f1f5f9; }
            77%  { transform: translateY(-33%) scale(1.07);}
            100% { transform: translateY(0) scale(1); background: none;}
          }
        `}</style>
      </span>
    );
  }

  return (
  <section
    ref={heroRef}
    className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden py-8 px-0"
    style={{
      background: "linear-gradient(110deg, #f7fafc 55%, #e3e8ee 85%, #cbd5e1 100%)",
    }}
  >
    {/* SVG textura de fundo: bolinhas discretas */}
    <svg
      className="absolute inset-0 w-full h-full z-0 pointer-events-none"
      style={{ opacity: 0.3, filter: "blur(1.2px)" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="tinyDots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.15" fill="#a2acc7" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tinyDots)" />
    </svg>
    {/* Degradê dos dois lados IGUAIS */}
    <div className="absolute bottom-[-120px] left-[-90px] w-[420px] h-[420px] rounded-full z-0 pointer-events-none"
      style={{
        background: "radial-gradient(circle at 60% 40%, #e0e7ef 55%, transparent 100%)",
        filter: "blur(32px)",
        opacity: 0.60,
      }}
    />
    <div className="absolute bottom-[-120px] right-[-90px] w-[420px] h-[420px] rounded-full z-0 pointer-events-none"
      style={{
        background: "radial-gradient(circle at 60% 40%, #e0e7ef 55%, transparent 100%)",
        filter: "blur(32px)",
        opacity: 0.60,
      }}
    />
    {/* Contas animadas no fundo, agora com hover destacado */}
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
      {contasBg.map((item) => (
        <span
          key={item.key}
          className="absolute font-mono select-none group"
          onMouseEnter={() => setHoverContaKey(item.key)}
          onMouseLeave={() => setHoverContaKey(null)}
          style={{
            pointerEvents: "auto",
            left: `${item.left}%`,
            top: `${item.top}%`,
            fontSize: hoverContaKey === item.key
              ? `clamp(1.2rem, ${item.size * 1.6}rem, 2.1rem)`
              : `clamp(0.7rem, ${item.size}rem, 1.2rem)`,
            opacity: hoverContaKey === item.key
              ? 0.96
              : 0.13,
            color: hoverContaKey === item.key ? "#1e293b" : "#64748b",
            background: hoverContaKey === item.key
              ? "#f1f5f9"
              : "rgba(255,255,255,0.02)",
            borderRadius: "0.4em",
            padding: hoverContaKey === item.key
              ? "0.18em 0.38em"
              : "0.09em 0.20em",
            boxShadow: hoverContaKey === item.key
              ? "0 3px 24px 0 #818cf840"
              : "0 2px 7px 0 #cbd5e122",
            fontWeight: hoverContaKey === item.key
              ? 700
              : 600,
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
            textShadow: "0 2px 8px #dbeafe24, 0 1px 2px #fff",
            userSelect: "none",
            animation: `floatUpHero${item.isLeft ? "Left" : "Right"} ${item.duration}s cubic-bezier(.36,1.05,.87,.67) ${item.delay}s infinite`,
            transition: "all 0.19s cubic-bezier(.5,1.7,.5,1)",
            maxWidth: "40vw",
            overflow: "hidden",
            direction: "ltr",
            filter: hoverContaKey === item.key ? "brightness(1.05) drop-shadow(0 1px 8px #818cf860)" : "blur(0.22px)",
            zIndex: hoverContaKey === item.key ? 12 : 1,
            cursor: hoverContaKey === item.key ? "pointer" : "default",
          }}
        >
          {item.texto}
        </span>
      ))}
    </div>
    <style>{`
      @keyframes floatUpHeroLeft {
        0% {
          transform: translate(-9vw,80vh) scale(1.01) rotate(-2.5deg);
          opacity: 0.07;
          filter: blur(2px);
        }
        35% { opacity: 0.15; filter: blur(0.08px);}
        80% { opacity: 0.11;}
        100% {
          transform: translate(-2vw,-12vh) scale(1.01) rotate(-4deg);
          opacity: 0.04;
          filter: blur(0.7px);
        }
      }
      @keyframes floatUpHeroRight {
        0% {
          transform: translate(10vw,80vh) scale(1.01) rotate(2.5deg);
          opacity: 0.07;
          filter: blur(2px);
        }
        35% { opacity: 0.15; filter: blur(0.08px);}
        80% { opacity: 0.11;}
        100% {
          transform: translate(2vw,-12vh) scale(1.01) rotate(4deg);
          opacity: 0.04;
          filter: blur(0.7px);
        }
      }
      @media (max-width: 640px) {
        .hero-btn {
          font-size: 1rem !important;
          padding: 0.75rem 1.1rem !important;
          min-width: 120px !important;
          border-radius: 2rem !important;
        }
        .hero-title {
          font-size: 2.1rem !important;
        }
        .hero-p {
          font-size: 1rem !important;
        }
      }
    `}</style>

    {/* TÍTULO PRINCIPAL COM EFEITO DE DESCRIPTOGRAFAR */}
    <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center px-2">
      <h1
        className="font-extrabold tracking-tight leading-tight drop-shadow hero-title"
        style={{
          marginBottom: "2.1rem",
          fontSize: "clamp(2.2rem, 6vw, 4.7rem)",
          lineHeight: 1.09,
          letterSpacing: "-0.01em"
        }}
      >
        {renderDecrypted()}
      </h1>
      <p
        className="text-gray-500 text-lg sm:text-2xl md:text-2xl mb-10 max-w-2xl font-light text-center hero-p"
        style={{
          marginBottom: "2.3rem",
          lineHeight: 1.44,
          fontWeight: 400,
          fontSize: "clamp(1.07rem, 1.5vw, 1.45rem)",
          textShadow: "0 1px 10px #e0e7ef11"
        }}
      >
        Ferramentas e consultoria para administrar seu Microempreendedor Individual com eficiência e segurança.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
          <button
            onClick={scrollToPlans}
            className="flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-gray-900 hover:bg-gray-800 text-white text-lg font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-gray-300 hero-btn"
            style={{ boxShadow: "0 3px 16px 0 #3341550b", minWidth: "180px" }}
          >
            <FiUserCheck className="text-xl" />
            Consultoria
          </button>
        <a
          href="#simulador"
          className="flex items-center justify-center gap-2 px-7 py-3 rounded-full border border-gray-300 bg-white hover:bg-gray-100 text-gray-900 text-lg font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-gray-100 hero-btn"
          style={{ minWidth: "180px" }}
        >
          <FiTrendingUp className="text-xl" />
          Simular Operação
        </a>
      </div>
    </div>
  </section>
);
}