'use client';'use client';

import { useState, useEffect } from 'react';import { useState, useEffect } from 'react';

import Link from 'next/link';import Link from 'next/link';

import { usePathname } from 'next/navigation';import { usePathname } from 'next/navigation';

import {import {

  HiOutlineHome,  HiOutlineHome,

  HiOutlineChartBarSquare,  HiOutlineChartBarSquare,

  HiOutlineUsers,  HiOutlineUsers,

  HiOutlineBuildingOffice2,  HiOutlineBuildingOffice2,

  HiOutlineCreditCard,  HiOutlineCreditCard,

  HiOutlineCog6Tooth,  HiOutlineCog6Tooth,

  HiOutlineDocumentText,  HiOutlineDocumentText,

  HiOutlineArrowRightOnRectangle,  HiOutlineArrowRightOnRectangle,

  HiChevronLeft,  HiChevronLeft,

  HiChevronRight,  HiChevronRight,

  HiOutlineUserCircle,  HiOutlineUserCircle,

  HiOutlineRectangleStack,  HiOutlineRectangleStack,

} from 'react-icons/hi2';} from 'react-icons/hi2';



interface AdminSidebarProps {interface AdminSidebarProps {

  currentPage?: string;  currentPage?: string;

  onToggle?: (collapsed: boolean) => void;}

}

export default function AdminSidebar({ currentPage = 'dashboard' }: AdminSidebarProps) {

export default function AdminSidebar({ currentPage = 'dashboard', onToggle }: AdminSidebarProps) {  const [isCollapsed, setIsCollapsed] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(false);  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);  const pathname = usePathname();

  const pathname = usePathname();

  // Criar contexto para o estado do sidebar

  const navigationItems = [  useEffect(() => {

    {    const handleResize = () => {

      name: 'Dashboard',      if (window.innerWidth < 1024) {

      href: '/admin/dashboard',        setIsCollapsed(true);

      icon: HiOutlineChartBarSquare,      }

      key: 'dashboard',    };

    },

    {    handleResize();

      name: 'Usuários',    window.addEventListener('resize', handleResize);

      href: '/admin/users',

      icon: HiOutlineUsers,    // Adicionar classe CSS global para o body

      key: 'users',    document.body.style.setProperty('--sidebar-width', isCollapsed ? '4rem' : '16rem');

    },

    {    return () => {

      name: 'Empresas',      window.removeEventListener('resize', handleResize);

      href: '/admin/companies',    };

      icon: HiOutlineBuildingOffice2,  }, [isCollapsed]);

      key: 'companies',

    },  const navigationItems = [

    {    {

      name: 'Dashboard MEI',      name: 'Dashboard',

      href: '/admin/mei-dashboards',      href: '/admin/dashboard',

      icon: HiOutlineRectangleStack,      icon: HiOutlineChartBarSquare,

      key: 'mei-dashboards',      key: 'dashboard',

    },    },

    {    {

      name: 'Assinaturas',      name: 'Usuários',

      href: '/admin/subscriptions',      href: '/admin/users',

      icon: HiOutlineCreditCard,      icon: HiOutlineUsers,

      key: 'subscriptions',      key: 'users',

    },    },

    {    {

      name: 'Relatórios',      name: 'Empresas',

      href: '/admin/reports',      href: '/admin/companies',

      icon: HiOutlineDocumentText,      icon: HiOutlineBuildingOffice2,

      key: 'reports',      key: 'companies',

    },    },

    {    {

      name: 'Configurações',      name: 'Dashboard MEI',

      href: '/admin/settings',      href: '/admin/mei-dashboards',

      icon: HiOutlineCog6Tooth,      icon: HiOutlineRectangleStack,

      key: 'settings',      key: 'mei-dashboards',

    },    },

  ];    {

      name: 'Assinaturas',

  useEffect(() => {      href: '/admin/subscriptions',

    const userData = localStorage.getItem('user');      icon: HiOutlineCreditCard,

    if (userData) {      key: 'subscriptions',

      try {    },

        const parsedUser = JSON.parse(userData);    {

        setUser(parsedUser);      name: 'Relatórios',

      } catch (error) {      href: '/admin/reports',

        console.error('Erro ao carregar dados do usuário:', error);      icon: HiOutlineDocumentText,

      }      key: 'reports',

    }    },

  }, []);    {

      name: 'Configurações',

  const handleToggle = () => {      href: '/admin/settings',

    setIsCollapsed(!isCollapsed);      icon: HiOutlineCog6Tooth,

    onToggle?.(!isCollapsed);      key: 'settings',

  };    },

  ];

  const handleLogout = () => {

    localStorage.removeItem('authToken');  useEffect(() => {

    localStorage.removeItem('user');    const userData = localStorage.getItem('user');

    window.location.href = '/Login';    if (userData) {

  };      try {

        const parsedUser = JSON.parse(userData);

  const getInitials = (name: string) => {        setUser(parsedUser);

    return name      } catch (error) {

      .split(' ')        console.error('Erro ao carregar dados do usuário:', error);

      .slice(0, 2)      }

      .map(word => word.charAt(0))    }

      .join('')  }, []);

      .toUpperCase();

  };  const handleLogout = () => {

    localStorage.removeItem('authToken');

  const isActive = (itemKey: string) => {    localStorage.removeItem('user');

    if (currentPage === itemKey) return true;    window.location.href = '/Login';

  };

    // Verifica se está na rota específica

    if (itemKey === 'dashboard' && pathname === '/admin/dashboard') return true;  const getInitials = (name: string) => {

    if (itemKey === 'users' && pathname?.startsWith('/admin/users')) return true;    return name

    if (itemKey === 'companies' && pathname?.startsWith('/admin/companies')) return true;      .split(' ')

    if (itemKey === 'mei-dashboards' && pathname?.startsWith('/admin/mei-dashboards')) return true;      .slice(0, 2)

    if (itemKey === 'subscriptions' && pathname?.startsWith('/admin/subscriptions')) return true;      .map(word => word.charAt(0))

    if (itemKey === 'reports' && pathname?.startsWith('/admin/reports')) return true;      .join('')

    if (itemKey === 'settings' && pathname?.startsWith('/admin/settings')) return true;      .toUpperCase();

  };

    return false;

  };  const isActive = (itemKey: string) => {

    if (currentPage === itemKey) return true;

  return (

    <div    // Verifica se está na rota específica

      className={`    if (itemKey === 'dashboard' && pathname === '/admin/dashboard') return true;

        fixed left-0 top-0 bg-white border-r border-gray-200 h-screen transition-all duration-300 ease-in-out flex flex-col z-50    if (itemKey === 'users' && pathname?.startsWith('/admin/users')) return true;

        ${isCollapsed ? 'w-16' : 'w-64'}    if (itemKey === 'companies' && pathname?.startsWith('/admin/companies')) return true;

      `}    if (itemKey === 'mei-dashboards' && pathname?.startsWith('/admin/mei-dashboards')) return true;

    >    if (itemKey === 'subscriptions' && pathname?.startsWith('/admin/subscriptions')) return true;

      {/* Logo/Header */}    if (itemKey === 'reports' && pathname?.startsWith('/admin/reports')) return true;

      <div className="p-6 border-b border-gray-100">    if (itemKey === 'settings' && pathname?.startsWith('/admin/settings')) return true;

        <div className="flex items-center justify-between">

          {!isCollapsed && (    return false;

            <div>  };

              <h1 className="text-xl font-bold text-gray-900">PaimContab</h1>

              <p className="text-sm text-gray-500 mt-0.5">Painel Administrativo</p>  return (

            </div>    <>

          )}      {/* Sidebar */}

          <button      <div

            onClick={handleToggle}        className={`

            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200"          fixed left-0 top-0 bg-white border-r border-gray-200 h-screen transition-all duration-300 ease-in-out flex flex-col z-50

            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}          ${isCollapsed ? 'w-16' : 'w-64'}

          >        `}

            {isCollapsed ? <HiChevronRight className="w-5 h-5" /> : <HiChevronLeft className="w-5 h-5" />}      >

          </button>        {/* Logo/Header */}

        </div>        <div className="p-6 border-b border-gray-100">

      </div>          <div className="flex items-center justify-between">

            {!isCollapsed && (

      {/* Navigation */}              <div>

      <nav className="flex-1 p-4 overflow-y-auto">                <h1 className="text-xl font-bold text-gray-900">PaimContab</h1>

        <div className="space-y-1">                <p className="text-sm text-gray-500 mt-0.5">Painel Administrativo</p>

          {navigationItems.map(item => {              </div>

            const Icon = item.icon;            )}

            const active = isActive(item.key);            <button

              onClick={() => setIsCollapsed(!isCollapsed)}

            return (              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200"

              <Link              title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}

                key={item.key}            >

                href={item.href}              {isCollapsed ? <HiChevronRight className="w-5 h-5" /> : <HiChevronLeft className="w-5 h-5" />}

                className={`            </button>

                  group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200          </div>

                  ${active ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}        </div>

                  ${isCollapsed ? 'justify-center' : ''}

                `}        {/* Navigation */}

                title={isCollapsed ? item.name : undefined}        <nav className="flex-1 p-4 overflow-y-auto">

              >          <div className="space-y-1">

                <Icon            {navigationItems.map(item => {

                  className={`              const Icon = item.icon;

                  w-5 h-5 flex-shrink-0 transition-colors duration-200              const active = isActive(item.key);

                  ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}

                `}              return (

                />                <Link

                {!isCollapsed && <span className="truncate">{item.name}</span>}                  key={item.key}

                {active && !isCollapsed && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>}                  href={item.href}

              </Link>                  className={`

            );                    group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200

          })}                    ${

        </div>                      active ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'

                    }

        {/* Quick Actions */}                    ${isCollapsed ? 'justify-center' : ''}

        <div className="mt-8 pt-6 border-t border-gray-100">                  `}

          <div className="space-y-1">                  title={isCollapsed ? item.name : undefined}

            <Link                >

              href="/"                  <Icon

              className={`                    className={`

                group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200                    w-5 h-5 flex-shrink-0 transition-colors duration-200

                ${isCollapsed ? 'justify-center' : ''}                    ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}

              `}                  `}

              title={isCollapsed ? 'Ir para Home' : undefined}                  />

            >                  {!isCollapsed && <span className="truncate">{item.name}</span>}

              <HiOutlineHome className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />                  {active && !isCollapsed && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>}

              {!isCollapsed && <span className="truncate">Ir para Home</span>}                </Link>

            </Link>              );

            })}

            <button          </div>

              onClick={handleLogout}

              className={`          {/* Quick Actions */}

                group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200          <div className="mt-8 pt-6 border-t border-gray-100">

                ${isCollapsed ? 'justify-center' : ''}            <div className="space-y-1">

              `}              <Link

              title={isCollapsed ? 'Sair' : undefined}                href="/"

            >                className={`

              <HiOutlineArrowRightOnRectangle className="w-5 h-5 flex-shrink-0" />                  group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200

              {!isCollapsed && <span className="truncate">Sair</span>}                  ${isCollapsed ? 'justify-center' : ''}

            </button>                `}

          </div>                title={isCollapsed ? 'Ir para Home' : undefined}

        </div>              >

      </nav>                <HiOutlineHome className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />

                {!isCollapsed && <span className="truncate">Ir para Home</span>}

      {/* User Info */}              </Link>

      <div className="p-4 border-t border-gray-100">

        {!isCollapsed ? (              <button

          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">                onClick={handleLogout}

            <div className="flex-shrink-0">                className={`

              {user?.name ? (                  group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200

                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center">                  ${isCollapsed ? 'justify-center' : ''}

                  <span className="text-sm font-semibold">{getInitials(user.name)}</span>                `}

                </div>                title={isCollapsed ? 'Sair' : undefined}

              ) : (              >

                <HiOutlineUserCircle className="w-10 h-10 text-gray-400" />                <HiOutlineArrowRightOnRectangle className="w-5 h-5 flex-shrink-0" />

              )}                {!isCollapsed && <span className="truncate">Sair</span>}

            </div>              </button>

            <div className="flex-1 min-w-0">            </div>

              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Administrador'}</p>          </div>

              <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@paimcontab.com'}</p>        </nav>

            </div>

          </div>        {/* User Info */}

        ) : (        <div className="p-4 border-t border-gray-100">

          <div className="flex justify-center">          {!isCollapsed ? (

            <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center">            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">

              <span className="text-sm font-semibold">{user?.name ? getInitials(user.name) : 'A'}</span>              <div className="flex-shrink-0">

            </div>                {user?.name ? (

          </div>                  <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center">

        )}                    <span className="text-sm font-semibold">{getInitials(user.name)}</span>

      </div>                  </div>

    </div>                ) : (

  );                  <HiOutlineUserCircle className="w-10 h-10 text-gray-400" />

}                )}
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

      {/* CSS para ajustar o conteúdo principal */}
      <style jsx global>{`
        body {
          --sidebar-width: ${isCollapsed ? '4rem' : '16rem'};
        }
        .admin-content {
          margin-left: var(--sidebar-width);
          transition: margin-left 0.3s ease-in-out;
        }
      `}</style>
    </>
  );
}

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
    if (itemKey === 'mei-dashboards' && pathname?.startsWith('/admin/mei-dashboards')) return true;
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
