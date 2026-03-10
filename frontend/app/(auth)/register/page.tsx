'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Truck, Mail, Lock, Building2, Phone, AlertCircle } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import type { UserRole } from '@/types';

const schema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(8, 'Пароль должен содержать не менее 8 символов'),
  role: z.enum(['shipper', 'carrier', 'dispatcher'] as const),
  company_name: z.string().optional(),
  phone: z.string().optional(),
});

type RegisterForm = z.infer<typeof schema>;

const roleOptions: { value: UserRole; label: string; desc: string }[] = [
  { value: 'shipper', label: 'Грузовладелец', desc: 'Мне нужно отправить груз' },
  { value: 'carrier', label: 'Перевозчик', desc: 'У меня есть транспорт' },
  { value: 'dispatcher', label: 'Диспетчер', desc: 'Я управляю логистикой' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'shipper' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    try {
      await authService.register(data);
      const tokens = await authService.login({ email: data.email, password: data.password });
      setTokens(tokens.access_token, tokens.refresh_token);
      const me = await authService.getMe();
      setUser(me);
      toast.success('Аккаунт создан! Добро пожаловать в ATI.');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 mb-4">
            <Truck className="w-7 h-7 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Создать аккаунт</h1>
          <p className="text-slate-400 mt-1 text-sm">Присоединяйтесь к тысячам грузовладельцев и перевозчиков</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Role selector */}
            <div>
              <label className="label-text">Я…</label>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`relative cursor-pointer rounded-xl border p-3 text-center transition-all duration-200 ${
                      selectedRole === value
                        ? 'border-brand-500 bg-brand-600/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <input type="radio" value={value} className="sr-only" {...register('role')} />
                    <div className="text-sm font-semibold text-white">{label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label-text">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="email" type="email" placeholder="вы@компания.com" className="input-field pl-10" {...register('email')} />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label-text">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="password" type="password" placeholder="мин. 8 символов" className="input-field pl-10" {...register('password')} />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Название компании</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input placeholder="ООО Логистика" className="input-field pl-10" {...register('company_name')} />
                </div>
              </div>
              <div>
                <label className="label-text">Телефон</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input placeholder="+7 999 000 0000" className="input-field pl-10" {...register('phone')} />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Создание аккаунта…' : 'Создать аккаунт'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
