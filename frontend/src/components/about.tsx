"use client";
import React, { useState, useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

// Tooltip com animação suave e deslocamento maior para baixo
function Grifado({
  children,
  dicaKey,
  dica,
}: {
  children: React.ReactNode;
  dicaKey: string;
  dica: string;
}) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  function onEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShow(true);
  }
  function onLeave() {
    timeoutRef.current = setTimeout(() => setShow(false), 90);
  }

  return (
    <span
      className="relative inline-block"
      style={{ verticalAlign: "baseline" }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      tabIndex={0}
      onFocus={onEnter}
      onBlur={onLeave}
    >
      <span
        className="underline decoration-[2px] underline-offset-4 decoration-[#22334a] font-semibold text-neutral-800 transition-colors duration-200 cursor-pointer px-0.5"
        data-dica-key={dicaKey}
        aria-describedby={dicaKey + "-tooltip"}
      >
        {children}
      </span>
      <span
        className={`
          pointer-events-none absolute z-[999] left-1/2 -translate-x-1/2
          mt-7
          px-4 py-3 rounded-xl border border-neutral-200
          bg-white text-neutral-900 text-base font-medium shadow-xl
          transition-all duration-250 ease-out
          ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1'}
        `}
        id={dicaKey + "-tooltip"}
        style={{
          minWidth: 220,
          maxWidth: 340,
          lineHeight: 1.6,
          fontSize: "1.05rem",
          filter: "drop-shadow(0 6px 32px rgba(32,44,60,.13))",
          whiteSpace: "normal",
        }}
        aria-hidden={show ? "false" : "true"}
      >
        {dica}
      </span>
    </span>
  );
}

const slides = [
  {
    trechos: [
      <>
        <b className="text-neutral-900 font-semibold">
          Consultoria clara e personalizada para o MEI.
        </b>
      </>,
      <>
        Simplifique sua rotina mantendo todas as{" "}
        <Grifado
          dicaKey="obrigações fiscais"
          dica="Te ajudamos a entender e cumprir todas as obrigações do seu MEI, evitando multas e problemas futuros. Assim, você mantém seu CNPJ ativo e sem riscos."
        >
          obrigações fiscais
        </Grifado>{" "}
        em dia e garanta tranquilidade para focar no seu negócio. Nosso suporte auxilia desde o registro inicial do MEI até o acompanhamento de prazos e documentos exigidos pelo governo.
      </>,
      <>
        Receba{" "}
        <Grifado
          dicaKey="orientação especializada"
          dica="Nossa equipe está pronta para tirar dúvidas e te orientar sobre emissão de notas fiscais, legislação, impostos e burocracias do MEI."
        >
          orientação especializada
        </Grifado>{" "}
        para emitir notas fiscais corretamente, evitar multas e estar sempre regular. Nossa equipe esclarece dúvidas sobre impostos, alvarás e regras municipais.
      </>,
      <>
        Acesse ferramentas práticas para o{" "}
        <Grifado
          dicaKey="controle financeiro"
          dica="Ferramentas e dicas para organizar seu caixa, separar contas, planejar pagamentos e manter a saúde financeira do seu negócio."
        >
          controle financeiro
        </Grifado>
        , como planilhas de fluxo de caixa, dicas para separar contas pessoais e empresariais e métodos de organização para que você tome decisões mais seguras.
      </>,
      <>
        Conte com acompanhamento constante: dúvidas sobre{" "}
        <Grifado
          dicaKey="declaração anual"
          dica="Auxiliamos no preenchimento e envio da Declaração Anual do MEI, evitando inconsistências e mantendo sua empresa regularizada."
        >
          declaração anual
        </Grifado>{" "}
        ou sobre como emitir boletos do DAS? Estamos prontos para ajudar você a crescer com confiança e segurança.
      </>,
    ],
  },
  {
    trechos: [
      <>
        <b className="text-neutral-900 font-semibold">
          Organize, planeje e cresça com segurança.
        </b>
      </>,
      <>
        Tenha apoio no{" "}
        <Grifado
          dicaKey="planejamento tributário"
          dica="Planeje seus impostos para evitar gastos desnecessários e aproveite benefícios fiscais exclusivos do MEI."
        >
          planejamento tributário
        </Grifado>{" "}
        para pagar menos impostos, entender benefícios e evitar surpresas. Esclareça dúvidas sobre limites de faturamento, atividades permitidas e como expandir seus serviços.
      </>,
      <>
        Ganhe autonomia para{" "}
        <Grifado
          dicaKey="emissão de notas"
          dica="Aprenda a emitir notas fiscais eletrônicas, entenda as regras do seu município e mantenha seus clientes e parceiros regulares."
        >
          emissão de notas
        </Grifado>{" "}
        eletrônicas com passo a passo e suporte para cadastro em prefeituras, escolhendo o código de serviço ideal para sua empresa.
      </>,
      <>
        Conte com{" "}
        <Grifado
          dicaKey="ferramentas digitais"
          dica="Conheça planilhas, apps e sistemas que organizam vendas, despesas e estoque, tornando seu dia a dia mais prático."
        >
          ferramentas digitais
        </Grifado>
        , como planilhas e aplicativos recomendados para MEIs, facilitando controle de vendas, despesas, estoque e emissão de recibos.
      </>,
      <>
        Utilize nossos relatórios para{" "}
        <Grifado
          dicaKey="análise de resultados"
          dica="Relatórios claros ajudam a visualizar lucros, identificar sazonalidades e planejar os próximos passos do seu negócio."
        >
          análise de resultados
        </Grifado>{" "}
        e monitore o crescimento do seu negócio, sabendo identificar oportunidades e pontos de melhoria.
      </>,
    ],
  },
  {
    trechos: [
      <>
        <b className="text-neutral-900 font-semibold">
          Dê o próximo passo com autonomia.
        </b>
      </>,
      <>
        Receba suporte completo para{" "}
        <Grifado
          dicaKey="enquadramento correto"
          dica="Orientação para escolher o melhor CNAE, entender limites de faturamento e manter seu MEI sempre regular."
        >
          enquadramento correto
        </Grifado>{" "}
        do seu MEI, escolha da atividade CNAE e orientação para manter-se sempre dentro das regras.
      </>,
      <>
        Expanda seu negócio com estratégia: conheça os cuidados ao{" "}
        <Grifado
          dicaKey="expansão do negócio"
          dica="Saiba como crescer com segurança, migrar para outro regime tributário e quais são os impactos dessa decisão."
        >
          expandir o negócio
        </Grifado>{" "}
        para além do limite do MEI, avalie migração para ME ou EPP e entenda obrigações extras.
      </>,
      <>
        Esteja sempre informado sobre{" "}
        <Grifado
          dicaKey="atualizações e prazos"
          dica="Alertas sobre datas importantes: pagamento do DAS, declaração anual, mudanças em obrigações e benefícios."
        >
          atualizações e prazos
        </Grifado>{" "}
        importantes, como vencimento do DAS, envio de declarações, alterações na legislação e oportunidades de incentivo.
      </>,
      <>
        Tire dúvidas sobre{" "}
        <Grifado
          dicaKey="auxílios e benefícios"
          dica="Descubra seus direitos como MEI: INSS, auxílio-doença, aposentadoria, salário-maternidade e benefícios previdenciários."
        >
          auxílios e benefícios
        </Grifado>{" "}
        disponíveis para MEI, como INSS, aposentadoria, auxílio maternidade e outros direitos.
      </>,
    ],
  },
];

export default function About() {
  const [slide, setSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const { trechos } = slides[slide];

  function changeSlide(next: number, dir: "left" | "right") {
    if (isAnimating) return;
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setSlide(next);
      setIsAnimating(false);
    }, 340);
  }

  return (
    <section className="w-full flex justify-center py-20 px-2 sm:px-12 bg-white select-none relative min-h-[700px]"
      // Removido overflow: "hidden" do style!
      style={{ minHeight: 700, position: "relative" }}
    >
      <div
        className="w-full max-w-6xl flex flex-col items-center mx-auto relative"
        // Não coloque overflow aqui também!
        style={{ minHeight: 700, position: "relative" }}
      >
        {/* Título centralizado */}
        <div className="w-full flex justify-center relative mb-12">
          <span
            className="font-extrabold text-3xl md:text-5xl text-neutral-800 tracking-tight text-center max-w-5xl w-full"
            style={{ letterSpacing: "-0.02em", lineHeight: 1.13 }}
          >
            Consultoria para MEI com foco em resultado
          </span>
        </div>
        {/* Texto principal */}
        <div className="w-full flex justify-center relative">
          <div
            className={`
              relative w-full max-w-5xl mx-auto px-2 sm:px-8 flex flex-col gap-7 text-neutral-800 text-xl font-normal leading-[2.1rem] text-justify
              transition-all duration-400
              ${isAnimating
                ? direction === "right"
                  ? "animate-slide-out-left"
                  : "animate-slide-out-right"
                : direction === "right"
                  ? "animate-slide-in-right"
                  : "animate-slide-in-left"
              }
            `}
            style={{ textJustify: "inter-word" }}
            aria-live="polite"
          >
            {trechos.map((el, idx) => (
              <span key={idx} className="block cursor-default">
                {el}
              </span>
            ))}
          </div>
        </div>
        {/* Navegação de slides embaixo e centralizada */}
        <div className="flex items-center gap-4 mt-12 justify-center w-full ">
          <button
            aria-label="Anterior"
            onClick={() =>
              changeSlide(
                slide === 0 ? slides.length - 1 : slide - 1,
                "left"
              )
            }
            className="rounded-full p-2 border border-neutral-200 bg-white hover:bg-neutral-50 transition disabled:opacity-40 cursor-pointer"
            disabled={slides.length <= 1 || isAnimating}
            tabIndex={0}
          >
            <FiChevronLeft size={22} className="text-neutral-500" />
          </button>
          <span className="text-base text-neutral-400 select-none font-medium">
            {slide + 1} / {slides.length}
          </span>
          <button
            aria-label="Próximo"
            onClick={() =>
              changeSlide(
                slide === slides.length - 1 ? 0 : slide + 1,
                "right"
              )
            }
            className="rounded-full p-2 border border-neutral-200 bg-white hover:bg-neutral-50 transition disabled:opacity-40 cursor-pointer"
            disabled={slides.length <= 1 || isAnimating}
            tabIndex={0}
          >
            <FiChevronRight size={22} className="text-neutral-500" />
          </button>
        </div>
      </div>
      {/* TailwindCSS keyframes para animações de slide */}
      <style jsx global>{`
        @keyframes slide-in-right {
          0% { opacity: 0; transform: translateX(70px);}
          100% { opacity: 1; transform: translateX(0);}
        }
        @keyframes slide-out-left {
          0% { opacity: 1; transform: translateX(0);}
          100% { opacity: 0; transform: translateX(-70px);}
        }
        @keyframes slide-in-left {
          0% { opacity: 0; transform: translateX(-70px);}
          100% { opacity: 1; transform: translateX(0);}
        }
        @keyframes slide-out-right {
          0% { opacity: 1; transform: translateX(0);}
          100% { opacity: 0; transform: translateX(70px);}
        }
        .animate-slide-in-right { animation: slide-in-right 0.38s cubic-bezier(.72,0,.27,1) both; }
        .animate-slide-out-left { animation: slide-out-left 0.38s cubic-bezier(.72,0,.27,1) both; }
        .animate-slide-in-left { animation: slide-in-left 0.38s cubic-bezier(.72,0,.27,1) both; }
        .animate-slide-out-right { animation: slide-out-right 0.38s cubic-bezier(.72,0,.27,1) both; }
      `}</style>
    </section>
  );
}