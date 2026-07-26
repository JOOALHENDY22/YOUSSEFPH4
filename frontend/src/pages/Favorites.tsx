import { Heart, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export default function Favorites() {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedDrugs') || '[]');
    setFavorites(saved);
  }, []);

  const removeFavorite = (drug: string) => {
    const newFavorites = favorites.filter(d => d !== drug);
    setFavorites(newFavorites);
    localStorage.setItem('savedDrugs', JSON.stringify(newFavorites));
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center space-x-3 rtl:space-x-reverse mb-8">
        <Heart className="h-8 w-8 text-red-500 fill-current" />
        <h1 className="text-3xl font-bold">{t('favorites.title')}</h1>
      </div>

      {favorites.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {favorites.map((drug, i) => (
            <div key={i} className="glass-panel p-6 flex justify-between items-center relative group">
              <div>
                <h3 className="font-bold text-lg">{drug}</h3>
                <p className="text-sm text-gray-500">Saved</p>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Link to={`/drug/${drug.toLowerCase()}`} className="btn-secondary text-sm">
                  {t('favorites.btn_view')}
                </Link>
                <button 
                  onClick={() => removeFavorite(drug)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Remove from favorites"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('favorites.no_saved_title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
            {t('favorites.no_saved_desc')}
          </p>
          <Link to="/search" className="btn-primary flex items-center">
            <Search className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t('favorites.btn_search')}
          </Link>
        </div>
      )}
    </div>
  );
}
