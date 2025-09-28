'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiExclamationTriangle, HiHome, HiCreditCard } from 'react-icons/hi2';

interface MeiProtectionProps {
  children: React.ReactNode;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Subscription {
  id: string;
  isActive: boolean;
  plan: {
    name: string;
  };
}

export default function MeiProtection({ children }: MeiProtectionProps) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMeiAccess = async () => {
      try {
        // Verificar se há token no localStorage
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
          router.push('/Login');
          return;
        }

        const userObj = JSON.parse(userData);
        setUser(userObj);

        // Se for admin, pode acessar
        if (userObj.role === 'admin') {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // Para usuários normais, verificar se tem plano ativo
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/subscription`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const subscriptionData = await response.json();
          setSubscription(subscriptionData);

          if (subscriptionData && subscriptionData.isActive) {
            setHasAccess(true);
          } else {
            setHasAccess(false);
          }
        } else {
          // Não tem assinatura
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Erro ao verificar acesso MEI:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkMeiAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <HiExclamationTriangle className="mx-auto h-16 w-16 text-orange-500" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">Plano Necessário</h1>

            <p className="text-gray-600 mb-2">Para acessar o Dashboard MEI, você precisa de um plano ativo.</p>

            <p className="text-sm text-gray-500 mb-8">
              Escolha um de nossos planos e tenha acesso completo às ferramentas de gestão do seu MEI.
            </p>

            {user && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">Conectado como:</p>
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                {subscription && !subscription.isActive && (
                  <p className="text-sm text-orange-600 mt-2">Plano inativo: {subscription.plan.name}</p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => router.push('/#plans')}
                className="w-full flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <HiCreditCard className="w-5 h-5" />
                Ver Planos
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 py-2 text-sm transition-colors"
              >
                <HiHome className="w-5 h-5" />
                Voltar para Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
