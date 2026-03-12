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
import { useLocale, useTranslations } from 'next-intl';
import { format } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const locale = useLocale();
  const t = useTranslations('Dashboard');
  const tNav = useTranslations('Navigation');

  useEffect(() => {
    if (!isAuthenticated()) router.push(`/${locale}/login`);
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
        { label: t('activeBids'), value: myBids?.filter((b) => b.status === 'pending').length ?? '–', icon: TrendingUp, color: 'text-yellow-500' },
        { label: t('accepted'),   value: myBids?.filter((b) => b.status === 'accepted').length ?? '–', icon: Truck,       color: 'text-emerald-500' },
        { label: t('rating'),     value: me?.rating.toFixed(1) ?? '–',                                  icon: Star,        color: 'text-amber-400' },
      ]
    : [
        { label: t('openCargo'), value: myCargo?.items.filter((c) => c.status === 'open').length ?? '–',     icon: Package, color: 'text-emerald-500' },
        { label: t('assigned'),  value: myCargo?.items.filter((c) => c.status === 'assigned').length ?? '–', icon: Truck,   color: 'text-blue-500' },
        { label: t('rating'),    value: me?.rating.toFixed(1) ?? '–',                                        icon: Star,    color: 'text-amber-400' },
      ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('title')}</h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
            {t('welcome')} <span className="text-brand-500">{me?.company_name || me?.email}</span>
          </p>
        </div>
        {!isCarrier && (
          <Link href={`/${locale}/post-cargo`} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t('addCargo')}
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`} style={{ backgroundColor: 'var(--surface-muted)' }}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isCarrier ? t('myBids') : t('myCargo')}
          </h2>
          <Link href={`/${locale}/cargo`} className="text-sm text-brand-500 hover:text-brand-400 flex items-center gap-1">
            {t('viewAll')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isCarrier ? (
          <div className="space-y-3">
            {myBids?.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                {t('noBids')}{' '}
                <Link href={`/${locale}/cargo`} className="text-brand-500 hover:underline">{t('findCargo')}</Link>
              </p>
            )}
            {myBids?.slice(0, 5).map((bid) => (
              <div key={bid.id} className="flex items-center justify-between p-4 rounded-xl transition-colors" style={{ backgroundColor: 'var(--surface-muted)' }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('cargo')} #{bid.cargo_id}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{format(new Date(bid.created_at), 'dd.MM.yyyy')}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{bid.price.toLocaleString()}</span>
                  <span className={`badge-${bid.status}`}>{bid.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {myCargo?.items.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                {t('noCargo')}{' '}
                <Link href={`/${locale}/post-cargo`} className="text-brand-500 hover:underline">{t('addFirst')}</Link>
              </p>
            )}
            {myCargo?.items.map((cargo) => (
              <Link key={cargo.id} href={`/${locale}/cargo/${cargo.id}`}
                className="flex items-center justify-between p-4 rounded-xl transition-colors group" style={{ backgroundColor: 'var(--surface-muted)' }}>
                <div>
                  <div className="text-sm font-medium group-hover:text-brand-500 transition-colors" style={{ color: 'var(--text-primary)' }}>{cargo.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{cargo.origin} → {cargo.destination}</div>
                </div>
                <div className="flex items-center gap-3">
                  {cargo.price && <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{cargo.price.toLocaleString()}</span>}
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
