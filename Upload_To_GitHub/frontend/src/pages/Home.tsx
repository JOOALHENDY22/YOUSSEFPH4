import { motion } from 'framer-motion';
import { Search, ShieldCheck, Zap, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-100/50 via-gray-50 to-gray-50 dark:from-primary-900/20 dark:via-gray-900 dark:to-gray-900"></div>
        
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-4xl mx-auto px-4"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            <span>{t('home.badge')}</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            {t('home.title_part1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">{t('home.title_highlight')}</span> {t('home.title_part2')}
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('home.description')}
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 rtl:space-x-reverse">
            <Link to="/search" className="w-full sm:w-auto btn-primary text-base px-8 py-4 rounded-2xl shadow-lg shadow-primary-500/25">
              <Search className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('home.search_btn')}
            </Link>
            <Link to="/interaction" className="w-full sm:w-auto btn-secondary text-base px-8 py-4 rounded-2xl">
              <Activity className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('home.interact_btn')}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[
            { label: t('home.stats.drugs_label'), value: '50,000+' },
            { label: t('home.stats.interact_label'), value: '2M+' },
            { label: t('home.stats.pro_label'), value: '10,000+' },
            { label: t('home.stats.uptime_label'), value: '99.9%' },
          ].map((stat, i) => (
            <div key={i} className="glass-panel p-6 text-center flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Creator Banner */}
      <section className="w-full py-6 bg-primary-900 text-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm font-medium text-primary-200 uppercase tracking-widest mb-1">{t('creator_banner.title')}</p>
          <h3 className="text-2xl md:text-3xl font-bold mb-2">
            {t('creator_banner.created_by')} <span className="text-primary-300">Youssef Mohamed</span>
          </h3>
          <p className="text-primary-100 dark:text-gray-300">
            {t('creator_banner.desc')}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.features_title')}</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{t('home.features_desc')}</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Search,
              title: t('home.f1_title'),
              desc: t('home.f1_desc'),
              color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20'
            },
            {
              icon: ShieldCheck,
              title: t('home.f2_title'),
              desc: t('home.f2_desc'),
              color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20'
            },
            {
              icon: Zap,
              title: t('home.f3_title'),
              desc: t('home.f3_desc'),
              color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/20'
            }
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="glass-panel p-8 hover:-translate-y-1 transition-transform duration-300">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full py-8 mt-auto border-t border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-4xl mx-auto px-4 gap-4">
          <div>
            <p>&copy; {new Date().getFullYear()} {t('footer.rights')}</p>
            <p className="mt-1">{t('footer.disclaimer')}</p>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">{t('footer.designed_by')}</p>
            <a 
              href="https://wa.me/qr/2ZQYXCK7REOIC1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors text-sm font-medium shadow-sm"
            >
              <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
