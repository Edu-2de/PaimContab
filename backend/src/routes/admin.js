const express = require('express');
const requireAdmin = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');
const router = express.Router();

// Dashboard
router.get('/dashboard', requireAdmin, adminController.getDashboard);

// Usuários
router.get('/users', requireAdmin, adminController.getAllUsers);
router.get('/users/:userId', requireAdmin, adminController.getUserDetails);
router.patch('/users/:userId/status', requireAdmin, adminController.updateUserStatus);
router.put('/users/:userId', requireAdmin, adminController.updateUser);
router.delete('/users/:userId', requireAdmin, adminController.deleteUser);

// Empresa do usuário
router.put('/users/:userId/company', requireAdmin, adminController.updateUserCompany);

// Status de assinatura de usuário específico (para administradores)
router.get('/subscription/status/:userId', requireAdmin, adminController.getUserSubscriptionStatus);

module.exports = router;
