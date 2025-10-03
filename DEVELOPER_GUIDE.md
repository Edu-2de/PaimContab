# PaimContab - Developer Quick Reference

## 🚀 Quick Start

### Initial Setup

```bash
# Clone and install
git clone <repository>
cd PaimContab

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npx prisma migrate dev
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

```bash
# Backend (.env)
DATABASE_URL="postgresql://user:pass@localhost:5432/paimcontab"
JWT_SECRET="generate-32-char-random-string"
STRIPE_SECRET_KEY="sk_test_..."
PORT=4000
```

---

## 📂 Project Structure

```
PaimContab/
├── backend/                 # Node.js + Express + Prisma
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, validation
│   │   ├── routes/          # API endpoints
│   │   └── utils/           # Helpers
│   └── prisma/
│       └── schema.prisma    # Database models
│
└── frontend/                # Next.js 15 + TypeScript
    └── src/
        ├── app/             # Pages (App Router)
        ├── components/      # Reusable UI
        └── utils/           # Client utilities
```

---

## 🔐 Authentication Flow

### Login

```javascript
// POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer" | "admin",
    "companyId": "uuid" | null
  }
}
```

### Using Token

```javascript
// All authenticated requests
headers: {
  'Authorization': 'Bearer jwt_token_here'
}
```

---

## 🏢 User Roles & Permissions

### Customer (MEI User)

- Access own company data only
- CRUD operations on own receitas/despesas
- Book consultations
- Access: `/mei/[companyId]/*`

### Admin

- Access all company data via `?companyId=X`
- Manage users
- View all consultations
- Access: `/admin/*`

---

## 🛣️ Key Routes

### Frontend Routes

```
/                           # Landing page
/Login                      # Authentication
/Payment                    # Subscription payment
/PaymentSuccess             # Post-payment welcome

# MEI Dashboard
/mei/[companyId]/dashboard       # Overview
/mei/[companyId]/receitas        # Income management
/mei/[companyId]/despesas        # Expense management
/mei/[companyId]/calendario      # Consultation booking

# Admin Panel
/admin/dashboard            # Admin overview
/admin/companies            # Manage companies
/admin/users                # Manage users
```

### API Endpoints

```
# Authentication
POST   /api/auth/register
POST   /api/auth/login

# Transactions (requires auth)
GET    /api/receitas?companyId=X    # Admin only needs ?companyId
POST   /api/receitas
PUT    /api/receitas/:id
DELETE /api/receitas/:id

GET    /api/despesas?companyId=X
POST   /api/despesas
PUT    /api/despesas/:id
DELETE /api/despesas/:id

# Consultations
GET    /api/consultations/available-dates?year=2025&month=10
POST   /api/consultations
GET    /api/consultations?companyId=X
DELETE /api/consultations/:id

# Admin
GET    /api/admin/users
GET    /api/admin/users/:id
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
```

---

## 💾 Database Models

### Key Models

```prisma
User {
  id, email, password, name, role, isActive
  company: Company?         # 1-to-1
}

Company {
  id, userId, companyName, cnpj
  receitas: Receita[]       # 1-to-many
  despesas: Despesa[]       # 1-to-many
  consultationBookings: ConsultationBooking[]
}

Receita {
  id, companyId, description, value, date, category
}

Despesa {
  id, companyId, description, value, date, category
}

ConsultationBooking {
  id, companyId, consultationDate, startTime
  @@unique([consultationDate])  # 1 MEI per day
}
```

---

## 🔧 Common Tasks

### Create Admin User

```bash
cd backend
node scripts/createAdmin.js
```

### Reset Database

```bash
cd backend
npx prisma migrate reset
```

### Add New Migration

```bash
cd backend
npx prisma migrate dev --name description_of_change
```

### Check Database

```bash
cd backend
npx prisma studio
```

---

## 🧪 Testing

### Test Authentication

```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### Test Protected Route

```bash
curl -X GET http://localhost:4000/api/receitas \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🐛 Troubleshooting

### JWT Secret Error

```
Error: JWT_SECRET must be defined in environment variables
```

**Fix:** Add `JWT_SECRET` to `.env` file

### Database Connection Error

```
Error: Can't reach database server
```

**Fix:**

1. Check PostgreSQL is running
2. Verify DATABASE_URL in .env
3. Run `npx prisma migrate dev`

### Port Already in Use

```
Error: Port 4000 is already in use
```

**Fix:** Change `PORT` in .env or kill process:

```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :4000
kill -9 <PID>
```

---

## 📝 Code Conventions

### Backend

- Use `const` and `let` (no `var`)
- Async/await over promises
- Try/catch for error handling
- Use Prisma for all database operations
- Validate input with middleware
- Return consistent error format:
  ```javascript
  res.status(400).json({ error: 'Description' });
  ```

### Frontend

- TypeScript for type safety
- Use Next.js App Router
- Client components: `'use client'`
- Store user in localStorage
- Use `useParams()` for dynamic routes
- Handle loading states
- Display user-friendly errors

---

## 🔒 Security Checklist

- [ ] Never commit `.env` files
- [ ] Use environment variables for secrets
- [ ] Validate all user input
- [ ] Use parameterized queries (Prisma does this)
- [ ] Implement rate limiting in production
- [ ] Use HTTPS in production
- [ ] Set secure JWT secret (32+ chars)
- [ ] Hash passwords (bcrypt with 12 rounds)
- [ ] Sanitize user input
- [ ] Implement CORS restrictions

---

## 📦 Dependencies

### Backend Key Packages

- `express` - Web framework
- `@prisma/client` - Database ORM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cors` - CORS middleware
- `validator` - Input validation

### Frontend Key Packages

- `next` - React framework
- `react` - UI library
- `typescript` - Type safety
- `tailwindcss` - Styling

---

## 🆘 Getting Help

### Documentation Files

- `README.md` - Project overview
- `SECURITY_IMPROVEMENTS.md` - Security guide
- `PROJECT_AUDIT.md` - Full audit report
- `SISTEMA_CONSULTORIAS.md` - Consultation system
- `backend/.env.example` - Environment setup

### Useful Commands

```bash
# Check logs
npm run dev                    # Shows server logs

# Database
npx prisma studio             # Visual database browser
npx prisma migrate status     # Check migration status

# Dependencies
npm audit                     # Check vulnerabilities
npm outdated                  # Check outdated packages
```

---

## 🎯 Next Steps for New Developers

1. **Setup Environment**

   - Install Node.js, PostgreSQL
   - Clone repository
   - Configure .env files

2. **Run Locally**

   - Start backend: `cd backend && npm run dev`
   - Start frontend: `cd frontend && npm run dev`
   - Create admin user with script

3. **Understand Architecture**

   - Review `PROJECT_AUDIT.md`
   - Check API routes in `backend/src/routes/`
   - Explore pages in `frontend/src/app/`

4. **Make First Change**
   - Pick a small task
   - Create feature branch
   - Test locally
   - Submit PR

---

_Last Updated: October 3, 2025_
