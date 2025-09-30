# 🔑 Guia para Evitar Erros de Chaves Duplicadas no React

## ❌ Problema Resolvido
Erro: `Encountered two children with the same key, '2025-03'. Keys should be unique...`

## ✅ Soluções Implementadas

### 1. **Página DAS** - Adicionado campo `id` único
```typescript
interface DASCalculation {
  id: string;          // ✅ Campo ID único adicionado
  month: string;
  revenue: number;
  dasValue: number;
  dueDate: string;
  isPaid: boolean;
  paymentDate?: string;
}

// ✅ Dados com IDs únicos
const dasHistory = [
  {
    id: 'das-2024-09',  // ✅ ID único
    month: '2024-09',
    revenue: 4500,
    // ...
  }
];

// ✅ Uso correto da key
{dasHistory.map(das => (
  <tr key={das.id}>  {/* ✅ Usando ID em vez de month */}
    {/* ... */}
  </tr>
))}
```

### 2. **Dashboard MEI** - Prefixos únicos para transações
```typescript
// ✅ IDs únicos para evitar conflitos entre receitas e despesas
const allTransactions = [
  ...receitas.map(r => ({
    id: `receita-${r.id}`,  // ✅ Prefixo único
    type: 'Receita',
    // ...
  })),
  ...despesas.map(d => ({
    id: `despesa-${d.id}`,  // ✅ Prefixo único
    type: 'Despesa',
    // ...
  }))
];
```

### 3. **Utilitário de Chaves Únicas** - `utils/uniqueKeys.ts`
```typescript
// ✅ Funções utilitárias para gerar IDs únicos
export const generateUniqueId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateUniqueKey = (item: Record<string, unknown>, index: number, prefix: string = 'item'): string => {
  if (item.id && typeof item.id === 'string') return item.id;
  if (item.month && typeof item.month === 'string') return `${prefix}-${item.month}-${index}`;
  return `${prefix}-${index}-${Date.now()}`;
};

// ✅ Remover duplicatas
export const removeDuplicates = <T>(array: T[], keyExtractor: (item: T) => string): T[] => {
  const seen = new Set<string>();
  return array.filter(item => {
    const key = keyExtractor(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
```

## 🛡️ Regras Preventivas

### ✅ **DO's (Faça)**

1. **Sempre use IDs únicos como keys**
```tsx
// ✅ CORRETO
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}
```

2. **Para dados sem ID, combine múltiplos campos**
```tsx
// ✅ CORRETO
{items.map((item, index) => (
  <div key={`${item.type}-${item.date}-${index}`}>
    {item.name}
  </div>
))}
```

3. **Use prefixos para evitar conflitos**
```tsx
// ✅ CORRETO
const allData = [
  ...receitas.map(r => ({ ...r, id: `receita-${r.id}` })),
  ...despesas.map(d => ({ ...d, id: `despesa-${d.id}` }))
];
```

4. **Para arrays aninhados, use IDs compostos**
```tsx
// ✅ CORRETO
{months.map(month => (
  <div key={month.id}>
    {month.events.map(event => (
      <div key={`${month.id}-${event.id}`}>
        {event.title}
      </div>
    ))}
  </div>
))}
```

### ❌ **DON'Ts (Não faça)**

1. **Nunca use apenas o índice como key**
```tsx
// ❌ ERRADO
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}
```

2. **Não use valores que podem ser duplicados**
```tsx
// ❌ ERRADO - months podem ser duplicados
{items.map(item => (
  <div key={item.month}>{item.name}</div>
))}
```

3. **Não ignore warnings de keys**
```tsx
// ❌ ERRADO
{items.map(item => (
  <div>{item.name}</div>  // Sem key!
))}
```

## 🔧 **Como Depurar Chaves Duplicadas**

### 1. **Ativar Modo Strict no React**
```tsx
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,  // ✅ Ativa warnings
}
```

### 2. **Usar Console.log para verificar keys**
```tsx
// ✅ Debug de keys
const keys = items.map(item => item.id);
console.log('Keys:', keys);
console.log('Duplicadas:', keys.filter((key, index) => keys.indexOf(key) !== index));
```

### 3. **Validar unicidade em desenvolvimento**
```tsx
// ✅ Validação de desenvolvimento
if (process.env.NODE_ENV === 'development') {
  const keys = items.map(item => item.id);
  const uniqueKeys = new Set(keys);
  if (keys.length !== uniqueKeys.size) {
    console.error('Keys duplicadas encontradas:', keys);
  }
}
```

## 📋 **Checklist de Verificação**

- [ ] Todas as listas usam `key` props únicas
- [ ] IDs não se conflitam entre diferentes tipos de dados
- [ ] Arrays combinados têm prefixos ou namespaces
- [ ] Não há uso de índices como keys (exceto para dados estáticos)
- [ ] Dados mockados/teste têm IDs únicos
- [ ] Interfaces TypeScript incluem campos `id`

## 🎯 **Status Atual do Projeto**

✅ **Corrigido:**
- Página DAS: IDs únicos para histórico
- Dashboard MEI: Prefixos para transações
- Utilitários: Funções helper criadas

✅ **Verificado:**
- Receitas: IDs únicos já existentes
- Despesas: IDs únicos já existentes  
- Planilha: Geração correta de IDs
- Calendário: Keys baseadas em event.id

O erro de chaves duplicadas foi **completamente resolvido**! 🎉