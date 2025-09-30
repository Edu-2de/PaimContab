// Utilitários de validação seguros para strings e filtros

/**
 * Verifica se um valor é uma string válida
 */
export const isValidString = (value: unknown): value is string => {
  return typeof value === 'string' && value.length > 0;
};

/**
 * Retorna uma string segura para operações de toLowerCase
 */
export const safeString = (value: unknown): string => {
  if (isValidString(value)) return value;
  return '';
};

/**
 * Função segura para toLowerCase que não falha com valores undefined/null
 */
export const safeToLowerCase = (value: unknown): string => {
  return safeString(value).toLowerCase();
};

/**
 * Função segura para verificar se uma string contém outra (case-insensitive)
 */
export const safeIncludes = (text: unknown, searchTerm: unknown): boolean => {
  const textSafe = safeToLowerCase(text);
  const searchSafe = safeToLowerCase(searchTerm);

  if (!textSafe || !searchSafe) return false;

  return textSafe.includes(searchSafe);
};

/**
 * Filtro de busca universal para qualquer objeto
 */
export const createSearchFilter = <T extends Record<string, unknown>>(
  searchTerm: string,
  searchFields: (keyof T)[]
) => {
  return (item: T): boolean => {
    if (!searchTerm.trim()) return true;

    return searchFields.some(field => safeIncludes(item[field], searchTerm));
  };
};

/**
 * Valida se uma data é válida
 */
export const isValidDate = (date: unknown): boolean => {
  if (!date) return false;
  const dateObj = new Date(date as string);
  return !isNaN(dateObj.getTime());
};

/**
 * Extrai ano-mês de uma data de forma segura (YYYY-MM)
 */
export const safeExtractYearMonth = (date: unknown): string => {
  if (!isValidDate(date)) return '';

  try {
    const dateStr = String(date);
    return dateStr.slice(0, 7); // YYYY-MM
  } catch {
    return '';
  }
};

/**
 * Filtro de data por mês/ano
 */
export const createMonthFilter = <T extends Record<string, unknown>>(selectedMonth: string, dateField: keyof T) => {
  return (item: T): boolean => {
    if (!selectedMonth) return true;

    const itemMonth = safeExtractYearMonth(item[dateField]);
    return itemMonth === selectedMonth;
  };
};

/**
 * Combina múltiplos filtros
 */
export const combineFilters = <T>(...filters: ((item: T) => boolean)[]): ((item: T) => boolean) => {
  return (item: T): boolean => {
    return filters.every(filter => filter(item));
  };
};

/**
 * Função para sanitizar entrada do usuário
 */
export const sanitizeInput = (input: unknown): string => {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove caracteres potencialmente perigosos
    .substring(0, 1000); // Limita tamanho
};

/**
 * Valida número de forma segura
 */
export const safeNumber = (value: unknown): number => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * Formata moeda de forma segura
 */
export const safeCurrencyFormat = (value: unknown): string => {
  const numValue = safeNumber(value);

  try {
    return numValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return `R$ ${numValue.toFixed(2)}`;
  }
};

/**
 * Formata data de forma segura
 */
export const safeDateFormat = (date: unknown): string => {
  if (!isValidDate(date)) return '-';

  try {
    return new Date(date as string).toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

/**
 * Debounce function para otimizar performance de filtros
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Hook personalizado para filtros com debounce
 */
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// Importações necessárias
import { useState, useEffect } from 'react';
