// Utility para gerar IDs únicos e gerenciar chaves React

export const generateUniqueId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateUniqueKey = (item: Record<string, unknown>, index: number, prefix: string = 'item'): string => {
  // Se o item tem um ID único, use-o
  if (item.id && typeof item.id === 'string') {
    return item.id;
  }
  
  // Se o item tem uma propriedade única óbvia
  if (item.uuid && typeof item.uuid === 'string') return item.uuid;
  if (item._id && typeof item._id === 'string') return item._id;
  
  // Para dados que podem ter duplicatas baseadas em data/mês
  if (item.month && typeof item.month === 'string' && item.type && typeof item.type === 'string') {
    return `${item.type}-${item.month}-${index}`;
  }
  
  if (item.month && typeof item.month === 'string') {
    return `${prefix}-${item.month}-${index}`;
  }
  
  if (item.date && typeof item.date === 'string') {
    return `${prefix}-${item.date}-${index}`;
  }
  
  // Como último recurso, use o índice com timestamp
  return `${prefix}-${index}-${Date.now()}`;
};

// Função para remover duplicatas de arrays baseado em uma chave
export const removeDuplicates = <T>(array: T[], keyExtractor: (item: T) => string): T[] => {
  const seen = new Set<string>();
  return array.filter(item => {
    const key = keyExtractor(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

// Hook para garantir IDs únicos em listas
export const useUniqueList = <T extends { id?: string }>(
  list: T[], 
  generateId: (item: T, index: number) => string
): (T & { id: string })[] => {
  return list.map((item, index) => ({
    ...item,
    id: item.id || generateId(item, index)
  }));
};