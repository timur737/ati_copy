'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { ChangeEvent } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    const newPath = pathname.replace(new RegExp(`^/${locale}`), `/${nextLocale}`);
    router.replace(newPath || `/${nextLocale}`);
  };

  return (
    <div className="flex items-center gap-2 px-2">
      <select
        value={locale}
        onChange={handleLocaleChange}
        className="bg-surface-muted text-slate-300 border border-slate-700/50 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand-500 cursor-pointer hover:bg-surface-card transition-colors"
      >
        <option value="ru">RU</option>
        <option value="ky">KY</option>
      </select>
    </div>
  );
}
