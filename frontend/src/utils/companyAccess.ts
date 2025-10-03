/**
 * Sistema de Controle de Acesso por Empresa
 *
 * Gerencia permissões de acesso às empresas:
 * - MEI: Pode acessar apenas sua própria empresa
 * - Admin: Pode acessar qualquer empresa
 * - Validação de Company ID na URL vs Token JWT
 */

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId?: string;
}

interface AccessValidation {
  hasAccess: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  reason?: string;
}

interface Company {
  id: string;
  name: string;
  cnpj?: string;
  businessType?: string;
  businessSegment?: string;
  isActive?: boolean;
}

export class CompanyAccessManager {
  /**
   * Valida se o usuário pode acessar a empresa especificada
   */
  static validateCompanyAccess(user: User | null, companyId: string): AccessValidation {
    if (!user) {
      return {
        hasAccess: false,
        isOwner: false,
        isAdmin: false,
        reason: 'Usuário não autenticado',
      };
    }

    const isAdmin = user.role === 'admin';
    const isOwner = user.companyId === companyId;

    // Admin tem acesso a qualquer empresa
    if (isAdmin) {
      return {
        hasAccess: true,
        isOwner: false,
        isAdmin: true,
      };
    }

    // MEI pode acessar apenas sua empresa
    if (isOwner) {
      return {
        hasAccess: true,
        isOwner: true,
        isAdmin: false,
      };
    }

    return {
      hasAccess: false,
      isOwner: false,
      isAdmin: false,
      reason: 'Acesso negado: Usuário não possui permissão para esta empresa',
    };
  }

  /**
   * Obtém informações do usuário do localStorage
   */
  static getUserFromStorage(): User | null {
    if (typeof window === 'undefined') return null;

    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;

      return JSON.parse(userData) as User;
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      return null;
    }
  }

  /**
   * Obtém o token de autenticação
   */
  static getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  /**
   * Redireciona usuário conforme necessário
   */
  static getRedirectPath(user: User | null, validation: AccessValidation): string | null {
    if (!user) {
      return '/Login';
    }

    if (!validation.hasAccess) {
      if (user.role === 'admin') {
        return '/admin/mei-dashboards';
      } else if (user.companyId) {
        return `/mei/${user.companyId}/dashboard`;
      } else {
        return '/setup-company';
      }
    }

    return null;
  }

  /**
   * Valida se o usuário tem acesso e redireciona se necessário
   */
  static async validateAndRedirect(
    companyId: string,
    router: { push: (path: string) => void }
  ): Promise<AccessValidation> {
    const user = this.getUserFromStorage();
    const validation = this.validateCompanyAccess(user, companyId);

    if (!validation.hasAccess) {
      const redirectPath = this.getRedirectPath(user, validation);
      if (redirectPath) {
        console.warn('Acesso negado:', validation.reason);
        router.push(redirectPath);
      }
    }

    return validation;
  }

  /**
   * Gera headers de autenticação para APIs
   */
  static getAuthHeaders(companyId?: string): Record<string, string> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Para admin, adiciona companyId como query parameter
    const user = this.getUserFromStorage();
    if (user?.role === 'admin' && companyId) {
      // O companyId será usado na URL da API quando necessário
    }

    return headers;
  }

  /**
   * Constrói URL da API com base no tipo de usuário
   */
  static buildApiUrl(baseUrl: string, endpoint: string, companyId?: string): string {
    const user = this.getUserFromStorage();

    if (user?.role === 'admin' && companyId) {
      // Admin acessa com query parameter
      return `${baseUrl}${endpoint}?companyId=${companyId}`;
    }

    // MEI acessa endpoint normal (companyId vem do token)
    return `${baseUrl}${endpoint}`;
  }

  /**
   * Obtém informações da empresa atual
   */
  static async getCompanyInfo(companyId: string): Promise<Company | null> {
    try {
      const headers = this.getAuthHeaders();
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/company/${companyId}`, { headers });

      if (response.ok) {
        return await response.json();
      }

      throw new Error(`Erro ao buscar empresa: ${response.status}`);
    } catch (error) {
      console.error('Erro ao buscar informações da empresa:', error);
      throw error;
    }
  }
}

export default CompanyAccessManager;
