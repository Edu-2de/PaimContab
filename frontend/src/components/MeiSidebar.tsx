'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HiOutlineChartBarSquare,
  HiOutlineCurrencyDollar,
  HiOutlineReceiptRefund,
  HiOutlineCalculator,
  HiOutlineDocumentText,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineUserCircle,
  HiOutlineCalendar,
  HiOutlineClipboardDocumentList,
  HiOutlineBuildingOffice2,
  HiOutlineUsers,
  HiOutlineTableCells,
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/mei/dashboard',
      icon: HiOutlineChartBarSquare,
      key: 'dashboard',
    },
    {
      name: 'Receitas',
      href: '/mei/receitas',
      icon: HiOutlineCurrencyDollar,
      key: 'receitas',
    },
    {
      name: 'Despesas',
      href: '/mei/despesas',
      icon: HiOutlineReceiptRefund,
      key: 'despesas',
    },
    {
      name: 'DAS',
      href: '/mei/das',
      icon: HiOutlineCalculator,
      key: 'das',
    },
    {
      name: 'Planilha',
      href: '/mei/planilha',
      icon: HiOutlineTableCells,
      key: 'planilha',
    },
    {
      name: 'Relatórios',
      href: '/mei/relatorios',
      icon: HiOutlineClipboardDocumentList,
      key: 'relatorios',
    },
    {
      name: 'Calendário',
      href: '/mei/calendario',
      icon: HiOutlineCalendar,
      key: 'calendario',
    },
    {
      name: 'Clientes',
      href: '/mei/clientes',
      icon: HiOutlineUsers,
      key: 'clientes',
    },
    {
      name: 'Notas Fiscais',
      href: '/mei/notas',
      icon: HiOutlineDocumentText,
      key: 'notas',
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

    // Para dashboard, verifica se é exatamente /mei/dashboard
    if (itemKey === 'dashboard') {
      return pathname === '/mei/dashboard';
    }

    // Para outras páginas, verifica se o pathname começa com /mei/{itemKey}
    // mas não é apenas uma substring (evita conflitos como "das" sendo encontrado em "dashboard")
    const expectedPath = `/mei/${itemKey}`;
    return pathname === expectedPath || pathname.startsWith(expectedPath + '/');
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
