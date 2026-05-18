'use client';

import { LayoutDashboard, Camera, Bell, Settings, LogOut, User as UserIcon, Map, Menu, X, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { ASSETS } from '../assets/images';
import { useState, useEffect } from 'react';

import { useNotificationContext } from '@/src/context/NotificationContext';

import NotificationDrawer from './NotificationDrawer';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, token } = useAuth();
  const { unreadCount, refreshUnreadCount } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    if (token) {
      refreshUnreadCount();
    }
  }, [token, refreshUnreadCount]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      if (newTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newTheme;
    });
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'user'] },
    { icon: Camera, label: 'Cameras', path: '/cameras', roles: ['admin'] },
    { icon: Bell, label: 'Notifications', path: '/notifications', roles: ['admin', 'user'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin'] },
  ].filter(item => item.roles.includes(user?.role || 'user'));

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-40 flex gap-2">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-gray-300"
        >
          <Menu className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setIsNotifOpen(true)}
          className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-gray-300 relative"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "w-64 h-[100dvh] bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ASSETS.logo} alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">VMS Kota</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Madiun</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                pathname === item.path
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4 px-2">
            <button 
              onClick={() => setIsNotifOpen(true)}
              className="flex-1 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition-all relative group"
              title="Notifikasi"
            >
              <Bell className="w-5 h-5 mx-auto" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-1/2 translate-x-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 group-hover:animate-ping"></span>
              )}
            </button>
            <button 
              onClick={toggleTheme}
              className="flex-1 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition-all"
              title="Ganti Tema"
            >
              {isDarkMode ? <Sun className="w-5 h-5 mx-auto" /> : <Moon className="w-5 h-5 mx-auto" />}
            </button>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
            <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
              <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate leading-none mb-1">{user?.full_name}</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate capitalize font-medium">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
