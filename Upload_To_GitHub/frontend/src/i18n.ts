import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import arTranslation from './locales/ar.json';
import arEGTranslation from './locales/ar-EG.json';

const resources = {
  en: {
    translation: enTranslation
  },
  ar: {
    translation: arTranslation
  },
  'ar-EG': {
    translation: arEGTranslation
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
