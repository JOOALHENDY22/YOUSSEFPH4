import { Link } from 'react-router-dom';
import { ShieldAlert, Home, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="relative mb-8">
        <ShieldAlert className="h-32 w-32 text-gray-200 dark:text-gray-800" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-black text-gray-900 dark:text-white">404</span>
        </div>
      </div>
      
      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">{t('notfound.title')}</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mb-8">
        {t('notfound.desc')}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/" className="btn-primary flex items-center justify-center">
          <Home className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
          {t('notfound.btn_home')}
        </Link>
        <Link to="/search" className="btn-secondary flex items-center justify-center">
          <Search className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
          {t('notfound.btn_search')}
        </Link>
      </div>
    </div>
  );
}
