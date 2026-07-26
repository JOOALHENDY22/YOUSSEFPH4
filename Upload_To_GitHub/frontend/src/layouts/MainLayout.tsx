import { Outlet, Link, useLocation } from 'react-router-dom';
import { Pill, Search, Activity, Scale, Heart, History, Info, Moon, Sun, Menu, X, Globe, ShieldAlert, RefreshCw, Stethoscope, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import UserWelcomeModal, { getUserProfile, UserProfile } from '../components/UserWelcomeModal';
import { trackVisitor } from '../services/api';

export default function MainLayout() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(getUserProfile());

  useEffect(() => {
    const existing = getUserProfile();
    const deviceId = existing?.deviceId || ('DEV-GUEST-ANON-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    const name = existing?.name || '';
    const role = existing?.role || '';
    trackVisitor({ name, role, deviceId });
  }, []);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setUserProfile(getUserProfile());
    };
    window.addEventListener('user_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('user_profile_updated', handleProfileUpdate);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Update direction for RTL support
    const dir = i18n.language.startsWith('ar') ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng.startsWith('ar') ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
    setIsLangMenuOpen(false);
  };

  const navItems = [
    { name: t('nav.search'), path: '/search', icon: Search },
    { name: t('nav.alternatives') || 'بدائل الأدوية', path: '/alternatives', icon: RefreshCw },
    { name: t('nav.emergency') || 'استشارة الطوارئ', path: '/emergency', icon: Stethoscope },
    { name: t('nav.scheduled'), path: '/scheduled', icon: ShieldAlert },
    { name: t('nav.interactions'), path: '/interaction', icon: Activity },
    { name: t('nav.compare'), path: '/compare', icon: Scale },
    { name: t('nav.favorites'), path: '/favorites', icon: Heart },
    { name: t('nav.history'), path: '/history', icon: History },
    { name: t('nav.about'), path: '/about', icon: Info },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      <UserWelcomeModal />

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel rounded-none border-t-0 border-l-0 border-r-0 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group rtl:space-x-reverse">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl group-hover:scale-105 transition-transform">
                <Pill className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                YMH <span className="text-primary-600 dark:text-primary-400">DRUG CHECK</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center space-x-1 rtl:space-x-reverse">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse relative">

              {/* User Profile Badge */}
              {userProfile && (
                <button 
                  onClick={() => {
                    localStorage.removeItem('ymh_user_profile');
                    window.dispatchEvent(new Event('user_profile_updated'));
                    window.location.reload();
                  }}
                  title="تعديل اسمك أو تغيير الحساب"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 text-xs font-bold text-primary-700 dark:text-primary-300 hover:bg-primary-100 transition-all"
                >
                  <User className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                  <span className="max-w-[90px] truncate">{userProfile.name}</span>
                </button>
              )}

              {/* Language Switcher */}
              <div className="relative" ref={langMenuRef}>
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center"
                  aria-label="Change Language"
                >
                  <Globe className="h-5 w-5" />
                </button>
                
                <AnimatePresence>
                  {isLangMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 rounded-2xl shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 overflow-hidden z-50 border border-gray-100 dark:border-gray-700"
                    >
                      <div className="py-1">
                        <button onClick={() => changeLanguage('ar-EG')} className={`w-full text-left rtl:text-right px-4 py-2.5 text-xs font-bold flex items-center justify-between ${i18n.language === 'ar-EG' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><span>🇪🇬 عامية مصرية</span></button>
                        <button onClick={() => changeLanguage('ar')} className={`w-full text-left rtl:text-right px-4 py-2.5 text-xs font-bold flex items-center justify-between ${i18n.language === 'ar' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><span>🇸🇦 عربي فصحى</span></button>
                        <button onClick={() => changeLanguage('en')} className={`w-full text-left rtl:text-right px-4 py-2.5 text-xs font-bold flex items-center justify-between ${i18n.language === 'en' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><span>🇬🇧 English</span></button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              <div className="xl:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                  aria-label="Toggle Mobile Menu"
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden glass-panel rounded-none border-x-0 border-b border-t-0 shadow-2xl"
          >
            <div className="px-4 pt-3 pb-6 space-y-1.5 max-h-[80vh] overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive 
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="glass-panel rounded-none border-x-0 border-b-0 border-t border-gray-200 dark:border-gray-800 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} YMH DRUG CHECK. {t('footer.rights') || 'جميع الحقوق محفوظة.'}</p>
        </div>
      </footer>
    </div>
  );
}
