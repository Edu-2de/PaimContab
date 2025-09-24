// Utilitário para gerenciar tokens e autenticação no frontend
import { useState, useEffect } from 'react';

export const tokenManager = {
  // Obter o token do localStorage
  getToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  },

  // Salvar token no localStorage
  setToken: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('authToken', token);
  },

  // Remover token do localStorage
  removeToken: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Verificar se o token existe e é válido
  isTokenValid: () => {
    const token = tokenManager.getToken();
    if (!token) return false;

    try {
      // Decodificar o payload do JWT (sem verificar assinatura)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      // Verificar se o token não expirou
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Token inválido:', error);
      return false;
    }
  },

  // Obter dados do usuário do token
  getUserFromToken: () => {
    const token = tokenManager.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        isActive: payload.isActive,
      };
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  },

  // Redirecionar para login se não autenticado
  requireAuth: () => {
    if (!tokenManager.isTokenValid()) {
      tokenManager.removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/Login';
      }
      return false;
    }
    return true;
  },

  // Verificar se é admin
  isAdmin: () => {
    const user = tokenManager.getUserFromToken();
    return user?.role === 'admin';
  },

  // Headers padrão para requisições autenticadas
  getAuthHeaders: () => {
    const token = tokenManager.getToken();
    return token
      ? {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      : {
          'Content-Type': 'application/json',
        };
  },
};

// Hook personalizado para usar em componentes React
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  type User = {
    userId: unknown;
    email: unknown;
    role: unknown;
    isActive: unknown;
  } | null;

  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isValid = tokenManager.isTokenValid();
      setIsAuthenticated(isValid);

      if (isValid) {
        const userData = tokenManager.getUserFromToken();
        setUser(userData);
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const logout = () => {
    tokenManager.removeToken();
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/Login';
  };

  return { isAuthenticated, user, loading, logout };
};
