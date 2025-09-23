const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const authenticateToken = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.post('/user/:userId', companyController.createCompany);
router.get('/user/:userId', authenticateToken, companyController.getCompanyByUser);
router.put('/:id', authenticateToken, companyController.updateCompany);
router.delete('/:id', authenticateToken, companyController.deleteCompany);

router.get('/', requireAdmin, companyController.getAllCompanies);
router.get('/search', requireAdmin, companyController.searchCompanies);

router.get('/stats', requireAdmin, companyController.getCompaniesStats);
router.get('/segments', requireAdmin, companyController.getCompaniesBySegment);

router.post('/validate-cnpj', authenticateToken, companyController.validateCNPJ);

router.patch('/bulk-update', requireAdmin, companyController.bulkUpdateCompanies);
router.patch('/:id/toggle-status', requireAdmin, companyController.toggleCompanyStatus);

module.exports = router;
