import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { Zap, Trash2, RefreshCw, Database, HardDrive, Users, BookOpen, AlertTriangle, CheckCircle, Shield, Loader2 } from 'lucide-react';

interface MaintenanceStatus {
  cache_driver: string;
  db_stats: { total_grades: number; total_students: number; total_teachers: number; total_semesters: number };
  old_data: {
    cutoff_date: string;
    semesters: { id: number; name: string }[];
    counts: Record<string, number>;
    total: number;
  };
  storage_size_mb: number;
}

export default function MaintenancePage() {
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [results, setResults] = useState<{ type: 'success' | 'error'; message: string; details?: string[] } | null>(null);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [purgeInput, setPurgeInput] = useState('');

  const fetchStatus = async () => {
    try {
      const r = await api.get('/admin/system/maintenance/status');
      setStatus(r.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleClearCache = async () => {
    setActionLoading('cache');
    setResults(null);
    try {
      const r = await api.post('/admin/system/maintenance/clear-cache');
      setResults({ type: 'success', message: r.data.message, details: r.data.results });
      fetchStatus();
    } catch (err: any) {
      setResults({ type: 'error', message: err.response?.data?.message || 'Gagal', details: err.response?.data?.results });
    } finally { setActionLoading(null); }
  };

  const handleOptimize = async () => {
    setActionLoading('optimize');
    setResults(null);
    try {
      const r = await api.post('/admin/system/maintenance/optimize');
      setResults({ type: 'success', message: r.data.message, details: r.data.results });
      fetchStatus();
    } catch (err: any) {
      setResults({ type: 'error', message: err.response?.data?.message || 'Gagal', details: err.response?.data?.results });
    } finally { setActionLoading(null); }
  };

  const handlePurge = async () => {
    if (purgeInput !== 'PURGE') return;
    setActionLoading('purge');
    setResults(null);
    setShowPurgeConfirm(false);
    setPurgeInput('');
    try {
      const r = await api.post('/admin/system/maintenance/purge', { confirm: 'PURGE' });
      setResults({ type: 'success', message: r.data.message, details: Object.entries(r.data.deleted || {}).map(([k, v]) => `${k}: ${v} records dihapus`) });
      fetchStatus();
    } catch (err: any) {
      setResults({ type: 'error', message: err.response?.data?.message || 'Gagal purge data' });
    } finally { setActionLoading(null); }
  };

  if (loading) return <AdminLayout title="System Maintenance"><div className="flex items-center justify-center h-64 text-layout-muted">Memuat status sistem...</div></AdminLayout>;

  return (
    <AdminLayout title="System Maintenance">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* System Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Siswa', value: status?.db_stats.total_students ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Total Guru', value: status?.db_stats.total_teachers ?? 0, icon: Users, color: 'text-[#2d7a50]', bg: 'bg-[#2d7a50]/10' },
            { label: 'Total Nilai', value: status?.db_stats.total_grades ?? 0, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { label: 'Storage', value: `${status?.storage_size_mb ?? 0} MB`, icon: HardDrive, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-layout-border`}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs font-semibold text-layout-muted uppercase tracking-wide">{s.label}</span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
            </div>
          ))}
        </div>

        {/* Result Banner */}
        {results && (
          <div className={`rounded-xl border p-4 flex items-start gap-3 ${results.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
            {results.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />}
            <div>
              <p className={`font-bold text-sm ${results.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>{results.message}</p>
              {results.details && results.details.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {results.details.map((d, i) => (
                    <li key={i} className={`text-xs ${results.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* SAFE ACTIONS — No Data Loss */}
        <div className="bg-layout-card rounded-2xl border border-layout-border overflow-hidden">
          <div className="px-6 py-4 border-b border-layout-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2d7a50]/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#2d7a50]" />
            </div>
            <div>
              <h3 className="font-bold text-layout-text">⚡ Percepat Sistem</h3>
              <p className="text-xs text-layout-muted">Aman — tidak menghapus data apapun</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-layout-muted">
              Seperti membersihkan cache di browser, operasi ini menghapus data sementara yang menumpuk 
              dan mempercepat loading sistem. <strong>Tidak ada data siswa, guru, atau nilai yang terhapus.</strong>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Clear Cache */}
              <div className="border border-layout-border rounded-xl p-5 hover:border-[#2d7a50] transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <RefreshCw className="w-5 h-5 text-blue-500" />
                  <div>
                    <h4 className="font-bold text-layout-text text-sm">Bersihkan Cache</h4>
                    <p className="text-xs text-layout-muted">Hapus data sementara yang menumpuk</p>
                  </div>
                </div>
                <ul className="text-xs text-layout-muted space-y-1 mb-4 list-disc list-inside">
                  <li>Cache konfigurasi & routing</li>
                  <li>Cache data sistem (semester, mapel, profil)</li>
                  <li>Token login yang sudah expired</li>
                  <li>Template view yang sudah dikompilasi</li>
                </ul>
                <button
                  onClick={handleClearCache}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'cache' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {actionLoading === 'cache' ? 'Membersihkan...' : 'Bersihkan Cache'}
                </button>
              </div>

              {/* Optimize */}
              <div className="border border-layout-border rounded-xl p-5 hover:border-[#2d7a50] transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-5 h-5 text-[#2d7a50]" />
                  <div>
                    <h4 className="font-bold text-layout-text text-sm">Optimasi Sistem</h4>
                    <p className="text-xs text-layout-muted">Rebuild cache untuk kecepatan maksimal</p>
                  </div>
                </div>
                <ul className="text-xs text-layout-muted space-y-1 mb-4 list-disc list-inside">
                  <li>Rebuild cache konfigurasi</li>
                  <li>Rebuild cache routing</li>
                  <li>Refresh data sistem terbaru</li>
                  <li>Bersihkan view lama</li>
                </ul>
                <button
                  onClick={handleOptimize}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2d7a50] text-white rounded-lg font-semibold text-sm hover:bg-[#1b6b43] transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'optimize' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {actionLoading === 'optimize' ? 'Mengoptimasi...' : 'Optimasi Sekarang'}
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-200">
              <p><strong>💡 Kapan harus dilakukan?</strong></p>
              <p className="mt-1">Lakukan "Bersihkan Cache" jika sistem terasa lambat, atau setelah ada perubahan data besar (import siswa, kenaikan kelas). Lakukan "Optimasi" setelah update sistem.</p>
            </div>
          </div>
        </div>

        {/* DANGER ZONE — Data Purge */}
        <div className="bg-layout-card rounded-2xl border border-red-200 dark:border-red-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-200">🗑️ Hapus Data Lama (&gt; 3 Tahun)</h3>
              <p className="text-xs text-red-600 dark:text-red-400">Perhatian — ini menghapus data secara permanen</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {(status?.old_data.total ?? 0) === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="font-bold text-layout-text">Tidak ada data lama</p>
                <p className="text-sm text-layout-muted mt-1">Semua data masih dalam periode retensi 3 tahun.</p>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
                    ⚠️ Ditemukan {status!.old_data.total.toLocaleString()} records data lama
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                    Cutoff: sebelum {status!.old_data.cutoff_date} · Semester: {status!.old_data.semesters.map(s => s.name).join(', ')}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {Object.entries(status!.old_data.counts).map(([key, val]) => (
                      <div key={key} className="bg-white/60 dark:bg-white/5 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-red-600">{val.toLocaleString()}</p>
                        <p className="text-[10px] text-layout-muted capitalize">{key.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-xs text-red-800 dark:text-red-200">
                  <p className="font-semibold">⚠️ Yang TIDAK dihapus (aman):</p>
                  <p className="mt-1">Data siswa, guru, kelas, semester, mata pelajaran, dan user tetap tersimpan. Hanya data transaksional (nilai, presensi, rapor) dari semester lama yang dihapus.</p>
                </div>

                <div className="bg-[#2d7a50]/10 border border-[#2d7a50]/20 rounded-lg p-3 text-xs text-[#2d7a50]">
                  <p className="font-semibold">💡 Saran: Export data terlebih dahulu!</p>
                  <p className="mt-1">Buka <strong>Sistem → Export Data Akademik</strong> untuk download arsip sebelum menghapus.</p>
                </div>

                <button
                  onClick={() => setShowPurgeConfirm(true)}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus {status!.old_data.total.toLocaleString()} Records Data Lama
                </button>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-layout-card border border-layout-border rounded-xl p-4 text-sm text-layout-muted">
          <p className="font-semibold text-layout-text mb-1"><Database className="w-4 h-4 inline mr-1" />Info Teknis</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>Cache driver: <code className="bg-layout-bg px-1 rounded">{status?.cache_driver}</code></li>
            <li>Total semester: {status?.db_stats.total_semesters}</li>
            <li>"Bersihkan Cache" dan "Optimasi" <strong>100% aman</strong> — tidak ada data yang hilang, mirip clear cache di browser</li>
            <li>"Hapus Data Lama" bersifat <strong>permanen</strong> — hanya untuk data akademik &gt; 3 tahun</li>
          </ul>
        </div>
      </div>

      {/* Purge Confirmation Modal */}
      {showPurgeConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[440px] rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 flex items-center gap-3">
              <Shield className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-bold text-red-800 dark:text-red-200">Konfirmasi Hapus Data</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-layout-muted">
                Anda akan menghapus <strong className="text-red-600">{status?.old_data.total.toLocaleString()} records</strong> data 
                akademik yang lebih lama dari 3 tahun secara <strong>PERMANEN</strong>.
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
                <p className="font-semibold">⚠️ Pastikan data sudah di-export sebelum melanjutkan!</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-layout-text mb-1">
                  Ketik <code className="bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded text-red-600 font-bold">PURGE</code> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  value={purgeInput}
                  onChange={e => setPurgeInput(e.target.value)}
                  placeholder="Ketik PURGE disini..."
                  className="w-full px-3 py-2.5 border border-red-200 dark:border-red-800 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-layout-card text-layout-text"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowPurgeConfirm(false); setPurgeInput(''); }}
                  className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg"
                >
                  Batal
                </button>
                <button
                  onClick={handlePurge}
                  disabled={purgeInput !== 'PURGE' || !!actionLoading}
                  className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === 'purge' ? 'Menghapus...' : 'Ya, Hapus Permanen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
