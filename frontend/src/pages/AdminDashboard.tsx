import React, { useState, useEffect } from 'react';
import { Lock, Key, ShieldCheck, Users, Eye, Database, Activity, RefreshCw, LogOut, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { fetchAdminStats, clearAdminStatsAPI } from '../services/api';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleResetAnalytics = async () => {
    if (window.confirm('هل أنت تأكد من تصفير وإعادة تعيين كافه بيانات الإحصائيات والزوار الحقيقيين؟')) {
      setLoading(true);
      await clearAdminStatsAPI();
      await loadStats();
    }
  };

  useEffect(() => {
    const authSession = sessionStorage.getItem('ymh_admin_auth');
    if (authSession === 'true') {
      setIsAuthenticated(true);
      loadStats();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const u = username.trim().toUpperCase();
    const p = password.trim().toUpperCase();

    if ((u === 'YOUSSEF' || u === 'ADMIN' || u === 'YMH') && (p === 'YOUSSEF482007' || p === '482007' || p === 'ADMIN')) {
      sessionStorage.setItem('ymh_admin_auth', 'true');
      setIsAuthenticated(true);
      loadStats();
    } else {
      setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة! (اسم المستخدم: YOUSSEF / كلمة المرور: YOUSSEF482007)');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ymh_admin_auth');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (e) {
      console.error("Failed to load admin stats", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 animate-fade-in">
        <div className="w-full max-w-md glass-panel p-8 shadow-2xl border border-primary-500/30 rounded-3xl relative overflow-hidden">
          {/* Accent Glow */}
          <div className="absolute -right-16 -top-16 w-40 h-40 bg-primary-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-gradient-to-tr from-gray-900 to-slate-800 text-amber-400 rounded-2xl shadow-lg mb-4 border border-amber-500/30">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              لوحة التحكم الإدارية المحمية
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              منطقة محمية تتطلب صلاحيات إدارة المنصة للاطلاع على إحصائيات وزوار الموقع
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-primary-500" />
                <span>اسم المستخدم (USERNAME):</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm font-bold dir-ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Key className="h-4 w-4 text-primary-500" />
                <span>كلمة المرور (PASSWORD):</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm font-bold dir-ltr"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 text-sm transition-all mt-2"
            >
              تسجيل الدخول كمالك للموقع
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in space-y-8">
      {/* Header Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 glass-panel p-6 border-l-4 border-l-amber-500 rtl:border-r-4 rtl:border-r-amber-500 rtl:border-l-0">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg mb-2">
            <ShieldCheck className="h-4 w-4" />
            <span>لوحة تحكم مالك المنصة (WELCOME YOUSSEF)</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            متابعة زوار وإحصائيات الموقع الحية
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetAnalytics}
            className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl transition-all flex items-center gap-2 border border-amber-200 dark:border-amber-900"
          >
            <RefreshCw className="h-4 w-4" />
            <span>تصفير الإحصائيات</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl transition-all flex items-center gap-2 border border-red-200 dark:border-red-900"
          >
            <LogOut className="h-4 w-4" />
            <span>قفل اللوحة</span>
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 text-primary-500 animate-spin mb-4" />
          <p className="text-gray-500 text-sm font-medium">جاري جلب إحصائيات وسجل الزوار من السيرفر...</p>
        </div>
      ) : stats && (
        <>
          {/* Top Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 border border-primary-100 dark:border-primary-950">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">إجمالي الأشخاص والزوار:</span>
                <Users className="h-5 w-5 text-primary-500" />
              </div>
              <p className="text-3xl font-black text-primary-600 dark:text-primary-400">
                {stats.totalVisitors} <span className="text-xs font-normal text-gray-400">زائر مسجل</span>
              </p>
            </div>

            <div className="glass-panel p-5 border border-emerald-100 dark:border-emerald-950">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">إجمالي المشاهدات والجلسات:</span>
                <Eye className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.totalVisits} <span className="text-xs font-normal text-gray-400">زيارة</span>
              </p>
            </div>

            <div className="glass-panel p-5 border border-blue-100 dark:border-blue-950">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">قواعد البيانات المباشرة:</span>
                <Database className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
                5 <span className="text-xs font-normal text-gray-400">قواعد 0ms</span>
              </p>
            </div>

            <div className="glass-panel p-5 border border-purple-100 dark:border-purple-950">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">حالة السيرفر والسرعة:</span>
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-3xl font-black text-purple-600 dark:text-purple-400">
                100% <span className="text-xs font-normal text-gray-400">نشط وحي</span>
              </p>
            </div>
          </div>

          {/* Visitors Log Table */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary-500" />
                  سجل الزوار والأشخاص الذين دخلوا الموقع:
                </h3>
                <p className="text-xs text-gray-500 mt-1">يظهر اسم كل زائر، تخصص، وبصمة جهازه الموثقة</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-200">
                مربوط بالأجهزة والموقع
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right rtl:text-right text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-bold bg-gray-50/50 dark:bg-gray-800/50">
                    <th className="p-3">#</th>
                    <th className="p-3">اسم الزائر</th>
                    <th className="p-3">التخصص / الصفة</th>
                    <th className="p-3">معرف الجهاز (DEVICE ID)</th>
                    <th className="p-3">تاريخ أول دخول</th>
                    <th className="p-3">آخر نشاط</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {stats.visitors && stats.visitors.length > 0 ? (
                    stats.visitors.map((visitor: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="p-3 font-bold text-gray-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>{visitor.name}</span>
                        </td>
                        <td className="p-3 font-semibold text-primary-600 dark:text-primary-400">
                          {visitor.role}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-gray-500 dir-ltr text-right rtl:text-left">
                          {visitor.deviceId}
                        </td>
                        <td className="p-3 text-gray-500 dir-ltr text-right rtl:text-left">
                          {new Date(visitor.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3 text-gray-500 dir-ltr text-right rtl:text-left">
                          {new Date(visitor.lastActive || visitor.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">لا يوجد زوار مسجلين حالياً</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Database Health Overview */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <Database className="h-5 w-5 text-indigo-500" />
              حجم وقواعد البيانات الخاصة بالموقع (Master Databases):
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 block mb-1">الأدوية المصرية والعالمية</span>
                <strong className="text-base text-primary-600 dark:text-primary-400">{stats.masterDrugsCount} دواء</strong>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 block mb-1">التداخلات الدوائية</span>
                <strong className="text-base text-emerald-600 dark:text-emerald-400">{stats.interactionsCount} ثنائي</strong>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 block mb-1">المقارنات الكلينيكية</span>
                <strong className="text-base text-blue-600 dark:text-blue-400">{stats.comparisonsCount} ثنائي</strong>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 block mb-1">بدائل الأدوية</span>
                <strong className="text-base text-purple-600 dark:text-purple-400">{stats.alternativesCount} دواء</strong>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 block mb-1">أدوية الجدول</span>
                <strong className="text-base text-red-600 dark:text-red-400">{stats.scheduledDrugsCount} دواء</strong>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
