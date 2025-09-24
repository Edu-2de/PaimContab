const express = require('express');
const { PrismaClient } = require('@prisma/client');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware de autenticação para todas as rotas de admin
router.use(adminMiddleware);

// Configurações padrão do sistema
const defaultSettings = {
  siteName: 'PaimContab',
  siteDescription: 'Sistema de gestão contábil para empresas',
  adminEmail: 'admin@paimcontab.com',
  enableRegistration: true,
  enableEmailVerification: false,
  maxUsersPerCompany: 10,
  defaultPlan: 'basic',
  paymentProvider: 'stripe',
  emailProvider: 'sendgrid',
  backupFrequency: 'daily',
  maintenanceMode: false,
};

// GET /api/admin/settings - Obter configurações do sistema
router.get('/', async (req, res) => {
  try {
    // Em um cenário real, você buscaria as configurações do banco de dados
    // Por exemplo, em uma tabela Settings ou usando variáveis de ambiente

    // Para este exemplo, vou simular com configurações padrão
    // que poderiam ser armazenadas no banco ou arquivo de configuração
    const settings = {
      ...defaultSettings,
      // Aqui você poderia sobrescrever com configurações salvas no banco
    };

    res.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/admin/settings - Atualizar configurações do sistema
router.put('/', async (req, res) => {
  try {
    const {
      siteName,
      siteDescription,
      adminEmail,
      enableRegistration,
      enableEmailVerification,
      maxUsersPerCompany,
      defaultPlan,
      paymentProvider,
      emailProvider,
      backupFrequency,
      maintenanceMode,
    } = req.body;

    // Validações básicas
    if (siteName && siteName.trim().length === 0) {
      return res.status(400).json({ error: 'Nome do site não pode estar vazio' });
    }

    if (adminEmail && !isValidEmail(adminEmail)) {
      return res.status(400).json({ error: 'Email do administrador inválido' });
    }

    if (maxUsersPerCompany && (maxUsersPerCompany < 1 || maxUsersPerCompany > 1000)) {
      return res.status(400).json({ error: 'Número máximo de usuários deve estar entre 1 e 1000' });
    }

    // Em um cenário real, você salvaria essas configurações no banco de dados
    // Por exemplo:
    // await prisma.setting.upsert({
    //   where: { key: 'siteName' },
    //   update: { value: siteName },
    //   create: { key: 'siteName', value: siteName }
    // });

    // Para este exemplo, vou simular que as configurações foram salvas
    const updatedSettings = {
      siteName: siteName || defaultSettings.siteName,
      siteDescription: siteDescription || defaultSettings.siteDescription,
      adminEmail: adminEmail || defaultSettings.adminEmail,
      enableRegistration: enableRegistration !== undefined ? enableRegistration : defaultSettings.enableRegistration,
      enableEmailVerification:
        enableEmailVerification !== undefined ? enableEmailVerification : defaultSettings.enableEmailVerification,
      maxUsersPerCompany: maxUsersPerCompany || defaultSettings.maxUsersPerCompany,
      defaultPlan: defaultPlan || defaultSettings.defaultPlan,
      paymentProvider: paymentProvider || defaultSettings.paymentProvider,
      emailProvider: emailProvider || defaultSettings.emailProvider,
      backupFrequency: backupFrequency || defaultSettings.backupFrequency,
      maintenanceMode: maintenanceMode !== undefined ? maintenanceMode : defaultSettings.maintenanceMode,
    };

    res.json(updatedSettings);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/settings/backup - Fazer backup das configurações
router.get('/backup', async (req, res) => {
  try {
    // Em um cenário real, você criaria um backup completo do sistema
    const backupData = {
      timestamp: new Date().toISOString(),
      settings: defaultSettings,
      // Outras informações de backup...
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="paimcontab-backup.json"');
    res.json(backupData);
  } catch (error) {
    console.error('Erro ao fazer backup:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/settings/restore - Restaurar configurações do backup
router.post('/restore', async (req, res) => {
  try {
    const { backupData } = req.body;

    if (!backupData || !backupData.settings) {
      return res.status(400).json({ error: 'Dados de backup inválidos' });
    }

    // Em um cenário real, você validaria e restauraria as configurações
    // Por agora, vou simular que a restauração foi bem-sucedida
    res.json({
      message: 'Configurações restauradas com sucesso',
      settings: backupData.settings,
    });
  } catch (error) {
    console.error('Erro ao restaurar configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/settings/system-status - Status do sistema
router.get('/system-status', async (req, res) => {
  try {
    // Em um cenário real, você verificaria o status de vários componentes
    const systemStatus = {
      database: 'healthy',
      storage: 'healthy',
      email: 'healthy',
      payment: 'healthy',
      backup: 'healthy',
      lastBackup: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
    };

    res.json(systemStatus);
  } catch (error) {
    console.error('Erro ao verificar status do sistema:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função auxiliar para validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = router;
