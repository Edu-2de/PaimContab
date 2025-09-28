'use client';'use client';'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';import { useState, useEffect } from 'react';import { useState, useEffect } from 'react';

import { usePathname } from 'next/navigation';

import {import Link from 'next/link';import Link from 'next/link';

  HiOutlineHome,

  HiOutlineChartBarSquare,import { usePathname } from 'next/navigation';import { usePathname } from 'next/navigation';

  HiOutlineUsers,

  HiOutlineBuildingOffice2,import {import {

  HiOutlineCreditCard,

  HiOutlineCog6Tooth,  HiOutlineHome,  HiOutlineHome,

  HiOutlineDocumentText,

  HiOutlineArrowRightOnRectangle,  HiOutlineChartBarSquare,  HiOutlineChartBarSquare,

  HiChevronLeft,

  HiChevronRight,  HiOutlineUsers,  HiOutlineUsers,

  HiOutlineUserCircle,

  HiOutlineRectangleStack,  HiOutlineBuildingOffice2,  HiOutlineBuildingOffice2,

} from 'react-icons/hi2';

  HiOutlineCreditCard,  HiOutlineCreditCard,

interface AdminSidebarProps {

  currentPage?: string;  HiOutlineCog6Tooth,  HiOutlineCog6Tooth,

  onToggle?: (collapsed: boolean) => void;

}  HiOutlineDocumentText,  HiOutlineDocumentText,



export default function AdminSidebar({ currentPage = 'dashboard', onToggle }: AdminSidebarProps) {  HiOutlineArrowRightOnRectangle,  HiOutlineArrowRightOnRectangle,

  const [isCollapsed, setIsCollapsed] = useState(false);

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);  HiChevronLeft,  HiChevronLeft,

  const pathname = usePathname();

  HiChevronRight,  HiChevronRight,

  const navigationItems = [

    {  HiOutlineUserCircle,  HiOutlineUserCircle,

      name: 'Dashboard',

      href: '/admin/dashboard',  HiOutlineRectangleStack,  HiOutlineRectangleStack,

      icon: HiOutlineChartBarSquare,

      key: 'dashboard',} from 'react-icons/hi2';} from 'react-icons/hi2';

    },

    {

      name: 'Usuários',

      href: '/admin/users',interface AdminSidebarProps {interface AdminSidebarProps {

      icon: HiOutlineUsers,

      key: 'users',  currentPage?: string;  currentPage?: string;

    },

    {  onToggle?: (collapsed: boolean) => void;}

      name: 'Empresas',

      href: '/admin/companies',}

      icon: HiOutlineBuildingOffice2,

      key: 'companies',export default function AdminSidebar({ currentPage = 'dashboard' }: AdminSidebarProps) {

    },

    {export default function AdminSidebar({ currentPage = 'dashboard', onToggle }: AdminSidebarProps) {  const [isCollapsed, setIsCollapsed] = useState(false);

      name: 'Dashboard MEI',

      href: '/admin/mei-dashboards',  const [isCollapsed, setIsCollapsed] = useState(false);  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

      icon: HiOutlineRectangleStack,

      key: 'mei-dashboards',  const [user, setUser] = useState<{ name: string; email: string } | null>(null);  const pathname = usePathname();

    },

    {  const pathname = usePathname();

      name: 'Assinaturas',

      href: '/admin/subscriptions',  // Criar contexto para o estado do sidebar

      icon: HiOutlineCreditCard,

      key: 'subscriptions',  const navigationItems = [  useEffect(() => {

    },

    {    {    const handleResize = () => {

      name: 'Relatórios',

      href: '/admin/reports',      name: 'Dashboard',      if (window.innerWidth < 1024) {

      icon: HiOutlineDocumentText,

      key: 'reports',      href: '/admin/dashboard',        setIsCollapsed(true);

    },

    {      icon: HiOutlineChartBarSquare,      }

      name: 'Configurações',

      href: '/admin/settings',      key: 'dashboard',    };

      icon: HiOutlineCog6Tooth,

      key: 'settings',    },

    },

  ];    {    handleResize();



  // Define o CSS customizado para o layout responsivo      name: 'Usuários',    window.addEventListener('resize', handleResize);

  useEffect(() => {

    const sidebarWidth = isCollapsed ? '4rem' : '16rem';      href: '/admin/users',

    document.documentElement.style.setProperty('--admin-sidebar-width', sidebarWidth);

          icon: HiOutlineUsers,    // Adicionar classe CSS global para o body

    // Adiciona o CSS se ainda não foi adicionado

    let styleElement = document.getElementById('admin-sidebar-styles');      key: 'users',    document.body.style.setProperty('--sidebar-width', isCollapsed ? '4rem' : '16rem');

    if (!styleElement) {

      styleElement = document.createElement('style');    },

      styleElement.id = 'admin-sidebar-styles';

      styleElement.textContent = `    {    return () => {

        .admin-content-wrapper {

          margin-left: var(--admin-sidebar-width, 16rem);      name: 'Empresas',      window.removeEventListener('resize', handleResize);

          transition: margin-left 0.3s ease-in-out;

          min-height: 100vh;      href: '/admin/companies',    };

        }

        @media (max-width: 768px) {      icon: HiOutlineBuildingOffice2,  }, [isCollapsed]);

          .admin-content-wrapper {

            margin-left: 0;      key: 'companies',

          }

        }    },  const navigationItems = [

      `;

      document.head.appendChild(styleElement);    {    {

    }

      name: 'Dashboard MEI',      name: 'Dashboard',

    // Chama o callback de toggle se fornecido

    onToggle?.(isCollapsed);      href: '/admin/mei-dashboards',      href: '/admin/dashboard',

  }, [isCollapsed, onToggle]);

      icon: HiOutlineRectangleStack,      icon: HiOutlineChartBarSquare,

  useEffect(() => {

    const userData = localStorage.getItem('user');      key: 'mei-dashboards',      key: 'dashboard',

    if (userData) {

      try {    },    },

        const parsedUser = JSON.parse(userData);

        setUser(parsedUser);    {    {

      } catch (error) {

        console.error('Erro ao carregar dados do usuário:', error);      name: 'Assinaturas',      name: 'Usuários',

      }

    }      href: '/admin/subscriptions',      href: '/admin/users',

  }, []);

      icon: HiOutlineCreditCard,      icon: HiOutlineUsers,

  const handleToggle = () => {

    setIsCollapsed(!isCollapsed);      key: 'subscriptions',      key: 'users',

  };

    },    },

  const handleLogout = () => {

    localStorage.removeItem('authToken');    {    {

    localStorage.removeItem('user');

    window.location.href = '/Login';      name: 'Relatórios',      name: 'Empresas',

  };

      href: '/admin/reports',      href: '/admin/companies',

  const getInitials = (name: string) => {

    return name      icon: HiOutlineDocumentText,      icon: HiOutlineBuildingOffice2,

      .split(' ')

      .slice(0, 2)      key: 'reports',      key: 'companies',

      .map(word => word.charAt(0))

      .join('')    },    },

      .toUpperCase();

  };    {    {



  const isActive = (itemKey: string) => {      name: 'Configurações',      name: 'Dashboard MEI',

    if (currentPage === itemKey) return true;

      href: '/admin/settings',      href: '/admin/mei-dashboards',

    // Verifica se está na rota específica

    if (itemKey === 'dashboard' && pathname === '/admin/dashboard') return true;      icon: HiOutlineCog6Tooth,      icon: HiOutlineRectangleStack,

    if (itemKey === 'users' && pathname?.startsWith('/admin/users')) return true;

    if (itemKey === 'companies' && pathname?.startsWith('/admin/companies')) return true;      key: 'settings',      key: 'mei-dashboards',

    if (itemKey === 'mei-dashboards' && pathname?.startsWith('/admin/mei-dashboards')) return true;

    if (itemKey === 'subscriptions' && pathname?.startsWith('/admin/subscriptions')) return true;    },    },

    if (itemKey === 'reports' && pathname?.startsWith('/admin/reports')) return true;

    if (itemKey === 'settings' && pathname?.startsWith('/admin/settings')) return true;  ];    {



    return false;      name: 'Assinaturas',

  };

  useEffect(() => {      href: '/admin/subscriptions',

  return (

    <div    const userData = localStorage.getItem('user');      icon: HiOutlineCreditCard,

      className={`

        fixed left-0 top-0 bg-white border-r border-gray-200 h-screen transition-all duration-300 ease-in-out flex flex-col z-50    if (userData) {      key: 'subscriptions',

        ${isCollapsed ? 'w-16' : 'w-64'}

      `}      try {    },

    >

      {/* Logo/Header */}        const parsedUser = JSON.parse(userData);    {

      <div className="p-6 border-b border-gray-100">

        <div className="flex items-center justify-between">        setUser(parsedUser);      name: 'Relatórios',

          {!isCollapsed && (

            <div>      } catch (error) {      href: '/admin/reports',

              <h1 className="text-xl font-bold text-gray-900">PaimContab</h1>

              <p className="text-sm text-gray-500 mt-0.5">Painel Administrativo</p>        console.error('Erro ao carregar dados do usuário:', error);      icon: HiOutlineDocumentText,

            </div>

          )}      }      key: 'reports',

          <button

            onClick={handleToggle}    }    },

            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200"

            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}  }, []);    {

          >

            {isCollapsed ? <HiChevronRight className="w-5 h-5" /> : <HiChevronLeft className="w-5 h-5" />}      name: 'Configurações',

          </button>

        </div>  const handleToggle = () => {      href: '/admin/settings',

      </div>

    setIsCollapsed(!isCollapsed);      icon: HiOutlineCog6Tooth,

      {/* Navigation */}

      <nav className="flex-1 p-4 overflow-y-auto">    onToggle?.(!isCollapsed);      key: 'settings',

        <div className="space-y-1">

          {navigationItems.map(item => {  };    },

            const Icon = item.icon;

            const active = isActive(item.key);  ];



            return (  const handleLogout = () => {

              <Link

                key={item.key}    localStorage.removeItem('authToken');  useEffect(() => {

                href={item.href}

                className={`    localStorage.removeItem('user');    const userData = localStorage.getItem('user');

                  group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200

                  ${active ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}    window.location.href = '/Login';    if (userData) {

                  ${isCollapsed ? 'justify-center' : ''}

                `}  };      try {

                title={isCollapsed ? item.name : undefined}

              >        const parsedUser = JSON.parse(userData);

                <Icon

                  className={`  const getInitials = (name: string) => {        setUser(parsedUser);

                  w-5 h-5 flex-shrink-0 transition-colors duration-200

                  ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}    return name      } catch (error) {

                `}

                />      .split(' ')        console.error('Erro ao carregar dados do usuário:', error);

                {!isCollapsed && <span className="truncate">{item.name}</span>}

                {active && !isCollapsed && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>}      .slice(0, 2)      }

              </Link>

            );      .map(word => word.charAt(0))    }

          })}

        </div>      .join('')  }, []);



        {/* Quick Actions */}      .toUpperCase();

        <div className="mt-8 pt-6 border-t border-gray-100">

          <div className="space-y-1">  };  const handleLogout = () => {

            <Link

              href="/"    localStorage.removeItem('authToken');

              className={`

                group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200  const isActive = (itemKey: string) => {    localStorage.removeItem('user');

                ${isCollapsed ? 'justify-center' : ''}

              `}    if (currentPage === itemKey) return true;    window.location.href = '/Login';

              title={isCollapsed ? 'Ir para Home' : undefined}

            >  };

              <HiOutlineHome className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />

              {!isCollapsed && <span className="truncate">Ir para Home</span>}    // Verifica se está na rota específica

            </Link>

    if (itemKey === 'dashboard' && pathname === '/admin/dashboard') return true;  const getInitials = (name: string) => {

            <button

              onClick={handleLogout}    if (itemKey === 'users' && pathname?.startsWith('/admin/users')) return true;    return name

              className={`

                group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200    if (itemKey === 'companies' && pathname?.startsWith('/admin/companies')) return true;      .split(' ')

                ${isCollapsed ? 'justify-center' : ''}

              `}    if (itemKey === 'mei-dashboards' && pathname?.startsWith('/admin/mei-dashboards')) return true;      .slice(0, 2)

              title={isCollapsed ? 'Sair' : undefined}

            >    if (itemKey === 'subscriptions' && pathname?.startsWith('/admin/subscriptions')) return true;      .map(word => word.charAt(0))

              <HiOutlineArrowRightOnRectangle className="w-5 h-5 flex-shrink-0" />

              {!isCollapsed && <span className="truncate">Sair</span>}    if (itemKey === 'reports' && pathname?.startsWith('/admin/reports')) return true;      .join('')

            </button>

          </div>    if (itemKey === 'settings' && pathname?.startsWith('/admin/settings')) return true;      .toUpperCase();

        </div>

      </nav>  };



      {/* User Info */}    return false;

      <div className="p-4 border-t border-gray-100">

        {!isCollapsed ? (  };  const isActive = (itemKey: string) => {

          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">

            <div className="flex-shrink-0">    if (currentPage === itemKey) return true;

              {user?.name ? (

                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center">  return (

                  <span className="text-sm font-semibold">{getInitials(user.name)}</span>

                </div>    <div    // Verifica se está na rota específica

              ) : (

                <HiOutlineUserCircle className="w-10 h-10 text-gray-400" />      className={`    if (itemKey === 'dashboard' && pathname === '/admin/dashboard') return true;

              )}

            </div>        fixed left-0 top-0 bg-white border-r border-gray-200 h-screen transition-all duration-300 ease-in-out flex flex-col z-50    if (itemKey === 'users' && pathname?.startsWith('/admin/users')) return true;

            <div className="flex-1 min-w-0">

              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Administrador'}</p>        ${isCollapsed ? 'w-16' : 'w-64'}    if (itemKey === 'companies' && pathname?.startsWith('/admin/companies')) return true;

              <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@paimcontab.com'}</p>

            </div>      `}    if (itemKey === 'mei-dashboards' && pathname?.startsWith('/admin/mei-dashboards')) return true;

          </div>

        ) : (    >    if (itemKey === 'subscriptions' && pathname?.startsWith('/admin/subscriptions')) return true;

          <div className="flex justify-center">

            <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center">      {/* Logo/Header */}    if (itemKey === 'reports' && pathname?.startsWith('/admin/reports')) return true;

              <span className="text-sm font-semibold">{user?.name ? getInitials(user.name) : 'A'}</span>

            </div>      <div className="p-6 border-b border-gray-100">    if (itemKey === 'settings' && pathname?.startsWith('/admin/settings')) return true;

          </div>

        )}        <div className="flex items-center justify-between">

      </div>

    </div>          {!isCollapsed && (    return false;

  );

}            <div>  };

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
