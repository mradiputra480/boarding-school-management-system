import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Users, UserSquare2, BookOpen, TrendingUp, FileSpreadsheet, Settings, Shield, Building2, Activity, Database, HardDrive, Server, Clock, RefreshCw } from 'lucide-react';
import api from '@/lib/axios';
import { useSchoolStore } from '@/stores/schoolStore';
import { useLangStore } from '@/stores/langStore';

interface DashboardStats {
  total_teachers: number;
  total_students: number;
  total_classes: number;
}

interface DashboardResponse {
  stats: DashboardStats;
  active_semester: string;
  submit_tracker: Array<{
    class_id: number;
    class_name: string;
    homeroom: string;
    total_subjects: number;
    submitted_count: number;
    percentage: number;
    subjects: Array<{
      subject_id: number;
      subject_name: string;
      is_submitted: boolean;
      submitted_at: string | null;
    }>;
  }>;
  recent_events: Array<{
    id: number;
    name: string;
    description: string;
    status: string;
    academic_year: string;
    results_count: number;
    created_at: string;
  }>;
  recent_documents: Array<{
    id: number;
    title: string;
    type: string;
    status: string;
    recipients_count: number;
    created_at: string;
  }>;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile: school, fetch: fetchSchool } = useSchoolStore();
  const { t } = useLangStore();

  // System Health state
  interface HealthData {
    status: 'healthy' | 'degraded' | 'critical';
    response_ms: number;
    speed_rating: string;
    environment: {
      type: string;
      cache_driver: string;
      queue_driver: string;
      exec_available: boolean;
      php_version: string;
      php_compatible: boolean;
    };
    services: {
      database: { ok: boolean; ms: number };
      cache: { ok: boolean; ms: number; driver: string };
      queue: { driver: string; status: string; workers?: number };
      opcache: { enabled: boolean; scripts: number; hit_rate: number; memory_used_mb: number } | null;
    };
    resources: {
      disk_used_pct: number;
      disk_free_gb: number | null;
      storage_mb: number;
      php_memory_mb: number;
      php_memory_limit_mb: number;
    };
    backup: { last: string | null; count: number; days_since: number | null; status: string; total_size_mb?: number };
    alerts: Array<{ key: string; level: string; params: Record<string, any> }>;
    timestamp: string;
  }
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState(false);
  const [lastHealthPoll, setLastHealthPoll] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const r = await api.get('/admin/system/health');
      setHealth(r.data);
      setHealthError(false);
      setLastHealthPoll(new Date());
    } catch {
      setHealthError(true);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchool();
    const fetchDashboard = async () => {
      try {
        const dashRes = await api.get('/admin/dashboard');
        setData(dashRes.data);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
    fetchHealth();

    // Poll health every 30 seconds
    const healthInterval = setInterval(fetchHealth, 30000);
    return () => clearInterval(healthInterval);
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <AdminLayout title={t('dashboard.mainTitle')}>
      <div className="flex flex-col gap-6">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-[#2d7a50] to-[#1b5e3a] rounded-2xl p-8 text-white flex justify-between items-center relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 opacity-10 w-64 h-64 bg-layout-card rounded-full -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-1/3 opacity-5 w-40 h-40 bg-layout-card rounded-full translate-y-1/2"></div>
          <div className="z-10 flex items-start gap-5">
            {school?.logoUrl ? (
              <img src={school.logoUrl} className="w-16 h-16 rounded-xl object-contain bg-layout-card/10 p-1.5 shrink-0 hidden sm:block" alt="Logo"/>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-layout-card/10 flex items-center justify-center shrink-0 hidden sm:block">
                <Building2 className="w-8 h-8 text-white/60"/>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold mb-1">{school?.name || t('dashboard.title')}</h1>
              <p className="text-layout-muted text-sm max-w-lg leading-relaxed">
                {t('dashboard.welcome')} <strong className="text-white">{data?.active_semester || t('common.loading')}</strong>.
              </p>
              <p className="text-white/50 text-xs mt-3">{dateStr} • {timeStr} WIB</p>
            </div>
          </div>
          <div className="z-10 hidden md:flex p-4 bg-layout-card/10 rounded-xl backdrop-blur-sm border border-white/20 items-center gap-3">
             <div className="w-12 h-12 bg-layout-card/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
             </div>
             <div>
               <p className="text-xs text-white/70 uppercase tracking-widest font-semibold mb-1">{t('dashboard.systemStatus')}</p>
               <p className="text-sm font-bold text-[#d4a23a]">{t('dashboard.systemNormal')}</p>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div onClick={() => navigate('/admin/students')} className="bg-layout-card p-6 rounded-2xl border border-layout-border shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#3a8fd4]/10 text-[#3a8fd4] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-layout-muted text-[13px] font-medium">{t('dashboard.totalStudents')}</p>
                <h3 className="text-2xl font-bold text-layout-text">{loading ? '...' : data?.stats.total_students}</h3>
              </div>
            </div>
            <div className="text-xs text-layout-muted flex items-center gap-1.5 mt-2">
              <span className="text-[#3a8fd4] font-semibold bg-[#3a8fd4]/10 px-1.5 py-0.5 rounded">Klik</span>
              {t('dashboard.viewAllStudents')}
            </div>
          </div>

          <div onClick={() => navigate('/admin/teachers')} className="bg-layout-card p-6 rounded-2xl border border-layout-border shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#d4a23a]/10 text-[#d4a23a] flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserSquare2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-layout-muted text-[13px] font-medium">{t('dashboard.totalTeachers')}</p>
                <h3 className="text-2xl font-bold text-layout-text">{loading ? '...' : data?.stats.total_teachers}</h3>
              </div>
            </div>
            <div className="text-xs text-layout-muted flex items-center gap-1.5 mt-2">
              <span className="text-[#d4a23a] font-semibold bg-[#d4a23a]/10 px-1.5 py-0.5 rounded">Klik</span>
              {t('dashboard.manageTeachers')}
            </div>
          </div>

          <div onClick={() => navigate('/admin/classes')} className="bg-layout-card p-6 rounded-2xl border border-layout-border shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#2d7a50]/10 text-[#2d7a50] flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-layout-muted text-[13px] font-medium">{t('dashboard.totalClasses')}</p>
                <h3 className="text-2xl font-bold text-layout-text">{loading ? '...' : data?.stats.total_classes}</h3>
              </div>
            </div>
            <div className="text-xs text-layout-muted flex items-center gap-1.5 mt-2">
              <span className="text-[#2d7a50] font-semibold bg-[#2d7a50]/10 px-1.5 py-0.5 rounded">Semester</span>
              {t('dashboard.perSemester')}
            </div>
          </div>
        </div>

        {/* System Health Monitor */}
        <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#2d7a50]/5 to-transparent rounded-bl-full pointer-events-none"></div>
          <div className="p-5 border-b border-layout-border flex justify-between items-center bg-layout-bg/50 relative z-10">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${health?.status === 'healthy' ? 'bg-[#2d7a50]/10 text-[#2d7a50]' : 'bg-[#d45a5a]/10 text-[#d45a5a]'}`}>
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-layout-text flex items-center gap-2">
                  System Health Monitor
                  {health?.status === 'healthy' && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2d7a50] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#2d7a50]"></span></span>}
                  {health?.status === 'degraded' && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d45a5a] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#d45a5a]"></span></span>}
                </h3>
                <p className="text-xs text-layout-muted">
                  Auto-refresh setiap 30 detik
                  {lastHealthPoll && <span> • Terakhir: {lastHealthPoll.toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>}
                </p>
              </div>
            </div>
            <button onClick={fetchHealth} className="p-2 rounded-lg border border-layout-border text-layout-muted hover:bg-layout-hover hover:text-[#2d7a50] transition-colors" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="p-5">
            {healthError ? (
              <div className="text-center py-4 text-[#d45a5a] text-sm">
                ⚠️ Gagal mengambil data health. Server mungkin tidak dapat dijangkau.
              </div>
            ) : healthLoading && !health ? (
              <div className="text-center py-4 text-layout-muted text-sm">Memuat status sistem...</div>
            ) : health && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Database */}
                <div className={`p-3 rounded-xl border transition-all ${health.services.database.ok ? 'border-[#2d7a50]/20 bg-[#2d7a50]/5' : 'border-[#d45a5a]/20 bg-[#d45a5a]/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Database className={`w-4 h-4 ${health.services.database.ok ? 'text-[#2d7a50]' : 'text-[#d45a5a]'}`} />
                    <span className="text-[11px] font-bold text-layout-text uppercase tracking-wider">MySQL</span>
                  </div>
                  <p className={`text-lg font-bold ${health.services.database.ok ? 'text-[#2d7a50]' : 'text-[#d45a5a]'}`}>
                    {health.services.database.ok ? `${health.services.database.ms}ms` : 'DOWN'}
                  </p>
                  <p className="text-[10px] text-layout-muted">{health.services.database.ok ? 'Koneksi OK' : 'Gagal koneksi'}</p>
                </div>
                {/* Cache */}
                <div className={`p-3 rounded-xl border transition-all ${health.services.cache.ok ? 'border-[#2d7a50]/20 bg-[#2d7a50]/5' : 'border-[#d45a5a]/20 bg-[#d45a5a]/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Server className={`w-4 h-4 ${health.services.cache.ok ? 'text-[#2d7a50]' : 'text-[#d45a5a]'}`} />
                    <span className="text-[11px] font-bold text-layout-text uppercase tracking-wider">Cache</span>
                  </div>
                  <p className={`text-lg font-bold ${health.services.cache.ok ? 'text-[#2d7a50]' : 'text-[#d45a5a]'}`}>
                    {health.services.cache.ok ? `${health.services.cache.ms}ms` : 'DOWN'}
                  </p>
                  <p className="text-[10px] text-layout-muted">{health.services.cache.driver} {health.services.cache.ok ? '• aktif' : '• error'}</p>
                </div>
                {/* OPcache */}
                <div className={`p-3 rounded-xl border transition-all ${health.services.opcache?.enabled ? 'border-[#3a8fd4]/20 bg-[#3a8fd4]/5' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className={`w-4 h-4 ${health.services.opcache?.enabled ? 'text-[#3a8fd4]' : 'text-gray-400'}`} />
                    <span className="text-[11px] font-bold text-layout-text uppercase tracking-wider">OPcache</span>
                  </div>
                  <p className={`text-lg font-bold ${health.services.opcache?.enabled ? 'text-[#3a8fd4]' : 'text-gray-400'}`}>
                    {health.services.opcache ? `${health.services.opcache.hit_rate}%` : 'N/A'}
                  </p>
                  <p className="text-[10px] text-layout-muted">{health.services.opcache ? `${health.services.opcache.scripts} scripts cached` : 'CLI mode'}</p>
                </div>
                {/* Disk */}
                <div className={`p-3 rounded-xl border transition-all ${(health.resources.disk_used_pct ?? 0) < 80 ? 'border-[#d4a23a]/20 bg-[#d4a23a]/5' : 'border-[#d45a5a]/20 bg-[#d45a5a]/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <HardDrive className={`w-4 h-4 ${(health.resources.disk_used_pct ?? 0) < 80 ? 'text-[#d4a23a]' : 'text-[#d45a5a]'}`} />
                    <span className="text-[11px] font-bold text-layout-text uppercase tracking-wider">Disk</span>
                  </div>
                  <p className={`text-lg font-bold ${(health.resources.disk_used_pct ?? 0) < 80 ? 'text-[#d4a23a]' : 'text-[#d45a5a]'}`}>
                    {health.resources.disk_used_pct}%
                  </p>
                  <p className="text-[10px] text-layout-muted">{health.resources.disk_free_gb ?? '?'} GB tersisa</p>
                </div>
                {/* Backup */}
                <div className={`p-3 rounded-xl border transition-all ${health.backup.status === 'ok' ? 'border-[#2d7a50]/20 bg-[#2d7a50]/5' : 'border-[#d45a5a]/20 bg-[#d45a5a]/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className={`w-4 h-4 ${health.backup.status === 'ok' ? 'text-[#2d7a50]' : 'text-[#d45a5a]'}`} />
                    <span className="text-[11px] font-bold text-layout-text uppercase tracking-wider">Backup</span>
                  </div>
                  <p className={`text-sm font-bold ${health.backup.status === 'ok' ? 'text-[#2d7a50]' : 'text-[#d45a5a]'}`}>
                    {health.backup.last || 'Tidak ada'}
                  </p>
                  <p className="text-[10px] text-layout-muted">{health.backup.count} file • {health.backup.status === 'ok' ? 'Backup rutin' : health.backup.status === 'none' ? 'Belum ada' : `${health.backup.days_since}+ hari`}</p>
                </div>
                {/* Queue */}
                <div className={`p-3 rounded-xl border transition-all ${health.services.queue.status === 'immediate' ? 'border-purple-500/20 bg-purple-500/5' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className={`w-4 h-4 ${health.services.queue.status === 'immediate' ? 'text-purple-500' : 'text-gray-400'}`} />
                    <span className="text-[11px] font-bold text-layout-text uppercase tracking-wider">Queue</span>
                  </div>
                  <p className={`text-lg font-bold ${health.services.queue.status === 'immediate' ? 'text-purple-500' : 'text-gray-400'}`}>
                    {health.services.queue.driver}
                  </p>
                  <p className="text-[10px] text-layout-muted">{health.services.queue.status === 'immediate' ? 'Langsung proses' : health.services.queue.workers ? `${health.services.queue.workers} worker` : 'Background'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
           {/* Info Penting */}
           <div className="bg-layout-card p-6 rounded-2xl border border-layout-border shadow-sm">
             <h3 className="text-[15px] font-bold text-layout-text mb-4">📌 {t('dashboard.importantInfo')}</h3>
             <div className="flex flex-col gap-3">
               <div className="flex gap-3 items-start p-3 bg-[#2d7a50]/10 rounded-xl">
                 <div className="w-2 h-2 mt-2 rounded-full bg-[#2d7a50] shrink-0"></div>
                 <div>
                   <p className="text-sm font-medium text-layout-text">{t('dashboard.teacherPassTitle')}</p>
                   <p className="text-xs text-layout-text opacity-70 mt-0.5">{t('dashboard.teacherPassDesc')}<strong className="text-[#2d7a50]">guru1236</strong></p>
                 </div>
               </div>
               <div className="flex gap-3 items-start p-3 bg-[#3a8fd4]/5 rounded-xl">
                 <div className="w-2 h-2 mt-2 rounded-full bg-[#3a8fd4] shrink-0"></div>
                 <div>
                   <p className="text-sm font-medium text-layout-text">{t('dashboard.parentPassTitle')}</p>
                   <p className="text-xs text-layout-text opacity-70 mt-0.5">{t('dashboard.parentPassDesc')}<strong className="text-[#3a8fd4]">parents123</strong></p>
                 </div>
               </div>
               <div className="flex gap-3 items-start p-3 bg-[#d4a23a]/5 rounded-xl">
                 <div className="w-2 h-2 mt-2 rounded-full bg-[#d4a23a] shrink-0"></div>
                 <div>
                   <p className="text-sm font-medium text-layout-text">{t('dashboard.parentLoginTitle')}</p>
                   <p className="text-xs text-layout-text opacity-70 mt-0.5">{t('dashboard.parentLoginDesc')}</p>
                 </div>
               </div>
             </div>
           </div>
           
           {/* Akses Cepat */}
           <div className="bg-layout-card p-6 rounded-2xl border border-layout-border shadow-sm">
             <h3 className="text-[15px] font-bold text-layout-text mb-4">⚡ {t('dashboard.quickAccess')}</h3>
             <div className="grid grid-cols-2 gap-3">
               <button onClick={() => navigate('/admin/teachers')} className="p-4 text-sm font-medium text-[#2d7a50] bg-[#2d7a50]/10 hover:bg-[#2d7a50] hover:text-white rounded-xl transition-all text-left flex flex-col gap-2 group">
                 <UserSquare2 className="w-5 h-5 group-hover:scale-110 transition-transform" />{t('teachers.addNew')}</button>
               <button onClick={() => navigate('/admin/students')} className="p-4 text-sm font-medium text-[#3a8fd4] bg-[#3a8fd4]/10 hover:bg-[#3a8fd4] hover:text-white rounded-xl transition-all text-left flex flex-col gap-2 group">
                 <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                 Input Data Siswa
               </button>
               <button onClick={() => navigate('/admin/accounts')} className="p-4 text-sm font-medium text-[#d4a23a] bg-[#d4a23a]/10 hover:bg-[#d4a23a] hover:text-white rounded-xl transition-all text-left flex flex-col gap-2 group">
                 <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                 Manajemen Akun
               </button>
               <button onClick={() => navigate('/admin/semesters')} className="p-4 text-sm font-medium text-layout-muted bg-[#6b8a7d]/10 hover:bg-[#6b8a7d] hover:text-white rounded-xl transition-all text-left flex flex-col gap-2 group">
                 <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />{t('semesters.settings')}</button>
             </div>
           </div>
        </div>

        {/* Submit Tracker Widget */}
        <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-5 border-b border-layout-border flex justify-between items-center bg-layout-bg/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#3a8fd4]/10 text-[#3a8fd4] flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-layout-text">Progress Submit Nilai (Admin Nilai)</h3>
                <p className="text-xs text-layout-muted">Pantau status pengisian nilai per kelas</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-layout-text">
              <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="px-5 py-3">Kelas</th>
                  <th className="px-5 py-3">Homeroom</th>
                  <th className="px-5 py-3 text-center">Progress</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8e5]">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-6 text-center text-layout-muted">{t('common.loading')}</td></tr>
                ) : data?.submit_tracker?.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-6 text-center text-layout-muted">Belum ada data pengumpulan nilai.</td></tr>
                ) : (
                  data?.submit_tracker?.map((tracker) => (
                    <tr key={tracker.class_id} className="hover:bg-layout-hover transition-colors">
                      <td className="px-5 py-4 font-bold text-layout-text">{tracker.class_name}</td>
                      <td className="px-5 py-4 text-layout-muted">{tracker.homeroom}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-layout-border rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${tracker.percentage === 100 ? 'bg-[#2d7a50]' : tracker.percentage > 0 ? 'bg-[#3a8fd4]' : 'bg-layout-muted'}`}
                              style={{ width: `${tracker.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold w-10 text-right">{tracker.percentage}%</span>
                        </div>
                        <div className="text-[10px] text-layout-muted text-center mt-1">
                          {tracker.submitted_count} dari {tracker.total_subjects} Mapel
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {tracker.percentage === 100 ? (
                          <span className="inline-flex items-center gap-1 bg-[#2d7a50]/10 text-[#2d7a50] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">
                            ✓ Lengkap
                          </span>
                        ) : tracker.percentage > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-[#3a8fd4]/10 text-[#3a8fd4] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">
                            Proses
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-layout-muted/10 text-layout-muted px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">
                            Belum Ada
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assessment Events Widget */}
        <div className="bg-layout-card border border-[#d4a23a]/30 rounded-xl shadow-sm overflow-hidden mb-6 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4a23a]/5 rounded-bl-full pointer-events-none"></div>
          <div className="p-5 border-b border-layout-border flex justify-between items-center bg-layout-bg/50 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#d4a23a]/10 text-[#d4a23a] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-[#d4a23a]">Event Penilaian</h3>
                <p className="text-xs text-layout-muted">Status event dan jumlah hasil yang masuk</p>
              </div>
            </div>
            <button onClick={() => navigate('/admin/assessment-events')} className="text-xs font-bold text-[#d4a23a] hover:underline">
              Kelola Event &rarr;
            </button>
          </div>
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left text-sm text-layout-text">
              <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="px-5 py-3">Nama Event</th>
                  <th className="px-5 py-3">Tahun Ajaran</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Jumlah Hasil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8e5]">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-6 text-center text-layout-muted">{t('common.loading')}</td></tr>
                ) : data?.recent_events?.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-6 text-center text-layout-muted">Belum ada event penilaian.</td></tr>
                ) : (
                  data?.recent_events?.map((ev) => (
                    <tr key={ev.id} className="hover:bg-layout-hover transition-colors">
                      <td className="px-5 py-4 font-bold text-layout-text">{ev.name}</td>
                      <td className="px-5 py-4 text-layout-muted">{ev.academic_year}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${ev.status==='published'?'bg-[#2d7a50]/10 text-[#2d7a50]':'bg-gray-100 text-gray-500'}`}>
                          {ev.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-[#d4a23a]">
                        {ev.results_count || 0} Siswa
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distributed Documents Widget */}
        <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-5 border-b border-layout-border flex justify-between items-center bg-layout-bg/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#2d7a50]/10 text-[#2d7a50] flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-[#2d7a50]">Distribusi Dokumen</h3>
                <p className="text-xs text-layout-muted">Status distribusi dokumen kelulusan/pengumuman</p>
              </div>
            </div>
            <button onClick={() => navigate('/admin/documents')} className="text-xs font-bold text-[#2d7a50] hover:underline">
              Kelola Dokumen &rarr;
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-layout-text">
              <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="px-5 py-3">Judul Dokumen</th>
                  <th className="px-5 py-3">Tipe</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Terdistribusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8e5]">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-6 text-center text-layout-muted">{t('common.loading')}</td></tr>
                ) : data?.recent_documents?.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-6 text-center text-layout-muted">Belum ada dokumen yang didistribusikan.</td></tr>
                ) : (
                  data?.recent_documents?.map((doc) => (
                    <tr key={doc.id} className="hover:bg-layout-hover transition-colors">
                      <td className="px-5 py-4 font-bold text-layout-text">{doc.title}</td>
                      <td className="px-5 py-4 text-layout-muted font-bold uppercase">{doc.type}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${doc.status==='published'?'bg-[#2d7a50]/10 text-[#2d7a50]':'bg-gray-100 text-gray-500'}`}>
                          {doc.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-[#2d7a50]">
                        {doc.recipients_count || 0} Siswa
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
