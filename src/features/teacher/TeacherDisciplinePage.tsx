import { useState, useEffect, useMemo } from 'react';
import TeacherLayout from '@/components/layouts/TeacherLayout';
import api from '@/lib/axios';
import { useLangStore } from '@/stores/langStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { ShieldAlert, Plus, Calendar as CalendarIcon, User, Save, Loader2, CheckCircle, XCircle, Settings, AlertCircle, Trash2, TrendingUp, Award, Activity, FileSearch, BarChart3, Clock } from 'lucide-react';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface Student {
  id: number;
  name: string;
  nisn: string;
  class_id: number;
  school_class?: { id: number; name: string };
}

interface Violation {
  id: number;
  code: string;
  type: 'penalty' | 'reward';
  description: string;
  points: number;
}

interface DisciplineRecord {
  id: number;
  student: { id: number; name: string; school_class: { id: number; name: string } };
  violation: Violation;
  reporter: { id: number; name: string };
  occurred_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reporter_notes: string | null;
}

export default function TeacherDisciplinePage() {
  const { t } = useLangStore();
  const { profile } = useTeacherStore();

  const [violations, setViolations] = useState<Violation[]>([]);
  const [classes, setClasses] = useState<{name: string}[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassName, setSelectedClassName] = useState('');
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dashboard states for Role Kedisiplinan
  const [dashboardRecords, setDashboardRecords] = useState<DisciplineRecord[]>([]);
  const [redZoneStudents, setRedZoneStudents] = useState<{student: Student, points: number, threshold?: number}[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pending' | 'analisis' | 'leaderboard' | 'riwayat-plus'>('dashboard');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<any>(null);

  // Laporan Kesiswaan States
  const [laporanTab, setLaporanTab] = useState<'absensi' | 'prestasi' | 'pelanggaran'>('absensi');
  const [laporanDate, setLaporanDate] = useState(new Date().toISOString().split('T')[0]);
  const [laporanData, setLaporanData] = useState<any[]>([]);
  const [laporanLoading, setLaporanLoading] = useState(false);
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null);

  // Pagination for Dashboard
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filters for Analytics
  const [filterReporter, setFilterReporter] = useState('');
  const [filterViolation, setFilterViolation] = useState('');
  const [reporterPage, setReporterPage] = useState(1);

  // Settings state
  const [redZoneThreshold, setRedZoneThreshold] = useState(80);
  const [showSettings, setShowSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Form states
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{student_ids: number[], violation_id: string, occurred_at: string, reporter_notes: string}>({
    student_ids: [],
    violation_id: '',
    occurred_at: new Date().toISOString().split('T')[0],
    reporter_notes: ''
  });

  // Master Management states
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [masterFormData, setMasterFormData] = useState<Partial<Violation> | null>(null);
  const [masterLoading, setMasterLoading] = useState(false);

  // F2: Confirmation modal states
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // F1: Permanent Red Zone states
  const [permanentRedZone, setPermanentRedZone] = useState<any[]>([]);

  // F4: Class Violation Recap states
  const [recapClassName, setRecapClassName] = useState('');
  const [recapData, setRecapData] = useState<any[]>([]);
  const [recapLoading, setRecapLoading] = useState(false);

  // F5: Weekly Monitoring states
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  // Pending Approval states (Kedisiplinan)
  const [pendingRecords, setPendingRecords] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingLoading, setPendingLoading] = useState(false);

  const isKedisiplinan = profile?.is_kedisiplinan;

  const getRemainingAutoApproveTime = (createdAtStr: string) => {
    const createdAt = new Date(createdAtStr).getTime();
    const expiresAt = createdAt + 48 * 60 * 60 * 1000;
    const now = Date.now();
    const diffMs = expiresAt - now;
    if (diffMs <= 0) return { label: 'Auto-approve segera', badgeClass: 'bg-red-500/10 text-red-600 border border-red-500/20 font-bold' };
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours >= 24) return { label: `Sisa ${hours}j ${minutes}m`, badgeClass: 'bg-green-500/10 text-green-600 border border-green-500/20 font-semibold' };
    if (hours >= 12) return { label: `Sisa ${hours}j ${minutes}m`, badgeClass: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 font-semibold' };
    return { label: `Sisa ${hours}j ${minutes}m`, badgeClass: 'bg-red-500/10 text-red-600 border border-red-500/30 animate-pulse font-bold' };
  };

  const fetchPendingRecords = async () => {
    setPendingLoading(true);
    try {
      const res = await api.get('/teacher/discipline/all-pending');
      setPendingRecords(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setPendingLoading(false);
    }
  };

  const handleVerifyPending = async (id: number, status: 'approved' | 'rejected') => {
    const notes = status === 'rejected' ? (await promptDialog('Alasan penolakan:')) : '';
    if (status === 'rejected' && notes === null) return;
    try {
      await api.post(`/teacher/discipline/verify/${id}`, { status, reviewer_notes: notes });
      alertDialog('Berhasil diverifikasi');
      fetchPendingRecords();
      fetchDashboard();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || 'Gagal verifikasi');
    }
  };



  const handleApproveAllPending = async () => {
    if (!await confirmDialog('Apakah Anda yakin ingin menyetujui SEMUA laporan yang menunggu persetujuan?')) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/teacher/discipline/approve-all');
      alertDialog(`Berhasil menyetujui ${res.data.count} laporan.`);
      fetchPendingRecords();
      fetchDashboard();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || 'Gagal menyetujui semua laporan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [rewardHistory, setRewardHistory] = useState<any[]>([]);

  const fetchRewardHistory = async () => {
    setLaporanLoading(true);
    try {
      const res = await api.get('/teacher/discipline/reward-history');
      setRewardHistory(res.data.data || []);
    } catch (err) {
      console.error(err);
      alertDialog('Gagal memuat riwayat poin plus');
    } finally {
      setLaporanLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'riwayat-plus' && isKedisiplinan) {
      fetchRewardHistory();
    }
  }, [activeTab, isKedisiplinan]);

  useEffect(() => {
    fetchMasterData();
    if (isKedisiplinan) {
      fetchDashboard();
      fetchSettings();
      fetchPendingRecords();
    }
  }, [isKedisiplinan]);

  useEffect(() => {
    if (isKedisiplinan) {
      if (activeTab === 'analisis' && !analyticsData) {
        fetchAnalytics();
      }
      if (activeTab === 'leaderboard' && !leaderboardData) {
        fetchLeaderboard();
      }
    }
  }, [activeTab, isKedisiplinan]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/teacher/discipline/analytics', {
        params: {
          reporter_id: filterReporter,
          violation_id: filterViolation
        }
      });
      setAnalyticsData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isKedisiplinan && activeTab === 'analisis') {
      fetchAnalytics();
    }
  }, [filterReporter, filterViolation]);

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/teacher/discipline/leaderboard');
      setLeaderboardData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/teacher/discipline/settings');
      setRedZoneThreshold(res.data.discipline_red_zone_threshold || 80);
    } catch (err) {
      console.error(err);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.post('/teacher/discipline/settings', { discipline_red_zone_threshold: redZoneThreshold });
      alertDialog('Pengaturan Red Zone berhasil disimpan!');
      setShowSettings(false);
      fetchDashboard(); // Refresh dashboard to apply new threshold
    } catch (err) {
      console.error(err);
      alertDialog('Gagal menyimpan pengaturan.');
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const url = isKedisiplinan ? '/teacher/discipline/master' : '/teacher/discipline/master?type=penalty';
      const [resV, resC] = await Promise.all([
        api.get(url),
        api.get('/teacher/discipline/classes')
      ]);
      setViolations(resV.data.data);
      setClasses(resC.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterFormData) return;
    
    const payload = {
      ...masterFormData,
      type: masterFormData.type || 'penalty'
    };

    setMasterLoading(true);
    try {
      if (payload.id) {
        await api.put(`/teacher/discipline/master/${payload.id}`, payload);
        alertDialog('Data berhasil diubah');
      } else {
        await api.post('/teacher/discipline/master', payload);
        alertDialog('Data berhasil ditambahkan');
      }
      setMasterFormData(null);
      fetchMasterData();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || 'Gagal menyimpan data master');
    } finally {
      setMasterLoading(false);
    }
  };


  const handleCancelRecord = async (id: number) => {
    if (!(await confirmDialog('Batalkan dan hapus laporan ini?', 'Konfirmasi Batal', true))) return;
    try {
      await api.delete(`/teacher/discipline/record/${id}`);
      alertDialog('Laporan berhasil dibatalkan');
      fetchDashboard();
      fetchPendingRecords();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || 'Gagal membatalkan laporan');
    }
  };

  const handleDeleteMaster = async (id: number) => {
    if (!(await confirmDialog('Hapus jenis pelanggaran ini?', 'Konfirmasi', true))) return;
    try {
      await api.delete(`/teacher/discipline/master/${id}`);
      alertDialog('Data berhasil dihapus');
      fetchMasterData();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || 'Gagal menghapus data');
    }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClassName) {
        setStudents([]);
        return;
      }
      
      setFetchingStudents(true);
      try {
        const res = await api.get(`/teacher/discipline/students?class_name=${encodeURIComponent(selectedClassName)}`);
        setStudents(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setFetchingStudents(false);
      }
    };

    fetchStudents();
  }, [selectedClassName]);

  const fetchDashboard = async () => {
    setDashboardLoading(true);
    setCurrentPage(1);
    try {
      let url = '/teacher/discipline/dashboard?';
      if (startDate) url += `start_date=${startDate}&`;
      if (endDate) url += `end_date=${endDate}`;
      
      const res = await api.get(url);
      setDashboardRecords(res.data.records);
      setRedZoneStudents(res.data.red_zone);
      setPermanentRedZone(res.data.permanent_red_zone || []);
      setPendingCount(res.data.pending_count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setDashboardLoading(false);
    }
  };

  // F2: Show confirmation modal instead of direct submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.student_ids.length === 0) {
      alertDialog('Pilih minimal 1 siswa.');
      return;
    }
    if (!formData.violation_id) {
      alertDialog('Pilih jenis pelanggaran.');
      return;
    }
    setShowConfirmationModal(true);
  };

  // F2: Actual submission after student confirmation
  const handleConfirmedSubmit = async () => {
    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        student_confirmed_at: new Date().toISOString(),
      };
      await api.post('/teacher/discipline/record', payload);
      alertDialog('Catatan berhasil ditambahkan, menunggu verifikasi Homeroom.');
      setShowConfirmationModal(false);
      setShowForm(false);
      setFormData({
        student_ids: [],
        violation_id: '',
        occurred_at: new Date().toISOString().split('T')[0],
        reporter_notes: ''
      });
      if (isKedisiplinan) fetchDashboard();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || 'Gagal menyimpan catatan');
    } finally {
      setFormLoading(false);
    }
  };

  // F4: Fetch class violation recap
  const fetchClassRecap = async (className: string) => {
    if (!className) { setRecapData([]); return; }
    setRecapLoading(true);
    try {
      const res = await api.get(`/teacher/discipline/class-recap?class_name=${encodeURIComponent(className)}`);
      setRecapData(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setRecapLoading(false); }
  };

  // F5: Fetch weekly monitoring
  const fetchWeeklyMonitoring = async () => {
    setWeeklyLoading(true);
    try {
      let url = '/teacher/discipline/weekly-monitoring?';
      if (startDate) url += `start_date=${startDate}&`;
      if (endDate) url += `end_date=${endDate}`;
      const res = await api.get(url);
      setWeeklyData(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setWeeklyLoading(false); }
  };

  return (
    <TeacherLayout title="Kedisiplinan & Pelanggaran">
      <div className="space-y-6">
        
        {/* ACTION BAR: CATAT PELANGGARAN */}
        <div className="bg-layout-card border border-layout-border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-layout-text flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Catat Pelanggaran / Aktivitas
            </h2>
            <p className="text-sm text-layout-muted mt-1">
              Laporkan pelanggaran kedisiplinan atau aktivitas positif siswa di sini.
            </p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${showForm ? 'bg-layout-bg text-layout-text border border-layout-border hover:bg-layout-hover' : 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20'}`}
          >
            {showForm ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Batal' : 'Buat Laporan Baru'}
          </button>
        </div>

        {/* FORM CATAT PELANGGARAN */}
        {showForm && (
          <div className="bg-layout-card border border-red-200 dark:border-red-900/30 rounded-xl p-6 shadow-lg animate-in slide-in-from-top-4 fade-in duration-200">
            <h3 className="font-bold text-layout-text mb-4 border-b border-layout-border pb-3">Formulir Laporan Kedisiplinan</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-layout-text mb-1">Tanggal Kejadian <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-layout-muted" />
                      <input 
                        type="date" 
                        required 
                        value={formData.occurred_at}
                        onChange={e => setFormData({...formData, occurred_at: e.target.value})}
                        className="w-full h-10 pl-9 pr-3 bg-layout-bg border border-layout-border rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-layout-text mb-1">Pilih Kelas <span className="text-red-500">*</span></label>
                    <select 
                      required
                      value={selectedClassName}
                      onChange={e => {
                        setSelectedClassName(e.target.value);
                        setFormData({...formData, student_ids: []}); // Reset student selection
                      }}
                      className="w-full h-10 px-3 bg-layout-bg border border-layout-border rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                      <option value="">Pilih Kelas...</option>
                      {classes.map((c, i) => (
                        <option key={i} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-layout-text mb-1">Pilih Siswa <span className="text-red-500">*</span></label>
                  <div className="border border-layout-border rounded-lg bg-layout-bg overflow-hidden h-40 flex flex-col">
                    <div className="px-3 py-2 border-b border-layout-border bg-layout-card flex items-center justify-between text-xs font-semibold text-layout-muted">
                      <span>{students.length} Siswa Tersedia</span>
                      <button 
                        type="button"
                        onClick={() => {
                          if (formData.student_ids.length === students.length) {
                            setFormData({...formData, student_ids: []});
                          } else {
                            setFormData({...formData, student_ids: students.map(s => s.id)});
                          }
                        }}
                        className="text-[#2d7a50] hover:underline"
                      >
                        {formData.student_ids.length === students.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {fetchingStudents ? (
                        <div className="text-center p-4 text-xs text-layout-muted">Memuat...</div>
                      ) : students.length === 0 ? (
                        <div className="text-center p-4 text-xs text-layout-muted">Pilih kelas dulu</div>
                      ) : students.map(s => (
                        <label key={s.id} className="flex items-center gap-2 p-1.5 hover:bg-layout-hover rounded cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.student_ids.includes(s.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({...formData, student_ids: [...formData.student_ids, s.id]});
                              } else {
                                setFormData({...formData, student_ids: formData.student_ids.filter(id => id !== s.id)});
                              }
                            }}
                            className="rounded text-red-500 focus:ring-red-500 bg-layout-bg border-layout-border"
                          />
                          <span className="text-sm text-layout-text truncate">{s.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-layout-text mb-1">Jenis Pelanggaran / Aktivitas <span className="text-red-500">*</span></label>
                <select 
                  required
                  value={formData.violation_id}
                  onChange={e => setFormData({...formData, violation_id: e.target.value})}
                  className="w-full h-10 px-3 bg-layout-bg border border-layout-border rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                >
                  <option value="">Pilih Kategori...</option>
                  {violations
                    .filter(v => isKedisiplinan || v.type === 'penalty')
                    .map(v => (
                    <option key={v.id} value={v.id}>
                      [{v.code}] {v.description} ({v.type === 'penalty' ? '-' : '+'}{v.points} Poin)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-layout-text mb-1">Catatan Tambahan (Opsional)</label>
                <textarea 
                  value={formData.reporter_notes}
                  onChange={e => setFormData({...formData, reporter_notes: e.target.value})}
                  rows={3}
                  placeholder="Detail kejadian, kronologi, dll..."
                  className="w-full p-3 bg-layout-bg border border-layout-border rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-70 transition-colors"
                >
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Kirim Laporan
                </button>
              </div>
            </form>
          </div>
        )}

        {/* DASHBOARD KEDISIPLINAN (Only visible if role has Kedisiplinan) */}
        {isKedisiplinan && (
          <div className="space-y-6 animate-in fade-in duration-500 delay-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-layout-text">Dashboard Kedisiplinan Pusat</h2>
                  <p className="text-sm text-layout-muted">Ringkasan seluruh pelanggaran siswa (Khusus Role Kedisiplinan)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowMasterModal(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs bg-layout-card border border-layout-border text-layout-text shadow-sm hover:bg-layout-hover"
                >
                  <AlertCircle className="w-4 h-4" />
                  Kelola Jenis Pelanggaran
                </button>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs transition-colors ${showSettings ? 'bg-layout-bg text-layout-text border border-layout-border hover:bg-layout-hover' : 'bg-layout-card border border-layout-border text-layout-text shadow-sm hover:bg-layout-hover'}`}
                >
                  <Settings className="w-4 h-4" />
                  Pengaturan
                </button>
              </div>
            </div>

            {/* TABS KEDISIPLINAN */}
            <div className="flex overflow-x-auto space-x-1 bg-layout-card border border-layout-border p-1 rounded-xl pb-2">
              <button onClick={() => setActiveTab('dashboard')} className={`flex-1 shrink-0 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'dashboard' ? 'bg-[#2d7a50] text-white shadow-sm' : 'text-layout-muted hover:text-layout-text hover:bg-layout-hover'}`}>
                <Activity className="w-4 h-4" />
                Monitoring & Riwayat
              </button>
              <button onClick={() => { setActiveTab('pending'); fetchPendingRecords(); }} className={`flex-1 shrink-0 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-layout-muted hover:text-layout-text hover:bg-layout-hover'}`}>
                <Clock className="w-4 h-4" />
                Menunggu Persetujuan
                {pendingCount > 0 && <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'pending' ? 'bg-white text-amber-600' : 'bg-amber-500 text-white'}`}>{pendingCount}</span>}
              </button>
              <button onClick={() => setActiveTab('analisis')} className={`flex-1 shrink-0 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'analisis' ? 'bg-[#2d7a50] text-white shadow-sm' : 'text-layout-muted hover:text-layout-text hover:bg-layout-hover'}`}>
                <TrendingUp className="w-4 h-4" />
                Analisis & Evaluasi
              </button>
              <button onClick={() => setActiveTab('leaderboard')} className={`flex-1 shrink-0 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'leaderboard' ? 'bg-[#2d7a50] text-white shadow-sm' : 'text-layout-muted hover:text-layout-text hover:bg-layout-hover'}`}>
                <Award className="w-4 h-4" />
                Leaderboard (Most Caring)
              </button>
              <button onClick={() => setActiveTab('riwayat-plus')} className={`flex-1 shrink-0 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'riwayat-plus' ? 'bg-[#2d7a50] text-white shadow-sm' : 'text-layout-muted hover:text-layout-text hover:bg-layout-hover'}`}>
                <Activity className="w-4 h-4" />
                Riwayat Poin Plus
              </button>
            </div>

            {showSettings && (
              <div className="bg-layout-card border border-layout-border rounded-xl p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <h3 className="font-bold text-layout-text mb-3">Pengaturan Kedisiplinan</h3>
                <form onSubmit={saveSettings} className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                  <div className="w-full sm:w-64">
                    <label className="block text-xs font-semibold text-layout-text mb-1">Batas Minimal Poin Red Zone</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="0" max="100" 
                        required
                        value={redZoneThreshold}
                        onChange={e => setRedZoneThreshold(Number(e.target.value))}
                        className="w-24 h-9 px-3 bg-layout-bg border border-layout-border rounded-lg text-sm focus:outline-none focus:border-red-500"
                      />
                      <span className="text-xs text-layout-muted">Poin (Base 100)</span>
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={savingSettings}
                    className="flex items-center justify-center gap-2 bg-[#2d7a50] hover:bg-[#1a4a30] text-white h-9 px-4 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Simpan
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* RED ZONE PANEL */}
              <div className="lg:col-span-1 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-5">
                <h3 className="font-bold text-red-800 dark:text-red-400 mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Daftar Red Zone (&lt; {redZoneThreshold} Poin)
                </h3>
                {dashboardLoading ? (
                  <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-red-500" /></div>
                ) : redZoneStudents.length === 0 ? (
                  <div className="text-center p-6 bg-white/50 dark:bg-black/20 rounded-xl text-sm text-red-600/70 border border-red-100 dark:border-red-900/20">
                    Tidak ada siswa di Red Zone.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {redZoneStudents.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-layout-card border border-red-100 dark:border-red-900/30 rounded-xl shadow-sm">
                        <div>
                          <p className="text-sm font-bold text-layout-text">{item.student.name}</p>
                          <p className="text-[11px] text-layout-muted">{item.student.school_class?.name}</p>
                        </div>
                        <div className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-lg font-black text-sm">
                          {item.points}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LATEST RECORDS TABLE */}
              <div className="lg:col-span-2 bg-layout-card border border-layout-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="p-4 border-b border-layout-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="font-bold text-layout-text">Riwayat Kedisiplinan</h3>
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="h-8 px-2 bg-layout-bg border border-layout-border rounded-md text-xs" 
                    />
                    <span className="text-layout-muted">-</span>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="h-8 px-2 bg-layout-bg border border-layout-border rounded-md text-xs" 
                    />
                    <button onClick={fetchDashboard} className="h-8 px-3 bg-layout-bg hover:bg-layout-hover border border-layout-border rounded-md text-xs font-semibold">Filter</button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left text-sm text-layout-text">
                    <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[10px] font-bold tracking-wider sticky top-0">
                      <tr>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Siswa</th>
                        <th className="px-4 py-3">Pelanggaran</th>
                        <th className="px-4 py-3">Poin</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-layout-border">
                      {dashboardLoading ? (
                        <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-layout-muted mx-auto" /></td></tr>
                      ) : dashboardRecords.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-layout-muted">Belum ada riwayat kedisiplinan.</td></tr>
                      ) : (
                        dashboardRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(r => (
                          <tr key={r.id} className="hover:bg-layout-hover/50">
                            <td className="px-4 py-3 whitespace-nowrap text-xs">{new Date(r.occurred_at).toLocaleDateString('id-ID')}</td>
                            <td className="px-4 py-3">
                              <div className="font-bold">{r.student.name}</div>
                              <div className="text-[11px] text-layout-muted">{r.student.school_class?.name}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs">{r.violation.description}</div>
                              <div className="text-[10px] text-layout-muted">Dilaporkan: {r.reporter.name}</div>
                            </td>
                            <td className="px-4 py-3 font-bold">
                              <span className={r.violation.type === 'penalty' ? 'text-red-500' : 'text-green-500'}>
                                {r.violation.type === 'penalty' ? '-' : '+'}{r.violation.points}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {r.status === 'pending' && (
                                <div className="flex flex-col gap-2">
                                  <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold self-start">Pending</span>
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => handleVerifyPending(r.id, 'approved')} className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors">
                                      <CheckCircle className="w-3 h-3" /> Setujui
                                    </button>
                                    <button onClick={() => handleVerifyPending(r.id, 'rejected')} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors">
                                      <XCircle className="w-3 h-3" /> Tolak
                                    </button>
                                  </div>
                                </div>
                              )}
                              {r.status === 'approved' && (
                                <div className="flex flex-col gap-2 items-start">
                                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">Disetujui</span>
                                  {isKedisiplinan && (
                                    <button onClick={() => handleCancelRecord(r.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors border border-red-200">
                                      <Trash2 className="w-3 h-3" /> Batalkan
                                    </button>
                                  )}
                                </div>
                              )}
                              {r.status === 'rejected' && (
                                <div className="flex flex-col gap-2 items-start">
                                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">Ditolak</span>
                                  {isKedisiplinan && (
                                    <button onClick={() => handleCancelRecord(r.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors border border-red-200">
                                      <Trash2 className="w-3 h-3" /> Hapus
                                    </button>
                                  )}
                                </div>
                              )}
                              {r.reviewer_notes && (
                                <div className="text-[10px] mt-1.5 text-layout-muted italic bg-layout-bg border border-layout-border p-1.5 rounded" title={r.reviewer_notes}>
                                  <span className="font-semibold not-italic">Catatan:</span> {r.reviewer_notes}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {Math.ceil(dashboardRecords.length / itemsPerPage) > 1 && (
                  <div className="flex items-center justify-between p-3 border-t border-layout-border bg-layout-bg">
                    <button 
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="px-3 py-1 text-xs font-semibold rounded bg-layout-card border border-layout-border hover:bg-layout-hover disabled:opacity-50"
                    >
                      Sebelumnya
                    </button>
                    <span className="text-xs text-layout-muted">
                      Halaman {currentPage} dari {Math.ceil(dashboardRecords.length / itemsPerPage)}
                    </span>
                    <button 
                      disabled={currentPage === Math.ceil(dashboardRecords.length / itemsPerPage)} 
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="px-3 py-1 text-xs font-semibold rounded bg-layout-card border border-layout-border hover:bg-layout-hover disabled:opacity-50"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* F5: Weekly Monitoring Summary */}
            {isKedisiplinan && (
              <div className="bg-layout-card border border-layout-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-layout-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="font-bold text-layout-text flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#3a8fd4]" />
                    Monitoring Mingguan
                  </h3>
                  <button onClick={fetchWeeklyMonitoring} disabled={weeklyLoading} className="h-8 px-4 bg-[#3a8fd4] hover:bg-[#2e78b8] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
                    {weeklyLoading ? 'Memuat...' : 'Muat Data Mingguan'}
                  </button>
                </div>
                {weeklyData.length > 0 && (
                  <div className="overflow-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-layout-bg border-b border-layout-border text-[10px] font-bold text-layout-muted uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Minggu</th>
                          <th className="px-4 py-3">Periode</th>
                          <th className="px-4 py-3 text-center">Total Kasus</th>
                          <th className="px-4 py-3 text-center">Poin Dikurangi</th>
                          <th className="px-4 py-3 text-center">Siswa Terdampak</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-layout-border">
                        {weeklyData.map((w: any) => (
                          <tr key={w.week_number} className="hover:bg-layout-hover/50">
                            <td className="px-4 py-3 font-bold text-layout-text">{w.week_label}</td>
                            <td className="px-4 py-3 text-xs text-layout-muted">
                              {new Date(w.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(w.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full text-xs">{w.total_cases}</span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-red-500">-{w.total_points_deducted}</td>
                            <td className="px-4 py-3 text-center font-bold text-layout-text">{w.affected_students_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {weeklyData.length === 0 && !weeklyLoading && (
                  <div className="p-6 text-center text-sm text-layout-muted">Klik tombol di atas untuk memuat ringkasan mingguan.</div>
                )}
              </div>
            )}

            {/* F1: Permanent Red Zone Panel */}
            {isKedisiplinan && permanentRedZone.length > 0 && (
              <div className="bg-layout-card border border-red-500/30 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-red-500/20 bg-red-500/5">
                  <h3 className="font-bold text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    ⚠️ Permanent Red Zone — Efek Jera ({permanentRedZone.length} siswa)
                  </h3>
                  <p className="text-[11px] text-layout-muted mt-1">Siswa yang PERNAH masuk Red Zone di semester ini. Poin maksimal mereka ter-cap di {permanentRedZone[0]?.threshold_at_flag || 80}.</p>
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-red-500/5 border-b border-red-500/10 text-[10px] font-bold text-layout-muted uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Nama Siswa</th>
                        <th className="px-4 py-3">Kelas</th>
                        <th className="px-4 py-3 text-center">Poin Asli</th>
                        <th className="px-4 py-3 text-center">Poin Ter-cap</th>
                        <th className="px-4 py-3 text-center">Sejak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-layout-border">
                      {permanentRedZone.map((item: any) => (
                        <tr key={item.student.id} className="hover:bg-red-500/5">
                          <td className="px-4 py-3">
                            <div className="font-bold text-layout-text">{item.student.name}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-layout-muted">{item.student.school_class?.name || '-'}</td>
                          <td className="px-4 py-3 text-center font-bold text-layout-muted">{item.current_points}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-black text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full text-xs">{item.capped_points}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-layout-muted">{new Date(item.flagged_at).toLocaleDateString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </>
            )}

            {activeTab === 'pending' && (
              <div className="bg-layout-card border border-layout-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="p-4 border-b border-layout-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="font-bold text-layout-text flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" /> Verifikasi Pelanggaran Kelas
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={fetchPendingRecords} className="h-8 px-3 bg-layout-bg hover:bg-layout-hover border border-layout-border rounded-md text-xs font-semibold flex items-center gap-2">
                      <Loader2 className={`w-3.5 h-3.5 ${pendingLoading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    {isKedisiplinan && pendingRecords.length > 0 && (
                      <button onClick={handleApproveAllPending} disabled={isSubmitting} className="h-8 px-3 bg-[#2d7a50] hover:bg-[#225e3d] text-white rounded-md text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50">
                        <CheckCircle className="w-3.5 h-3.5" /> Setujui Semua
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left text-sm text-layout-text">
                    <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[10px] font-bold tracking-wider sticky top-0">
                      <tr>
                        <th className="px-4 py-3 w-16">Tanggal</th>
                        <th className="px-4 py-3">Siswa / Kelas</th>
                        <th className="px-4 py-3">Pelanggaran</th>
                        <th className="px-4 py-3">Batas Verifikasi</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-layout-border">
                      {pendingLoading ? (
                        <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-layout-muted mx-auto" /></td></tr>
                      ) : pendingRecords.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-layout-muted">
                            <div className="flex flex-col items-center justify-center">
                              <CheckCircle className="w-12 h-12 text-green-500 mb-3 opacity-20" />
                              <p className="font-semibold">Semua bersih!</p>
                              <p className="text-xs mt-1">Tidak ada pelanggaran yang menunggu verifikasi saat ini.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pendingRecords.map(r => {
                          const timer = getRemainingAutoApproveTime(r.created_at);
                          return (
                            <tr key={r.id} className="hover:bg-layout-hover/50">
                              <td className="px-4 py-3 whitespace-nowrap text-xs">
                                <div className="font-semibold">{new Date(r.occurred_at).toLocaleDateString('id-ID')}</div>
                                <div className="text-[10px] text-layout-muted">{r.time_period === 'morning' ? 'Pagi' : r.time_period === 'afternoon' ? 'Siang' : 'Sore'}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-bold">{r.student.name}</div>
                                <div className="text-[11px] text-layout-muted font-semibold">{r.student.school_class?.name}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-xs font-medium">{r.violation.description}</div>
                                <div className="text-[10px] text-layout-muted flex gap-2 mt-0.5">
                                  <span>Pelapor: <span className="font-semibold">{r.reporter.name}</span></span>
                                  <span>Poin: <span className={r.violation.type === 'penalty' ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>{r.violation.type === 'penalty' ? '-' : '+'}{r.violation.points}</span></span>
                                </div>
                                {r.notes && <div className="text-[10px] mt-1 text-layout-muted italic border-l-2 border-layout-border pl-2">{r.notes}</div>}
                              </td>
                              <td className="px-4 py-3">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] ${timer.badgeClass}`}>
                                  <Clock className="w-3 h-3" /> {timer.label}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => handleVerifyPending(r.id, 'approved')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-colors">
                                    <CheckCircle className="w-4 h-4" /> Setujui
                                  </button>
                                  <button onClick={() => handleVerifyPending(r.id, 'rejected')} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-colors">
                                    <XCircle className="w-4 h-4" /> Tolak
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'analisis' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-layout-card border border-layout-border rounded-xl p-4 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-layout-text mb-1">Filter Pelapor</label>
                    <select 
                      value={filterReporter} 
                      onChange={e => setFilterReporter(e.target.value)}
                      className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]"
                    >
                      <option value="">Semua Guru Pelapor (Top 10)</option>
                      {analyticsData?.reporters?.map((r: any) => (
                        <option key={r.id} value={r.id}>{r.name} ({r.count} Kasus)</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-layout-text mb-1">Filter Jenis Pelanggaran</label>
                    <select 
                      value={filterViolation} 
                      onChange={e => setFilterViolation(e.target.value)}
                      className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]"
                    >
                      <option value="">Semua Jenis Pelanggaran</option>
                      {violations.filter(v => v.type === 'penalty').map(v => (
                        <option key={v.id} value={v.id}>{v.description}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-layout-card rounded-xl border border-layout-border shadow-sm p-5">
                  <h3 className="font-bold text-layout-text mb-4 text-sm flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    Siswa Paling Sering Melanggar
                  </h3>
                  {analyticsData?.frequent_violators?.length > 0 ? (
                    <ul className="space-y-3">
                      {analyticsData.frequent_violators.map((v: any, idx: number) => (
                        <li key={v.student.id} className="flex items-center justify-between p-3 bg-layout-bg rounded-lg border border-layout-border">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-layout-muted w-5 text-center">{idx + 1}</span>
                            <div>
                              <p className="font-bold text-sm text-layout-text">{v.student.name}</p>
                              <p className="text-[10px] text-layout-muted">{v.student.school_class?.name}</p>
                            </div>
                          </div>
                          <span className="font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full text-xs">
                            {v.count} Kasus
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-layout-muted">Belum ada data pelanggaran signifikan.</p>
                  )}
                </div>
                
                <div className="bg-layout-card rounded-xl border border-layout-border shadow-sm p-5">
                  <h3 className="font-bold text-layout-text mb-4 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#d4a23a]" />
                    Jenis Pelanggaran Terbanyak
                  </h3>
                  {analyticsData?.frequent_violations?.length > 0 ? (
                    <ul className="space-y-3">
                      {analyticsData.frequent_violations.map((v: any, idx: number) => (
                        <li key={idx} className="flex items-center justify-between p-3 bg-layout-bg rounded-lg border border-layout-border">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-layout-muted w-5 text-center">{idx + 1}</span>
                            <div>
                              <p className="font-bold text-sm text-layout-text">{v.violation.description}</p>
                            </div>
                          </div>
                          <span className="font-bold text-layout-text bg-layout-card px-2.5 py-1 border border-layout-border rounded-full text-xs">
                            {v.count}x
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-layout-muted">Belum ada data pelanggaran signifikan.</p>
                  )}
                </div>

                <div className="bg-layout-card rounded-xl border border-layout-border shadow-sm p-5 flex flex-col">
                  <h3 className="font-bold text-layout-text mb-4 text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#2d7a50]" />
                    Guru Pelapor Teraktif
                  </h3>
                  {analyticsData?.reporters?.length > 0 ? (
                    <div className="flex-1 flex flex-col justify-between">
                      <ul className="space-y-3 mb-4">
                        {analyticsData.reporters.slice((reporterPage - 1) * 10, reporterPage * 10).map((r: any, idx: number) => (
                          <li key={r.id} className="flex items-center justify-between p-3 bg-layout-bg rounded-lg border border-layout-border">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-layout-muted w-5 text-center">{(reporterPage - 1) * 10 + idx + 1}</span>
                              <div>
                                <p className="font-bold text-sm text-layout-text">{r.name}</p>
                              </div>
                            </div>
                            <span className="font-bold text-layout-text bg-layout-card px-2.5 py-1 border border-layout-border rounded-full text-xs">
                              {r.count}x
                            </span>
                          </li>
                        ))}
                      </ul>
                      
                      {Math.ceil(analyticsData.reporters.length / 10) > 1 && (
                        <div className="flex items-center justify-between pt-3 border-t border-layout-border mt-auto">
                          <button 
                            disabled={reporterPage === 1} 
                            onClick={() => setReporterPage(p => p - 1)}
                            className="px-2 py-1 text-[10px] font-semibold rounded bg-layout-bg border border-layout-border hover:bg-layout-hover disabled:opacity-50"
                          >
                            Sebelumnya
                          </button>
                          <span className="text-[10px] text-layout-muted">
                            Hal {reporterPage} dari {Math.ceil(analyticsData.reporters.length / 10)}
                          </span>
                          <button 
                            disabled={reporterPage === Math.ceil(analyticsData.reporters.length / 10)} 
                            onClick={() => setReporterPage(p => p + 1)}
                            className="px-2 py-1 text-[10px] font-semibold rounded bg-layout-bg border border-layout-border hover:bg-layout-hover disabled:opacity-50"
                          >
                            Selanjutnya
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-layout-muted">Belum ada pelapor.</p>
                  )}
                </div>
                </div>

              {/* F4: Class Violation Recap */}
              {isKedisiplinan && (
                <div className="md:col-span-2 bg-layout-card border border-layout-border rounded-xl shadow-sm p-5">
                  <h3 className="font-bold text-layout-text mb-4 text-sm flex items-center gap-2">
                    <FileSearch className="w-4 h-4 text-[#2d7a50]" />
                    Rekap Pelanggaran per Kelas
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    <select
                      value={recapClassName}
                      onChange={e => { setRecapClassName(e.target.value); fetchClassRecap(e.target.value); }}
                      className="h-9 px-3 bg-layout-bg border border-layout-border rounded-lg text-sm flex-1 max-w-xs"
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {classes.map((c: any) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    {recapLoading && <Loader2 className="w-4 h-4 animate-spin text-layout-muted" />}
                  </div>
                  {recapData.length > 0 && (
                    <div className="overflow-auto rounded-lg border border-layout-border">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-layout-bg border-b border-layout-border text-[10px] font-bold text-layout-muted uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">No</th>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">NISN</th>
                            <th className="px-4 py-3 text-center">Poin</th>
                            <th className="px-4 py-3">Kode Pelanggaran</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-layout-border">
                          {recapData.map((r: any) => (
                            <tr key={r.no} className="hover:bg-layout-hover/50">
                              <td className="px-4 py-3 text-xs text-layout-muted">{r.no}</td>
                              <td className="px-4 py-3 font-bold text-layout-text">{r.name}</td>
                              <td className="px-4 py-3 text-xs text-layout-muted">{r.nisn}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${r.points < 80 ? 'bg-red-500/10 text-red-500' : r.points < 100 ? 'bg-amber-500/10 text-amber-600' : 'bg-green-500/10 text-green-600'}`}>
                                  {r.points}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-layout-muted font-mono">{r.violation_codes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {recapClassName && recapData.length === 0 && !recapLoading && (
                    <p className="text-sm text-layout-muted">Tidak ada data pelanggaran untuk kelas ini.</p>
                  )}
                </div>
              )}
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
                <div className="p-6 bg-gradient-to-r from-[#d4a23a]/10 to-transparent border-b border-layout-border">
                  <h3 className="font-bold text-[#d4a23a] flex items-center gap-2 text-xl">
                    <Award className="w-6 h-6" />
                    The Most Caring Teachers Leaderboard
                  </h3>
                  <p className="text-xs text-layout-muted mt-2">
                    Penghargaan untuk guru dengan partisipasi pelaporan kedisiplinan dan aktivitas positif terbanyak di semester ini.
                  </p>
                </div>
                <div className="p-0">
                  {leaderboardData?.most_caring_teachers?.length > 0 ? (
                    <ul className="divide-y divide-layout-border">
                      {leaderboardData.most_caring_teachers.map((t: any, idx: number) => (
                        <li key={t.teacher_id} className="p-4 flex items-center justify-between hover:bg-layout-hover transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${idx === 0 ? 'bg-[#d4a23a] text-white shadow-lg shadow-[#d4a23a]/40 scale-110' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-amber-700/80 text-amber-100' : 'bg-layout-bg border border-layout-border text-layout-muted'}`}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-layout-text">{t.teacher_name}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-black text-lg text-[#2d7a50]">{t.count}</span>
                            <span className="text-[10px] uppercase font-bold text-layout-muted tracking-wider">Laporan</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-8 text-center text-layout-muted">Belum ada data pelaporan dari guru.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'riwayat-plus' && isKedisiplinan && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-layout-border flex justify-between items-center">
                    <h3 className="font-bold text-layout-text flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-500" />
                      Riwayat Pemberian Poin Plus (Reward)
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Tanggal</th>
                          <th className="px-4 py-3">Siswa</th>
                          <th className="px-4 py-3">Deskripsi Reward</th>
                          <th className="px-4 py-3 text-center">Poin</th>
                          <th className="px-4 py-3">Pemberi Poin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-layout-border">
                        {laporanLoading ? (
                          <tr><td colSpan={5} className="p-8 text-center text-layout-muted">Memuat data...</td></tr>
                        ) : rewardHistory.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-layout-muted">Belum ada riwayat poin plus di semester ini.</td></tr>
                        ) : rewardHistory.map((row: any) => (
                          <tr key={row.id} className="hover:bg-layout-hover/30 transition-colors">
                            <td className="px-4 py-3 text-xs text-layout-muted">{new Date(row.date).toLocaleDateString('id-ID')}</td>
                            <td className="px-4 py-3 font-bold text-layout-text">{row.student_name}</td>
                            <td className="px-4 py-3 text-xs">
                              {row.violation_desc}
                              {row.notes && <div className="text-[10px] text-layout-muted mt-0.5">{row.notes}</div>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-bold">+{Math.abs(row.points)}</span>
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold">{row.teacher_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* F2: Student Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-layout-card w-full max-w-md rounded-2xl shadow-xl border border-layout-border overflow-hidden">
            <div className="p-5 border-b border-layout-border bg-amber-500/5">
              <h3 className="font-bold text-lg text-layout-text flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                Konfirmasi Pengakuan Siswa
              </h3>
              <p className="text-xs text-layout-muted mt-1">Pastikan siswa telah membaca dan mengakui pelanggaran ini.</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-layout-muted uppercase tracking-wider">Siswa</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {formData.student_ids.map(id => {
                    const s = students.find(st => st.id === Number(id));
                    return s ? <span key={id} className="px-2.5 py-1 bg-layout-bg border border-layout-border rounded-full text-xs font-semibold">{s.name}</span> : null;
                  })}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-layout-muted uppercase tracking-wider">Jenis Pelanggaran</label>
                <p className="text-sm font-semibold text-layout-text mt-1">
                  {violations.find(v => v.id === Number(formData.violation_id))?.description || '-'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-[10px] font-bold text-layout-muted uppercase tracking-wider">Poin</label>
                  <p className="text-sm font-black text-red-500 mt-1">
                    {violations.find(v => v.id === Number(formData.violation_id))?.points || 0}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-layout-muted uppercase tracking-wider">Tanggal</label>
                  <p className="text-sm font-semibold text-layout-text mt-1">
                    {new Date(formData.occurred_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              {formData.reporter_notes && (
                <div>
                  <label className="text-[10px] font-bold text-layout-muted uppercase tracking-wider">Catatan</label>
                  <p className="text-sm text-layout-muted mt-1 italic">"{formData.reporter_notes}"</p>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-layout-border flex gap-3">
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="flex-1 py-2.5 text-sm font-bold border border-layout-border rounded-xl hover:bg-layout-hover transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmedSubmit}
                disabled={formLoading}
                className="flex-[2] py-2.5 text-sm font-bold bg-[#2d7a50] hover:bg-[#1a4a30] text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {formLoading ? 'Menyimpan...' : '✅ Saya Mengakui Pelanggaran Ini'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MASTER MANAGEMENT MODAL */}
      {showMasterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-layout-card w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col border border-layout-border">
            <div className="flex items-center justify-between p-5 border-b border-layout-border">
              <div>
                <h3 className="font-bold text-lg text-layout-text">Kelola Jenis Pelanggaran & Penghargaan</h3>
                <p className="text-xs text-layout-muted">Atur data master yang muncul di opsi pelaporan</p>
              </div>
              <button onClick={() => setShowMasterModal(false)} className="p-2 text-layout-muted hover:text-red-500 rounded-lg transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-auto bg-layout-bg flex flex-col md:flex-row gap-6">
              {/* Form Section */}
              <div className="w-full md:w-1/3 bg-layout-card p-4 rounded-xl border border-layout-border shadow-sm h-fit sticky top-0">
                <h4 className="font-bold text-sm mb-4 border-b border-layout-border pb-2">
                  {masterFormData?.id ? 'Edit Data' : 'Tambah Baru'}
                </h4>
                <form onSubmit={handleSaveMaster} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Kode</label>
                    <input type="text" required value={masterFormData?.code || ''} onChange={e => setMasterFormData({...masterFormData, code: e.target.value})} className="w-full text-sm border border-layout-border rounded-lg p-2 bg-layout-bg" placeholder="001, 101" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Jenis</label>
                    <select required value={masterFormData?.type || 'penalty'} onChange={e => setMasterFormData({...masterFormData, type: e.target.value as 'penalty'|'reward'})} className="w-full text-sm border border-layout-border rounded-lg p-2 bg-layout-bg">
                      <option value="penalty">Pelanggaran (Penalty)</option>
                      <option value="reward">Aktivitas Positif (Reward)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Poin</label>
                    <input type="number" required value={masterFormData?.points || ''} onChange={e => setMasterFormData({...masterFormData, points: Number(e.target.value)})} className="w-full text-sm border border-layout-border rounded-lg p-2 bg-layout-bg" placeholder="-5, 2" />
                    <p className="text-[10px] text-layout-muted mt-1">Gunakan angka negatif untuk pelanggaran.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Deskripsi Lengkap</label>
                    <textarea required value={masterFormData?.description || ''} onChange={e => setMasterFormData({...masterFormData, description: e.target.value})} className="w-full text-sm border border-layout-border rounded-lg p-2 bg-layout-bg resize-none h-24" placeholder="Deskripsi aktivitas atau pelanggaran..." />
                  </div>
                  <div className="flex gap-2 pt-2">
                    {masterFormData && (
                      <button type="button" onClick={() => setMasterFormData(null)} className="flex-1 py-2 text-xs font-bold border border-layout-border rounded-lg hover:bg-layout-hover">Batal</button>
                    )}
                    <button type="submit" disabled={masterLoading} className="flex-[2] py-2 text-xs font-bold bg-[#d4a23a] text-white rounded-lg hover:bg-[#b5892f] disabled:opacity-50">
                      {masterLoading ? 'Menyimpan...' : 'Simpan Data'}
                    </button>
                  </div>
                </form>
              </div>

              {/* List Section */}
              <div className="w-full md:w-2/3 border border-layout-border rounded-xl overflow-hidden bg-layout-card">
                <div className="overflow-auto max-h-[60vh]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-layout-bg border-b border-layout-border text-xs sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-3">Kode</th>
                        <th className="p-3">Deskripsi</th>
                        <th className="p-3">Poin</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-layout-border">
                      {violations.map(v => (
                        <tr key={v.id} className="hover:bg-layout-bg group">
                          <td className="p-3 font-semibold text-xs whitespace-nowrap">[{v.code}]</td>
                          <td className="p-3 text-xs">{v.description}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${v.type === 'penalty' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                              {v.points}
                            </span>
                          </td>
                          <td className="p-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => setMasterFormData(v)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Edit">
                                <Settings className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteMaster(v.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Hapus">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}

