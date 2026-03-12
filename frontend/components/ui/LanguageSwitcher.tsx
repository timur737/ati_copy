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
    <div className="flex items-center gap-2 px-1">
      <select
        value={locale}
        onChange={handleLocaleChange}
        className="input-field !py-1.5 !px-2 text-sm w-auto cursor-pointer"
        style={{ minWidth: '56px' }}
      >
        <option value="ru">RU</option>
        <option value="ky">KY</option>
      </select>
    </div>
  );
}
