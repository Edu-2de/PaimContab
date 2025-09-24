'use client';
import { useState } from 'react';
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
  HiChevronRight
} from 'react-icons/hi2';

interface AdminSidebarProps {
  currentPage?: string;
}

export default function AdminSidebar({ currentPage = 'dashboard' }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: HiOutlineChartBarSquare,
      key: 'dashboard'
    },
    {
      name: 'Usuários',
      href: '/admin/users',
      icon: HiOutlineUsers,
      key: 'users'
    },
    {
      name: 'Empresas',
      href: '/admin/companies',
      icon: HiOutlineBuildingOffice2,
      key: 'companies'
    },
    {
      name: 'Assinaturas',
      href: '/admin/subscriptions',
      icon: HiOutlineCreditCard,
      key: 'subscriptions'
    },
    {
      name: 'Relatórios',
      href: '/admin/reports',
      icon: HiOutlineDocumentText,
      key: 'reports'
    },
    {
      name: 'Configurações',
      href: '/admin/settings',
      icon: HiOutlineCog6Tooth,
      key: 'settings'
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/Login';
  };

  return (
    <div className={`
      bg-gray-900 text-white min-h-screen transition-all duration-300 relative
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Logo/Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold">PaimContab</h1>
              <p className="text-sm text-gray-400">Painel Admin</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {isCollapsed ? (
              <HiChevronRight className="w-5 h-5" />
            ) : (
              <HiChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 flex-1">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.key;
            
            return (
              <a
                key={item.key}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </a>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-4"></div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <HiOutlineHome className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Ir para Home</span>}
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-300 hover:bg-red-900/20 hover:text-red-200 transition-colors"
          >
            <HiOutlineArrowRightOnRectangle className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </nav>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin</p>
              <p className="text-xs text-gray-400 truncate">Administrador</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}