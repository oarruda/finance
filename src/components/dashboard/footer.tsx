'use client';
import { useLanguage } from '@/lib/i18n';

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="border-t bg-[#3a3a3a] backdrop-blur">
      <div className="container mx-auto px-4 py-4">
        <p className="text-center text-sm text-white">
          {t('footer.quote')}
        </p>
      </div>
    </footer>
  );
}
