'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { HiExclamationTriangle, HiArrowPath } from 'react-icons/hi2';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log erro para serviço de monitoramento (ex: Sentry)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <HiExclamationTriangle className="w-8 h-8 text-red-600" />
            </div>

            <h1 className="text-xl font-semibold text-gray-900 mb-2">Oops! Algo deu errado</h1>

            <p className="text-gray-600 mb-6">
              Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto text-red-600">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <HiArrowPath className="w-4 h-4" />
                Tentar novamente
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Voltar ao início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para capturar erros assíncronos
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: string) => {
    console.error('Erro capturado:', error, errorInfo);

    // Em produção, enviar para serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
      // Exemplo: Sentry.captureException(error);
    }
  };
};

// Error Boundary específico para formulários
export const FormErrorBoundary: React.FC<Props> = ({ children, ...props }) => {
  return (
    <ErrorBoundary
      {...props}
      fallback={
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <HiExclamationTriangle className="w-5 h-5" />
            <span className="font-medium">Erro no formulário</span>
          </div>
          <p className="text-red-700 mt-1 text-sm">Ocorreu um problema ao processar o formulário. Tente novamente.</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

// Error Boundary específico para listas/tabelas
export const ListErrorBoundary: React.FC<Props> = ({ children, ...props }) => {
  return (
    <ErrorBoundary
      {...props}
      fallback={
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <HiExclamationTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Erro ao carregar dados</h3>
          <p className="text-yellow-700">Não foi possível carregar a lista. Tente recarregar a página.</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
