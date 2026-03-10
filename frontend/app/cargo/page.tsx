'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, MapPin, Weight, Calendar, DollarSign, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { cargoService } from '@/services/cargo.service';
import { format } from 'date-fns';
import type { CargoFilters } from '@/types';

export default function CargoListPage() {
  const [filters, setFilters] = useState<CargoFilters>({});
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDest, setSearchDest] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [weightMin, setWeightMin] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');

  const { data, isLoading } = useQuery({
    queryKey: ['cargo', filters, page, sortBy, order],
    queryFn: () => cargoService.list({ ...filters, page, page_size: 20, sort_by: sortBy, order }),
  });

  const applyFilters = () => {
    setFilters({
      origin: searchOrigin || undefined,
      destination: searchDest || undefined,
      price_min: priceMin ? +priceMin : undefined,
      price_max: priceMax ? +priceMax : undefined,
      weight_min: weightMin ? +weightMin : undefined,
    });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchOrigin('');
    setSearchDest('');
    setPriceMin('');
    setPriceMax('');
    setWeightMin('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Cargo Marketplace</h1>
        <p className="text-slate-400 mt-1">
          {data?.total ?? '–'} loads available right now
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters sidebar */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="card sticky top-20">
            <div className="flex items-center gap-2 mb-5">
              <Filter className="w-4 h-4 text-brand-400" />
              <h2 className="font-semibold text-white">Фильтры</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label-text">Город отправления</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={searchOrigin} onChange={(e) => setSearchOrigin(e.target.value)}
                    placeholder="Например, Москва" className="input-field pl-9 text-sm py-2.5" />
                </div>
              </div>

              <div>
                <label className="label-text">Город назначения</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={searchDest} onChange={(e) => setSearchDest(e.target.value)}
                    placeholder="Например, Берлин" className="input-field pl-9 text-sm py-2.5" />
                </div>
              </div>

              <div>
                <label className="label-text">Диапазон цен (USD)</label>
                <div className="flex gap-2">
                  <input value={priceMin} onChange={(e) => setPriceMin(e.target.value)}
                    type="number" placeholder="Мин" className="input-field text-sm py-2.5 w-full" />
                  <input value={priceMax} onChange={(e) => setPriceMax(e.target.value)}
                    type="number" placeholder="Макс" className="input-field text-sm py-2.5 w-full" />
                </div>
              </div>

              <div>
                <label className="label-text">Мин. вес (кг)</label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={weightMin} onChange={(e) => setWeightMin(e.target.value)}
                    type="number" placeholder="Например, 500" className="input-field pl-9 text-sm py-2.5" />
                </div>
              </div>

              <div>
                <label className="label-text">Сортировать по</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field text-sm py-2.5">
                  <option value="created_at">Дата публикации</option>
                  <option value="price">Цена</option>
                  <option value="weight">Вес</option>
                  <option value="loading_date">Дата загрузки</option>
                </select>
                <select value={order} onChange={(e) => setOrder(e.target.value)} className="input-field text-sm py-2.5 mt-2">
                  <option value="desc">Сначала новые</option>
                  <option value="asc">Сначала старые</option>
                </select>
              </div>

              <button onClick={applyFilters} className="btn-primary w-full text-sm py-2.5">
                <Search className="w-4 h-4 inline mr-1.5" />Применить фильтры
              </button>
              <button onClick={clearFilters} className="btn-secondary w-full text-sm py-2.5">Очистить</button>
            </div>
          </div>
        </aside>

        {/* Cargo list */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {data?.items.length === 0 && (
                  <div className="card text-center py-12">
                    <p className="text-slate-400">Грузов не найдено. Попробуйте изменить фильтры.</p>
                  </div>
                )}
                {data?.items.map((cargo) => (
                  <Link key={cargo.id} href={`/cargo/${cargo.id}`}
                    className="card block hover:border-brand-500/50 transition-all duration-200 group animate-slide-up">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`badge-${cargo.status}`}>{cargo.status}</span>
                        </div>
                        <h3 className="font-semibold text-white group-hover:text-brand-300 transition-colors truncate">{cargo.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {cargo.origin} → {cargo.destination}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Weight className="w-3.5 h-3.5" />{cargo.weight} кг
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(cargo.loading_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {cargo.price ? (
                          <div className="text-xl font-bold text-white">
                            ${cargo.price}
                            <span className="text-sm text-slate-400 font-normal"> {cargo.currency}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500 italic">Цена по запросу</div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {data && data.pages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn-secondary flex items-center gap-1 text-sm py-2 px-3 disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <span className="text-slate-400 text-sm">Page {page} of {data.pages}</span>
                  <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                    className="btn-secondary flex items-center gap-1 text-sm py-2 px-3 disabled:opacity-40">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
