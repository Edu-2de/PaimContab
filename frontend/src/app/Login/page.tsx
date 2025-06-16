"use client";
import { useState, useRef } from "react";
import { FiUser, FiMail, FiLock, FiArrowLeft, FiX } from "react-icons/fi";

const siteName = "PaimContab";

export default function LoginRegisterPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");

  function handleSwitch() {
    setError(null);
    setName("");
    setEmail("");
    setPass("");
    setConfirm("");
    if (containerRef.current) {
      containerRef.current.classList.add("switching-fluent");
      setTimeout(() => {
        setMode((m) => (m === "login" ? "register" : "login"));
        setTimeout(() => {
          containerRef.current?.classList.remove("switching-fluent");
        }, 320);
      }, 180);
    } else {
      setMode((m) => (m === "login" ? "register" : "login"));
    }
  }

  function handleBack() {
    window.location.href = "/";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "register") {
        if (pass !== confirm) {
          setError("As senhas não coincidem.");
          setLoading(false);
          return;
        }
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password: pass }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Erro ao registrar.");
        } else {
          setMode("login");
          setError("Cadastro realizado! Faça login.");
        }
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: pass }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "E-mail ou senha inválidos.");
        } else {
          // Exemplo: salvar token/localStorage, redirecionar, etc
          // localStorage.setItem("token", data.token);
          window.location.href = "/";
        }
      }
    } catch {
      setError("Erro de conexão.");
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7fafc] via-[#e3e8ee] to-[#cbd5e1] relative"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <button
        onClick={handleBack}
        aria-label="Voltar para home"
        className="absolute top-6 left-6 bg-white/80 hover:bg-gray-100 rounded-full p-2 shadow transition z-20 cursor-pointer"
        style={{ border: "1.5px solid #e5e7eb" }}
      >
        <FiX className="text-2xl text-gray-500" />
      </button>
      <div
        ref={containerRef}
        className="relative w-full max-w-md mx-auto bg-white/90 rounded-3xl shadow-2xl px-8 py-10 flex flex-col items-center transition-all duration-500"
        style={{
          boxShadow: "0 8px 32px 0 #cbd5e1cc",
          border: "1.5px solid #e0e7ef",
          minHeight: 420,
        }}
      >
        <h1
          className="font-extrabold text-3xl mb-2 tracking-tight"
          style={{
            color: "#23272f",
            letterSpacing: "0.04em",
            textShadow: "0 2px 8px #e2e8f080",
            fontFamily: "monospace",
          }}
        >
          {siteName}
        </h1>
        <p className="text-gray-500 mb-7 text-center" style={{ fontSize: "1.13rem" }}>
          {mode === "login"
            ? "Acesse sua conta para gerenciar sua contabilidade."
            : "Crie sua conta e simplifique sua gestão MEI."}
        </p>
        <form
          className="w-full flex flex-col gap-4 transition-all"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          {mode === "register" && (
            <div className="relative">
              <FiUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Seu nome"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="pl-10 pr-3 py-2 rounded-lg border border-gray-200 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                style={{ fontSize: "1.08rem" }}
              />
            </div>
          )}
          <div className="relative">
            <FiMail className="absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              placeholder="E-mail"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="pl-10 pr-3 py-2 rounded-lg border border-gray-200 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              style={{ fontSize: "1.08rem" }}
            />
          </div>
          <div className="relative">
            <FiLock className="absolute left-3 top-3 text-gray-400" />
            <input
              type="password"
              placeholder="Senha"
              required
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="pl-10 pr-3 py-2 rounded-lg border border-gray-200 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              style={{ fontSize: "1.08rem" }}
            />
          </div>
          {mode === "register" && (
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                placeholder="Confirmar senha"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="pl-10 pr-3 py-2 rounded-lg border border-gray-200 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                style={{ fontSize: "1.08rem" }}
              />
            </div>
          )}
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`mt-2 py-2 rounded-lg font-semibold text-lg transition bg-gray-900 text-white hover:bg-gray-800 shadow cursor-pointer ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
            style={{
              letterSpacing: "0.01em",
              boxShadow: "0 3px 16px 0 #3341550b",
            }}
          >
            {loading
              ? mode === "login"
                ? "Entrando..."
                : "Registrando..."
              : mode === "login"
              ? "Entrar"
              : "Registrar"}
          </button>
        </form>
        <div className="mt-6 flex flex-col items-center w-full">
          <button
            onClick={handleSwitch}
            className={`font-medium transition cursor-pointer ${
              mode === "register"
                ? "text-black hover:underline"
                : "text-indigo-600 hover:underline"
            }`}
            style={{ fontSize: "1.04rem" }}
            type="button"
          >
            {mode === "login"
              ? "Não tem conta? Cadastre-se"
              : "Já tem conta? Entrar"}
          </button>
        </div>
        <button
          onClick={handleBack}
          className="absolute top-6 left-6 sm:hidden bg-white/80 hover:bg-gray-100 rounded-full p-2 shadow transition cursor-pointer"
          style={{ border: "1.5px solid #e5e7eb" }}
          aria-label="Voltar para home"
        >
          <FiArrowLeft className="text-xl text-gray-500" />
        </button>
        <style>{`
          .switching-fluent {
            animation: fadeSwitchFluent 0.5s cubic-bezier(.45,1.75,.38,.9);
          }
          @keyframes fadeSwitchFluent {
            0% { opacity: 1; transform: scale(1);}
            30% { opacity: 0.1; transform: scale(0.97) translateY(10px);}
            60% { opacity: 0.1; transform: scale(1.03) translateY(-10px);}
            100% { opacity: 1; transform: scale(1);}
          }
        `}</style>
      </div>
    </div>
  );
}