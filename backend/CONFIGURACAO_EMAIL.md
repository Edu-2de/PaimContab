# 📧 Configuração de Email para Notificações

## 🎯 Funcionalidade

Quando um usuário **Premium** agenda uma consultoria, o sistema envia automaticamente um email para **todos os administradores** com os detalhes do agendamento:

- 📅 Data e horário
- 🏢 Nome da empresa
- 👤 Nome do usuário
- 📧 Email de contato
- 📝 Observações (se houver)

---

## ⚙️ Como Configurar (Gmail)

### 1️⃣ Criar Senha de App no Gmail

1. Acesse: https://myaccount.google.com/apppasswords
2. Faça login na sua conta Gmail
3. Clique em **"Criar senha de app"**
4. Escolha:
   - App: **Email**
   - Dispositivo: **Outro (nome personalizado)**
   - Nome: **PaimContab Backend**
5. Clique em **"Gerar"**
6. **COPIE A SENHA** (16 caracteres sem espaços)
   - Exemplo: `abcd efgh ijkl mnop` (copie sem espaços: `abcdefghijklmnop`)

### 2️⃣ Configurar no .env

Edite o arquivo `backend/.env` e adicione/altere:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

**⚠️ IMPORTANTE:**

- Use o **email completo** em `EMAIL_USER` (exemplo@gmail.com)
- Use a **senha de app** (não a senha normal da conta)
- `EMAIL_SECURE=false` para porta 587
- Se usar porta 465, mude para `EMAIL_SECURE=true`

### 3️⃣ Reiniciar Backend

Após configurar o `.env`:

```bash
# Pressione Ctrl+C no terminal do backend
# Execute novamente:
npm run dev
```

---

## 🧪 Testar Envio de Email

### Teste Completo:

1. **Configure o email** no `.env` (passos acima)
2. **Reinicie o backend**
3. **Faça login** com usuário Premium
4. **Acesse o calendário** no dashboard MEI
5. **Agende uma consultoria**
6. **Verifique**:
   - ✅ Console do backend deve mostrar: `✅ Email enviado com sucesso para admins`
   - ✅ Admins devem receber o email

### Se não enviar:

Verifique os logs do backend:

```bash
# Se aparecer:
⚠️ Credenciais de email não configuradas no .env
# Solução: Configure EMAIL_USER e EMAIL_PASS

# Se aparecer:
❌ Erro ao enviar email: Invalid login
# Solução: Verifique se a senha de app está correta

# Se aparecer:
❌ Erro ao enviar email: Connection timeout
# Solução: Verifique conexão com internet e firewall
```

---

## 📋 Outras Configurações de Email

### Outlook/Hotmail:

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu-email@outlook.com
EMAIL_PASS=sua-senha
```

### Yahoo Mail:

```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu-email@yahoo.com
EMAIL_PASS=sua-senha-de-app
```

### Gmail Workspace (Google Workspace):

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu-email@suaempresa.com
EMAIL_PASS=sua-senha-de-app
```

---

## 🔒 Segurança

**❌ NUNCA:**

- Commitar o arquivo `.env` no Git
- Compartilhar suas senhas de app
- Usar a senha normal da conta de email

**✅ SEMPRE:**

- Use senhas de app (Gmail/Yahoo)
- Mantenha o `.env` no `.gitignore`
- Revogue senhas de app não utilizadas

---

## 🆘 Problemas Comuns

### Erro: "Invalid login"

- **Causa**: Senha de app incorreta ou expirada
- **Solução**: Gere uma nova senha de app

### Erro: "Connection timeout"

- **Causa**: Firewall bloqueando porta 587
- **Solução**: Verifique firewall ou use porta 465

### Erro: "Self signed certificate"

- **Causa**: Problema com certificado SSL
- **Solução**: Adicione no .env: `NODE_TLS_REJECT_UNAUTHORIZED=0` (só para testes!)

### Email não chega

- Verifique **caixa de spam** dos admins
- Verifique se `EMAIL_USER` está correto
- Teste com outro provedor de email

---

## 📊 Logs Úteis

Quando funcionar corretamente, você verá:

```bash
📧 Preparando email para admins: [ 'admin1@example.com', 'admin2@example.com' ]
✅ Email enviado com sucesso para admins: [ 'admin1@example.com', 'admin2@example.com' ]
```

Quando não estiver configurado:

```bash
⚠️ Credenciais de email não configuradas no .env
📋 Detalhes do agendamento que seria enviado:
   Empresa: Minha Empresa MEI
   Usuário: João Silva
   Email: joao@example.com
   Data: 15/11/2025
   Horário: 19:00
```

---

**Criado**: 31/10/2025  
**Última atualização**: 31/10/2025
