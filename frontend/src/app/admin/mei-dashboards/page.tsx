'use client';

import { useState, useEffect } from 'react';
import AdminProtection from '../../../components/AdminProtection';
import AdminSidebar from '../../../components/AdminSidebar';
import { HiMagnifyingGlass, HiEye, HiUser } from 'react-icons/hi2';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserWithCompany {
  id: string;
  name: string;
  email: string;
  company?: {
    name: string;
    cnpj?: string;
  };
  hasActiveSubscription: boolean;
}

export default function AdminMeiDashboardPage() {
  const [users, setUsers] = useState<UserWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setError('');
      console.log('🔍 Buscando usuários...');

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      console.log('📡 Fazendo requisição para:', `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/users`);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/users?limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📄 Status da resposta:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('👥 Dados recebidos:', data);

        // Usar a resposta formatada da API
        let allUsers = [];
        if (data.users && Array.isArray(data.users)) {
          allUsers = data.users;
        } else if (Array.isArray(data)) {
          allUsers = data;
        } else {
          console.error('Formato de dados inesperado:', data);
          throw new Error('Formato de resposta inválido');
        }

        console.log(`📊 Total de usuários recebidos: ${allUsers.length}`);

        // Filtrar apenas usuários não-admin
        const filteredUsers = allUsers.filter((user: User) => user.role !== 'admin');
        console.log(`🔍 Usuários não-admin: ${filteredUsers.length}`);

        // Para cada usuário, verificar se tem assinatura ativa e dados da empresa
        const usersWithSubscriptionInfo = await Promise.all(
          filteredUsers.map(async (user: User) => {
            try {
              console.log(`🔄 Processando usuário: ${user.name} (${user.id})`);

              // Verificar assinatura
              const subscriptionResponse = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/subscription/status/${user.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              // Buscar dados da empresa
              const companyResponse = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/company/user/${user.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              let hasActiveSubscription = false;
              if (subscriptionResponse.ok) {
                const subscriptionData = await subscriptionResponse.json();
                hasActiveSubscription = subscriptionData.hasActiveSubscription;
              } else {
                console.log(`⚠️ Erro ao buscar assinatura para ${user.name}:`, subscriptionResponse.status);
              }

              let company = null;
              if (companyResponse.ok) {
                company = await companyResponse.json();
              } else {
                console.log(`⚠️ Erro ao buscar empresa para ${user.name}:`, companyResponse.status);
              }

              console.log(
                `✅ ${user.name}: Assinatura ativa: ${hasActiveSubscription}, Empresa: ${
                  company?.name || 'Não encontrada'
                }`
              );

              return {
                ...user,
                hasActiveSubscription,
                company,
              } as UserWithCompany;
            } catch (error) {
              console.error(`❌ Erro ao buscar dados do usuário ${user.name}:`, error);
              return {
                ...user,
                hasActiveSubscription: false,
                company: undefined,
              } as UserWithCompany;
            }
          })
        );

        console.log(`📈 Processados ${usersWithSubscriptionInfo.length} usuários`);
        console.log(
          '👤 Usuários com assinatura ativa:',
          usersWithSubscriptionInfo.filter(u => u.hasActiveSubscription).length
        );
        console.log(
          '👤 Usuários sem assinatura ativa:',
          usersWithSubscriptionInfo.filter(u => !u.hasActiveSubscription).length
        );

        setUsers(usersWithSubscriptionInfo);
      } else {
        console.error('❌ Erro na resposta da API:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Detalhes do erro:', errorText);
        throw new Error(`Falha ao buscar usuários: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      setError(`Erro ao carregar lista de usuários: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openUserMeiDashboard = (userId: string, userName: string) => {
    // Abre o dashboard MEI do usuário em uma nova aba
    // O sistema de proteção detectará que é um admin acessando
    const url = `/mei/dashboard?adminView=true&userId=${userId}&userName=${encodeURIComponent(userName)}`;
    window.open(url, '_blank');
  };

  const filteredUsers = users.filter(
    user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeUsers = filteredUsers.filter(user => user.hasActiveSubscription);
  const inactiveUsers = filteredUsers.filter(user => !user.hasActiveSubscription);

  if (loading) {
    return (
      <AdminProtection>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </AdminProtection>
    );
  }

  return (
    <AdminProtection>
      <AdminSidebar currentPage="mei-dashboards" />
      <div className="admin-content-wrapper">
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboards MEI dos Usuários</h1>
              <p className="text-gray-600 mt-2">
                Acesse os dashboards MEI de qualquer usuário para suporte e supervisão
              </p>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou empresa..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Usuarios com Plano Ativo */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Usuários com Plano Ativo ({activeUsers.length})
              </h2>
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {activeUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <HiUser className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum usuário com plano ativo encontrado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-green-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuário
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Empresa
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activeUsers.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{user.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.company ? (
                                <div>
                                  <div className="font-medium text-gray-900">{user.company.name}</div>
                                  {user.company.cnpj && (
                                    <div className="text-xs text-gray-500">{user.company.cnpj}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">Sem empresa</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Plano Ativo
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => openUserMeiDashboard(user.id, user.name)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors"
                              >
                                <HiEye className="w-4 h-4" />
                                Ver Dashboard
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Usuarios sem Plano Ativo */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Usuários sem Plano Ativo ({inactiveUsers.length})
              </h2>
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {inactiveUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <HiUser className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum usuário sem plano ativo encontrado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuário
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Empresa
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {inactiveUsers.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{user.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.company ? (
                                <div>
                                  <div className="font-medium text-gray-900">{user.company.name}</div>
                                  {user.company.cnpj && (
                                    <div className="text-xs text-gray-500">{user.company.cnpj}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">Sem empresa</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Sem Plano
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => openUserMeiDashboard(user.id, user.name)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                              >
                                <HiEye className="w-4 h-4" />
                                Ver Dashboard
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtection>
  );
}
