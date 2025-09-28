'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HiOutlineHome,
  HiOutlineChartBarSquare,
  HiOutlineCurrencyDollar,
  HiOutlineReceiptRefund,
  HiOutlineCalculator,
  HiOutlineDocumentText,
  HiOutlineBell,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineUserCircle,
  HiOutlineCalendar,
  HiOutlineClipboardDocumentList,
  HiOutlineBuildingOffice2,
} from 'react-icons/hi2';

interface MeiSidebarProps {
  currentPage?: string;
  onToggle?: (collapsed: boolean) => void;
}

interface User {
  name: string;
  email: string;
}

interface Company {
  name: string;
  cnpj?: string;
}

export default function MeiSidebar({ currentPage = 'dashboard', onToggle }: MeiSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/mei/dashboard',
      icon: HiOutlineChartBarSquare,
      key: 'dashboard',
      description: 'Visão geral',
    },
    {
      name: 'Receitas',
      href: '/mei/receitas',
      icon: HiOutlineCurrencyDollar,
      key: 'receitas',
      description: 'Controle de receitas',
    },
    {
      name: 'Despesas',
      href: '/mei/despesas',
      icon: HiOutlineReceiptRefund,
      key: 'despesas',
      description: 'Controle de gastos',
    },
    {
      name: 'DAS e Impostos',
      href: '/mei/das',
      icon: HiOutlineCalculator,
      key: 'das',
      description: 'Impostos e obrigações',
    },
    {
      name: 'Relatórios',
      href: '/mei/relatorios',
      icon: HiOutlineClipboardDocumentList,
      key: 'relatorios',
      description: 'DRE e análises',
    },
    {
      name: 'Calendário',
      href: '/mei/calendario',
      icon: HiOutlineCalendar,
      key: 'calendario',
      description: 'Prazos e eventos',
    },
    {
      name: 'Clientes',
      href: '/mei/clientes',
      icon: HiOutlineUserCircle,
      key: 'clientes',
      description: 'Base de clientes',
    },
    {
      name: 'Notas Fiscais',
      href: '/mei/notas',
      icon: HiOutlineDocumentText,
      key: 'notas',
      description: 'Emissão de NFs',
    },
  ];

  const quickActions = [
    {
      name: 'Notificações',
      href: '/mei/notificacoes',
      icon: HiOutlineBell,
      key: 'notificacoes',
    },
    {
      name: 'Configurações',
      href: '/mei/configuracoes',
      icon: HiOutlineCog6Tooth,
      key: 'configuracoes',
    },
  ];

  useEffect(() => {
    const sidebarWidth = isCollapsed ? '4rem' : '18rem';
    document.documentElement.style.setProperty('--mei-sidebar-width', sidebarWidth);

    let styleElement = document.getElementById('mei-sidebar-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'mei-sidebar-styles';
      styleElement.textContent = `
        .mei-content-wrapper {
          margin-left: var(--mei-sidebar-width, 18rem);
          transition: margin-left 0.3s ease-in-out;
          min-height: 100vh;
        }
        @media (max-width: 768px) {
          .mei-content-wrapper {
            margin-left: 0;
          }
        }
      `;
      document.head.appendChild(styleElement);
    }

    onToggle?.(isCollapsed);
  }, [isCollapsed, onToggle]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    }

    // Simular dados da empresa - idealmente viria da API
    setCompany({
      name: 'Minha Empresa MEI',
      cnpj: '12.345.678/0001-90',
    });
  }, []);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/Login';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  const isActive = (itemKey: string) => {
    if (currentPage === itemKey) return true;
    if (pathname?.includes(`/mei/${itemKey}`)) return true;
    if (itemKey === 'dashboard' && pathname === '/mei/dashboard') return true;
    return false;
  };

  return (
    <div
      className={`
        fixed left-0 top-0 bg-gradient-to-b from-blue-900 to-blue-800 text-white h-screen transition-all duration-300 ease-in-out flex flex-col z-50 shadow-xl
        ${isCollapsed ? 'w-16' : 'w-72'}
      `}
    >
      {/* Header */}
      <div className="p-6 border-b border-blue-700/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <HiOutlineBuildingOffice2 className="w-6 h-6 text-blue-200" />
                <h1 className="text-xl font-bold">MEI Dashboard</h1>
              </div>
              <p className="text-blue-200 text-sm">{company?.name || 'Minha Empresa'}</p>
              {company?.cnpj && <p className="text-blue-300 text-xs mt-1">CNPJ: {company.cnpj}</p>}
            </div>
          )}
          <button
            onClick={handleToggle}
            className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-blue-700/50 transition-all duration-200"
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? <HiChevronRight className="w-5 h-5" /> : <HiChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.key);

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`
                  group flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative
                  ${
                    active
                      ? 'bg-white/20 text-white shadow-md backdrop-blur-sm'
                      : 'text-blue-100 hover:text-white hover:bg-white/10'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon
                  className={`
                    w-5 h-5 flex-shrink-0 transition-colors duration-200
                    ${active ? 'text-white' : 'text-blue-200 group-hover:text-white'}
                  `}
                />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{item.name}</div>
                    <div className="text-xs text-blue-200 truncate">{item.description}</div>
                  </div>
                )}
                {active && !isCollapsed && <div className="w-2 h-2 bg-white rounded-full"></div>}
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-blue-700/50">
          <div className="space-y-1">
            {quickActions.map(item => {
              const Icon = item.icon;
              const active = isActive(item.key);

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${active ? 'bg-white/20 text-white' : 'text-blue-100 hover:text-white hover:bg-white/10'}
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}

            <Link
              href="/"
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-white/10 transition-all duration-200
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? 'Voltar ao site' : undefined}
            >
              <HiOutlineHome className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Voltar ao site</span>}
            </Link>

            <button
              onClick={handleLogout}
              className={`
                group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-200 hover:text-red-100 hover:bg-red-500/20 transition-all duration-200
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? 'Sair' : undefined}
            >
              <HiOutlineArrowRightOnRectangle className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Sair</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-blue-700/50">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
            <div className="flex-shrink-0">
              {user?.name ? (
                <div className="w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold">{getInitials(user.name)}</span>
                </div>
              ) : (
                <HiOutlineUserCircle className="w-10 h-10 text-blue-200" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuário MEI'}</p>
              <p className="text-xs text-blue-200 truncate">{user?.email || 'mei@empresa.com'}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">{user?.name ? getInitials(user.name) : 'M'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
