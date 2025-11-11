# Correção: Admin Dashboard MEI - Erro 404

## Problema Identificado

Quando o admin tentava abrir o dashboard MEI de um usuário através da página `/admin/mei-dashboards`, ocorria um erro 404 com a seguinte URL:

```
http://localhost:3000/mei/dashboard?adminView=true&userId=37d4af4b-282e-4b01-a972-f745a9f0a642&userName=Batalhaa
```

### Causa Raiz

A URL gerada estava **incorreta**. A estrutura de rotas do Next.js para dashboards MEI é:

```
/mei/[companyId]/dashboard
```

E não simplesmente `/mei/dashboard`.

O admin precisa passar o `companyId` do usuário na URL para que o roteamento dinâmico funcione corretamente.

## Correções Implementadas

### 1. Interface `UserWithCompany` Atualizada

Adicionado campo `id` no objeto `company`:

```typescript
interface UserWithCompany {
  id: string;
  name: string;
  email: string;
  company?: {
    id: string;          // ← ADICIONADO
    name: string;
    cnpj?: string;
  };
  hasActiveSubscription: boolean;
}
```

### 2. Função `openUserMeiDashboard` Corrigida

**ANTES:**
```typescript
const openUserMeiDashboard = (userId: string, userName: string) => {
  const url = `/mei/dashboard?adminView=true&userId=${userId}&userName=${encodeURIComponent(userName)}`;
  window.open(url, '_blank');
};
```

**DEPOIS:**
```typescript
const openUserMeiDashboard = (userId: string, userName: string, companyId?: string) => {
  if (!companyId) {
    alert('Este usuário não possui empresa cadastrada.');
    return;
  }
  const url = `/mei/${companyId}/dashboard?adminView=true&userId=${userId}&userName=${encodeURIComponent(userName)}`;
  window.open(url, '_blank');
};
```

**Mudanças:**
- Adicionado parâmetro `companyId`
- Validação: se não houver `companyId`, exibe alerta e não abre
- URL corrigida: `/mei/${companyId}/dashboard` em vez de `/mei/dashboard`

### 3. Botões "Ver Dashboard" Atualizados

**Usuários com Plano Ativo:**
```typescript
<button
  onClick={() => openUserMeiDashboard(user.id, user.name, user.company?.id)}
  disabled={!user.company}
  className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${
    user.company
      ? 'bg-black text-white hover:bg-gray-800'
      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }`}
  title={!user.company ? 'Usuário sem empresa cadastrada' : ''}
>
  <HiEye className="w-4 h-4" />
  Ver Dashboard
</button>
```

**Usuários sem Plano Ativo:**
```typescript
<button
  onClick={() => openUserMeiDashboard(user.id, user.name, user.company?.id)}
  disabled={!user.company}
  className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${
    user.company
      ? 'bg-gray-500 text-white hover:bg-gray-600'
      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }`}
  title={!user.company ? 'Usuário sem empresa cadastrada' : ''}
>
  <HiEye className="w-4 h-4" />
  Ver Dashboard
</button>
```

**Melhorias:**
- Botões desabilitados se usuário não tiver empresa
- Estilo visual diferenciado (cinza) quando desabilitado
- Tooltip explicativo ao passar o mouse
- Passa `user.company?.id` como terceiro argumento

## Fluxo Corrigido

1. Admin clica em "Ver Dashboard" na tabela de usuários
2. Sistema valida se o usuário tem empresa (`company?.id`)
3. Se não tiver empresa: exibe alerta e não abre
4. Se tiver empresa: abre URL correta `/mei/{companyId}/dashboard?adminView=true&userId={userId}&userName={userName}`
5. Next.js roteia para `/mei/[companyId]/dashboard/page.tsx`
6. `MeiProtection` detecta `adminView=true` e valida se quem está acessando é admin
7. Dashboard carrega os dados da empresa correta

## Verificação da API

A API `/api/company/user/:userId` já retorna o objeto completo da empresa:

```json
{
  "id": "uuid-da-empresa",
  "companyName": "Nome da Empresa",
  "cnpj": "12345678000100",
  "userId": "uuid-do-usuario",
  ...
}
```

Portanto, o `company.id` já estava disponível no backend, precisava apenas ser utilizado corretamente no frontend.

## Arquivos Modificados

- `frontend/src/app/admin/mei-dashboards/page.tsx`
  - Interface `UserWithCompany` (adicionado `id` em `company`)
  - Função `openUserMeiDashboard` (validação e URL corrigida)
  - Botões "Ver Dashboard" (passagem do `companyId` e estado disabled)

## Como Testar

1. Acesse `/admin/mei-dashboards` como admin
2. Localize um usuário **com empresa cadastrada**
3. Clique em "Ver Dashboard"
4. Deve abrir nova aba com URL: `/mei/{companyId}/dashboard?adminView=true&userId={userId}&userName={nome}`
5. Dashboard deve carregar corretamente
6. Barra azul no topo deve indicar "Visualização Administrativa - {nome do usuário}"
7. Dados de receitas, despesas e DAS devem aparecer

### Caso de Usuário Sem Empresa

1. Localize um usuário **sem empresa cadastrada**
2. Botão "Ver Dashboard" deve estar **desabilitado** (cinza)
3. Ao passar o mouse, deve mostrar tooltip: "Usuário sem empresa cadastrada"
4. Se clicar (caso seja possível), deve exibir alerta

## Observações

- O sistema de proteção `MeiProtection` já estava preparado para receber `adminView=true`
- O dashboard MEI já validava corretamente o acesso de admin vs. dono da empresa
- A única falha era a geração da URL sem o `companyId`

## Status

✅ **CORRIGIDO** - Admin pode agora acessar dashboards MEI dos usuários corretamente
