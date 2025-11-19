'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar';
import AdminProtection from '../../../components/AdminProtection';
import ExportButton from '../../../components/ExportButton';
import ImportExcelButton from '../../../components/ImportExcelButton';
import CreateCompanyModal from '../../../components/CreateCompanyModal';
import Link from 'next/link';
import {
  HiMagnifyingGlass,
  HiEye,
  HiXCircle,
  HiCheckCircle,
  HiPlus,
  HiAdjustmentsHorizontal,
  HiChevronLeft,
  HiChevronRight,
  HiUserGroup,
  HiBuildingOffice2,
} from 'react-icons/hi2';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Company {
  id: string;
  companyName: string; // Campo correto do backend
  legalName?: string;
  cnpj?: string;
  businessEmail?: string;
  businessPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  businessType?: string;
  businessSegment?: string;
  isActive: boolean; // Campo correto do backend
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminCompaniesPage() {
  return (
    <AdminProtection>
      <AdminCompaniesContent />
    </AdminProtection>
  );
}

function AdminCompaniesContent() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSegment, setFilterSegment] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableSegments, setAvailableSegments] = useState<string[]>([]);
  const itemsPerPage = 10;

  const fetchCompanies = async (searchQuery?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
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

      // Extrair segmentos únicos
      const segments = [...new Set(data.companies.map((c: Company) => c.businessSegment).filter(Boolean))];
      setAvailableSegments(segments as string[]);
    } catch (error) {
      console.error('Erro:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Carregar apenas na primeira vez ou quando mudar página
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const getFilteredCompanies = () => {
    return companies.filter(company => {
      // Filtro de Status
      if (filterStatus !== 'all') {
        if (filterStatus === 'active' && !company.isActive) return false;
        if (filterStatus === 'inactive' && company.isActive) return false;
      }

      // Filtro de Segmento
      if (filterSegment !== 'all') {
        if (!company.businessSegment || company.businessSegment !== filterSegment) return false;
      }

      return true;
    });
  };

  const handleToggleCompanyStatus = async (companyId: string, currentStatus: boolean) => {
    if (!confirm(`Tem certeza que deseja ${currentStatus ? 'desativar' : 'ativar'} esta empresa?`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/companies/${companyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error('Erro ao alterar status da empresa');

      await fetchCompanies();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao alterar status da empresa');
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Ativa</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-300 text-gray-700">Inativa</span>;
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

      <div className="admin-content-wrapper min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gerenciar Empresas</h1>
              <p className="text-gray-600 mt-1">Visualize e gerencie todas as empresas do sistema</p>
            </div>
            <div className="flex gap-2">
              <ExportButton
                endpoint={`${API_BASE}/admin/companies/export${
                  filterStatus !== 'all' ? `?status=${filterStatus}` : ''
                }${searchTerm ? `${filterStatus !== 'all' ? '&' : '?'}search=${searchTerm}` : ''}`}
                filename="empresas"
              />
              <ImportExcelButton
                endpoint={`${API_BASE}/admin/companies/import`}
                requiredColumns={['Nome', 'CNPJ', 'Email Usuario']}
                onSuccess={() => fetchCompanies()}
                entityName="Empresas"
                templateData={[
                  {
                    Nome: 'Empresa Exemplo Ltda',
                    CNPJ: '12.345.678/0001-90',
                    Email: 'contato@empresa.com',
                    Telefone: '(11) 98765-4321',
                    Endereco: 'Rua Exemplo, 123',
                    Cidade: 'São Paulo',
                    Estado: 'SP',
                    CEP: '01234-567',
                    'Email Usuario': 'usuario@exemplo.com',
                  },
                ]}
              />
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <HiPlus className="w-4 h-4" />
                Nova Empresa
              </button>
            </div>
          </div>
        </div>

        {/* Filtros e Busca - Padrão Profissional */}
        <div className="p-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl shadow-xl mb-6">
            {/* Header dos Filtros */}
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                    <HiAdjustmentsHorizontal className="w-5 h-5 text-gray-900" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Filtros e Pesquisa</h2>
                    <p className="text-sm text-gray-300">
                      {getFilteredCompanies().length}{' '}
                      {getFilteredCompanies().length === 1 ? 'empresa encontrada' : 'empresas encontradas'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <HiAdjustmentsHorizontal className="w-4 h-4" />
                  {showAdvancedFilters ? 'Ocultar Filtros' : 'Mais Filtros'}
                </button>
              </div>
            </div>

            {/* Barra de Pesquisa Principal */}
            <div className="p-6">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  setCurrentPage(1);
                  fetchCompanies(searchTerm);
                }}
                className="flex gap-3 mb-4"
              >
                <div className="relative flex-1">
                  <HiMagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setCurrentPage(1);
                        fetchCompanies(searchTerm);
                      }
                    }}
                    placeholder="Pesquisar por nome, CNPJ ou cidade..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all font-semibold whitespace-nowrap"
                >
                  Buscar
                </button>
              </form>

              {/* Filtros Rápidos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="active">Ativas</option>
                    <option value="inactive">Inativas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Segmento</label>
                  <select
                    value={filterSegment}
                    onChange={e => setFilterSegment(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium"
                  >
                    <option value="all">Todos os Segmentos</option>
                    {availableSegments.map(segment => (
                      <option key={segment} value={segment}>
                        {segment}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filtros Avançados */}
              {showAdvancedFilters && (
                <div className="mt-6 pt-6 border-t border-gray-700 animate-slideDown">
                  <h3 className="text-sm font-bold text-white mb-4">Filtros Avançados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Estado</label>
                      <select className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium">
                        <option value="all">Todos os Estados</option>
                        <option value="SP">São Paulo</option>
                        <option value="RJ">Rio de Janeiro</option>
                        <option value="MG">Minas Gerais</option>
                        <option value="RS">Rio Grande do Sul</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Data de Cadastro</label>
                      <select className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all font-medium">
                        <option value="all">Qualquer Data</option>
                        <option value="today">Hoje</option>
                        <option value="week">Última Semana</option>
                        <option value="month">Último Mês</option>
                        <option value="year">Último Ano</option>
                      </select>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                        setFilterSegment('all');
                        fetchCompanies();
                      }}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
                    >
                      Limpar Filtros
                    </button>
                    <button
                      onClick={() => fetchCompanies()}
                      className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
                    >
                      Aplicar Filtros
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          {getFilteredCompanies().length === 0 && !loading ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <HiUserGroup className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' || filterSegment !== 'all'
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
                        Segmento
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
                    {getFilteredCompanies().length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <HiBuildingOffice2 className="w-16 h-16 text-gray-300 mb-4" />
                            <p className="text-lg font-medium text-gray-600">Nenhuma empresa encontrada</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Tente ajustar os filtros ou buscar por outros termos
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      getFilteredCompanies().map(company => (
                        <tr key={company.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{company.companyName || '-'}</div>
                              {company.businessEmail && (
                                <div className="text-sm text-gray-500">{company.businessEmail}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatCNPJ(company.cnpj)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700 font-medium">{company.businessSegment || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{company.user?.name || '-'}</div>
                              {company.user?.email && <div className="text-sm text-gray-500">{company.user.email}</div>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(company.isActive)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(company.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/companies/edit/${company.id}`}
                                className="inline-flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                                title="Ver detalhes"
                              >
                                <HiEye className="w-4 h-4" />
                                Visualizar
                              </Link>
                              <button
                                onClick={() => handleToggleCompanyStatus(company.id, company.isActive)}
                                className={`inline-flex items-center gap-1 px-3 py-2 rounded ${
                                  company.isActive
                                    ? 'text-red-700 hover:bg-red-50'
                                    : 'text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={company.isActive ? 'Desativar empresa' : 'Ativar empresa'}
                              >
                                {company.isActive ? (
                                  <>
                                    <HiXCircle className="w-4 h-4" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <HiCheckCircle className="w-4 h-4" />
                                    Ativar
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
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

      {/* Modal de Criação */}
      <CreateCompanyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchCompanies();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}
