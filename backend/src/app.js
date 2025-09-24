const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const companyRoutes = require('./routes/company');
const adminCompaniesRoutes = require('./routes/adminCompanies');
const adminSubscriptionsRoutes = require('./routes/adminSubscriptions');
const adminReportsRoutes = require('./routes/adminReports');
const adminSettingsRoutes = require('./routes/adminSettings');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/companies', adminCompaniesRoutes);
app.use('/api/admin/subscriptions', adminSubscriptionsRoutes);
app.use('/api/admin/reports', adminReportsRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/company', companyRoutes);

app.get('/', (req, res) => {
  res.send('PaimContab backend running!');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
