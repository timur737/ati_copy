'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Weight, DollarSign, Calendar, FileText, Package, Truck, ArrowLeft } from 'lucide-react';
import { cargoService } from '@/services/cargo.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link'; // Added Link import

const schema = z.object({
  title: z.string().min(5, 'Минимум 5 символов'),
  description: z.string().optional(),
  origin: z.string().min(2, 'Обязательное поле'),
  destination: z.string().min(2, 'Обязательное поле'),
  weight: z.number().positive(),
  volume: z.number().positive(),
  price: z.number().positive('Сумма должна быть больше 0'),
  currency: z.string().min(3),
  loading_date: z.string().min(1, 'Укажите дату'),
});

type PostCargoForm = z.infer<typeof schema>;

export default function PostCargoPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const qc = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PostCargoForm>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'USD' },
  });

  const mutation = useMutation({
    mutationFn: (data: PostCargoForm) =>
      cargoService.create({
        ...data,
        weight: Number(data.weight),
        volume: data.volume ? Number(data.volume) : undefined,
        price: data.price ? Number(data.price) : undefined,
        loading_date: new Date(data.loading_date).toISOString(),
      }),
    onSuccess: (cargo) => {
      toast.success('Груз успешно добавлен!');
      qc.invalidateQueries({ queryKey: ['cargo'] });
      router.push('/dashboard');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Не удалось добавить груз'),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white flex items-center gap-1 w-fit mb-4">
          <ArrowLeft className="w-4 h-4" /> Назад в панель
        </Link>
        <h1 className="text-2xl font-bold text-white">Добавить груз</h1>
        <p className="text-slate-400 mt-1 pb-4 border-b border-slate-800">Заполните детали для поиска перевозчика</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-8">
        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-400" /> Основная информация
          </h2>
          
          <div>
            <label className="label-text">Название груза *</label>
            <input placeholder="Например: Паллеты с электроникой" className="input-field" {...register('title')} />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label-text">Описание (опционально)</label>
            <textarea 
              placeholder="Дополнительные детали, требования к перевозке…" 
              className="input-field min-h-[100px] py-3" 
              {...register('description')} 
            />
          </div>
        </section>

        {/* Route Info */}
        <section className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" /> Маршрут и даты
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Откуда (City, Country) *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input placeholder="Москва, Россия" className="input-field pl-9" {...register('origin')} />
              </div>
              {errors.origin && <p className="text-red-400 text-xs mt-1">{errors.origin.message}</p>}
            </div>
            <div>
              <label className="label-text">Куда (City, Country) *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input placeholder="Берлин, Германия" className="input-field pl-9" {...register('destination')} />
              </div>
              {errors.destination && <p className="text-red-400 text-xs mt-1">{errors.destination.message}</p>}
            </div>
          </div>

          <div>
            <label className="label-text">Дата загрузки *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="date" className="input-field pl-9" {...register('loading_date')} />
            </div>
            {errors.loading_date && <p className="text-red-400 text-xs mt-1">{errors.loading_date.message}</p>}
          </div>
        </section>

        {/* Specs & Pricing */}
        <section className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" /> Характеристики и оплата
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Общий вес (т) *</label>
              <div className="relative">
                <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="number" step="0.1" placeholder="2.5" className="input-field pl-9" {...register('weight', { valueAsNumber: true })} />
              </div>
              {errors.weight && <p className="text-red-400 text-xs mt-1">{errors.weight.message}</p>}
            </div>
            <div>
              <label className="label-text">Объем (м³) *</label>
              <input type="number" step="0.1" placeholder="10" className="input-field" {...register('volume', { valueAsNumber: true })} />
              {errors.volume && <p className="text-red-400 text-xs mt-1">{errors.volume.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Предлагаемая цена *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="number" placeholder="1500" className="input-field pl-9" {...register('price', { valueAsNumber: true })} />
              </div>
              {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="label-text">Валюта</label>
              <select className="input-field" {...register('currency')}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="RUB">RUB (₽)</option>
                <option value="KZT">KZT (₸)</option>
              </select>
            </div>
          </div>
        </section>
        
        <button type="submit" className="btn-primary w-full shadow-lg shadow-brand-500/20" disabled={isSubmitting}>
          {isSubmitting ? 'Добавление груза…' : 'Опубликовать груз'}
        </button>
      </form>
    </div>
  );
}
