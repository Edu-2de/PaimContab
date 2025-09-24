'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '../../../components/AdminSidebar';
import Link from 'next/link';
import {
  HiMagnifyingGlass,
  HiEye,
  HiTrash,
  HiPlus,
  HiAdjustmentsHorizontal,
  HiChevronLeft,
  HiChevronRight,
  HiUserGroup,
} from 'react-icons/hi2';

interface Company {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  plan?: string;
  status: 'active' | 'inactive' | 'suspended';
  userId?: string;
  user?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 10;

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus && { status: filterStatus }),
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/companies?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao carregar empresas');

      const data = await response.json();
      setCompanies(data.companies || []);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (error) {
      console.error('Erro:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterStatus]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/companies/${companyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao excluir empresa');

      await fetchCompanies();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao excluir empresa');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { color: 'bg-gray-800 text-white', text: 'Ativa' },
      inactive: { color: 'bg-gray-300 text-gray-700', text: 'Inativa' },
      suspended: { color: 'bg-gray-200 text-gray-600', text: 'Suspensa' },
    };

    const badge = badges[status as keyof typeof badges] || badges.inactive;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.text}</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return '-';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch =
      !searchTerm ||
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.cnpj?.includes(searchTerm) ||
      company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.user?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filterStatus || company.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div>
        <AdminSidebar currentPage="companies" />
        <div className="ml-64 flex items-center justify-center bg-white min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando empresas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminSidebar currentPage="companies" />

      <div className="ml-64 min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gerenciar Empresas</h1>
              <p className="text-gray-600 mt-1">Visualize e gerencie todas as empresas do sistema</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
              <HiPlus className="w-4 h-4" />
              Nova Empresa
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                showFilters ? 'bg-gray-100 border-gray-300' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <HiAdjustmentsHorizontal className="w-4 h-4" />
              Filtros
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none"
                  >
                    <option value="">Todos os status</option>
                    <option value="active">Ativa</option>
                    <option value="inactive">Inativa</option>
                    <option value="suspended">Suspensa</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-8">
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <HiUserGroup className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus
                  ? 'Tente ajustar os filtros de busca'
                  : 'Não há empresas cadastradas no sistema'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CNPJ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Criação
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCompanies.map(company => (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{company.name}</div>
                            {company.email && <div className="text-sm text-gray-500">{company.email}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCNPJ(company.cnpj)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{company.user?.name || '-'}</div>
                            {company.user?.email && <div className="text-sm text-gray-500">{company.user.email}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(company.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(company.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/companies/${company.id}`}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Ver detalhes"
                            >
                              <HiEye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteCompany(company.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Excluir empresa"
                            >
                              <HiTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-700">
                      Página {currentPage} de {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <HiChevronLeft className="w-4 h-4" />
                        Anterior
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próximo
                        <HiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
