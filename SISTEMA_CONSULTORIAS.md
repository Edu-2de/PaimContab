# Sistema de Agendamento de Consultorias

## Visão Geral

Sistema completo para agendamento de consultorias personalizadas entre MEIs e administradores do PaimContab.

## Regras de Negócio

### Consultoria

- **Duração:** 4 horas por sessão
- **Horário:** Das 19h às 22h (início possível: 19:00, 20:00, 21:00)
- **Limite:** Apenas 1 MEI pode agendar por dia
- **Status:** scheduled (agendado) ou cancelled (cancelado)

### Permissões

- **MEI:** Pode agendar apenas para sua própria empresa
- **Admin:** Pode visualizar todos os agendamentos de todas as empresas

## Estrutura do Banco de Dados

### Modelo Prisma

```prisma
model ConsultationBooking {
  id                String   @id @default(cuid())
  companyId         String
  company           Company  @relation(fields: [companyId], references: [id])
  consultationDate  DateTime
  startTime         String
  duration          Int      @default(4)
  status            String   @default("scheduled")
  companyName       String
  userName          String
  userEmail         String
  notes             String?
  createdAt         DateTime @default(now())

  @@unique([consultationDate]) // Garante 1 MEI por dia
}
```

## API Endpoints

### 1. GET /api/consultations/available-dates

Retorna datas já reservadas em um mês específico.

**Query Parameters:**

- `year` (required): Ano (ex: 2025)
- `month` (required): Mês (ex: 10)

**Response:**

```json
{
  "bookedDates": ["2025-10-15", "2025-10-20", "2025-10-25"]
}
```

### 2. POST /api/consultations

Cria novo agendamento de consultoria.

**Headers:**

- `Authorization: Bearer <token>`

**Body:**

```json
{
  "consultationDate": "2025-10-15",
  "startTime": "19:00",
  "notes": "Gostaria de revisar fluxo de caixa"
}
```

**Validações:**

- Data não pode estar no passado
- Horário deve ser 19:00, 20:00 ou 21:00
- Data não pode estar já reservada (unique constraint)
- Usuário deve ter empresa associada

**Response:** (201 Created)

```json
{
  "id": "ckx1234567890",
  "companyId": "company123",
  "consultationDate": "2025-10-15T00:00:00.000Z",
  "startTime": "19:00",
  "duration": 4,
  "status": "scheduled",
  "companyName": "Empresa MEI LTDA",
  "userName": "João Silva",
  "userEmail": "joao@empresa.com",
  "notes": "Gostaria de revisar fluxo de caixa"
}
```

**Errors:**

- 400: Campos obrigatórios faltando ou horário inválido
- 404: Usuário ou empresa não encontrada
- 409: Data já reservada (Conflict)

### 3. GET /api/consultations

Lista agendamentos.

**Headers:**

- `Authorization: Bearer <token>`

**Query Parameters (Admin apenas):**

- `companyId` (optional): Filtrar por empresa específica

**Comportamento:**

- **MEI:** Retorna apenas agendamentos da própria empresa
- **Admin sem companyId:** Retorna todos os agendamentos
- **Admin com companyId:** Retorna agendamentos da empresa especificada

**Response:**

```json
[
  {
    "id": "ckx1234567890",
    "companyId": "company123",
    "consultationDate": "2025-10-15T00:00:00.000Z",
    "startTime": "19:00",
    "status": "scheduled",
    "companyName": "Empresa MEI LTDA",
    "userName": "João Silva",
    "notes": "..."
  }
]
```

### 4. DELETE /api/consultations/:id

Cancela um agendamento (status → "cancelled").

**Headers:**

- `Authorization: Bearer <token>`

**Permissões:**

- Admin pode cancelar qualquer agendamento
- MEI pode cancelar apenas seus próprios agendamentos

**Response:** (200 OK)

```json
{
  "id": "ckx1234567890",
  "status": "cancelled",
  "...": "..."
}
```

**Errors:**

- 403: Sem permissão para cancelar
- 404: Agendamento não encontrado

## Frontend

### Página: /mei/[companyId]/calendario

**Funcionalidades:**

1. **Calendário Mensal Interativo**

   - Navegação entre meses (← Anterior / Próximo →)
   - Visualização de dias:
     - 🔴 Vermelho: Data já reservada
     - 🟣 Roxo: Data selecionada
     - ⚪ Branco: Data disponível
     - ⚫ Cinza: Data passada (desabilitada)

2. **Formulário de Agendamento**

   - Aparece ao clicar em data disponível
   - Campos:
     - Data (auto-preenchida, read-only)
     - Horário (dropdown: 19:00, 20:00, 21:00)
     - Observações (textarea opcional)
   - Botões: "Confirmar Agendamento" e "Cancelar"

3. **Lista de Agendamentos**
   - Mostra todos os agendamentos do MEI
   - Status visual (Agendado verde / Cancelado vermelho)
   - Botão "Cancelar" para agendamentos ativos

**Validações Frontend:**

- Não permite selecionar datas passadas
- Não permite selecionar datas já reservadas
- Valida permissão de acesso (MEI vs Admin)

## Sistema de Notificações

### Envio de Email aos Admins

Quando um MEI agenda uma consultoria, todos os administradores do sistema recebem um email com:

**Informações no Email:**

- Nome da empresa MEI
- Nome do usuário que agendou
- Email do usuário
- Data da consultoria
- Horário de início
- Observações (se houver)

**Implementação Atual:**

- Estrutura está pronta em `/backend/src/routes/consultations.js`
- Função `sendEmailToAdmins()` imprime log no console
- Para ativar emails reais, configurar nodemailer:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

await transporter.sendMail({
  from: process.env.SMTP_USER,
  to: adminEmails.join(', '),
  subject: `Nova Consultoria Agendada - ${booking.companyName}`,
  html: `
    <h2>Nova Consultoria Agendada</h2>
    <p><strong>Empresa:</strong> ${booking.companyName}</p>
    <p><strong>Usuário:</strong> ${booking.userName}</p>
    <p><strong>Email:</strong> ${booking.userEmail}</p>
    <p><strong>Data:</strong> ${formatDate(booking.consultationDate)}</p>
    <p><strong>Horário:</strong> ${booking.startTime} (4 horas)</p>
    ${booking.notes ? `<p><strong>Observações:</strong> ${booking.notes}</p>` : ''}
  `,
});
```

## Variáveis de Ambiente Necessárias

```env
# SMTP para envio de emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
```

## Fluxo de Uso

### Para MEI:

1. Acessa `/mei/{companyId}/calendario`
2. Navega pelo calendário para encontrar data disponível
3. Clica na data desejada
4. Preenche horário e observações
5. Confirma agendamento
6. Recebe confirmação visual
7. Email é enviado automaticamente aos admins

### Para Admin:

1. Recebe email com notificação de novo agendamento
2. Pode acessar `/mei/{companyId}/calendario` de qualquer MEI
3. Visualiza todos os agendamentos
4. Pode cancelar agendamentos se necessário

## Melhorias Futuras

1. **Email de Confirmação ao MEI**
   - Enviar email ao MEI confirmando o agendamento
2. **Lembretes Automáticos**
   - Email 24h antes da consultoria
3. **Sistema de Reagendamento**
   - Permitir alterar data/horário de consultorias já agendadas
4. **Integração com Calendário Externo**
   - Google Calendar, Outlook, etc.
5. **Sistema de Avaliação**
   - MEI avaliar consultoria após realização
6. **Dashboard de Consultorias (Admin)**
   - Visualização consolidada de todas consultorias
   - Filtros por data, empresa, status
   - Estatísticas de utilização

## Testes

### Testar Criação de Agendamento:

```bash
# Login como MEI
POST http://localhost:4000/api/auth/login
{
  "email": "mei@empresa.com",
  "password": "senha123"
}

# Criar agendamento
POST http://localhost:4000/api/consultations
Authorization: Bearer <token>
{
  "consultationDate": "2025-10-15",
  "startTime": "19:00",
  "notes": "Teste de agendamento"
}
```

### Testar Unique Constraint (1 MEI por dia):

```bash
# Tentar agendar mesma data novamente (deve retornar 409 Conflict)
POST http://localhost:4000/api/consultations
Authorization: Bearer <token>
{
  "consultationDate": "2025-10-15",
  "startTime": "20:00"
}
```

### Testar Acesso Admin:

```bash
# Login como Admin
POST http://localhost:4000/api/auth/login
{
  "email": "admin@paimcontab.com",
  "password": "admin123"
}

# Ver todos agendamentos
GET http://localhost:4000/api/consultations
Authorization: Bearer <token>

# Ver agendamentos de empresa específica
GET http://localhost:4000/api/consultations?companyId=company123
Authorization: Bearer <token>
```

## Arquivos Modificados/Criados

### Backend:

- ✅ `backend/prisma/schema.prisma` - Modelo ConsultationBooking
- ✅ `backend/prisma/migrations/20251003142821_add_consultation_bookings/` - Migration
- ✅ `backend/src/routes/consultations.js` - Rotas da API
- ✅ `backend/src/app.js` - Registro das rotas

### Frontend:

- ✅ `frontend/src/app/mei/[companyId]/calendario/page.tsx` - Página do calendário
- ✅ `frontend/src/app/PaymentSuccess/page.tsx` - Tela de boas-vindas
- ✅ `frontend/src/components/MeiSidebar.tsx` - Link do calendário

## Status do Projeto

✅ **Completo:**

- Estrutura de rotas MEI com companyId dinâmico
- Sistema de permissões (MEI vs Admin)
- Tela de boas-vindas pós-assinatura
- Backend completo de agendamentos
- Frontend interativo com calendário
- Validações de horário e data única

⏳ **Pendente:**

- Configuração real de envio de emails (nodemailer)
- Variáveis de ambiente SMTP
- Testes de integração completos
