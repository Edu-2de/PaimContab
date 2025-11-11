'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HiOutlineChartBarSquare,
  HiOutlineCurrencyDollar,
  HiOutlineReceiptRefund,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineUserCircle,
  HiOutlineCalendar,
  HiOutlineBuildingOffice2,
  HiOutlineTableCells,
  HiLockClosed,
} from 'react-icons/hi2';

interface MeiSidebarProps {
  currentPage?: string;
  onToggle?: (collapsed: boolean) => void;
  companyId?: string;
}

interface User {
  name: string;
  email: string;
  role?: string;
}

interface Company {
  name: string;
  cnpj?: string;
}

export default function MeiSidebar({ currentPage = 'dashboard', onToggle, companyId }: MeiSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hasCalendarAccess, setHasCalendarAccess] = useState(false);
  const pathname = usePathname();

  // Obter companyId do usuário se não for passado como prop
  const effectiveCompanyId =
    companyId ||
    (() => {
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          return user.companyId;
        }
      }
      return null;
    })();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: `/mei/${effectiveCompanyId}/dashboard`,
      icon: HiOutlineChartBarSquare,
      key: 'dashboard',
    },
    {
      name: 'Receitas',
      href: `/mei/${effectiveCompanyId}/receitas`,
      icon: HiOutlineCurrencyDollar,
      key: 'receitas',
    },
    {
      name: 'Despesas',
      href: `/mei/${effectiveCompanyId}/despesas`,
      icon: HiOutlineReceiptRefund,
      key: 'despesas',
    },
    {
      name: 'Planilha',
      href: `/mei/${effectiveCompanyId}/planilha`,
      icon: HiOutlineTableCells,
      key: 'planilha',
    },
    {
      name: 'Calendário',
      href: `/mei/${effectiveCompanyId}/calendario`,
      icon: HiOutlineCalendar,
      key: 'calendario',
    },
  ];

  useEffect(() => {
    const sidebarWidth = isCollapsed ? '4rem' : '15rem';
    document.documentElement.style.setProperty('--mei-sidebar-width', sidebarWidth);

    let styleElement = document.getElementById('mei-sidebar-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'mei-sidebar-styles';
      styleElement.textContent = `
        .mei-content-wrapper {
          margin-left: var(--mei-sidebar-width, 15rem);
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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

    setCompany({
      name: 'Minha Empresa MEI',
      cnpj: '12.345.678/0001-90',
    });

    // Verificar assinatura e acesso ao calendário
    const checkCalendarAccess = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');

        if (!token || !userData) return;

        const userObj = JSON.parse(userData);

        // Admin sempre tem acesso
        if (userObj.role === 'admin') {
          setHasCalendarAccess(true);
          return;
        }

        // Buscar dados da assinatura
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/subscription`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const subscriptionData = await response.json();

          // Apenas planos Profissional e Premium têm acesso ao calendário
          const planName = subscriptionData?.plan?.name?.toLowerCase() || '';
          const hasAccess =
            subscriptionData?.isActive && (planName.includes('profissional') || planName.includes('premium'));

          setHasCalendarAccess(hasAccess);
        } else {
          setHasCalendarAccess(false);
        }
      } catch (error) {
        console.error('Erro ao verificar acesso ao calendário:', error);
        setHasCalendarAccess(false);
      }
    };

    checkCalendarAccess();
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

  // Função corrigida para detecção da página ativa
  const isActive = (itemKey: string) => {
    // Prioriza o currentPage se for fornecido
    if (currentPage && currentPage === itemKey) return true;

    // Caso contrário, usa o pathname para detecção exata
    if (!pathname) return false;

    // Para dashboard, verifica se é /mei/{companyId}/dashboard
    if (itemKey === 'dashboard') {
      return pathname.includes('/mei/') && pathname.endsWith('/dashboard');
    }

    // Para outras páginas, verifica se o pathname contém /mei/{companyId}/{itemKey}
    const expectedPattern = `/mei/${effectiveCompanyId}/${itemKey}`;
    return pathname === expectedPattern || pathname.startsWith(expectedPattern + '/');
  };

  return (
    <div
      className={`
        fixed left-0 top-0 bg-gray-800 h-screen transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col z-50
        ${isCollapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Header */}
      <div className="px-5 py-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <HiOutlineBuildingOffice2 className="w-5 h-5 text-gray-800" />
                </div>
                <h1 className="text-lg font-semibold text-white">MEI Manager</h1>
              </div>
              <p className="text-sm text-gray-300 font-medium">{company?.name || 'Minha Empresa'}</p>
              {company?.cnpj && <p className="text-xs text-gray-400 mt-1">CNPJ: {company.cnpj}</p>}
            </div>
          )}
          <button
            onClick={handleToggle}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200"
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? <HiChevronRight className="w-4 h-4" /> : <HiChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.key);
            const isCalendar = item.key === 'calendario';
            const isLocked = isCalendar && !hasCalendarAccess;

            // Se estiver bloqueado, renderiza um div ao invés de Link
            if (isLocked) {
              return (
                <div
                  key={item.key}
                  onMouseEnter={() => setHoveredItem(item.key)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`
                    group flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative cursor-not-allowed opacity-50
                    ${isCollapsed ? 'justify-center' : ''}
                    text-gray-400
                  `}
                  title={isCollapsed ? `${item.name} - Apenas para planos Profissional e Premium` : undefined}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5 flex-shrink-0 text-gray-500" />
                    <HiLockClosed className="w-3 h-3 absolute -bottom-1 -right-1 text-red-400 bg-gray-800 rounded-full" />
                  </div>
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1">
                      <span className="text-sm font-medium truncate text-gray-500">{item.name}</span>
                      <HiLockClosed className="w-4 h-4 text-red-400 flex-shrink-0" />
                    </div>
                  )}
                  {!isCollapsed && hoveredItem === item.key && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg border border-gray-700">
                      <div className="font-semibold mb-1">🔒 Recurso Bloqueado</div>
                      <div>Disponível nos planos:</div>
                      <div className="text-yellow-400">• Profissional</div>
                      <div className="text-yellow-400">• Premium</div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.key}
                href={item.href}
                onMouseEnter={() => setHoveredItem(item.key)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`
                  group flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative
                  ${isCollapsed ? 'justify-center' : ''}
                  ${active ? 'bg-white text-gray-800' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
                  ${hoveredItem === item.key && !active ? 'bg-gray-700' : ''}
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon
                  className={`
                    w-5 h-5 flex-shrink-0 transition-all duration-200
                    ${active ? 'text-gray-800' : 'text-gray-300'}
                    ${hoveredItem === item.key && !active ? 'text-white scale-110' : ''}
                    ${active ? 'scale-110' : ''}
                  `}
                />
                {!isCollapsed && (
                  <span className={`text-sm font-medium truncate ${active ? 'text-gray-800' : 'text-gray-300'}`}>
                    {item.name}
                  </span>
                )}
                {active && !isCollapsed && <div className="absolute right-3 w-2 h-2 bg-gray-800 rounded-full"></div>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Settings and Logout */}
      <div className="px-3 py-4 border-t border-gray-700">
        <div className="space-y-1">
          <Link
            href="/mei/configuracoes"
            onMouseEnter={() => setHoveredItem('configuracoes')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`
              group flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-all duration-200
              ${isCollapsed ? 'justify-center' : ''}
              ${hoveredItem === 'configuracoes' ? 'bg-gray-700' : ''}
            `}
            title={isCollapsed ? 'Configurações' : undefined}
          >
            <HiOutlineCog6Tooth
              className={`
                w-5 h-5 flex-shrink-0 text-gray-300 transition-all duration-200
                ${hoveredItem === 'configuracoes' ? 'text-white scale-110' : ''}
              `}
            />
            {!isCollapsed && <span className="text-sm font-medium truncate">Configurações</span>}
          </Link>

          <button
            onClick={handleLogout}
            onMouseEnter={() => setHoveredItem('logout')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`
              group w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all duration-200
              ${isCollapsed ? 'justify-center' : ''}
              ${hoveredItem === 'logout' ? 'bg-red-900/20' : ''}
            `}
            title={isCollapsed ? 'Sair' : undefined}
          >
            <HiOutlineArrowRightOnRectangle
              className={`
                w-5 h-5 flex-shrink-0 transition-all duration-200
                ${hoveredItem === 'logout' ? 'scale-110' : ''}
              `}
            />
            {!isCollapsed && <span className="text-sm font-medium truncate">Sair</span>}
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="px-3 pb-4">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-700 border border-gray-600">
            <div className="flex-shrink-0">
              {user?.name ? (
                <div className="w-9 h-9 bg-white text-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold">{getInitials(user.name)}</span>
                </div>
              ) : (
                <HiOutlineUserCircle className="w-9 h-9 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Usuário MEI'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || 'mei@empresa.com'}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-9 h-9 bg-white text-gray-800 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold">{user?.name ? getInitials(user.name) : 'M'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
