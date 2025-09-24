// Utilitário para fazer requisições API com tratamento de erros de token
import { tokenManager } from './auth';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

export const apiClient = {
  // Método GET
  async get<T = any>(url: string): Promise<ApiResponse<T>> {
    try {
      if (!tokenManager.isTokenValid()) {
        tokenManager.requireAuth();
        return { success: false, error: 'Token inválido ou expirado' };
      }

      const response = await fetch(url, {
        headers: tokenManager.getAuthHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        tokenManager.removeToken();
        window.location.href = '/Login';
        return { success: false, error: 'Sessão expirada' };
      }

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Erro na requisição' };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Erro na requisição GET:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  },

  // Método POST
  async post<T = any>(url: string, body: any = {}): Promise<ApiResponse<T>> {
    try {
      if (!tokenManager.isTokenValid()) {
        tokenManager.requireAuth();
        return { success: false, error: 'Token inválido ou expirado' };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: tokenManager.getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (response.status === 401 || response.status === 403) {
        tokenManager.removeToken();
        window.location.href = '/Login';
        return { success: false, error: 'Sessão expirada' };
      }

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Erro na requisição' };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Erro na requisição POST:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  },

  // Método PUT
  async put<T = any>(url: string, body: any = {}): Promise<ApiResponse<T>> {
    try {
      if (!tokenManager.isTokenValid()) {
        tokenManager.requireAuth();
        return { success: false, error: 'Token inválido ou expirado' };
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: tokenManager.getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (response.status === 401 || response.status === 403) {
        tokenManager.removeToken();
        window.location.href = '/Login';
        return { success: false, error: 'Sessão expirada' };
      }

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Erro na requisição' };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Erro na requisição PUT:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  },

  // Método DELETE
  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    try {
      if (!tokenManager.isTokenValid()) {
        tokenManager.requireAuth();
        return { success: false, error: 'Token inválido ou expirado' };
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers: tokenManager.getAuthHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        tokenManager.removeToken();
        window.location.href = '/Login';
        return { success: false, error: 'Sessão expirada' };
      }

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Erro na requisição' };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Erro na requisição DELETE:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  },

  // Método PATCH
  async patch<T = any>(url: string, body: any = {}): Promise<ApiResponse<T>> {
    try {
      if (!tokenManager.isTokenValid()) {
        tokenManager.requireAuth();
        return { success: false, error: 'Token inválido ou expirado' };
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers: tokenManager.getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (response.status === 401 || response.status === 403) {
        tokenManager.removeToken();
        window.location.href = '/Login';
        return { success: false, error: 'Sessão expirada' };
      }

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Erro na requisição' };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Erro na requisição PATCH:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  }
};