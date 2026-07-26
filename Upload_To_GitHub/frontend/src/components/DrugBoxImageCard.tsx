import React, { useState } from 'react';
import { Package, ShieldCheck, Pill } from 'lucide-react';

interface DrugBoxImageCardProps {
  drugName: string;
  activeIngredient?: string;
  imageUrl?: string;
  isScheduled?: boolean;
  isEmergency?: boolean;
  productType?: string;
}

export const DrugBoxImageCard: React.FC<DrugBoxImageCardProps> = ({
  drugName,
  activeIngredient,
  imageUrl,
  isScheduled,
  isEmergency,
  productType
}) => {
  const [imageError, setImageError] = useState(false);

  // High-definition 3D Pharmaceutical Packaging Box render fallback
  if (imageError || !imageUrl) {
    return (
      <div className="relative w-full h-56 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col justify-between p-5 select-none transition-transform duration-500 hover:scale-[1.02]">
        {/* Background 3D Box Packaging Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
        
        {/* Top Header Badge */}
        <div className="flex justify-between items-start z-10">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-semibold border border-white/20">
            <Package className="h-3.5 w-3.5 text-amber-400" />
            <span>جمهورية مصر العربية - وزارة الصحة</span>
          </div>

          {isScheduled ? (
            <span className="px-2.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-md shadow-md animate-pulse">
              أدوية جدول 🔒
            </span>
          ) : isEmergency ? (
            <span className="px-2.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-md shadow-md">
              روشتة طبية 🚨
            </span>
          ) : (
            <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md shadow-md">
              OTC متاح 🟢
            </span>
          )}
        </div>

        {/* 3D Box Center Branding */}
        <div className="my-auto text-center z-10 space-y-1">
          <div className="inline-block p-2 rounded-2xl bg-indigo-500/20 backdrop-blur-md mb-1 border border-indigo-400/30">
            <Pill className="h-8 w-8 text-cyan-400 mx-auto" />
          </div>
          <h3 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">
            {drugName.toUpperCase()}
          </h3>
          <p className="text-xs text-indigo-300 font-medium truncate max-w-[90%] mx-auto dir-ltr">
            {activeIngredient || 'مستحضر صيدلي مصري مسجل'}
          </p>
        </div>

        {/* Bottom Box Footer */}
        <div className="flex justify-between items-center z-10 pt-2 border-t border-white/10 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            علبة مستحضر أصلي 📦
          </span>
          <span className="font-mono text-indigo-300">{productType || 'مصر - EDA Registered'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-56 w-full rounded-2xl overflow-hidden mb-3 bg-gray-100 dark:bg-gray-800 flex items-center justify-center group shadow-md border border-gray-100 dark:border-gray-800">
      <img
        src={imageUrl}
        alt={drugName}
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute top-2 right-2 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] rounded-lg font-medium">
        صورة علبة الدواء 📦 (السوق المصري)
      </div>
    </div>
  );
};
