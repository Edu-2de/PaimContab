'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiExclamationTriangle, HiHome } from 'react-icons/hi2';

interface AdminProtectionProps {
  children: React.ReactNode;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminProtection({ children }: AdminProtectionProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
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

        // Verificar se o usuário é admin fazendo uma chamada para o backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          // Se a resposta for 200, o usuário é admin
          setIsAdmin(true);
        } else if (response.status === 401 || response.status === 403) {
          // Se for 401/403, não é admin ou token inválido
          setIsAdmin(false);
        } else {
          // Outros erros
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Erro ao verificar acesso admin:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <HiExclamationTriangle className="mx-auto h-16 w-16 text-red-500" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>

            <p className="text-gray-600 mb-2">Você não tem permissão para acessar esta área administrativa.</p>

            <p className="text-sm text-gray-500 mb-8">Esta seção é restrita apenas para administradores do sistema.</p>

            {user && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">Conectado como:</p>
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => router.push('/')}
                className="w-full flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <HiHome className="w-5 h-5" />
                Voltar para Home
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('user');
                  router.push('/Login');
                }}
                className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm transition-colors"
              >
                Fazer login com outra conta
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
