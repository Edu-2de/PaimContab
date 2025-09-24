'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar';
import AdminProtection from '../../../components/AdminProtection';
import {
  HiCog6Tooth,
  HiShieldCheck,
  HiCurrencyDollar,
  HiServer,
  HiExclamationTriangle,
  HiCheckCircle,
} from 'react-icons/hi2';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  enableRegistration: boolean;
  enableEmailVerification: boolean;
  maxUsersPerCompany: number;
  defaultPlan: string;
  paymentProvider: string;
  emailProvider: string;
  backupFrequency: string;
  maintenanceMode: boolean;
}

export default function AdminSettingsPage() {
  return (
    <AdminProtection>
      <AdminSettingsContent />
    </AdminProtection>
  );
}

function AdminSettingsContent() {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: '',
    siteDescription: '',
    adminEmail: '',
    enableRegistration: true,
    enableEmailVerification: false,
    maxUsersPerCompany: 10,
    defaultPlan: 'basic',
    paymentProvider: 'stripe',
    emailProvider: 'sendgrid',
    backupFrequency: 'daily',
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      } else {
        throw new Error('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div>
        <AdminSidebar currentPage="settings" />
        <div className="ml-64 flex items-center justify-center bg-white min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminSidebar currentPage="settings" />

      <div className="ml-64 min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
              <p className="text-gray-600 mt-1">Gerencie as configurações globais da aplicação</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <HiCheckCircle className="w-4 h-4" />
              )}
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>

          {message && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <HiCheckCircle className="w-5 h-5" />
                ) : (
                  <HiExclamationTriangle className="w-5 h-5" />
                )}
                {message.text}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* General Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                <HiCog6Tooth className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Configurações Gerais</h2>
                <p className="text-sm text-gray-600">Informações básicas do sistema</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Sistema</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={e => handleInputChange('siteName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email do Administrador</label>
                <input
                  type="email"
                  value={settings.adminEmail}
                  onChange={e => handleInputChange('adminEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição do Sistema</label>
                <textarea
                  value={settings.siteDescription}
                  onChange={e => handleInputChange('siteDescription', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <HiShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Gerenciamento de Usuários</h2>
                <p className="text-sm text-gray-600">Configurações de registro e validação</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Permitir Registro Público</label>
                  <p className="text-sm text-gray-500">Usuários podem se registrar sem convite</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableRegistration}
                    onChange={e => handleInputChange('enableRegistration', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Verificação de Email</label>
                  <p className="text-sm text-gray-500">Requerer verificação de email para novos usuários</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableEmailVerification}
                    onChange={e => handleInputChange('enableEmailVerification', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Máximo de Usuários por Empresa</label>
                <input
                  type="number"
                  value={settings.maxUsersPerCompany}
                  onChange={e => handleInputChange('maxUsersPerCompany', parseInt(e.target.value))}
                  min="1"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <HiCurrencyDollar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Configurações de Pagamento</h2>
                <p className="text-sm text-gray-600">Provedores e planos padrão</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provedor de Pagamento</label>
                <select
                  value={settings.paymentProvider}
                  onChange={e => handleInputChange('paymentProvider', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none"
                >
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="mercadopago">Mercado Pago</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plano Padrão</label>
                <select
                  value={settings.defaultPlan}
                  onChange={e => handleInputChange('defaultPlan', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none"
                >
                  <option value="basic">Básico</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <HiServer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Configurações do Sistema</h2>
                <p className="text-sm text-gray-600">Email, backup e manutenção</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provedor de Email</label>
                <select
                  value={settings.emailProvider}
                  onChange={e => handleInputChange('emailProvider', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none"
                >
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="ses">Amazon SES</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequência de Backup</label>
                <select
                  value={settings.backupFrequency}
                  onChange={e => handleInputChange('backupFrequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none"
                >
                  <option value="hourly">A cada hora</option>
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Modo Manutenção</label>
                  <p className="text-sm text-gray-500">Desabilita o acesso público ao sistema</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={e => handleInputChange('maintenanceMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              {settings.maintenanceMode && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <HiExclamationTriangle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Modo de manutenção ativado. Usuários não conseguirão acessar o sistema.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
