# PaimContab

A modern, secure accounting management platform designed specifically for MEI (Micro Empreendedor Individual) businesses in Brazil. Built with Next.js 15 and Node.js, PaimContab provides comprehensive tools for financial management, consultation booking, and administrative oversight.

## 🚀 Features

### For MEI Users

- 📊 **Financial Dashboard** - Real-time overview of revenue, expenses, and profitability
- 💰 **Income Management** (Receitas) - Track and manage all business income
- 💸 **Expense Management** (Despesas) - Monitor and categorize business expenses
- 📅 **Consultation Booking** - Schedule free 4-hour monthly consultations (19h-22h)
- 📈 **DAS Calculator** - Automatic MEI tax calculations
- 🗓️ **Calendar** - Event management and deadline tracking

### For Administrators

- 👥 **User Management** - Complete CRUD operations for all users
- 🏢 **Company Management** - Oversee all registered MEI businesses
- 📊 **Analytics Dashboard** - System-wide metrics and insights
- 🔔 **Consultation Notifications** - Email alerts for new bookings
- 💳 **Subscription Management** - Track payments and plan status

## 🛠️ Tech Stack

### Frontend

- **Framework:** Next.js 15.3.3 (React 19) with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** React Icons (HeroIcons)
- **State:** React Hooks + localStorage

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js 5.1.0
- **Database:** PostgreSQL
- **ORM:** Prisma 6.9.0
- **Authentication:** JWT (jsonwebtoken)
- **Security:** bcryptjs (12 rounds), validator, CORS
- **Payment:** Stripe
- **Email:** Nodemailer (planned)

## 📁 Project Structure

```
PaimContab/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, validation, admin checks
│   │   ├── routes/          # API endpoints
│   │   └── utils/           # Logger, helpers
│   ├── prisma/
│   │   └── schema.prisma    # Database models
│   └── scripts/             # Utility scripts
│
└── frontend/
    └── src/
        ├── app/
        │   ├── mei/[companyId]/  # MEI dashboard pages
        │   ├── admin/            # Admin panel
        │   └── Login/            # Authentication
        ├── components/           # Reusable UI components
        └── utils/                # Client utilities
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd PaimContab
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npx prisma migrate dev
   npm run dev
   ```

3. **Frontend Setup** (new terminal)

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Create Admin User**

   ```bash
   cd backend
   node scripts/createAdmin.js
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## 🔐 Environment Variables

### Backend (.env)

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/paimcontab"
JWT_SECRET="your-32-character-random-secret"
STRIPE_SECRET_KEY="sk_test_..."
PORT=4000
NODE_ENV=development
```

See `backend/.env.example` for complete configuration.

## 🔒 Security Features

- ✅ JWT authentication with secure token management
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Input validation and sanitization
- ✅ XSS protection
- ✅ SQL injection prevention (Prisma ORM)
- ✅ Role-based access control (admin/customer)
- ✅ Company data isolation
- ✅ Environment-based logging

## 📚 Documentation

- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Quick reference for developers
- **[SECURITY_IMPROVEMENTS.md](./SECURITY_IMPROVEMENTS.md)** - Security audit and recommendations
- **[PROJECT_AUDIT.md](./PROJECT_AUDIT.md)** - Complete project review
- **[SISTEMA_CONSULTORIAS.md](./SISTEMA_CONSULTORIAS.md)** - Consultation booking system

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Check database
npx prisma studio
```

## 🚀 Deployment

Before deploying to production, complete the checklist in `SECURITY_IMPROVEMENTS.md`:

- Set `NODE_ENV=production`
- Generate strong JWT_SECRET
- Configure HTTPS/SSL
- Install Helmet.js and rate limiting
- Restrict CORS
- Run `npm audit fix`
- Set up error monitoring

## 📝 API Documentation

### Authentication

- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Authenticate user

### Transactions (Protected)

- `GET /api/receitas` - List income
- `POST /api/receitas` - Create income
- `PUT /api/receitas/:id` - Update income
- `DELETE /api/receitas/:id` - Delete income

(Similar for `/api/despesas`)

### Consultations (Protected)

- `GET /api/consultations/available-dates` - Get available dates
- `POST /api/consultations` - Book consultation
- `GET /api/consultations` - List bookings
- `DELETE /api/consultations/:id` - Cancel booking

### Admin (Protected, Admin Only)

- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Project Status:** ✅ Production-ready after implementing high-priority security items (see SECURITY_IMPROVEMENTS.md)

**Last Updated:** October 3, 2025
