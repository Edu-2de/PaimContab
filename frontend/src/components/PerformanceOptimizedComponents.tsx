'use client';

import React, { memo, useMemo, useCallback } from 'react';

// Componente memo para itens de lista que podem ser renderizados com frequência
export const MemoizedListItem = memo<{
  id: string;
  title: string;
  subtitle?: string;
  value: number;
  status?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}>(({ id, title, subtitle, value, status, onEdit, onDelete, isLoading }) => {
  const handleEdit = useCallback(() => {
    onEdit?.(id);
  }, [onEdit, id]);

  const handleDelete = useCallback(() => {
    onDelete?.(id);
  }, [onDelete, id]);

  const formattedValue = useMemo(() => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }, [value]);

  const statusColor = useMemo(() => {
    switch (status) {
      case 'Recebido':
      case 'Pago':
        return 'text-green-600 bg-green-50';
      case 'Pendente':
        return 'text-amber-600 bg-amber-50';
      case 'Cancelado':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }, [status]);

  if (isLoading) {
    return (
      <tr className="border-b border-gray-100 animate-pulse">
        <td className="py-4 px-6">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </td>
        <td className="py-4 px-6">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </td>
        <td className="py-4 px-6">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </td>
        <td className="py-4 px-6">
          <div className="h-6 w-6 bg-gray-200 rounded mx-auto"></div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-25 transition-colors">
      <td className="py-4 px-6">
        <div>
          <div className="text-sm font-medium text-gray-900 mb-1">{title}</div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
      </td>
      <td className="py-4 px-6 text-right">
        <div className="text-sm font-mono font-medium text-gray-900">{formattedValue}</div>
      </td>
      <td className="py-4 px-6">
        {status && (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>{status}</span>
        )}
      </td>
      <td className="py-4 px-6 text-center">
        <div className="flex items-center justify-center space-x-2">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
              title="Editar"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title="Excluir"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L7.586 12l-1.293 1.293a1 1 0 101.414 1.414L9 13.414l2.293 2.293a1 1 0 001.414-1.414L11.414 12l1.293-1.293z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

MemoizedListItem.displayName = 'MemoizedListItem';

// Componente memo para métricas que são calculadas com frequência
export const MemoizedMetricCard = memo<{
  title: string;
  value: number;
  subtitle?: string;
  icon?: React.ReactNode;
  colorScheme?: 'green' | 'blue' | 'red' | 'amber' | 'purple';
  isLoading?: boolean;
}>(({ title, value, subtitle, icon, colorScheme = 'blue', isLoading }) => {
  const formattedValue = useMemo(() => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }, [value]);

  const colorClasses = useMemo(() => {
    const colors = {
      green: 'bg-green-100 text-green-600',
      blue: 'bg-blue-100 text-blue-600',
      red: 'bg-red-100 text-red-600',
      amber: 'bg-amber-100 text-amber-600',
      purple: 'bg-purple-100 text-purple-600',
    };
    return colors[colorScheme];
  }, [colorScheme]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && <div className={`p-2 rounded-full ${colorClasses}`}>{icon}</div>}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{formattedValue}</p>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
    </div>
  );
});

MemoizedMetricCard.displayName = 'MemoizedMetricCard';

// Hook otimizado para filtros com debounce
export const useOptimizedFilter = <T,>(
  items: T[],
  searchTerm: string,
  filterFn: (item: T, searchTerm: string) => boolean,
  debounceMs = 300
) => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState(searchTerm);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return items;
    return items.filter(item => filterFn(item, debouncedSearchTerm));
  }, [items, debouncedSearchTerm, filterFn]);

  return { filteredItems, debouncedSearchTerm };
};

// Componente memo para formulários que não precisam ser re-renderizados constantemente
export const MemoizedFormField = memo<{
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}>(({ label, name, type = 'text', value, onChange, error, placeholder, required, options }) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange(name, e.target.value);
    },
    [name, onChange]
  );

  const fieldId = useMemo(() => `field-${name}`, [name]);

  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {options ? (
        <select
          id={fieldId}
          name={name}
          value={value}
          onChange={handleChange}
          required={required}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Selecione...</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          id={fieldId}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
});

MemoizedFormField.displayName = 'MemoizedFormField';

// Hook para otimizar chamadas de API
export const useOptimizedAPI = () => {
  const cache = useMemo(() => new Map<string, unknown>(), []);

  const cachedFetch = useCallback(
    async (url: string, options?: RequestInit) => {
      const cacheKey = `${url}-${JSON.stringify(options)}`;

      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }

      try {
        const response = await fetch(url, options);
        const data = await response.json();

        // Cache por 5 minutos
        cache.set(cacheKey, data);
        setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);

        return data;
      } catch (error) {
        cache.delete(cacheKey);
        throw error;
      }
    },
    [cache]
  );

  const clearCache = useCallback(() => {
    cache.clear();
  }, [cache]);

  return { cachedFetch, clearCache };
};
