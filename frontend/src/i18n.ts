import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import arTranslation from './locales/ar.json';
import arEGTranslation from './locales/ar-EG.json';

const resources = {
  ar: {
    translation: arTranslation
  },
  'ar-EG': {
    translation: arEGTranslation
  },
  en: {
    translation: enTranslation
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar-EG', // default to Egyptian Dialect / Arabic
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
