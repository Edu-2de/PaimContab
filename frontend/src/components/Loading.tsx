'use client';

import React from 'react';

// Loading Spinner simples
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );
};

// Loading overlay para páginas inteiras
export const PageLoading: React.FC<{ message?: string }> = ({ message = 'Carregando...' }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
};

// Loading para botões
export const ButtonLoading: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => {
  return <LoadingSpinner size={size} className="text-white" />;
};

// Skeleton para tabelas
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="animate-pulse">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header skeleton */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded flex-1" />
            ))}
          </div>
        </div>
        
        {/* Rows skeleton */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 border-b border-gray-100 last:border-b-0">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div 
                  key={colIndex} 
                  className={`h-4 bg-gray-200 rounded ${
                    colIndex === 0 ? 'flex-2' : 'flex-1'
                  }`} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Skeleton para cards de métricas
export const MetricsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-8 w-8 bg-gray-200 rounded-full" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
};

// Skeleton para formulários
export const FormSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
      <div className="space-y-6">
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
        ))}
        
        <div className="flex justify-end space-x-4 pt-4">
          <div className="h-10 bg-gray-200 rounded w-20" />
          <div className="h-10 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
};

// Loading inline para listas
export const InlineLoading: React.FC<{ message?: string }> = ({ message = 'Carregando...' }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="md" className="mr-3" />
      <span className="text-gray-600">{message}</span>
    </div>
  );
};

// Empty state para quando não há dados
export const EmptyState: React.FC<{ 
  title: string; 
  description: string; 
  action?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, description, action, icon }) => {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  );
};

// Skeleton genérico reutilizável
export const Skeleton: React.FC<{ 
  width?: string; 
  height?: string; 
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}> = ({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '', 
  variant = 'rectangular' 
}) => {
  const baseClasses = 'bg-gray-200 animate-pulse';
  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${width} ${height} ${className}`} />
  );
};

// Hook para estados de loading
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  
  const startLoading = React.useCallback(() => setIsLoading(true), []);
  const stopLoading = React.useCallback(() => setIsLoading(false), []);
  
  return { isLoading, startLoading, stopLoading, setIsLoading };
};

// Hook para operações assíncronas com loading
export const useAsyncOperation = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  
  const execute = React.useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return { isLoading, error, execute };
};