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


module.exports = router;
