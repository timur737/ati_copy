'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Package, Truck, Star, ArrowRight, Plus, TrendingUp } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { cargoService } from '@/services/cargo.service';
import { bidsService } from '@/services/bids.service';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, []);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: authService.getMe });
  const { data: myCargo } = useQuery({
    queryKey: ['my-cargo'],
    queryFn: () => cargoService.list({ page_size: 5 }),
    enabled: me?.role !== 'carrier',
  });
  const { data: myBids } = useQuery({
    queryKey: ['my-bids'],
    queryFn: bidsService.getMyBids,
    enabled: me?.role === 'carrier',
  });

  const isCarrier = user?.role === 'carrier';

  const stats = isCarrier
    ? [
        { label: 'Активные ставки', value: myBids?.filter((b) => b.status === 'pending').length ?? '–', icon: TrendingUp, color: 'text-yellow-400' },
        { label: 'Принятые', value: myBids?.filter((b) => b.status === 'accepted').length ?? '–', icon: Truck, color: 'text-emerald-400' },
        { label: 'Рейтинг', value: me?.rating.toFixed(1) ?? '–', icon: Star, color: 'text-amber-400' },
      ]
    : [
        { label: 'Открытые грузы', value: myCargo?.items.filter((c) => c.status === 'open').length ?? '–', icon: Package, color: 'text-emerald-400' },
        { label: 'Назначенные', value: myCargo?.items.filter((c) => c.status === 'assigned').length ?? '–', icon: Truck, color: 'text-blue-400' },
        { label: 'Рейтинг', value: me?.rating.toFixed(1) ?? '–', icon: Star, color: 'text-amber-400' },
      ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Панель управления</h1>
          <p className="text-slate-400 mt-1">
            С возвращением, <span className="text-brand-400">{me?.company_name || me?.email}</span>
          </p>
        </div>
        {!isCarrier && (
          <Link href="/post-cargo" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Добавить груз
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-surface-muted flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-sm text-slate-400">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {isCarrier ? 'Мои ставки' : 'Мои грузы'}
          </h2>
          <Link href="/cargo" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
            Смотреть все <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isCarrier ? (
          <div className="space-y-3">
            {myBids?.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">Вы еще не делали ставок. <Link href="/cargo" className="text-brand-400 hover:underline">Найти грузы →</Link></p>
            )}
            {myBids?.slice(0, 5).map((bid) => (
              <div key={bid.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-muted hover:bg-slate-700/50 transition-colors">
                <div>
                  <div className="text-sm font-medium text-white">Груз #{bid.cargo_id}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{format(new Date(bid.created_at), 'dd.MM.yyyy')}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold">${bid.price}</span>
                  <span className={`badge-${bid.status}`}>{bid.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {myCargo?.items.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">Нет добавленных грузов. <Link href="/post-cargo" className="text-brand-400 hover:underline">Добавить первый груз →</Link></p>
            )}
            {myCargo?.items.map((cargo) => (
              <Link key={cargo.id} href={`/cargo/${cargo.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-surface-muted hover:bg-slate-700/50 transition-colors group">
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors">{cargo.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{cargo.origin} → {cargo.destination}</div>
                </div>
                <div className="flex items-center gap-3">
                  {cargo.price && <span className="text-white font-semibold">${cargo.price}</span>}
                  <span className={`badge-${cargo.status}`}>{cargo.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
