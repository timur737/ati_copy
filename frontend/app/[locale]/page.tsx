import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function Home() {
  const t = useTranslations('Index');
  const locale = useLocale();

  return (
    <>
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-24 text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
          </span>
          {t('heroBadge')}
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {t('heroTitle1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">{t('heroTitle2')}</span> {t('heroTitle3')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{t('heroTitle4')}</span> {t('heroTitle5')}
        </h1>
        
        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {t('heroSubtitle')}
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Link href={`/${locale}/cargo`} className="btn-primary w-full sm:w-auto px-8 py-4 text-base rounded-xl group">
            {t('searchCargoBtn')} 
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href={`/${locale}/post-cargo`} className="btn-secondary w-full sm:w-auto px-8 py-4 text-base rounded-xl">
            {t('addCargoBtn')}
          </Link>
        </div>
      </section>
    </>
  );
}
