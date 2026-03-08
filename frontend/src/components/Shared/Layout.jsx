// src/components/Shared/Layout.jsx
import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Settings,
  LogOut,
  Store,
  UserCircle,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isDark = theme === 'dark';

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory',  href: '/inventory',  icon: Package },
    { name: 'Products',   href: '/products',   icon: Tag },
    { name: 'Sales',      href: '/sales',      icon: ShoppingCart },
    { name: 'Settings',   href: '/settings',   icon: Settings },
  ].filter(item => !item.adminOnly || user?.role === 'admin');

  const isCurrentPath = (href) => location.pathname === href;
  const currentPage = navigation.find(item => isCurrentPath(item.href))?.name || 'Dashboard';

  // ── Theme-aware class helpers ──
  const headerBg     = isDark ? 'bg-slate-900 shadow-slate-950/50' : 'bg-white shadow-gray-200/80';
  const brandBorder  = isDark ? 'border-slate-700/60' : 'border-gray-200';
  const brandText    = isDark ? 'text-white' : 'text-gray-900';
  const pageTitleCls = isDark ? 'text-white' : 'text-gray-800';
  const userRoleCls  = isDark ? 'text-slate-400' : 'text-gray-500';
  const sidebarBg    = isDark ? 'bg-slate-900' : 'bg-white border-r border-gray-200';
  const navInactive  = isDark
    ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';
  const navIconInactive = isDark ? 'text-slate-500' : 'text-gray-400';
  const logoutDivider   = isDark ? 'border-slate-700/60' : 'border-gray-200';
  const logoutCls       = isDark
    ? 'text-slate-400 hover:bg-red-500/10 hover:text-red-400'
    : 'text-gray-500 hover:bg-red-50 hover:text-red-500';
  const mainBg          = isDark ? 'bg-slate-800' : 'bg-gray-100';
  const dropdownBg      = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200';

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${mainBg}`}>

      {/* ── Full-width Header ── */}
      <header className={`flex-shrink-0 flex items-center h-16 shadow-md z-20 w-full transition-colors duration-300 print:hidden ${headerBg}`}>

        {/* Hamburger Menu (Mobile Only) */}
        <div className="md:hidden flex items-center px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg transition-colors focus:outline-none ${navInactive}`}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Brand – aligned with sidebar width */}
        <div className={`hidden md:flex items-center gap-3 w-64 px-5 border-r h-full flex-shrink-0 ${brandBorder}`}>
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500">
            <Store size={18} className="text-white" />
          </span>
          <span className={`text-sm font-bold tracking-wide leading-tight ${brandText}`}>
            Store Master
          </span>
        </div>

        {/* Page title + user info dropdown */}
        <div className="flex-1 flex items-center justify-between px-6 pr-8">
          <h1 className={`text-lg font-semibold tracking-wide ${pageTitleCls}`}>
            {currentPage}
          </h1>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-300 focus:outline-none ${navInactive} hover:scale-110`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-600" />}
            </button>

            <div className="relative">
            {/* Clickable User profile */}
            <button 
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-500/10 transition-colors focus:outline-none"
            >
              <div className="leading-tight text-right hidden sm:block">
                <p className={`text-sm font-semibold ${brandText}`}>{user?.fullname || 'User'}</p>
                <p className={`text-xs capitalize ${userRoleCls}`}>{user?.role || 'Staff'}</p>
              </div>
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600/80 shadow-inner">
                <UserCircle size={24} className="text-white" />
              </span>
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setUserDropdownOpen(false)}
                />
                <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border z-40 overflow-hidden transform origin-top-right transition-all duration-200 ${dropdownBg}`}>
                  <div className="p-4 border-b border-gray-200/10">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600/80">
                        <UserCircle size={24} className="text-white" />
                      </span>
                      <div className="overflow-hidden">
                        <p className={`text-sm font-bold truncate ${brandText}`}>
                          {user?.fullname || 'User'}
                        </p>
                        <p className={`text-xs capitalize truncate ${userRoleCls}`}>
                          {user?.role || 'Staff Member'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Body (sidebar + page content) ── */}
      <div className="flex flex-1 overflow-hidden print:block">

        {/* Mobile Sidebar Backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex md:flex-col flex-shrink-0 print:hidden
          ${sidebarBg}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Mobile Header in Sidebar */}
          <div className={`flex md:hidden items-center gap-3 px-5 h-16 border-b ${brandBorder}`}>
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500">
              <Store size={18} className="text-white" />
            </span>
            <span className={`text-sm font-bold tracking-wide leading-tight ${brandText}`}>
              Dept Store
            </span>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 mt-4 md:mt-10 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isCurrentPath(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                      : navInactive
                  }`}
                >
                  <Icon
                    size={18}
                    className={active ? 'text-white' : navIconInactive}
                  />
                  {item.name}
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout – pinned to bottom */}
          <div className={`px-3 py-4 border-t flex-shrink-0 ${logoutDivider}`}>
            <button
              onClick={() => {
                setSidebarOpen(false);
                logout();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${logoutCls}`}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none print:static print:overflow-visible">
          <div className="py-6 print:py-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 print:px-0 print:max-w-none">
              <Outlet />
            </div>
          </div>
        </main>

      </div>
    </div>
  );
};

export default Layout;