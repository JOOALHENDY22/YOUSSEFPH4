import React, { useState, useEffect } from 'react';
import { User, Sparkles, ArrowRight, Pill } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackVisitor } from '../services/api';

export interface UserProfile {
  name: string;
  role: string;
  deviceId: string;
  createdAt: string;
}

export function getUserProfile(): UserProfile | null {
  try {
    const data = localStorage.getItem('ymh_user_profile');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export default function UserWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('دكتور صيدلي / Pharmacist');

  useEffect(() => {
    const existing = getUserProfile();
    if (existing) {
      trackVisitor({ name: existing.name, role: existing.role, deviceId: existing.deviceId });
    } else {
      // Delay modal opening slightly for smooth entrance animation
      const timer = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const deviceId = 'DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    const profile: UserProfile = {
      name: name.trim(),
      role,
      deviceId,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('ymh_user_profile', JSON.stringify(profile));
    trackVisitor({ name: profile.name, role: profile.role, deviceId: profile.deviceId });
    window.dispatchEvent(new Event('user_profile_updated'));
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg glass-panel p-6 sm:p-8 shadow-2xl border border-primary-500/30 bg-white/95 dark:bg-slate-900/95 text-gray-900 dark:text-white rounded-3xl overflow-hidden relative"
          >
            {/* Background Accent Gradients */}
            <div className="absolute -right-20 -top-20 w-56 h-56 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="text-center mb-6 relative z-10">
              <div className="inline-flex p-3.5 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-primary-500/30 mb-3">
                <Pill className="h-8 w-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary-600 to-gray-900 dark:from-white dark:via-primary-400 dark:to-white">
                أهلاً بك في منصة YMH DRUG CHECK
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                مرحباً بك! يرجى إدخال اسمك الكريم لتخصيص التصفح وسجل البحث والمفضلة لصفحتك الشخصية.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-5 relative z-10">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-primary-500" />
                  <span>الاسم الكريم (مثال: د. أحمد علي / Dr. Ahmed Ali):</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك هنا..."
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary-500" />
                  <span>التخصص / الصفة:</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                >
                  <option value="دكتور صيدلي / Pharmacist">دكتور صيدلي / Pharmacist</option>
                  <option value="طبيب بشري / Medical Doctor">طبيب بشري / Medical Doctor</option>
                  <option value="طالب طب / صيدلة / Medical Student">طالب طب / صيدلة / Student</option>
                  <option value="مستخدم / Patient">مستخدم عام / General User</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="w-full py-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/25 flex items-center justify-center gap-2 text-base transition-all disabled:opacity-50"
                >
                  <span>بدء الاستخدام وتفعيل الحساب الشخصي</span>
                  <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
