"use client";
import { useState } from "react";
import { FiSmile, FiZap, FiShield, FiThumbsUp, FiBookOpen, FiUsers } from "react-icons/fi";

const diferenciais = [
  {
    titulo: "Atendimento Humanizado",
    icone: <FiSmile className="text-5xl text-pink-600" />,
    texto: "Você fala com pessoas reais, especialistas em MEI, prontas para tirar dúvidas e ajudar de verdade.",
    cor: "bg-pink-50 border-pink-200",
    cta: "Converse agora",
    ctaHref: "#consultoria"
  },
  {
    titulo: "Agilidade e Praticidade",
    icone: <FiZap className="text-5xl text-yellow-500" />,
    texto: "Respostas rápidas, processos descomplicados e foco em soluções. Resolva tudo sem enrolação.",
    cor: "bg-yellow-50 border-yellow-200",
    cta: "Saiba mais",
    ctaHref: "#consultoria"
  },
  {
    titulo: "Segurança & Privacidade",
    icone: <FiShield className="text-5xl text-blue-700" />,
    texto: "Seus dados protegidos com criptografia e sigilo total. Privacidade é compromisso!",
    cor: "bg-blue-50 border-blue-200",
    cta: "Ver política",
    ctaHref: "#"
  },
  {
    titulo: "Materiais Exclusivos",
    icone: <FiBookOpen className="text-5xl text-violet-700" />,
    texto: "Acesso a e-books, planilhas e modelos práticos, feitos para o dia a dia do microempreendedor.",
    cor: "bg-violet-50 border-violet-200",
    cta: "Ver materiais",
    ctaHref: "#materiais"
  },
  {
    titulo: "Comunidade & Networking",
    icone: <FiUsers className="text-5xl text-green-700" />,
    texto: "Participe de grupos, eventos e troque experiências com outros MEIs. Juntos, vamos mais longe.",
    cor: "bg-green-50 border-green-200",
    cta: "Quero participar",
    ctaHref: "#"
  },
  {
    titulo: "Satisfação Garantida",
    icone: <FiThumbsUp className="text-5xl text-orange-600" />,
    texto: "Nosso compromisso é o seu sucesso. Atendimento, materiais e suporte de qualidade real.",
    cor: "bg-orange-50 border-orange-200",
    cta: "Depoimentos",
    ctaHref: "#depoimentos"
  },
];

export default function NossosDiferenciais() {
  const [index, setIndex] = useState(0);

  function next() {
    setIndex((idx) => (idx + 1) % diferenciais.length);
  }
  function prev() {
    setIndex((idx) => (idx - 1 + diferenciais.length) % diferenciais.length);
  }

  return (
    <section
      id="diferenciais"
      className="w-full py-16 px-4 flex flex-col items-center bg-white border-t border-gray-100"
    >
      <div className="max-w-xl mx-auto flex flex-col items-center">
        <h2 className="text-blue-900 text-3xl sm:text-4xl font-extrabold text-center mb-2 tracking-tight">
          Nossos diferenciais
        </h2>
        <p className="text-blue-800/80 text-base sm:text-lg mb-10 text-center max-w-lg font-light">
          O que faz nossa consultoria ser única para o seu MEI.
        </p>
        <div className="relative w-full max-w-md">
          {/* Card com animação */}
          <div
            className={`
              flex flex-col items-center justify-between transition-all duration-400
              rounded-3xl border shadow-lg px-6 py-10 min-h-[330px]
              ${diferenciais[index].cor}
            `}
            style={{
              boxShadow: "0 4px 32px 0 rgba(0,0,0,0.07)",
              transition: "background 0.4s, border 0.4s"
            }}
            key={index}
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-1 mb-4">
              {diferenciais[index].icone}
              <span className="text-xl sm:text-2xl font-bold text-blue-900 text-center mt-2">
                {diferenciais[index].titulo}
              </span>
            </div>
            <p className="text-blue-900/90 text-base text-center mb-8 font-medium min-h-[60px]">
              {diferenciais[index].texto}
            </p>
            <a
              href={diferenciais[index].ctaHref}
              className={`
                inline-block mt-auto px-7 py-2 rounded-full font-semibold transition
                text-white shadow
                ${
                  [
                    "bg-pink-600 hover:bg-pink-700",
                    "bg-yellow-500 hover:bg-yellow-600",
                    "bg-blue-700 hover:bg-blue-800",
                    "bg-violet-700 hover:bg-violet-800",
                    "bg-green-700 hover:bg-green-800",
                    "bg-orange-600 hover:bg-orange-700",
                  ][index]
                }
              `}
              style={{ minWidth: 150 }}
              tabIndex={-1}
            >
              {diferenciais[index].cta}
            </a>
          </div>

          {/* Navegação interativa */}
          <div className="flex flex-row justify-center items-center gap-3 mt-7">
            <button
              onClick={prev}
              aria-label="Anterior"
              className={`
                w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-blue-800 flex items-center justify-center
                shadow transition disabled:opacity-60
              `}
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              </svg>
            </button>
            {diferenciais.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Ir para diferencial ${i + 1}`}
                className={`w-3 h-3 rounded-full transition-all
                  ${
                    index === i
                      ? [
                          "bg-pink-600",
                          "bg-yellow-500",
                          "bg-blue-700",
                          "bg-violet-700",
                          "bg-green-700",
                          "bg-orange-600"
                        ][i]
                      : "bg-gray-300 hover:scale-125"
                  }
                  ${index === i ? "scale-125 shadow" : "opacity-70"}
                `}
                style={{ margin: "0 0.18rem" }}
              />
            ))}
            <button
              onClick={next}
              aria-label="Próximo"
              className={`
                w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-blue-800 flex items-center justify-center
                shadow transition disabled:opacity-60
              `}
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Toque sutil de cor no fundo */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-pink-100 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-yellow-100 rounded-full blur-2xl opacity-20" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-blue-100 rounded-full blur-3xl opacity-20" />
      </div>
    </section>
  );
}