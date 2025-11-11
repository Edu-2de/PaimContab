# ⚡ TESTE RÁPIDO - Webhook do Stripe

## 🚨 PROBLEMA ATUAL

Mesmo seguindo todos os passos, a assinatura não está sendo salva no banco após pagamento aprovado.

**Logs mostram:**

```
❌ Nenhuma assinatura encontrada para o usuário
```

**Causa**: Webhook do Stripe não está chegando no backend.

---

## ✅ SOLUÇÃO PASSO A PASSO

### 1️⃣ Verificar se Stripe CLI está instalado

```powershell
stripe version
```

Se não estiver instalado:

```powershell
# Windows - PowerShell como Admin
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# OU baixar: https://github.com/stripe/stripe-cli/releases/latest
```

### 2️⃣ Autenticar (só precisa fazer 1 vez)

```bash
stripe login
```

Vai abrir navegador para autenticar.

### 3️⃣ Iniciar Backend

```bash
cd backend
npm run dev
```

**Deixe este terminal aberto!**

### 4️⃣ Iniciar Stripe Webhook Forwarding (NOVO TERMINAL)

```bash
stripe listen --forward-to http://localhost:4000/api/payment/webhook
```

Você verá:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**⚠️ COPIE O SECRET** (começa com `whsec_`)

**Deixe este terminal aberto também!**

### 5️⃣ Atualizar .env

Edite `backend/.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_cole_o_secret_aqui
```

### 6️⃣ Reiniciar Backend

No terminal do backend (passo 3):

- Pressione `Ctrl+C` para parar
- Execute novamente:

```bash
npm run dev
```

### 7️⃣ Iniciar Frontend (TERCEIRO TERMINAL)

```bash
cd frontend
npm run dev
```

### 8️⃣ Testar Pagamento

1. Acesse `http://localhost:3001`
2. Faça login
3. **IMPORTANTE**: Cadastre empresa se não tiver (`/setup-company`)
4. Vá para "Planos" e escolha um
5. Use cartão de teste: `4242 4242 4242 4242`
   - Validade: `12/25`
   - CVC: `123`
6. Complete o pagamento

### 9️⃣ VERIFICAR LOGS

**Terminal do Stripe CLI (passo 4) deve mostrar:**

```
2025-10-03 16:00:00 --> checkout.session.completed [evt_xxx]
2025-10-03 16:00:00 <-- [200] POST http://localhost:4000/api/payment/webhook
```

✅ **Se mostrar `[200]` = SUCESSO!**
❌ **Se mostrar `[400]` ou `[500]` = ERRO**

**Terminal do Backend (passo 3) deve mostrar:**

```
🔔 WEBHOOK RECEBIDO
✅ Webhook signature verificada com sucesso
✅ Webhook recebido: checkout.session.completed
💳 ===== CHECKOUT SESSION COMPLETED =====
✅ Usuário encontrado: { id: '...', email: '...', name: '...' }
✅ Plano encontrado no banco: { id: 'essencial', name: 'Essencial', price: 19 }
📝 Criando nova assinatura...
✅ ===== ASSINATURA CRIADA COM SUCESSO =====
✅ Subscription ID: ...
✅ User: Nome - email@exemplo.com
✅ Plan: Essencial - R$ 19
✅ Status: ATIVA
```

### 🔟 Verificar Dashboard

1. Acesse dashboard MEI pelo header (foto de perfil → Dashboard MEI)
2. Deve carregar normalmente ✅
3. Admin pode ver usuário em "Com Plano Ativo"

---

## 🚨 SE NÃO FUNCIONAR

### Erro: "Webhook signature verification failed"

**Problema**: Secret incorreto ou backend não reiniciado.

**Solução**:

1. Copie o secret do terminal `stripe listen` (whsec_xxx)
2. Cole no `backend/.env`
3. Reinicie backend (Ctrl+C e `npm run dev`)

### Erro: Webhook não chega

**Problema**: Stripe CLI não está rodando ou URL errada.

**Verificar**:

```bash
# O comando está rodando?
stripe listen --forward-to http://localhost:4000/api/payment/webhook

# Backend está na porta 4000?
# Veja no terminal do backend
```

### Erro: "Usuário sem empresa"

**Problema**: Tentou assinar sem cadastrar empresa.

**Solução**:

1. Acesse `/setup-company`
2. Preencha dados da empresa
3. Tente assinar novamente

### Assinatura não salva mas webhook retorna 200

**Problema**: Erro no código do webhook.

**Solução**:

1. Veja TODOS os logs do backend
2. Procure por linhas com ❌
3. Me mostre o erro completo

---

## ⚡ TESTE SUPER RÁPIDO

Se você já fez tudo isso antes e só quer testar de novo:

```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
stripe listen --forward-to http://localhost:4000/api/payment/webhook
# (Se o secret mudou, atualize .env e reinicie Terminal 1)

# Terminal 3
cd frontend
npm run dev

# Navegador
# http://localhost:3001 → Login → Empresa → Plano → Pagar
# Cartão: 4242 4242 4242 4242
```

Veja logs nos Terminais 1 e 2.

---

## 📊 COMO SABER SE FUNCIONOU

### ✅ Sinais de SUCESSO:

1. **Terminal Stripe CLI mostra**: `[200]`
2. **Terminal Backend mostra**: `ASSINATURA CRIADA COM SUCESSO`
3. **Dashboard MEI carrega** sem erro
4. **MeiProtection permite acesso**
5. **Admin vê usuário** com plano ativo

### ❌ Sinais de ERRO:

1. **Terminal Stripe CLI mostra**: `[400]` ou `[500]`
2. **Terminal Backend mostra**: Erros ❌
3. **Dashboard MEI bloqueia** com "Plano Necessário"
4. **MeiProtection redireciona** para planos

---

## 🆘 AINDA COM PROBLEMA?

Me envie:

1. **Logs completos do backend** (depois de fazer pagamento)
2. **Logs do Stripe CLI** (a linha com [200]/[400]/[500])
3. **Screenshot do erro** (se houver)
4. **Confirme que executou**:
   - `stripe listen` está rodando? (SIM/NÃO)
   - `.env` tem `STRIPE_WEBHOOK_SECRET` correto? (SIM/NÃO)
   - Backend foi reiniciado após mudar `.env`? (SIM/NÃO)
   - Usuário tem empresa cadastrada? (SIM/NÃO)

---

**Criado**: 03/10/2025  
**Objetivo**: Diagnosticar por que webhook não está salvando subscription
