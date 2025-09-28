'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HiOutlineHome,
  HiOutlineChartBarSquare,
  HiOutlineUsers,
  HiOutlineBuildingOffice2,
  HiOutlineCreditCard,
  HiOutlineCog6Tooth,
  HiOutlineDocumentText,
  HiOutlineArrowRightOnRectangle,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineUserCircle,
  HiOutlineRectangleStack,
} from 'react-icons/hi2';

interface AdminSidebarProps {
  currentPage?: string;
}

export default function AdminSidebar({ currentPage = 'dashboard' }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: HiOutlineChartBarSquare,
      key: 'dashboard',
    },
    {
      name: 'Usuários',
      href: '/admin/users',
      icon: HiOutlineUsers,
      key: 'users',
    },
    {
      name: 'Empresas',
      href: '/admin/companies',
      icon: HiOutlineBuildingOffice2,
      key: 'companies',
    },
    {
      name: 'Dashboard MEI',
      href: '/admin/mei-dashboards',
      icon: HiOutlineRectangleStack,
      key: 'mei-dashboards',
    },
    {
      name: 'Assinaturas',
      href: '/admin/subscriptions',
      icon: HiOutlineCreditCard,
      key: 'subscriptions',
    },
    {
      name: 'Relatórios',
      href: '/admin/reports',
      icon: HiOutlineDocumentText,
      key: 'reports',
    },
    {
      name: 'Configurações',
      href: '/admin/settings',
      icon: HiOutlineCog6Tooth,
      key: 'settings',
    },
  ];

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
  }, []);

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

    // Verifica se está na rota específica
    if (itemKey === 'dashboard' && pathname === '/admin/dashboard') return true;
    if (itemKey === 'users' && pathname?.startsWith('/admin/users')) return true;
    if (itemKey === 'companies' && pathname?.startsWith('/admin/companies')) return true;
    if (itemKey === 'subscriptions' && pathname?.startsWith('/admin/subscriptions')) return true;
    if (itemKey === 'reports' && pathname?.startsWith('/admin/reports')) return true;
    if (itemKey === 'settings' && pathname?.startsWith('/admin/settings')) return true;

    return false;
  };

  return (
    <div
      className={`
      fixed left-0 top-0 bg-white border-r border-gray-200 h-screen transition-all duration-300 ease-in-out flex flex-col z-50
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}
    >
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-900">PaimContab</h1>
              <p className="text-sm text-gray-500 mt-0.5">Painel Administrativo</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200"
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
                  group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${active ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon
                  className={`
                  w-5 h-5 flex-shrink-0 transition-colors duration-200
                  ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}
                `}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
                {active && !isCollapsed && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>}
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="space-y-1">
            <Link
              href="/"
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? 'Ir para Home' : undefined}
            >
              <HiOutlineHome className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
              {!isCollapsed && <span className="truncate">Ir para Home</span>}
            </Link>

            <button
              onClick={handleLogout}
              className={`
                group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200
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
      <div className="p-4 border-t border-gray-100">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div className="flex-shrink-0">
              {user?.name ? (
                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold">{getInitials(user.name)}</span>
                </div>
              ) : (
                <HiOutlineUserCircle className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Administrador'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@paimcontab.com'}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">{user?.name ? getInitials(user.name) : 'A'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
