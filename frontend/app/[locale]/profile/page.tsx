'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { User, Phone, Building2, Star, Mail, Shield } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, setUser } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, []);

  const { data: me, isLoading } = useQuery({ queryKey: ['me'], queryFn: authService.getMe });
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { isDirty } } = useForm({
    values: { company_name: me?.company_name ?? '', phone: me?.phone ?? '' },
  });

  const mutation = useMutation({
    mutationFn: (data: { company_name?: string; phone?: string }) => authService.updateMe(data),
    onSuccess: (user) => {
      setUser(user);
      qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Профиль обновлен!');
    },
    onError: () => toast.error('Не удалось обновить профиль'),
  });

  const roleColors: Record<string, string> = {
    shipper: 'badge-open',
    carrier: 'badge-assigned',
    dispatcher: 'badge-pending',
  };

  if (isLoading || !me) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-8">Мой профиль</h1>

      {/* Profile header */}
      <div className="card mb-5">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/30 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-white truncate">{me.company_name || me.email}</h2>
              <span className={roleColors[me.role] ?? 'badge'}>{me.role}</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
              <span className="text-sm font-medium">{me.rating.toFixed(1)}</span>
              <span className="text-slate-500 text-sm ml-1">рейтинг</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-slate-400 text-sm">
              <Mail className="w-3.5 h-3.5" />
              {me.email}
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card">
        <h2 className="font-semibold text-white mb-5">Редактировать профиль</h2>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label-text">Название компании</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input placeholder="ООО 'Ваша Компания'" className="input-field pl-9" {...register('company_name')} />
            </div>
          </div>
          <div>
            <label className="label-text">Телефон</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input placeholder="+7 999 000 0000" className="input-field pl-9" {...register('phone')} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={mutation.isPending || !isDirty}>
            {mutation.isPending ? 'Сохранение…' : 'Сохранить изменения'}
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-5">
        {[
          { label: 'Статус аккаунта', value: me.is_active ? 'Активен' : 'Неактивен', icon: Shield, color: 'text-emerald-400' },
          { label: 'Роль', value: me.role, icon: User, color: 'text-brand-400' },
          { label: 'Рейтинг', value: me.rating.toFixed(1) + ' / 5', icon: Star, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card text-center p-4">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
            <div className="text-sm font-semibold text-white capitalize">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
