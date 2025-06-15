"use client";
import { useState, useEffect, useRef } from "react";
import { FiTrendingUp, FiUserCheck } from "react-icons/fi";

// Gerador de operações contábeis simples
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
    case "+": resultado = (parseInt(valor1) + parseInt(valor2)).toString(); break;
    case "-": resultado = (parseInt(valor1) - parseInt(valor2)).toString(); break;
    case "×": resultado = (parseInt(valor1) * parseInt(valor2)).toString(); break;
    case "÷": resultado = Math.floor(parseInt(valor1) / parseInt(valor2)).toString(); break;
    default: resultado = valor1;
  }
  return { conta, op, valor1, valor2, resultado };
}
function embaralhar(str: string) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return str
    .split("")
    .map((c) => (c === " " ? " " : chars[Math.floor(Math.random() * chars.length)]))
    .join("");
}

// Hook para contas animadas subindo
function useContasAnimadas(qtd = 24, ativo = true, leftRange = [55, 90], sizeRange = [0.75, 1.07]) {
  const [contas, setContas] = useState(() =>
    Array.from({ length: qtd }, () => ({
      ...gerarOperacao(),
      fase: "embaralhando",
      texto: "",
      left: Math.random() * (leftRange[1] - leftRange[0]) + leftRange[0],
      top: Math.random() * 70 + 10,
      size: Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0],
      duration: 5 + Math.random() * 1.8,
      delay: Math.random() * 1.2,
      key: Math.random().toString(36).slice(2),
    }))
  );

  useEffect(() => {
    if (!ativo) return;
    const timers: NodeJS.Timeout[] = [];
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
                novo[i] = {
                  ...gerarOperacao(),
                  fase: "embaralhando",
                  texto: embaralhar(linhaOriginal),
                  left: Math.random() * (leftRange[1] - leftRange[0]) + leftRange[0],
                  top: 100,
                  size: Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0],
                  duration: 5 + Math.random() * 1.8,
                  delay: Math.random() * 1.2,
                  key: Math.random().toString(36).slice(2)
                };
                return novo;
              });
            }, (item.duration + 1) * 1000)
          );
        }, item.delay * 1000)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [contas, ativo, leftRange, sizeRange]);
  return contas;
}

// Detecta tamanho de tela
function useScreen() {
  const [screen, setScreen] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 640) setScreen("mobile");
      else if (window.innerWidth < 1024) setScreen("tablet");
      else setScreen("desktop");
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return screen;
}

export default function Hero1() {
  const [operacao, setOperacao] = useState(gerarOperacao());
  const [linhaAnimada, setLinhaAnimada] = useState("");
  const [fase, setFase] = useState("embaralhando");
  const linhaOriginal = `${operacao.conta}: ${operacao.valor1} ${operacao.op} ${operacao.valor2} = ${operacao.resultado}`;

  const screen = useScreen();

  // Configurações para cada tamanho de tela
  const contasConfig = {
    mobile: { qtd: 8, left: [10, 90] as [number, number], size: [0.7, 1.1] as [number, number] },
    tablet: { qtd: 14, left: [20, 80] as [number, number], size: [0.8, 1.2] as [number, number] },
    desktop: { qtd: 24, left: [55, 90] as [number, number], size: [0.75, 1.07] as [number, number] },
  };
  const contasBg = useContasAnimadas(
    contasConfig[screen].qtd,
    true,
    contasConfig[screen].left,
    contasConfig[screen].size
  );

  // Conta principal animada (não usada no mobile)
  useEffect(() => {
    if (screen === "mobile") return;
    setFase("embaralhando");
    let embaralhaCount = 0;
    const embaralhaInterval = setInterval(() => {
      setLinhaAnimada(embaralhar(linhaOriginal));
      embaralhaCount++;
      if (embaralhaCount > 10) {
        clearInterval(embaralhaInterval);
        setFase("revelando");
      }
    }, 38);

    const revelaTimeout = setTimeout(() => {
      setLinhaAnimada(linhaOriginal);
      setFase("resultado");
    }, 650);

    const trocaTimeout = setTimeout(() => {
      setOperacao(gerarOperacao());
    }, 2100);

    return () => {
      clearInterval(embaralhaInterval);
      clearTimeout(revelaTimeout);
      clearTimeout(trocaTimeout);
    };
  }, [operacao.conta, operacao.op, operacao.valor1, operacao.valor2, operacao.resultado, screen, linhaOriginal]);

  useEffect(() => {
    if (screen === "mobile") return;
    if (fase === "embaralhando") setLinhaAnimada(embaralhar(linhaOriginal));
    if (fase === "resultado") setLinhaAnimada(linhaOriginal);

  }, [fase, linhaOriginal, screen]);

  // Ativa/desativa efeito das contas com scroll
  const [contasAtivas, setContasAtivas] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);

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

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden py-8 px-0"
      style={{
        background:
          screen === "mobile"
            ? "radial-gradient(circle at 50% 40%, #b8e4fa 0%, #f7fafc 70%, #7dd3fc 100%)"
            : screen === "tablet"
            ? "#f7fafc"
            : "linear-gradient(110deg, #f7fafc 55%, #b8e4fa 85%, #7dd3fc 100%)",
      }}
    >
      {/* Contas animadas no fundo (pequenas e harmônicas) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {contasAtivas &&
          contasBg.map((item) => (
            <span
              key={item.key}
              className="absolute font-mono select-none"
              style={{
                left: `${item.left}%`,
                top: `${item.top}%`,
                fontSize: `clamp(0.7rem, ${item.size}rem, 1.2rem)`,
                opacity: 0.17 + 0.09 * Math.random(),
                color: "#2563eb",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "0.4em",
                padding: "0.09em 0.20em",
                boxShadow: "0 2px 7px 0 #60a5fa22",
                fontWeight: 600,
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                textShadow: "0 2px 12px #60a5fa38, 0 1px 2px #fff",
                userSelect: "none",
                animation: `floatUpHero ${item.duration}s cubic-bezier(.36,1.05,.87,.67) ${item.delay}s infinite`,
                transition: "opacity 0.8s, filter 0.8s",
                maxWidth: screen === "mobile" ? "80vw" : "40vw",
                overflow: "hidden",
                direction: "ltr",
                filter: "blur(0.26px)",
                zIndex: 1,
              }}
            >
              {item.texto}
            </span>
          ))}
      </div>

      {/* CSS da animação */}
      <style>{`
        @keyframes floatUpHero {
          0% {
            transform: translateY(80vh) scale(1.01) rotate(-2.5deg);
            opacity: 0.10;
            filter: blur(2.1px);
          }
          18% { opacity: 0.23; filter: blur(0.09px);}
          80% { opacity: 0.15;}
          100% {
            transform: translateY(-12vh) scale(1.00) rotate(1.8deg);
            opacity: 0.07;
            filter: blur(0.9px);
          }
        }
      `}</style>

      {/* DESKTOP: mantém o layout original */}
      {screen === "desktop" && (
        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center min-h-[60vh]">
          {/* Esquerda: conteúdo principal */}
          <div className="w-full md:w-[56%] lg:w-[48%] flex flex-col justify-center items-start px-4 sm:px-6  py-8 md:py-0">
            <h1
              className="text-[2.2rem] xs:text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight drop-shadow"
              style={{
                marginBottom: "2.2rem",
                lineHeight: 1.09,
                letterSpacing: "-0.01em",
                fontSize: "clamp(2.1rem, 5vw, 4.5rem)"
              }}
            >
              <span className="block text-blue-950">Gestão M.E.I.</span>
            </h1>
            <p
              className="text-gray-700 text-lg sm:text-2xl md:text-2xl mb-10 max-w-2xl font-light text-justify"
              style={{
                marginBottom: "2.3rem",
                lineHeight: 1.44,
                fontWeight: 400,
                fontSize: "1.5vw"
              }}
            >
              Ferramentas e consultoria para administrar seu Microempreendedor Individual com eficiência e segurança.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <a
                href="#consultoria"
                className="flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-blue-950 hover:bg-blue-900 text-white text-lg font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ boxShadow: "0 3px 16px 0 #22406c14", minWidth: "180px" }}
              >
                <FiUserCheck className="text-xl" />
                Consultoria
              </a>
              <a
                href="#simulador"
                className="flex items-center justify-center gap-2 px-7 py-3 rounded-full border border-gray-300 bg-white hover:bg-gray-100 text-blue-950 text-lg font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-blue-100"
                style={{ minWidth: "180px" }}
              >
                <FiTrendingUp className="text-xl" />
                Simular Operação
              </a>
            </div>
          </div>
          {/* Direita: conta principal clean, afastada */}
          <div className="w-full md:w-[44%] lg:w-[52%] flex flex-col items-end justify-center relative h-[120px] xs:h-[150px] sm:h-[180px] md:h-[210px] mt-10 md:mt-0">
            <div
              className="font-mono font-medium tracking-widest select-none transition-all duration-500 border border-gray-100 shadow-2xl"
              style={{
                fontSize: "clamp(1rem, 2.1vw, 1.35rem)",
                letterSpacing: "0.09em",
                opacity: 0.98,
                userSelect: "none",
                whiteSpace: "nowrap",
                color: "#1d4ed8",
                textShadow: "0 2px 10px #e4ecfa, 0 1px 0 #f8faff",
                fontFamily: "Fira Mono, monospace",
                borderRadius: "1.3em",
                padding: "0.60em 1.4em",
                minWidth: "min(72vw, 170px)",
                maxWidth: "93vw",
                overflow: "hidden",
                boxShadow: "0 8px 32px 0 #3b82f633",
                background: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(7px)",
                border: "1.8px solid #dbeafe",
              }}
            >
              {linhaAnimada}
            </div>
          </div>
        </div>
      )}

      {/* TABLET: layout centralizado, conta principal menor, degrade no rodapé */}
      {screen === "tablet" && (
        <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] px-4">
          {/* Degradê decorativo no rodapé centralizado */}
          <div
            className="absolute left-1/2 bottom-0 -translate-x-1/2 z-0 pointer-events-none"
            style={{
              width: 420,
              height: 120,
    
            }}
          />
          <div
            className="w-full rounded-xl shadow-xl bg-white/90 border border-blue-100 mb-8 py-5 px-4 flex flex-col items-center relative z-10"
            style={{
              minHeight: 70,
              marginTop: 10,
              marginBottom: 24,
            }}
          >
            <span
              className="font-mono font-bold tracking-widest text-blue-900 text-lg sm:text-xl"
              style={{
                letterSpacing: "0.08em",
                textShadow: "0 2px 10px #e4ecfa, 0 1px 0 #fff",
                fontFamily: "Fira Mono, monospace",
                whiteSpace: "nowrap",
                userSelect: "none",
              }}
            >
              {linhaAnimada}
            </span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-blue-950 leading-tight mb-2 text-center"
            style={{
              lineHeight: 1.13,
              letterSpacing: "-0.01em",
              fontSize: "clamp(2rem, 6vw, 2.7rem)",
            }}
          >
            Gestão M.E.I.
          </h1>
          <p
            className="text-blue-900/80 text-lg sm:text-xl mb-8 max-w-xl font-light text-center"
            style={{
              lineHeight: 1.44,
              fontWeight: 400,
              fontSize: "clamp(1.1rem, 3vw, 1.25rem)",
            }}
          >
            Ferramentas e consultoria para administrar seu MEI com eficiência e segurança.
          </p>
          <div className="flex flex-row gap-3 w-full justify-center">
            <a
              href="#consultoria"
              className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-blue-950 hover:bg-blue-900 text-white text-base font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ boxShadow: "0 3px 16px 0 #22406c14", minWidth: "140px" }}
            >
              <FiUserCheck className="text-xl" />
              Consultoria
            </a>
            <a
              href="#simulador"
              className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 text-blue-900 text-base font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-blue-100"
              style={{ minWidth: "140px" }}
            >
              <FiTrendingUp className="text-xl" />
              Simular Operação
            </a>
          </div>
        </div>
      )}

      {/* MOBILE: layout clean, centralizado, sem conta principal */}
      {screen === "mobile" && (
        <div className="relative z-10 w-full max-w-xs mx-auto flex flex-col items-center justify-center min-h-[60vh] px-2">
          <div
            className="w-full rounded-2xl shadow-xl bg-white/95 border border-blue-100 py-7 px-4 flex flex-col items-center"
            style={{
              marginTop: 32,
              marginBottom: 32,
            }}
          >
            <h1
              className="text-xl font-extrabold tracking-tight text-blue-950 leading-tight mb-2 text-center"
              style={{
                lineHeight: 1.13,
                letterSpacing: "-0.01em",
                fontSize: "clamp(1.2rem, 7vw, 1.7rem)",
              }}
            >
              Gestão M.E.I.
            </h1>
            <p
              className="text-blue-900/80 text-base mb-8 max-w-xs font-light text-center"
              style={{
                lineHeight: 1.44,
                fontWeight: 400,
                fontSize: "clamp(0.95rem, 3vw, 1.1rem)",
              }}
            >
              Ferramentas e consultoria para administrar seu MEI com eficiência e segurança.
            </p>
            <div className="flex flex-col gap-3 w-full justify-center">
              <a
                href="#consultoria"
                className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-blue-950 hover:bg-blue-900 text-white text-base font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ boxShadow: "0 3px 16px 0 #22406c14", minWidth: "100%" }}
              >
                <FiUserCheck className="text-xl" />
                Consultoria
              </a>
              <a
                href="#simulador"
                className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 text-blue-900 text-base font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-blue-100"
                style={{ minWidth: "100%" }}
              >
                <FiTrendingUp className="text-xl" />
                Simular Operação
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}