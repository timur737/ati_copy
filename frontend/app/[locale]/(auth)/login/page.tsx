'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Truck, Mail, Lock, AlertCircle } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(1, 'Введите пароль'),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const { setTokens, setUser } = useAuthStore();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      const tokens = await authService.login(data);
      setTokens(tokens.access_token, tokens.refresh_token);
      const user = await authService.getMe();
      setUser(user);
      toast.success('Добро пожаловать!');
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка авторизации');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 mb-4">
            <Truck className="w-7 h-7 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Вход в систему ATI</h1>
          <p className="text-slate-400 mt-1 text-sm">С возвращением — введите ваши данные</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="label-text">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  placeholder="вы@компания.com"
                  className="input-field pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label-text">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="input-field pl-10"
                  {...register('password')}
                />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Вход…' : 'Войти'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            У вас нет аккаунта?{' '}
            <Link href={`/${locale}/register`} className="text-brand-400 hover:text-brand-300 font-medium">
              Зарегистрироваться бесплатно
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
