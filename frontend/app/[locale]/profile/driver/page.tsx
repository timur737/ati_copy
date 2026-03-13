'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Truck, User, Shield, AlertCircle, CheckCircle, Clock,
  Upload, ArrowLeft, FileText, XCircle
} from 'lucide-react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { driverService } from '@/services/driver.service';

const schema = z.object({
  full_name: z.string().min(2, 'Введите полное имя'),
  license_number: z.string().min(2, 'Введите номер водительского удостоверения'),
  passport_front_url: z.string().min(1, 'Загрузите фото передней стороны паспорта'),
  passport_back_url: z.string().min(1, 'Загрузите фото задней стороны паспорта'),
});

type DriverForm = z.infer<typeof schema>;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

function PhotoUpload({
  label,
  fieldName,
  value,
  onChange,
  error,
}: {
  label: string;
  fieldName: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 5 МБ)');
      return;
    }
    const b64 = await fileToBase64(file);
    onChange(b64);
  };

  return (
    <div>
      <label className="label-text">{label}</label>
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          value
            ? 'border-brand-500/50 bg-brand-600/5'
            : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/30'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          id={fieldName}
        />
        {value ? (
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="w-full max-h-40 object-contain rounded-lg"
            />
            <button
              type="button"
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mt-1"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
            >
              <XCircle className="w-3.5 h-3.5" /> Удалить
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Upload className="w-8 h-8" />
            <span className="text-sm">Нажмите для загрузки фото</span>
            <span className="text-xs">JPG, PNG до 5 МБ</span>
          </div>
        )}
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    title: 'На проверке',
    desc: 'Ваша заявка получена и находится на проверке. Мы уведомим вас о результате.',
  },
  approved: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    title: 'Подтверждён',
    desc: 'Ваш профиль водителя верифицирован. Вы можете принимать заказы.',
  },
  rejected: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    title: 'Отклонён',
    desc: 'Ваша заявка отклонена.',
  },
};

export default function DriverRegistrationPage() {
  const router = useRouter();
  const locale = useLocale();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) router.push(`/${locale}/login`);
  }, []);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: authService.getMe });
  const { data: existingDriver, isLoading: driverLoading } = useQuery({
    queryKey: ['my-driver'],
    queryFn: driverService.getMyDriver,
    retry: false,
    enabled: !!me,
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<DriverForm>({ resolver: zodResolver(schema) });

  const frontUrl = watch('passport_front_url') ?? '';
  const backUrl = watch('passport_back_url') ?? '';

  const mutation = useMutation({
    mutationFn: driverService.createDriver,
    onSuccess: () => {
      toast.success('Заявка отправлена! Ожидайте проверки.');
      router.push(`/${locale}/profile`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Ошибка при отправке заявки');
    },
  });

  if (driverLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If driver profile exists, show status instead of form
  if (existingDriver) {
    const cfg = statusConfig[existingDriver.moderation_status as keyof typeof statusConfig];
    const Icon = cfg.icon;

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/${locale}/profile`} className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Профиль водителя
          </h1>
        </div>

        <div className={`card border ${cfg.bg} mb-5`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
              <Icon className={`w-6 h-6 ${cfg.color}`} />
            </div>
            <div>
              <div className={`font-semibold text-lg ${cfg.color}`}>{cfg.title}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{cfg.desc}</div>
              {existingDriver.moderation_status === 'rejected' && existingDriver.rejection_reason && (
                <div className="mt-2 text-sm text-red-400">
                  <strong>Причина:</strong> {existingDriver.rejection_reason}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Данные заявки
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>ФИО</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{existingDriver.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Удостоверение</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{existingDriver.license_number}</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-muted)' }}>Паспорт</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <FileText className="w-3.5 h-3.5" /> 2 документа загружено
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/${locale}/profile`} className="btn-ghost p-2 rounded-lg">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Регистрация водителя
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Верификация необходима для работы с грузами
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-brand-600/10 border border-brand-500/30 rounded-xl p-4 mb-6">
        <Shield className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Ваши документы используются только для верификации. После проверки они хранятся
          в зашифрованном виде. Срок проверки — 1–2 рабочих дня.
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        {/* Personal info */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <User className="w-4 h-4 text-brand-400" /> Личные данные
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label-text">Полное имя (ФИО)</label>
              <input
                placeholder="Иванов Иван Иванович"
                className="input-field"
                {...register('full_name')}
              />
              {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="label-text">Номер водительского удостоверения</label>
              <input
                placeholder="AA 123456"
                className="input-field"
                {...register('license_number')}
              />
              {errors.license_number && <p className="text-red-400 text-xs mt-1">{errors.license_number.message}</p>}
            </div>
          </div>
        </div>

        {/* Passport photos */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FileText className="w-4 h-4 text-brand-400" /> Фото паспорта
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Загрузите чёткие фотографии обеих сторон паспорта. Текст должен быть читаем.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PhotoUpload
              label="Передняя сторона"
              fieldName="passport_front"
              value={frontUrl}
              onChange={(v) => setValue('passport_front_url', v, { shouldValidate: true })}
              error={errors.passport_front_url?.message}
            />
            <PhotoUpload
              label="Задняя сторона"
              fieldName="passport_back"
              value={backUrl}
              onChange={(v) => setValue('passport_back_url', v, { shouldValidate: true })}
              error={errors.passport_back_url?.message}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={mutation.isPending || isSubmitting}
          >
            <Truck className="w-4 h-4" />
            {mutation.isPending ? 'Отправка…' : 'Отправить заявку'}
          </button>
          <Link href={`/${locale}/profile`} className="btn-ghost text-sm">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
