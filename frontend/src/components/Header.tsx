'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import classNames from 'classnames';
import { FiUser } from 'react-icons/fi';

const menuItems = [
  {
    label: 'Sobre',
    submenu: [
      { label: 'Institucional', href: '#' },
      { label: 'Histórico', href: '#' },
      { label: 'Missão e Valores', href: '#' },
    ],
  },
  {
    label: 'Cursos',
    submenu: [
      { label: 'Graduação', href: '#' },
      { label: 'Pós-graduação', href: '#' },
      { label: 'Extensão', href: '#' },
    ],
  },
  {
    label: 'Acadêmico',
    submenu: [
      { label: 'Calendário', href: '#' },
      { label: 'Biblioteca', href: '#' },
      { label: 'Secretaria', href: '#' },
    ],
  },
  {
    label: 'Contato',
    submenu: [
      { label: 'Fale Conosco', href: '#' },
      { label: 'Localização', href: '#' },
    ],
  },
];

export default function Header() {
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // Autenticação
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Para controlar dropdown mobile separado do desktop
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  function handleLogout(isMobile = false) {
    localStorage.removeItem('user');
    setUser(null);
    setProfileOpen(false);
    setMobileProfileOpen(false);
    if (isMobile) setMobileMenuOpen(false);
    window.location.href = '/';
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function onScroll() {
      if (mobileMenuOpen) {
        setSolid(true);
      } else {
        setSolid(window.scrollY > 10);
      }
    }
    window.addEventListener('scroll', onScroll);
    if (mobileMenuOpen) setSolid(true);
    return () => window.removeEventListener('scroll', onScroll);
  }, [mobileMenuOpen]);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleMenuMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenMenu(null), 100);
  };
  const handleMenuMouseEnter = (idx: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenMenu(idx);
  };
  const handleSubMenuMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
  const handleSubMenuMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenMenu(null), 100);
  };

  const [mobileOpenSubmenus, setMobileOpenSubmenus] = useState<{ [k: number]: boolean }>({});
  const handleMobileSubmenuToggle = (idx: number) => {
    setMobileOpenSubmenus(prev => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
      setMobileMenuOpen(false);
      setMobileProfileOpen(false);
    }
  };

  // Para fechar o dropdown do usuário ao clicar fora (desktop)
  useEffect(() => {
    if (!profileOpen) return;
    function handleClick(e: MouseEvent) {
      const dropdown = document.getElementById('user-profile-dropdown');
      const button = document.getElementById('user-profile-btn');
      if (dropdown && !dropdown.contains(e.target as Node) && button && !button.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen]);

  // Para fechar o dropdown do usuário ao clicar fora (mobile)
  useEffect(() => {
    if (!mobileProfileOpen) return;
    function handleClick(e: MouseEvent) {
      const dropdown = document.getElementById('user-profile-dropdown-mobile');
      const button = document.getElementById('user-profile-btn-mobile');
      if (dropdown && !dropdown.contains(e.target as Node) && button && !button.contains(e.target as Node)) {
        setMobileProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileProfileOpen]);

  return (
    <>
      {mobileMenuOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          aria-hidden="true"
          onClick={handleOverlayClick}
          style={{ opacity: 1 }}
        />
      )}

      <header
        ref={headerRef}
        className={classNames(
          'fixed top-0 left-0 w-full transition-all duration-300',
          solid ? 'bg-white/80 backdrop-blur-md shadow border-b border-gray-200' : 'bg-transparent',
          mobileMenuOpen ? 'z-30' : 'z-40'
        )}
        style={{ backdropFilter: solid ? 'blur(8px)' : undefined }}
      >
        <div className="max-w-7xl mx-auto flex items-center h-20 px-4 md:px-8">
          <div className="font-bold text-2xl text-gray-900 mr-6 md:mr-14 select-none tracking-tight flex-shrink-0">
            PaimContab
          </div>
          <nav className="flex-1 hidden lg:block">
            <ul className="flex space-x-8">
              {menuItems.map((item, idx) => (
                <li
                  key={item.label}
                  className="relative "
                  onMouseEnter={() => handleMenuMouseEnter(idx)}
                  onMouseLeave={handleMenuMouseLeave}
                >
                  <button
                    className={classNames(
                      'flex items-center gap-1 px-2 py-2 font-medium text-gray-800 hover:text-black transition-colors cursor-pointer',
                      openMenu === idx && 'text-black'
                    )}
                    type="button"
                    aria-haspopup={!!item.submenu}
                    aria-expanded={openMenu === idx}
                    onClick={() => setOpenMenu(openMenu === idx ? null : idx)}
                  >
                    {item.label}
                    {item.submenu && (
                      <svg
                        className={classNames(
                          'ml-1 w-4 h-4 text-gray-500 transform transition-transform duration-200',
                          openMenu === idx ? '-rotate-180 -translate-y-0.5' : 'rotate-0'
                        )}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  {item.submenu && openMenu === idx && (
                    <div
                      className="absolute left-0 top-full mt-2 z-30 bg-white border border-gray-200 rounded-md min-w-[180px] shadow-xl animate-fadein"
                      onMouseEnter={handleSubMenuMouseEnter}
                      onMouseLeave={handleSubMenuMouseLeave}
                    >
                      <ul>
                        {item.submenu.map(subitem => (
                          <li key={subitem.label}>
                            <Link
                              href={subitem.href}
                              className="block px-5 py-2 text-gray-700 hover:bg-gray-100 hover:text-black text-sm transition-colors"
                              onClick={() => setOpenMenu(null)}
                            >
                              {subitem.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="hidden lg:flex items-center space-x-4 ml-8">
            {!user ? (
              <button
                onClick={() => (window.location.href = '/Login')}
                className="px-5 py-2 rounded border border-gray-900 text-gray-900 font-semibold hover:bg-gray-100 transition cursor-pointer"
              >
                Entrar
              </button>
            ) : (
              <div className="relative flex items-center">
                <button
                  id="user-profile-btn"
                  className="flex items-center gap-3 px-2 py-1 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 transition cursor-pointer shadow-sm"
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={profileOpen}
                  tabIndex={0}
                  onClick={() => setProfileOpen(open => !open)}
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-200 text-gray-500 font-bold text-lg shadow-sm">
                    {user.name?.charAt(0).toUpperCase() || <FiUser />}
                  </span>
                  <span className="flex flex-col text-left leading-tight">
                    <span className="font-semibold text-gray-700 text-[15px]">{user.name.split(' ')[0]}</span>
                    <span className="text-xs text-gray-400">Minha conta</span>
                  </span>
                  <svg
                    className={classNames(
                      'ml-1 w-4 h-4 text-gray-400 transition-transform duration-200',
                      profileOpen ? '-rotate-180 -translate-y-0.5' : 'rotate-0'
                    )}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {profileOpen && (
                  <div
                    id="user-profile-dropdown"
                    className="absolute right-0 top-full mt-2 z-50 bg-white border border-gray-100 rounded-xl shadow-xl animate-fadein py-2 min-w-[160px]"
                  >
                    <Link
                      href="/mei/dashboard"
                      className="block px-5 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition font-medium rounded"
                      onClick={() => setProfileOpen(false)}
                    >
                      Dashboard MEI
                    </Link>
                    <button
                      onClick={() => handleLogout(false)}
                      className="w-full text-left px-5 py-2 text-red-500 hover:bg-gray-50 hover:text-red-600 transition font-medium rounded"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            className="lg:hidden ml-auto p-2 rounded hover:bg-gray-100 transition"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => {
              setMobileMenuOpen(open => !open);
              setMobileProfileOpen(false);
            }}
          >
            {mobileMenuOpen ? (
              <svg
                className="w-7 h-7 text-gray-900"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg
                className="w-7 h-7 text-gray-900"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <nav
          ref={drawerRef}
          className={classNames(
            'fixed top-0 right-0 h-full w-4/5 max-w-xs bg-white shadow-lg z-50 transform transition-transform duration-300',
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          )}
          aria-hidden={!mobileMenuOpen}
        >
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100">
            <span className="font-bold text-xl text-gray-900 select-none tracking-tight">PaimContab</span>
            <button
              className="p-2 rounded hover:bg-gray-100 transition"
              aria-label="Fechar menu"
              onClick={() => {
                setMobileMenuOpen(false);
                setMobileProfileOpen(false);
              }}
            >
              <svg
                className="w-7 h-7 text-gray-900"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <ul className="py-4 px-2">
            {menuItems.map((item, idx) => (
              <li key={item.label} className="mb-2">
                <button
                  className="flex items-center w-full justify-between px-3 py-3 text-base font-medium text-gray-800 hover:text-black rounded transition"
                  aria-haspopup={!!item.submenu}
                  aria-expanded={!!mobileOpenSubmenus[idx]}
                  onClick={() => handleMobileSubmenuToggle(idx)}
                  tabIndex={0}
                  type="button"
                >
                  <span>{item.label}</span>
                  {item.submenu && (
                    <svg
                      className={classNames(
                        'ml-1 w-5 h-5 text-gray-500 transform transition-transform duration-200',
                        mobileOpenSubmenus[idx] ? '-rotate-180 -translate-y-0.5' : 'rotate-0'
                      )}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                {item.submenu && mobileOpenSubmenus[idx] && (
                  <ul className="pl-5 pr-3 pb-3 pt-1 animate-fadein">
                    {item.submenu.map(subitem => (
                      <li key={subitem.label}>
                        <Link
                          href={subitem.href}
                          className="block py-2 text-gray-700 hover:bg-gray-100 hover:text-black rounded text-[15px] transition"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {subitem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="px-4 pb-6 pt-2 flex flex-col space-y-3">
            {!user ? (
              <button
                onClick={() => {
                  window.location.href = '/Login';
                  setMobileMenuOpen(false);
                  setMobileProfileOpen(false);
                }}
                className="w-full px-5 py-3 rounded border border-gray-900 text-gray-900 font-semibold hover:bg-gray-100 transition cursor-pointer"
              >
                Entrar
              </button>
            ) : (
              <div className="relative w-full">
                <button
                  id="user-profile-btn-mobile"
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 transition cursor-pointer shadow-sm"
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={mobileProfileOpen}
                  onClick={() => setMobileProfileOpen(open => !open)}
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-200 text-gray-500 font-bold text-lg shadow-sm">
                    {user.name?.charAt(0).toUpperCase() || <FiUser />}
                  </span>
                  <span className="flex flex-col text-left leading-tight">
                    <span className="font-semibold text-gray-700 text-[15px]">{user.name.split(' ')[0]}</span>
                    <span className="text-xs text-gray-400">Minha conta</span>
                  </span>
                  <svg
                    className={classNames(
                      'ml-1 w-4 h-4 text-gray-400 transition-transform duration-200',
                      mobileProfileOpen ? '-rotate-180 -translate-y-0.5' : 'rotate-0'
                    )}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {mobileProfileOpen && (
                  <div
                    id="user-profile-dropdown-mobile"
                    className="absolute right-0 left-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 animate-fadein py-2"
                  >
                    <Link
                      href="/mei/dashboard"
                      className="block px-5 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition font-medium rounded"
                      onClick={() => {
                        setMobileProfileOpen(false);
                        setMobileMenuOpen(false);
                      }}
                    >
                      Dashboard MEI
                    </Link>
                    <button
                      onClick={() => handleLogout(true)}
                      className="w-full text-left px-5 py-2 text-red-500 hover:bg-gray-50 hover:text-red-600 transition font-medium rounded"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      )}
      <style jsx>{`
        @keyframes fadein {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadein {
          animation: fadein 0.2s ease;
        }
      `}</style>
    </>
  );
}
