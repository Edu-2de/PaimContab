# Análise de Problemas - Admin & Stripe

## 1. ❌ PROBLEMA: Atualização de Empresa no Admin

### Causa do Erro:

A página de admin (`/admin/users/[userId]/page.tsx`) está fazendo a requisição para:

```
PUT /api/admin/users/${userId}/company
```

Porém, **essa rota NÃO existe no backend**!

### Rotas Existentes no Backend:

**Rota Admin (backend/src/routes/admin.js):**

```javascript
router.put('/users/:userId/company', requireAdmin, adminController.updateUserCompany);
```

**Rota Company (backend/src/routes/company.js):**

```javascript
router.put('/:id', authenticateToken, companyController.updateCompany);
```

### ⚠️ CONFLITO DESCOBERTO:

1. A rota do **admin** espera: `PUT /admin/users/:userId/company` ✅
2. O **frontend** está chamando: `PUT /api/admin/users/${userId}/company` ✅
3. Mas o **backend** registra as rotas admin em: `/api/admin/*` ✅

**O problema é que a função `updateUserCompany` no adminController está tentando atualizar a empresa pelo `userId`, mas o Prisma schema define que Company tem relação 1:1 com User através do campo `userId`.**

### Solução:

A rota existe, mas precisa verificar se o controller está funcionando corretamente.

---

## 2. ⚠️ PROBLEMA: Configuração Stripe - Pagamentos Recorrentes

### Status Atual:

✅ **Stripe está configurado corretamente para pagamentos mensais recorrentes**

### Evidências:

**1. Criação da sessão (paymentController.js):**

```javascript
line_items: [
  {
    price_data: {
      currency: 'brl',
      product_data: {
        name: `Plano ${plan.name} - PaimContab`,
        description: `Assinatura mensal do plano ${plan.name}`,
      },
      unit_amount: Math.round(plan.price * 100),
      recurring: { interval: 'month' },  // ✅ RECORRÊNCIA MENSAL
    },
    quantity: 1,
  },
],
mode: 'subscription',  // ✅ MODO ASSINATURA
```

**2. Webhook events configurados:**

- ✅ `checkout.session.completed` - Primeiro pagamento
- ✅ `invoice.payment_succeeded` - Pagamentos mensais subsequentes
- ✅ `invoice.payment_failed` - Falha em pagamentos
- ✅ `customer.subscription.updated` - Mudanças na assinatura
- ✅ `customer.subscription.deleted` - Cancelamento

### ⚠️ PORÉM: Faltam Implementações

**Problemas encontrados:**

1. **Renovação automática não está sincronizando com o banco:**

```javascript
case 'invoice.payment_succeeded':
  // TODO: Código comentado - não atualiza o banco local
```

2. **Falha de pagamento não suspende assinatura:**

```javascript
case 'invoice.payment_failed':
  // TODO: Implementar lógica de suspensão ou retry
```

3. **Não há sincronização entre Stripe e banco local:**

```javascript
case 'customer.subscription.updated':
  // TODO: Implementar lógica para sincronizar com o banco local
```

4. **Cancelamento não desativa assinatura:**

```javascript
case 'customer.subscription.deleted':
  // TODO: Implementar lógica para desativar assinatura local
```

---

## 3. Correções Necessárias

### A. Corrigir updateUserCompany

Verificar se o controller está usando `userId` corretamente

### B. Implementar Webhooks Completos

1. Renovação automática mensal
2. Suspensão por falta de pagamento
3. Sincronização de status
4. Cancelamento de assinatura

### C. Adicionar Metadata do Stripe

Salvar `stripeSubscriptionId` no banco para rastreamento

---

## 4. Próximos Passos

1. ✅ Testar rota de atualização de empresa
2. ⏳ Implementar webhooks faltantes
3. ⏳ Adicionar campo `stripeSubscriptionId` ao schema
4. ⏳ Testar renovação mensal
5. ⏳ Testar falha de pagamento
