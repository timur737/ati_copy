import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-24 text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
          </span>
          Платформа №1 для логистики в Евразии
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Соединяем <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">Перевозчиков</span> и <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Грузовладельцев</span> в реальном времени
        </h1>
        
        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Самый быстрый способ найти грузы, получить автомобили и развивать ваш логистический бизнес за счет надежных партнеров.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Link href="/cargo" className="btn-primary w-full sm:w-auto px-8 py-4 text-base rounded-xl group">
            Искать грузы 
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/post-cargo" className="btn-secondary w-full sm:w-auto px-8 py-4 text-base rounded-xl">
            Добавить груз
          </Link>
        </div>
      </section>
    </>
  );
}
