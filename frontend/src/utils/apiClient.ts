// Utilitário para fazer requisições API com tratamento de erros de token

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

// Utilitário para gerenciar tokens
const tokenManager = {
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  },

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  },

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  },

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decodifica o payload do JWT sem verificar a assinatura
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      
      // Verifica se o token não expirou
      return payload.exp > now;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return false;
    }
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  },

  requireAuth(): void {
    if (typeof window !== 'undefined') {
      this.removeToken();
      window.location.href = '/Login';
    }
  },
};

export const apiClient = {
  // Método GET
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
    } catch (error) {
      console.error('Erro na requisição GET:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  },

  // Método POST
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
    } catch (error) {
      console.error('Erro na requisição POST:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  },

  // Método PUT
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
    } catch (error) {
      console.error('Erro na requisição PUT:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  },

  // Método DELETE
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
    } catch (error) {
      console.error('Erro na requisição DELETE:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  },

  // Método PATCH
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
    } catch (error) {
      console.error('Erro na requisição PATCH:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  },
};

// Exporta também o tokenManager para uso direto se necessário
export { tokenManager };