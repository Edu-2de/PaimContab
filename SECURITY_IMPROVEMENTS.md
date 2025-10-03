# Security & Best Practices - PaimContab

## ✅ Security Improvements Implemented

### 1. Authentication & Authorization

- ✅ JWT secret MUST be set in environment variables (no fallback)
- ✅ Password hashing with bcrypt (12 rounds for stronger security)
- ✅ Token expiration set to 7 days
- ✅ Input validation on login and registration
- ✅ Email normalization (lowercase, trimmed)
- ✅ Role-based access control (admin/customer)
- ✅ Company-specific data isolation

### 2. Input Validation & Sanitization

- ✅ Validation middleware created (`validationMiddleware.js`)
- ✅ XSS protection via input sanitization
- ✅ Email format validation
- ✅ Password strength validation (minimum 6 characters)
- ✅ Numeric value validation for transactions
- ✅ Date format validation (ISO 8601)
- ✅ Applied to auth routes

### 3. Environment Configuration

- ✅ `.env.example` with clear documentation
- ✅ All sensitive keys documented
- ✅ JWT_SECRET validation on startup
- ✅ Proper environment variable structure

### 4. Logging & Monitoring

- ✅ Logger utility created (`utils/logger.js`)
- ✅ Environment-based logging (verbose in dev, minimal in prod)
- ✅ Error logging always enabled
- ✅ Removed excessive console.log statements from auth flow

### 5. Database Security

- ✅ Prisma ORM prevents SQL injection
- ✅ Parameterized queries by default
- ✅ Cascade delete on company relations
- ✅ Unique constraints on critical fields (email, cnpj, consultationDate)

## ⚠️ Recommendations for Production

### Critical (Must Do Before Production)

1. **Environment Variables**

   ```bash
   # Generate a strong JWT secret (32+ characters)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Set in .env:
   JWT_SECRET="generated_secret_from_above"
   NODE_ENV="production"
   ```

2. **HTTPS/TLS**

   - Deploy behind reverse proxy (nginx/Apache)
   - Force HTTPS redirects
   - Use Let's Encrypt for SSL certificates

3. **Rate Limiting**
   Install and configure express-rate-limit:

   ```javascript
   // Add to app.js
   const rateLimit = require('express-rate-limit');

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
   });

   app.use('/api/', limiter);

   const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 5, // 5 login attempts per 15 minutes
     message: 'Too many login attempts, please try again later',
   });

   app.use('/api/auth/login', authLimiter);
   ```

4. **Helmet.js for Security Headers**

   ```bash
   npm install helmet
   ```

   ```javascript
   // Add to app.js
   const helmet = require('helmet');
   app.use(helmet());
   ```

5. **CORS Configuration**
   Update CORS to be more restrictive:
   ```javascript
   // In app.js
   const cors = require('cors');
   app.use(
     cors({
       origin: process.env.FRONTEND_URL,
       credentials: true,
       methods: ['GET', 'POST', 'PUT', 'DELETE'],
       allowedHeaders: ['Content-Type', 'Authorization'],
     })
   );
   ```

### Important (Should Do)

6. **Audit npm Packages**

   ```bash
   npm audit fix
   cd frontend && npm audit fix
   ```

7. **Implement Refresh Tokens**

   - Short-lived access tokens (15-30 min)
   - Long-lived refresh tokens (7 days)
   - Rotate refresh tokens on use

8. **Database Backups**

   - Automated daily backups
   - Store in secure location (AWS S3, Azure Blob)
   - Test restore process regularly

9. **Logging & Monitoring**

   - Consider Winston or Pino for production logging
   - Log to files or external service (Sentry, LogRocket)
   - Monitor error rates and performance

10. **Input Validation on All Routes**
    Apply validation middleware to:
    - ✅ Auth routes (completed)
    - ⏳ Transaction routes (receitas/despesas)
    - ⏳ Consultation routes
    - ⏳ Admin routes

## 🔍 Code Quality Improvements

### Completed

- ✅ Removed duplicate MEI pages (`/mei/receitas`, `/mei/despesas`, `/mei/dashboard`, `/mei/calendario`)
- ✅ Centralized to `/mei/[companyId]/` structure
- ✅ Removed excessive logging from auth flow
- ✅ Standardized error messages to English
- ✅ Created validation middleware
- ✅ Created logger utility

### Pending

- ⏳ Convert Portuguese variable/function names to English
- ⏳ Remove all console.log from controllers (use logger)
- ⏳ Add JSDoc comments to critical functions
- ⏳ Standardize error handling across all routes

## 📝 Database Model Names (Portuguese)

The following Prisma models use Portuguese names:

- `Receita` (Income/Revenue)
- `Despesa` (Expense)

**Note:** These are kept as-is to avoid complex migrations and potential data loss. The API and frontend use English where possible.

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Generate and set strong JWT_SECRET
- [ ] Configure production database
- [ ] Set up HTTPS/SSL certificates
- [ ] Install and configure Helmet.js
- [ ] Install and configure rate limiting
- [ ] Restrict CORS to production domain
- [ ] Run `npm audit fix` on both backend and frontend
- [ ] Set up database backups
- [ ] Configure error monitoring (Sentry)
- [ ] Set up logging to external service
- [ ] Test all authentication flows
- [ ] Test authorization (admin vs customer)
- [ ] Load test critical endpoints
- [ ] Verify email notifications work
- [ ] Update Stripe to production keys
- [ ] Document API endpoints
- [ ] Create runbook for common issues

## 🔐 Security Testing

### Manual Tests

1. **Authentication**

   - ✅ Cannot login with invalid credentials
   - ✅ Cannot access protected routes without token
   - ✅ Token expires after 7 days
   - ✅ Cannot use expired/invalid tokens

2. **Authorization**

   - ✅ MEI users can only access their own company data
   - ✅ Admin users can access any company data
   - ✅ Cannot bypass with URL manipulation

3. **Input Validation**
   - ✅ XSS attempts are sanitized
   - ⏳ SQL injection prevented by Prisma
   - ✅ Invalid email formats rejected
   - ✅ Invalid dates rejected

### Automated Testing

Consider adding:

- Unit tests for authentication
- Integration tests for API endpoints
- Security scanning (OWASP ZAP, Burp Suite)
- Dependency vulnerability scanning (Snyk)

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [Prisma Security Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## 🔄 Regular Maintenance

- Weekly: Check npm audit
- Monthly: Review access logs
- Quarterly: Security audit
- Yearly: Penetration testing
