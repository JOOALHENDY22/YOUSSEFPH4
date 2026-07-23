import { Pill, Mail, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto py-12 animate-fade-in">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center p-4 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-6">
          <Pill className="h-12 w-12 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('about.title')}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          {t('about.subtitle')}
        </p>
      </div>

      <div className="space-y-8">
        <div className="glass-panel p-8">
          <h2 className="text-2xl font-bold mb-4">{t('about.mission_title')}</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
            {t('about.mission_desc')}
          </p>
        </div>

        <div className="glass-panel p-8">
          <h2 className="text-2xl font-bold mb-4">{t('creator_banner.title')}</h2>
          <div className="p-4 bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-900/50 rounded-xl text-primary-900 dark:text-primary-100 leading-relaxed text-center relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-lg font-medium">
                {t('creator_banner.created_by')} <span className="font-bold text-primary-600 dark:text-primary-400">Youssef Mohamed</span>
              </p>
              <div className="mt-4 mb-2 flex justify-center bg-white/50 dark:bg-white/10 p-2 rounded-xl inline-block mx-auto">
                <img 
                  src="https://ecu.edu.eg/wp-content/uploads/2021/04/ECU-Logo.png" 
                  alt="Egyptian Chinese University Logo" 
                  className="h-24 object-contain drop-shadow-md"
                />
              </div>
              <p className="mt-2 text-gray-700 dark:text-gray-300">
                {t('creator_banner.desc')}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8">
          <h2 className="text-2xl font-bold mb-4">{t('about.connect_title')}</h2>
          <div className="flex flex-wrap gap-4">
            <a href="mailto:jooalhendy2@gmail.com" className="flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors border border-blue-200 dark:border-blue-900/50">
              <Mail className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
              jooalhendy2@gmail.com
            </a>
            <a href="https://wa.me/qr/2ZQYXCK7REOIC1" target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors border border-green-200 dark:border-green-900/50">
              <Globe className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
