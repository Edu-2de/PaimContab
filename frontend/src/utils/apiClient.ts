import { tokenManager } from './auth';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

export const apiClient = {
  async get<T = unknown>(url: string): Promise<ApiResponse<T>> {
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
        if (typeof window !== 'undefined') {
          window.location.href = '/Login';
        }
        return { success: false, error: 'Sessão expirada' };
      }

      if (!response.ok) {
        let errorMessage = 'Erro na requisição';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro HTTP ${response.status}`;
        }
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
      return { success: true, data };
    } catch {
      return { success: false, error: 'Erro de conexão' };
    }
  },

  async post<T = unknown>(url: string, body: unknown = {}): Promise<ApiResponse<T>> {
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
        if (typeof window !== 'undefined') {
          window.location.href = '/Login';
        }
        return { success: false, error: 'Sessão expirada' };
      }

      if (!response.ok) {
        let errorMessage = 'Erro na requisição';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro HTTP ${response.status}`;
        }
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
      return { success: true, data };
    } catch {
      return { success: false, error: 'Erro de conexão' };
    }
  },

  async put<T = unknown>(url: string, body: unknown = {}): Promise<ApiResponse<T>> {
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
        if (typeof window !== 'undefined') {
          window.location.href = '/Login';
        }
        return { success: false, error: 'Sessão expirada' };
      }

      if (!response.ok) {
        let errorMessage = 'Erro na requisição';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro HTTP ${response.status}`;
        }
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
      return { success: true, data };
    } catch {
      return { success: false, error: 'Erro de conexão' };
    }
  },

  async delete<T = unknown>(url: string): Promise<ApiResponse<T>> {
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
        if (typeof window !== 'undefined') {
          window.location.href = '/Login';
        }
        return { success: false, error: 'Sessão expirada' };
      }

      if (!response.ok) {
        let errorMessage = 'Erro na requisição';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro HTTP ${response.status}`;
        }
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
      return { success: true, data };
    } catch {
      return { success: false, error: 'Erro de conexão' };
    }
  },

  async patch<T = unknown>(url: string, body: unknown = {}): Promise<ApiResponse<T>> {
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
        if (typeof window !== 'undefined') {
          window.location.href = '/Login';
        }
        return { success: false, error: 'Sessão expirada' };
      }

      if (!response.ok) {
        let errorMessage = 'Erro na requisição';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro HTTP ${response.status}`;
        }
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
      return { success: true, data };
    } catch {
      return { success: false, error: 'Erro de conexão' };
    }
  },
};
