# 🧪 GUIA DE TESTES - Sistema PaimContab

## 📋 Como Testar Tudo

---

## 1. ❗ IMPORTANTE: Antes de Começar

### Verificar se os servidores estão rodando:

```powershell
# Terminal 1 - Backend
cd C:\Projects\PaimContab\backend
npm run dev
# Deve mostrar: Server running on port 4000

# Terminal 2 - Frontend
cd C:\Projects\PaimContab\frontend
npm run dev
# Deve mostrar: Local: http://localhost:3000
```

---

## 2. 🔐 Teste 1: Atualização de Empresa no Admin

### Passo a Passo:

1. **Abrir browser** → `http://localhost:3000/Login`

2. **Fazer login como Admin:**

   - Email: (seu email de admin)
   - Senha: (sua senha de admin)

3. **Ir para Dashboard de Usuários:**

   - Menu lateral → "Usuários"
   - Ou direto: `http://localhost:3000/admin/dashboard`

4. **Selecionar um usuário:**

   - Clicar no ícone do olho 👁️ em qualquer usuário

5. **Editar Empresa:**

   - Scroll até "Informações da Empresa"
   - Clicar em "Editar"
   - Alterar campos:
     - Nome da Empresa
     - Cidade
     - Estado
     - Faturamento Mensal
   - Clicar em "Salvar Alterações"

6. **Verificar Sucesso:**
   - ✅ Deve aparecer alert: "Empresa atualizada com sucesso!"
   - ✅ Dados devem aparecer atualizados na tela
   - ✅ Recarregar página (F5) - dados permanecem atualizados

### 🐛 Se der erro:

**Abrir Console do Browser (F12) e verificar:**

- Erro 401: Fazer logout e login novamente
- Erro 404: Verificar se backend está rodando
- Erro 500: Verificar logs do backend

**No terminal do backend, procurar:**

```
🏢 Atualizando empresa do usuário: [userId]
✅ Empresa atualizada com sucesso
```

---

## 3. 💳 Teste 2: Pagamento com Stripe

### Passo a Passo:

#### A. Criar Nova Conta MEI:

1. **Abrir** → `http://localhost:3000`

2. **Clicar em "Cadastre-se"**

3. **Preencher dados:**

   - Nome: Teste MEI
   - Email: teste@exemplo.com
   - Senha: teste123

4. **Cadastrar empresa:**

   - Nome da Empresa: MEI Teste Ltda
   - Segmento: Tecnologia
   - Atividade: Desenvolvimento
   - Cidade: São Paulo
   - Estado: SP

5. **Escolher plano:**
   - Selecionar "Premium" (R$ 69,00)
   - Clicar em "Assinar"

#### B. Pagamento no Stripe:

1. **Será redirecionado para Stripe Checkout**

2. **Preencher dados do cartão:**

   ```
   Número: 4242 4242 4242 4242
   Validade: 12/34
   CVC: 123
   CEP: 12345-678
   ```

3. **Clicar em "Assinar"**

4. **Aguardar redirecionamento:**
   - Deve ir para: `/PaymentSuccess`
   - Login automático

#### C. Verificar no Banco:

**Abrir PgAdmin ou DBeaver:**

```sql
SELECT * FROM "Subscription"
WHERE "userId" = '[userId do usuário criado]'
ORDER BY "createdAt" DESC;
```

**Deve mostrar:**

- ✅ `isActive = true`
- ✅ `planId = "premium"`
- ✅ `stripeSubscriptionId` preenchido (ex: `sub_xxx`)
- ✅ `startDate` com data atual

---

## 4. 🔄 Teste 3: Renovação Mensal (Simulação)

### Via Stripe Dashboard:

1. **Abrir** → `https://dashboard.stripe.com/test/subscriptions`

2. **Encontrar a assinatura criada:**

   - Procurar pelo email: teste@exemplo.com

3. **Simular pagamento mensal:**

   - Clicar na assinatura
   - Actions → "Create invoice"
   - Marcar "Invoice now" e "Finalize"

4. **Verificar webhook no terminal backend:**

```
💰 ===== INVOICE PAYMENT SUCCEEDED =====
💰 Invoice ID: in_xxx
💰 Subscription ID: sub_xxx
✅ Pagamento recorrente processado para: teste@exemplo.com
```

5. **Verificar no banco:**

```sql
SELECT "isActive", "stripeSubscriptionId", "endDate"
FROM "Subscription"
WHERE "stripeSubscriptionId" = 'sub_xxx';
```

**Deve mostrar:**

- ✅ `isActive = true`
- ✅ `endDate = NULL`

---

## 5. ❌ Teste 4: Falha de Pagamento

### Via Stripe Dashboard:

1. **Abrir a assinatura no Stripe**

2. **Simular falha de pagamento:**

   - Actions → "Update payment method"
   - Trocar para cartão que falha: `4000 0000 0000 0002`

3. **Forçar cobrança:**

   - Actions → "Create invoice"
   - Finalize invoice

4. **Verificar webhook (1ª tentativa):**

```
❌ ===== INVOICE PAYMENT FAILED =====
⚠️ Tentativa 1 de 3 - Assinatura ainda ativa
```

5. **Repetir 3 vezes:**

   - Criar e finalizar invoice novamente
   - Stripe tentará automaticamente

6. **Após 3 falhas, verificar webhook:**

```
❌ Assinatura suspensa após falha de pagamento
📧 Email de suspensão deve ser enviado para: teste@exemplo.com
```

7. **Verificar no banco:**

```sql
SELECT "isActive", "endDate"
FROM "Subscription"
WHERE "stripeSubscriptionId" = 'sub_xxx';
```

**Deve mostrar:**

- ✅ `isActive = false`
- ✅ `endDate` com data atual

---

## 6. 🗑️ Teste 5: Cancelamento de Assinatura

### Via Stripe Dashboard:

1. **Abrir a assinatura no Stripe**

2. **Cancelar:**

   - Actions → "Cancel subscription"
   - Choose: "Cancel immediately"
   - Confirmar

3. **Verificar webhook:**

```
🗑️ ===== SUBSCRIPTION DELETED =====
✅ Assinatura cancelada no banco
✅ Usuário: teste@exemplo.com
```

4. **Verificar no banco:**

```sql
SELECT "isActive", "endDate"
FROM "Subscription"
WHERE "stripeSubscriptionId" = 'sub_xxx';
```

**Deve mostrar:**

- ✅ `isActive = false`
- ✅ `endDate` com data e hora do cancelamento

---

## 7. 🔄 Teste 6: Sincronização de Status

### Testar mudanças de plano:

1. **No Stripe Dashboard:**

   - Abrir assinatura
   - Actions → "Update subscription"
   - Trocar plano

2. **Verificar webhook:**

```
🔄 ===== SUBSCRIPTION UPDATED =====
✅ Assinatura sincronizada
```

3. **Verificar status:**

```sql
SELECT "isActive", "planId"
FROM "Subscription"
WHERE "stripeSubscriptionId" = 'sub_xxx';
```

---

## 8. 📊 Monitoramento e Logs

### Logs do Backend (Terminal):

**Pagamento bem-sucedido:**

```
💳 ===== CHECKOUT SESSION COMPLETED =====
✅ Usuário encontrado: [nome] - [email]
✅ Plano encontrado: Premium - R$ 69
✅ Stripe Subscription ID: sub_xxx
✅ ===== ASSINATURA CRIADA COM SUCESSO =====
```

**Renovação mensal:**

```
💰 ===== INVOICE PAYMENT SUCCEEDED =====
💰 Subscription ID: sub_xxx
✅ Pagamento recorrente processado
```

**Falha de pagamento:**

```
❌ ===== INVOICE PAYMENT FAILED =====
❌ Tentativa 1 de 3
// ou
❌ Assinatura suspensa após falha de pagamento
```

### Verificar Stripe Logs:

1. **Abrir** → `https://dashboard.stripe.com/test/logs`
2. **Filtrar por:** Webhooks
3. **Verificar eventos recebidos**

---

## 9. 🐛 Troubleshooting

### Problema: Webhook não chega

**Verificar:**

1. Stripe CLI está rodando?

   ```powershell
   stripe listen --forward-to localhost:4000/api/payment/webhook
   ```

2. Webhook secret está correto no `.env`?

   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

3. Backend está rodando na porta 4000?

### Problema: Assinatura não cria

**Verificar:**

1. Planos existem no banco?

   ```sql
   SELECT * FROM "Plan";
   ```

2. Usuário tem empresa cadastrada?

   ```sql
   SELECT * FROM "Company" WHERE "userId" = '[userId]';
   ```

3. Logs do backend mostram erros?

### Problema: Não consegue atualizar empresa

**Verificar:**

1. Está logado como admin?
2. Token ainda é válido?
3. Backend retorna erro 500? (ver logs)
4. Campos obrigatórios preenchidos?

---

## 10. ✅ Checklist Final

Antes de considerar completo, testar:

- [ ] Login como admin
- [ ] Visualizar lista de usuários
- [ ] Editar usuário (nome e email)
- [ ] Editar empresa do usuário
- [ ] Criar nova conta MEI
- [ ] Cadastrar empresa
- [ ] Assinar plano Premium
- [ ] Pagamento com cartão de teste
- [ ] Ver assinatura no banco com stripeSubscriptionId
- [ ] Simular renovação mensal no Stripe
- [ ] Verificar webhook de pagamento sucesso
- [ ] Simular falha de pagamento
- [ ] Verificar suspensão após 3 falhas
- [ ] Cancelar assinatura no Stripe
- [ ] Verificar webhook de cancelamento
- [ ] Confirmar sincronização no banco

---

## 📞 Suporte

Se encontrar problemas:

1. **Verificar logs do backend** (terminal)
2. **Verificar console do browser** (F12)
3. **Verificar Stripe Dashboard** → Logs
4. **Verificar banco de dados** (PgAdmin/DBeaver)

---

**Data:** 31 de Outubro de 2025  
**Status:** ✅ Pronto para testar
