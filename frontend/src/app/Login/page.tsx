'use client';
import { useState, useRef } from 'react';
import { FiUser, FiMail, FiLock, FiArrowLeft, FiX, FiEye, FiEyeOff } from 'react-icons/fi';

const siteName = 'PaimContab';

export default function LoginRegisterPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');

  // Password visibility (sincronizado)
  const [showPassword, setShowPassword] = useState(false);
  const [eyeAnim, setEyeAnim] = useState(false);

  function handleSwitch() {
    setError(null);
    setName('');
    setEmail('');
    setPass('');
    setConfirm('');
    if (containerRef.current) {
      containerRef.current.classList.add('switching-fluent');
      setTimeout(() => {
        setMode(m => (m === 'login' ? 'register' : 'login'));
        setTimeout(() => {
          containerRef.current?.classList.remove('switching-fluent');
        }, 320);
      }, 180);
    } else {
      setMode(m => (m === 'login' ? 'register' : 'login'));
    }
  }

  function handleBack() {
    window.location.href = '/';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        if (pass !== confirm) {
          setError('As senhas não coincidem.');
          setLoading(false);
          return;
        }
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password: pass }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Erro ao registrar.');
        } else {
          console.log('Dados do usuário registrado:', data.user);

          // Verificar se data.user existe antes de salvar
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('Usuário salvo no localStorage');
            window.location.href = '/setup-company';
          } else {
            setError('Erro: dados do usuário não retornados.');
          }
        }
      } else {
        console.log('🔐 Fazendo login com:', { email });

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass }),
        });

        const data = await res.json();
        console.log('📥 Resposta do login:', data);

        if (!res.ok) {
          setError(data.message || 'E-mail ou senha inválidos.');
        } else {
          console.log('✅ Login bem-sucedido!');

          // 🔍 DEBUG DETALHADO DO TOKEN
          if (data.token && data.user) {
            console.log('🔑 Token completo recebido:', data.token);
            console.log('📋 Decodificando token...');

            // Decodificar o JWT para ver o conteúdo (apenas para debug)
            try {
              const tokenParts = data.token.split('.');
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log('📄 Payload do token:', payload);
              console.log('⏰ Token expira em:', new Date(payload.exp * 1000));
              console.log('⏰ Tempo atual:', new Date());
              console.log(
                '⏰ Token válido por mais:',
                Math.round((payload.exp * 1000 - Date.now()) / 1000 / 60),
                'minutos'
              );
            } catch (e) {
              console.log('❌ Erro ao decodificar token:', e);
            }

            console.log('💾 Salvando token:', data.token.substring(0, 20) + '...');
            console.log('👤 Salvando usuário:', data.user);

            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Verificar se foi salvo
            const savedToken = localStorage.getItem('authToken');
            const savedUser = localStorage.getItem('user');

            console.log('✅ Token salvo:', savedToken ? savedToken.substring(0, 20) + '...' : 'FALHOU');
            console.log('✅ User salvo:', savedUser ? JSON.parse(savedUser).name : 'FALHOU');

            // Redirecionar baseado no role
            if (data.user.role === 'admin') {
              console.log('🔧 Redirecionando para painel admin');
              window.location.href = '/admin/dashboard';
            } else {
              console.log('👥 Redirecionando para dashboard normal');
              window.location.href = '/dashboard';
            }
          } else {
            setError('Erro: token ou dados do usuário não retornados.');
            console.error('❌ Token ou usuário não retornados:', { token: !!data.token, user: !!data.user });
          }
        }
      }
    } catch (error) {
      console.error('💥 Erro na requisição:', error);
      setError('Erro de conexão.');
    }
    setLoading(false);
  }

  // Função para animar e sincronizar o olho
  function handleEyeClick() {
    setEyeAnim(true);
    setShowPassword(v => !v);
    setTimeout(() => setEyeAnim(false), 320);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7fafc] via-[#e3e8ee] to-[#cbd5e1] relative"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* X só na versão desktop */}
      <button
        onClick={handleBack}
        aria-label="Voltar para home"
        className="absolute top-6 left-6 bg-white/80 hover:bg-gray-100 rounded-full p-2 shadow transition z-20 cursor-pointer hidden sm:inline-flex"
        style={{ border: '1.5px solid #e5e7eb' }}
      >
        <FiX className="text-2xl text-gray-500" />
      </button>
      {/* Seta só na versão mobile */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 bg-white/80 hover:bg-gray-100 rounded-full p-2 shadow transition cursor-pointer sm:hidden"
        style={{ border: '1.5px solid #e5e7eb' }}
        aria-label="Voltar para home"
      >
        <FiArrowLeft className="text-xl text-gray-500" />
      </button>
      <div
        ref={containerRef}
        className="relative w-full max-w-md mx-auto bg-white/90 rounded-3xl shadow-2xl px-8 py-10 flex flex-col items-center transition-all duration-500"
        style={{
          boxShadow: '0 8px 32px 0 #cbd5e1cc',
          border: '1.5px solid #e0e7ef',
          minHeight: 420,
        }}
      >
        <h1
          className="font-extrabold text-3xl mb-2 tracking-tight"
          style={{
            color: '#23272f',
            letterSpacing: '0.04em',
            textShadow: '0 2px 8px #e2e8f080',
            fontFamily: 'monospace',
          }}
        >
          {siteName}
        </h1>
        <p className="text-gray-500 mb-7 text-center" style={{ fontSize: '1.13rem' }}>
          {mode === 'login'
            ? 'Acesse sua conta para gerenciar sua contabilidade.'
            : 'Crie sua conta e simplifique sua gestão MEI.'}
        </p>
        <form className="w-full flex flex-col gap-4 transition-all" onSubmit={handleSubmit} autoComplete="off">
          {mode === 'register' && (
            <div className="relative">
              <FiUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Seu nome"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="pl-10 pr-3 py-2 rounded-lg border border-gray-200 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition input-text-black"
                style={{ fontSize: '1.08rem' }}
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
              className="pl-10 pr-3 py-2 rounded-lg border border-gray-200 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition input-text-black"
              style={{ fontSize: '1.08rem' }}
            />
          </div>
          <div className="relative">
            <FiLock className="absolute left-3 top-3 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              required
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="pl-10 pr-10 py-2 rounded-lg border border-gray-200 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition input-text-black"
              style={{ fontSize: '1.08rem' }}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={handleEyeClick}
              className={`absolute right-3 top-2.5 p-1 rounded-full transition cursor-pointer bg-transparent border-none outline-none flex items-center justify-center eye-btn ${
                eyeAnim ? 'eye-anim' : ''
              }`}
            >
              {showPassword ? (
                <FiEyeOff className="text-xl text-gray-400 transition-all" />
              ) : (
                <FiEye className="text-xl text-gray-400 transition-all" />
              )}
            </button>
          </div>
          {mode === 'register' && (
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirmar senha"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="pl-10 pr-10 py-2 rounded-lg border border-gray-200 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition input-text-black"
                style={{ fontSize: '1.08rem' }}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={handleEyeClick}
                className={`absolute right-3 top-2.5 p-1 rounded-full transition cursor-pointer bg-transparent border-none outline-none flex items-center justify-center eye-btn ${
                  eyeAnim ? 'eye-anim' : ''
                }`}
              >
                {showPassword ? (
                  <FiEyeOff className="text-xl text-gray-400 transition-all" />
                ) : (
                  <FiEye className="text-xl text-gray-400 transition-all" />
                )}
              </button>
            </div>
          )}
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className={`mt-2 py-2 rounded-lg font-semibold text-lg transition bg-gray-900 text-white hover:bg-gray-800 shadow cursor-pointer ${
              loading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            style={{
              letterSpacing: '0.01em',
              boxShadow: '0 3px 16px 0 #3341550b',
            }}
          >
            {loading
              ? mode === 'login'
                ? 'Entrando...'
                : 'Registrando...'
              : mode === 'login'
              ? 'Entrar'
              : 'Registrar'}
          </button>
        </form>
        <div className="mt-6 flex flex-col items-center w-full">
          <button
            onClick={handleSwitch}
            className={`font-medium transition cursor-pointer ${
              mode === 'register' ? 'text-black hover:underline' : 'text-indigo-600 hover:underline'
            }`}
            style={{ fontSize: '1.04rem' }}
            type="button"
          >
            {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
          </button>
        </div>
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
          /* Placeholder cinza, texto digitado preto */
          .input-text-black::placeholder {
            color: #a3a3a3 !important;
            opacity: 1;
          }
          .input-text-black {
            color: #23272f !important;
          }
          .eye-btn {
            transition: background 0.18s, transform 0.25s;
          }
          .eye-btn:active {
            background: #e5e7eb;
          }
          .eye-anim {
            animation: eyePop 0.32s cubic-bezier(.45,1.75,.38,.9);
          }
          @keyframes eyePop {
            0% { transform: scale(1);}
            40% { transform: scale(1.18);}
            100% { transform: scale(1);}
          }
        `}</style>
      </div>
    </div>
  );
}
