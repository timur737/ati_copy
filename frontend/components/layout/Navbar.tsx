'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, Package, MessageSquare, User, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const navLinks = [
  { href: '/cargo', label: 'Поиск грузов', icon: Package },
  { href: '/messages', label: 'Сообщения', icon: MessageSquare },
  { href: '/dashboard', label: 'Панель управления', icon: Truck },
];



export function Navbar() {
  const router = useRouter();
  const { user, accessToken, logout, isAuthenticated } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const handleLogout = async () => {
    try {
      if (accessToken) await authService.logout(accessToken);
    } finally {
      logout();
      router.push('/login');
      toast.success('Вы успешно вышли из системы');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-surface-card/80 backdrop-blur-md border-b border-slate-700/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center group-hover:bg-brand-500 transition-colors">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">
            ATI<span className="text-brand-400">.market</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {isAuthenticated() &&
            navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-muted text-sm font-medium transition-all"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
        </div>

        {/* Auth actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated() ? (
            <>
              <Link href="/post-cargo" className="btn-primary text-sm py-2">
                + Добавить груз
              </Link>
              <Link href="/profile" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 transition-colors px-2 py-1 rounded-lg hover:bg-surface-muted">
                <User className="w-4 h-4" />
                <span className="max-w-[120px] truncate">{user?.email}</span>
              </Link>
              <button onClick={handleLogout} className="btn-ghost text-sm p-2" title="Выйти">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">Войти</Link>
              <Link href="/register" className="btn-primary text-sm py-2">Регистрация</Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden btn-ghost p-2" onClick={toggleSidebar}>
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {sidebarOpen && (
        <div className="md:hidden border-t border-slate-700/50 bg-surface-card animate-fade-in">
          <div className="px-4 py-4 flex flex-col gap-2">
            {isAuthenticated() ? (
              <>
                {navLinks.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-surface-muted text-sm font-medium" onClick={toggleSidebar}>
                    <Icon className="w-4 h-4" /> {label}
                  </Link>
                ))}
                <Link href="/post-cargo" className="btn-primary text-sm text-center mt-2" onClick={toggleSidebar}>+ Добавить груз</Link>
                <button onClick={handleLogout} className="text-left flex items-center gap-2 px-3 py-2.5 text-red-400 hover:bg-surface-muted rounded-lg text-sm mt-1">
                  <LogOut className="w-4 h-4" /> Выйти
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-center text-sm" onClick={toggleSidebar}>Войти</Link>
                <Link href="/register" className="btn-primary text-center text-sm" onClick={toggleSidebar}>Регистрация</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
