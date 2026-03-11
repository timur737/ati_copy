'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Weight, Calendar, DollarSign, Package, ArrowLeft, Star, AlertCircle } from 'lucide-react';
import { cargoService } from '@/services/cargo.service';
import { bidsService } from '@/services/bids.service';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react'; // imported missing icon

const bidSchema = z.object({
  price: z.number({ invalid_type_error: 'Enter a valid price' }).positive('Price must be positive'),
  message: z.string().optional(),
});
type BidForm = z.infer<typeof bidSchema>;

export default function CargoDetailPage() {
  const { id } = useParams();
  const cargoId = Number(id);
  const { user, isAuthenticated } = useAuthStore();
  const qc = useQueryClient();

  const { data: cargo, isLoading } = useQuery({
    queryKey: ['cargo', cargoId],
    queryFn: () => cargoService.getById(cargoId),
  });

  const { data: bids } = useQuery({
    queryKey: ['bids', cargoId],
    queryFn: () => bidsService.getCargoBids(cargoId),
    enabled: !!user && (user.role !== 'carrier' || cargo?.created_by === user.id),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BidForm>({
    resolver: zodResolver(bidSchema),
  });

  const placeBidMutation = useMutation({
    mutationFn: (data: BidForm) => bidsService.placeBid({ cargo_id: cargoId, ...data }),
    onSuccess: () => {
      toast.success('Bid placed successfully!');
      reset();
      qc.invalidateQueries({ queryKey: ['bids', cargoId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to place bid'),
  });

  const acceptBidMutation = useMutation({
    mutationFn: bidsService.acceptBid,
    onSuccess: () => {
      toast.success('Bid accepted!');
      qc.invalidateQueries({ queryKey: ['cargo', cargoId] });
      qc.invalidateQueries({ queryKey: ['bids', cargoId] });
    },
  });

  const rejectBidMutation = useMutation({
    mutationFn: bidsService.rejectBid,
    onSuccess: () => {
      toast.success('Bid rejected');
      qc.invalidateQueries({ queryKey: ['bids', cargoId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!cargo) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Груз не найден</h2>
        <p className="text-slate-400 mb-6">Возможно, этот груз был удален или вы перешли по неверной ссылке.</p>
        <Link href="/cargo" className="btn-primary inline-flex gap-2">
          <ArrowLeft className="w-4 h-4" /> Вернуться к списку
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === cargo?.created_by;
  const canBid = user?.role === 'carrier' || user?.role === 'dispatcher';

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Mock company data for now
  const company = {
    name: 'ООО "ТрансЛогистик"',
    country: 'Россия',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <Link href="/cargo" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Вернуться к спигам грузов
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cargo info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-xl font-bold text-white">{cargo.title}</h1>
              <span className={`badge-${cargo.status} flex-shrink-0`}>{cargo.status}</span>
            </div>
            {cargo.description && <p className="text-slate-400 text-sm mb-5">{cargo.description}</p>}

            {/* Route */}
            <div className="flex items-center gap-4 p-5 bg-slate-900/50 rounded-xl mb-8">
              <div className="flex-1">
                <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Откуда</div>
                <div className="font-medium text-white">{cargo.origin}</div>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-600 flex-shrink-0" />
              <div className="flex-1 text-right">
                <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Куда</div>
                <div className="font-medium text-white">{cargo.destination}</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Weight, label: 'Вес', value: `${cargo.weight.toLocaleString()} кг${cargo.volume ? ` / ${cargo.volume} м³` : ''}` },
                { icon: Calendar, label: 'Дата погрузки', value: format(new Date(cargo.loading_date), 'MMMM d, yyyy') },
                { icon: DollarSign, label: 'Цена', value: cargo.price ? `${cargo.price} ${cargo.currency}` : 'По запросу' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-surface-muted">
                  <Icon className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
                    <div className="text-sm font-medium text-white mt-0.5">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bids (shown to cargo owner or admin) */}
          {isOwner && (
            <div className="card">
              <h2 className="font-semibold text-white mb-4">Ставки ({bids?.length ?? 0})</h2>
              {bids?.length === 0 && <p className="text-slate-500 text-sm">Пока нет ставок.</p>}
              <div className="space-y-3">
                {bids?.map((bid) => (
                  <div key={bid.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-muted">
                    <div>
                      <div className="text-sm font-semibold text-white">${bid.price}</div>
                      {bid.message && <div className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{bid.message}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge-${bid.status}`}>{bid.status}</span>
                      {bid.status === 'pending' && cargo.status === 'open' && (
                        <>
                          <button onClick={() => acceptBidMutation.mutate(bid.id)}
                            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                            Принять
                          </button>
                          <button onClick={() => rejectBidMutation.mutate(bid.id)}
                            className="text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg transition-colors">
                            Отклонить
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-5">
          {/* Company info */}
          <div className="card">
            <h2 className="font-semibold text-white mb-3">О компании</h2>
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-medium text-white">{company.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-brand-400" />
              <span className="text-sm text-slate-400">{company.country}</span>
            </div>
          </div>

          {/* Place a bid form */}
          {isAuthenticated() && canBid && cargo.status === 'open' && !isOwner && (
            <div className="card">
              <h2 className="font-semibold text-white mb-4">Предложить ставку</h2>
              <form onSubmit={handleSubmit((data) => placeBidMutation.mutate(data))} className="space-y-4">
                <div>
                  <label htmlFor="price" className="text-xs text-slate-400 mb-1 block">Ваша цена</label>
                  <input type="number" id="price" placeholder="Введите сумму"
                    className="input-field" {...register('price', { valueAsNumber: true })} />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Сообщение (опционально)</label>
                  <textarea rows={3} placeholder="Например: Готовы забрать завтра утром"
                    className="input-field py-2 resize-none" {...register('message')} />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={placeBidMutation.isPending}>
                  {placeBidMutation.isPending ? 'Отправка…' : 'Предложить ставку'}
                </button>
              </form>
            </div>
          )}

          {!isAuthenticated() && (
            <div className="card text-center">
              <Package className="w-8 h-8 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-4">Войдите как перевозчик, чтобы сделать ставку</p>
              <Link href="/login" className="btn-primary text-sm">Войти</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
