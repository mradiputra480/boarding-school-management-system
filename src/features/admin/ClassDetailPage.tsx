import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { useLangStore } from '@/stores/langStore';
import { ArrowLeft, Users, Download, Upload, UserPlus, X, Check, Search, TrendingUp, Award, UserMinus, Eye, EyeOff, Unlock, ShieldAlert, Palette, Activity } from 'lucide-react';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface ClassDetail {
  id: number;
  name: string;
  level: string;
  status: string;
  homeroom_teacher: { id: number; name: string } | null;
  semester: { id: number; name: string } | null;
  graduation_announced?: boolean;
  graduation_message?: string | null;
}

interface StudentDetail {
  id: number;
  nisn: string;
  name: string;
  gender: string;
  photo: string | null;
  is_active: boolean;
  portfolio_url: string | null;
  graduation_status?: 'lulus' | 'tidak_lulus' | 'ditahan' | null;
  graduation_message?: string | null;
  discipline_score: number | null;
  academic_average: number;
  achievements_count: number;
}

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLangStore();
  
  const [classInfo, setClassInfo] = useState<ClassDetail | null>(null);
  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: 'name'|'academic_average'|'discipline_score', direction: 'asc'|'desc'}>({key: 'name', direction: 'asc'});

  // Assign Modal
  const [assignModal, setAssignModal] = useState(false);
  const [unassigned, setUnassigned] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignFilter, setAssignFilter] = useState<string>('all');

  // Bulk Upload Modal
  const [uploadModal, setUploadModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Inline editing portfolio tracking
  const [editingUrl, setEditingUrl] = useState<{id: number, url: string} | null>(null);
  const [savingUrlId, setSavingUrlId] = useState<number | null>(null);

  const [gradMessage, setGradMessage] = useState('');
  const [savingGradMsg, setSavingGradMsg] = useState(false);

  // Distribution
  const [distributionStatus, setDistributionStatus] = useState<any>(null);

  // Individual Graduation Modal
  const [gradModal, setGradModal] = useState<StudentDetail | null>(null);
  const [indGradStatus, setIndGradStatus] = useState<'lulus' | 'tidak_lulus' | 'ditahan' | ''>('');
  const [indGradMsg, setIndGradMsg] = useState('');
  const [savingIndGrad, setSavingIndGrad] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const [{ data }, analyticsRes] = await Promise.all([
        api.get(`/admin/classes/${id}/detail`),
        api.get(`/admin/class-analytics/${id}`).catch(() => ({ data: null }))
      ]);
      setClassInfo(data.class);
      setStudents(data.students);
      if (analyticsRes.data) setAnalytics(analyticsRes.data);
      setGradMessage(data.class.graduation_message || '');

      if (data.class.semester?.id) {
        const distRes = await api.get('/admin/report-cards/distribution-status', {
          params: { class_id: id, semester_id: data.class.semester.id }
        });
        setDistributionStatus(distRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleSort = (key: 'name' | 'academic_average' | 'discipline_score' | 'achievements_count') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedStudents = [...students].sort((a, b) => {
    const vA = a[sortConfig.key] ?? 0;
    const vB = b[sortConfig.key] ?? 0;
    if (vA < vB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (vA > vB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredStudents = sortedStudents.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.nisn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = students.filter(s => s.is_active).length;
  const inactiveCount = students.length - activeCount;

  // Actions
  const toggleStatus = async (student: StudentDetail) => {
    const action = student.is_active ? 'Non-aktifkan (Keluarkan)' : 'Aktifkan kembali';
    if (!(await confirmDialog(`Yakin ingin ${action} siswa ${student.name}? Jika dinonaktifkan, siswa tidak akan muncul di form penilaian guru.`, 'Konfirmasi', false))) return;

    try {
      await api.post(`/admin/classes/${id}/toggle-student/${student.id}`);
      fetchDetail();
    } catch (err) {
      alertDialog('Gagal mengubah status');
    }
  };

  const handleSavePortfolio = async (studentId: number) => {
    if (!editingUrl || editingUrl.id !== studentId) return;
    setSavingUrlId(studentId);
    try {
      await api.post(`/admin/classes/${id}/portfolio/${studentId}`, { portfolio_url: editingUrl.url });
      setStudents(students.map(s => s.id === studentId ? { ...s, portfolio_url: editingUrl.url } : s));
      setEditingUrl(null);
    } catch (err) {
      alertDialog('Gagal menyimpan link portofolio');
    } finally {
      setSavingUrlId(null);
    }
  };

  const toggleGraduation = async () => {
    if (!classInfo) return;
    const action = classInfo.graduation_announced ? 'Batalkan pengumuman' : 'Umumkan';
    if (!(await confirmDialog(`${action} kelulusan untuk kelas ini?`, 'Konfirmasi', false))) return;
    try {
      await api.patch(`/admin/classes/${id}/graduation`);
      fetchDetail();
    } catch { alertDialog('Gagal'); }
  };

  const saveGradMessage = async () => {
    setSavingGradMsg(true);
    try {
      await api.patch(`/admin/classes/${id}/graduation-message`, { graduation_message: gradMessage });
      alertDialog('Pesan kelulusan tersimpan');
      fetchDetail();
    } catch { alertDialog('Gagal menyimpan pesan'); }
    finally { setSavingGradMsg(false); }
  };

  const openGradModal = (student: StudentDetail) => {
    setGradModal(student);
    setIndGradStatus(student.graduation_status || '');
    setIndGradMsg(student.graduation_message || '');
  };

  const handleSaveIndGrad = async () => {
    if (!gradModal) return;
    setSavingIndGrad(true);
    try {
      await api.put(`/admin/classes/${id}/students/${gradModal.id}/graduation`, {
        graduation_status: indGradStatus || null,
        graduation_message: indGradMsg || null
      });
      setGradModal(null);
      fetchDetail();
    } catch {
      alertDialog('Gagal menyimpan status kelulusan');
    } finally {
      setSavingIndGrad(false);
    }
  };

  const openAssignModal = async () => {
    setAssignModal(true); setSelectedStudents([]); setAssignFilter('all');
    try {
      const { data } = await api.get('/admin/classes/unassigned-students');
      setUnassigned(data.data);
    } catch {}
  };

  const handleAssign = async () => {
    if (selectedStudents.length === 0) return;
    setAssignLoading(true);
    try {
      await api.post(`/admin/classes/${id}/assign-students`, { student_ids: selectedStudents });
      setAssignModal(false);
      fetchDetail();
    } catch {
      alertDialog('Gagal assign siswa');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', excelFile);
    try {
      await api.post(`/admin/classes/${id}/bulk-portfolio`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadModal(false); setExcelFile(null);
      fetchDetail();
      alertDialog('Bulk upload portofolio berhasil!');
    } catch (err) {
      alertDialog('Gagal upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get(`/admin/classes/${id}/export-portfolio-template`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Template_Portofolio_${classInfo?.name.replace(/ /g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alertDialog('Gagal mendownload template');
    }
  };  const unlockAllGrades = async () => {
    if (!classInfo) return;
    if (!(await confirmDialog(`Yakin ingin membuka SEMUA kunci nilai mapel untuk kelas ${classInfo.name}? Semua guru mapel akan dapat mengedit nilai kembali.`, 'Konfirmasi', false))) return;
    
    try {
      const res = await api.post(`/admin/classes/${id}/unlock-all-grades`);
      alertDialog(res.data.message || 'Kunci nilai berhasil dibuka!');
    } catch (err: any) {
      alertDialog(err.response?.data?.message || 'Gagal membuka kunci nilai.');
    }
  };



  const distributeGrades = async () => {
    if (!classInfo?.semester?.id) return;
    if (!(await confirmDialog('Yakin ingin mendistribusikan semua nilai ke portal Orang Tua? Nilai akan dikunci dan orang tua akan dapat melihatnya.', 'Konfirmasi', false))) return;
    try {
      await api.post('/admin/report-cards/distribute', { class_id: id, semester_id: classInfo.semester.id });
      alertDialog('Nilai berhasil didistribusikan.');
      fetchDetail();
    } catch (err) {
      alertDialog('Gagal mendistribusikan nilai.');
    }
  };

  const undistributeGrades = async () => {
    if (!classInfo?.semester?.id) return;
    if (!(await confirmDialog('Yakin ingin menarik kembali (undistribute) nilai? Nilai akan disembunyikan dari portal Orang Tua dan kunci akan dibuka untuk guru.', 'Konfirmasi', false))) return;
    try {
      await api.post('/admin/report-cards/undistribute', { class_id: id, semester_id: classInfo.semester.id });
      alertDialog('Distribusi nilai ditarik.');
      fetchDetail();
    } catch (err) {
      alertDialog('Gagal menarik distribusi nilai.');
    }
  };

  const renderDisciplineBar = (score: number | null) => {
    if (score === null) return <span className="text-xs text-layout-muted italic">Belum ada nilai</span>;
    let color = 'bg-red-500';
    if (score >= 90) color = 'bg-green-500';
    else if (score >= 75) color = 'bg-blue-500';
    else if (score >= 60) color = 'bg-amber-500';
    
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-layout-bg rounded-full overflow-hidden border border-layout-border">
          <div className={`h-full ${color}`} style={{ width: `${score}%` }}></div>
        </div>
        <span className="text-xs font-bold text-layout-text w-6">{score}</span>
      </div>
    );
  };

  const renderAcademicBar = (average: number) => {
    if (!average) return <span className="text-xs text-layout-muted italic">0.0</span>;
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-layout-bg rounded-full overflow-hidden border border-layout-border">
          <div className="h-full bg-[#2d7a50]" style={{ width: `${average}%` }}></div>
        </div>
        <span className="text-xs font-bold text-layout-text w-8">{average.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <AdminLayout title="Detail Kelas">
      <button onClick={() => navigate('/admin/classes')} className="flex items-center gap-2 text-sm text-layout-muted hover:text-[#2d7a50] font-medium mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Kelas
      </button>

      {loading || !classInfo ? (
        <div className="flex justify-center items-center h-40 text-layout-muted">Memuat detail kelas...</div>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-[#2d7a50] to-[#1b5e3a] rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                    {classInfo.semester?.name}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${classInfo.status === 'active' ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'}`}>
                    {classInfo.status === 'active' ? 'Aktif' : 'Draft'}
                  </span>
                </div>
                <h1 className="text-3xl font-black mb-1">{classInfo.name}</h1>
                <p className="text-green-50/80 font-medium">Homeroom: {classInfo.homeroom_teacher?.name || 'Belum di-set'}</p>
              </div>
              <div className="flex items-center gap-6 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="text-center">
                  <p className="text-3xl font-black">{activeCount}</p>
                  <p className="text-[10px] uppercase tracking-widest text-green-50/70 font-semibold">Aktif</p>
                </div>
                <div className="w-px h-10 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-3xl font-black text-amber-200">{inactiveCount}</p>
                  <p className="text-[10px] uppercase tracking-widest text-green-50/70 font-semibold">Keluar</p>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Summary Widget */}
          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-layout-card border border-layout-border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] uppercase font-bold tracking-wider text-layout-muted mb-1 flex items-center gap-1.5"><TrendingUp className="w-3 h-3"/> Rata-Rata Kelas</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-black text-layout-text">{analytics.class_average}</p>
                </div>
              </div>
              <div className="bg-layout-card border border-layout-border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] uppercase font-bold tracking-wider text-layout-muted mb-1 flex items-center gap-1.5"><Award className="w-3 h-3"/> Rata-Rata Disiplin</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-black text-layout-text">{analytics.class_discipline_average}</p>
                </div>
              </div>
              <div className="bg-layout-card border border-layout-border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] uppercase font-bold tracking-wider text-layout-muted mb-1 flex items-center gap-1.5"><Award className="w-3 h-3"/> Rata-Rata Digiart</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-black text-[#2d7a50]">{analytics.class_digiart_average}</p>
                </div>
              </div>
              <div className="bg-layout-card border border-layout-border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] uppercase font-bold tracking-wider text-layout-muted mb-1 flex items-center gap-1.5"><Award className="w-3 h-3"/> Rata-Rata Ekstra</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-black text-[#3a8fd4]">{analytics.class_ekstra_average}</p>
                </div>
              </div>
              <div 
                className={`bg-layout-card border border-layout-border rounded-xl p-4 shadow-sm ${analytics.at_risk_count > 0 ? 'cursor-pointer hover:border-red-300 transition-colors' : ''}`}
                onClick={() => {
                  if (analytics.at_risk_count > 0) {
                    const atRiskStudents = analytics.students.filter((s:any) => s.is_at_risk).map((s:any) => s.name).join(', ');
                    alertDialog(`Siswa At-Risk:\n\n${atRiskStudents}\n\nSilakan cek tabel detail siswa di bawah untuk informasi selengkapnya.`);
                  }
                }}
              >
                <p className="text-[10px] uppercase font-bold tracking-wider text-layout-muted mb-1 flex items-center gap-1.5"><Users className="w-3 h-3"/> Siswa At-Risk</p>
                <div className="flex items-end gap-2">
                  <p className={`text-2xl font-black ${analytics.at_risk_count > 0 ? 'text-[#d45a5a]' : 'text-[#2d7a50]'}`}>{analytics.at_risk_count}</p>
                  <span className="text-xs text-layout-muted font-medium mb-1">Siswa</span>
                </div>
              </div>
              <div className="bg-layout-card border border-layout-border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] uppercase font-bold tracking-wider text-layout-muted mb-1 flex items-center gap-1.5"><Eye className="w-3 h-3"/> Pelanggaran Sering</p>
                <div className="flex items-end gap-2">
                  <p className="text-sm font-bold text-layout-text truncate" title={analytics.frequent_violations?.[0]?.violation?.description || '-'}>
                    {analytics.frequent_violations?.length > 0 ? analytics.frequent_violations[0].violation.description : '-'}
                  </p>
                </div>
              </div>
              <div className="bg-layout-card border border-layout-border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] uppercase font-bold tracking-wider text-layout-muted mb-1 flex items-center gap-1.5"><Award className="w-3 h-3"/> Total Prestasi</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-black text-layout-text">{analytics.total_achievements || 0}</p>
                </div>
              </div>
              <div 
                className={`bg-layout-card border ${analytics.top_student ? 'border-[#d4a23a]/50 bg-[#d4a23a]/5 cursor-pointer hover:bg-[#d4a23a]/10' : 'border-layout-border'} rounded-xl p-4 shadow-sm transition-colors`}
                onClick={() => {
                  if (analytics.top_student) navigate(`/admin/student-progress/${analytics.top_student.student.id}`);
                }}
              >
                <p className="text-[10px] uppercase font-bold tracking-wider text-layout-muted mb-1 flex items-center gap-1.5 text-[#d4a23a]"><Award className="w-3 h-3"/> Juara Kelas</p>
                <div className="flex items-end gap-2">
                  <p className="text-sm font-black text-layout-text truncate">{analytics.top_student ? analytics.top_student.student.name : '-'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Graduation Section for Level IX */}
          {(classInfo.level === 'IX' || classInfo.level === '9') && (
            <div className="bg-layout-card border border-[#d4a23a]/30 rounded-xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4a23a]/5 rounded-bl-full"></div>
              <h3 className="text-lg font-bold text-[#d4a23a] flex items-center gap-2 mb-4">
                <Award className="w-5 h-5" /> Pengumuman Kelulusan
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div>
                  <p className="text-sm text-layout-muted mb-3">
                    Status Pengumuman: {classInfo.graduation_announced ? <span className="text-green-600 font-bold">SUDAH DIUMUMKAN</span> : <span className="text-gray-500 font-bold">BELUM DIUMUMKAN</span>}
                  </p>
                  <button 
                    onClick={toggleGraduation}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${
                      classInfo.graduation_announced 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-[#d4a23a] text-white hover:bg-[#b5882b]'
                    }`}
                  >
                    {classInfo.graduation_announced ? <><EyeOff className="w-4 h-4"/> Batalkan Pengumuman</> : <><Eye className="w-4 h-4"/> Umumkan Sekarang</>}
                  </button>
                  <p className="text-xs text-layout-muted mt-2">Jika diumumkan, orang tua akan melihat status LULUS di portal mereka.</p>

                  <div className="mt-4 flex gap-3">
                    <div className="bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 text-center">
                      <p className="text-[10px] text-green-600 uppercase font-bold">Lulus</p>
                      <p className="text-lg font-black text-green-700">{students.filter(s => s.graduation_status === 'lulus' || (s.graduation_status == null && classInfo.graduation_announced)).length}</p>
                    </div>
                    <div className="bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 text-center">
                      <p className="text-[10px] text-red-600 uppercase font-bold">Tdk Lulus</p>
                      <p className="text-lg font-black text-red-700">{students.filter(s => s.graduation_status === 'tidak_lulus').length}</p>
                    </div>
                    <div className="bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 text-center">
                      <p className="text-[10px] text-amber-600 uppercase font-bold">Ditahan</p>
                      <p className="text-lg font-black text-amber-700">{students.filter(s => s.graduation_status === 'ditahan').length}</p>
                    </div>
                    {!classInfo.graduation_announced && (
                      <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-center">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Belum Diumumkan</p>
                        <p className="text-lg font-black text-gray-600">{students.filter(s => s.graduation_status == null).length}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-layout-text mb-2">Pesan Kustom Kelulusan (Opsional)</label>
                  <textarea 
                    rows={3} 
                    value={gradMessage} 
                    onChange={e => setGradMessage(e.target.value)}
                    className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4a23a] mb-2"
                    placeholder="Contoh: Selamat atas kelulusannya! Tetap semangat meraih cita-cita."
                  ></textarea>
                  <button 
                    onClick={saveGradMessage} 
                    disabled={savingGradMsg}
                    className="px-4 py-2 bg-layout-bg border border-layout-border text-layout-text rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                  >
                    {savingGradMsg ? 'Menyimpan...' : 'Simpan Pesan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-layout-muted" />
              <input 
                type="text" placeholder="Cari nama / NISN..." 
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-layout-card border border-layout-border rounded-xl text-sm focus:outline-none focus:border-[#2d7a50] shadow-sm transition-all"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button onClick={() => setUploadModal(true)} className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-layout-card border border-layout-border text-[#2d7a50] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-layout-bg transition-colors shadow-sm">
                <Upload className="w-4 h-4" /> Portofolio Massal
              </button>
              <button onClick={openAssignModal} className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-[#2d7a50] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3d9968] transition-colors shadow-sm">
                <UserPlus className="w-4 h-4" /> Tambah Siswa
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-layout-bg/50 border-b border-layout-border text-layout-muted text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4 cursor-pointer hover:text-layout-text" onClick={() => handleSort('name')}>
                      Siswa {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-layout-text" onClick={() => handleSort('academic_average')}>
                      <div className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5"/> Nilai {sortConfig.key === 'academic_average' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-layout-text" onClick={() => handleSort('discipline_score')}>
                      <div className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5"/> Disiplin {sortConfig.key === 'discipline_score' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-layout-text text-center" onClick={() => handleSort('achievements_count')}>
                      <div className="flex items-center justify-center gap-1.5"><Award className="w-3.5 h-3.5"/> Prestasi {sortConfig.key === 'achievements_count' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5"><Palette className="w-3.5 h-3.5"/> Digiart</div>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5"><Activity className="w-3.5 h-3.5"/> Ekstra</div>
                    </th>
                    <th className="px-6 py-4">Link Portofolio</th>
                    {(classInfo?.level === 'IX' || classInfo?.level === '9') && <th className="px-6 py-4 text-center">Kelulusan</th>}
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-layout-border">
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-layout-muted">Tidak ada siswa ditemukan.</td></tr>
                  ) : filteredStudents.map(student => (
                    <tr key={student.id} className={`hover:bg-layout-hover/50 transition-colors ${!student.is_active ? 'opacity-60 bg-layout-bg/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${student.is_active ? 'bg-[#3a8fd4]/10 text-[#3a8fd4]' : 'bg-gray-200 text-gray-500'}`}>
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className={`font-bold ${!student.is_active ? 'line-through text-layout-muted' : 'text-layout-text'}`}>{student.name}</p>
                            <p className="text-xs text-layout-muted">{student.nisn} • {student.gender === 'Laki-laki' ? 'L' : 'P'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {renderAcademicBar(student.academic_average)}
                      </td>
                      <td className="px-6 py-4">
                        {renderDisciplineBar(student.discipline_score)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.achievements_count > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[2rem] gap-1 px-2 py-1 bg-yellow-50 text-yellow-600 rounded-lg text-xs font-bold border border-yellow-200" title={`${student.achievements_count} Prestasi`}>
                            <Award className="w-3 h-3" /> {student.achievements_count}
                          </span>
                        ) : (
                          <span className="text-layout-muted text-xs font-medium">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.digiart_grade ? (
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-200">
                            {student.digiart_grade}
                          </span>
                        ) : (
                          <span className="text-layout-muted text-xs font-medium">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.ekstra_grade ? (
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-200">
                            {student.ekstra_grade}
                          </span>
                        ) : (
                          <span className="text-layout-muted text-xs font-medium">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative flex items-center w-64">
                          <input
                            type="text"
                            placeholder="https://..."
                            value={editingUrl?.id === student.id ? editingUrl.url : (student.portfolio_url || '')}
                            onChange={(e) => setEditingUrl({ id: student.id, url: e.target.value })}
                            onFocus={() => { if (!editingUrl || editingUrl.id !== student.id) setEditingUrl({ id: student.id, url: student.portfolio_url || '' }) }}
                            onBlur={() => handleSavePortfolio(student.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSavePortfolio(student.id) }}
                            disabled={!student.is_active || savingUrlId === student.id}
                            className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-1.5 text-xs text-layout-text focus:outline-none focus:border-[#2d7a50] disabled:opacity-50"
                          />
                          {savingUrlId === student.id && <span className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 border border-t-transparent border-[#2d7a50] rounded-full animate-spin"></span>}
                        </div>
                      </td>
                      {(classInfo?.level === 'IX' || classInfo?.level === '9') && (
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => openGradModal(student)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1 mx-auto ${
                              student.graduation_status === 'ditahan' || student.graduation_status === 'tidak_lulus' 
                                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                : student.graduation_status === 'lulus' || (student.graduation_status == null && classInfo?.graduation_announced)
                                ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <Award className="w-3.5 h-3.5" />
                            {student.graduation_status === 'ditahan' ? 'Ditahan' : student.graduation_status === 'tidak_lulus' ? 'Tidak Lulus' : student.graduation_status === 'lulus' ? 'Lulus' : (classInfo?.graduation_announced ? 'Lulus (Default)' : 'Belum Diumumkan')}
                          </button>
                        </td>
                      )}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleStatus(student)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 mx-auto ${
                            student.is_active 
                            ? 'bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20' 
                            : 'bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20'
                          }`}
                        >
                          {student.is_active ? 'Aktif' : <><UserMinus className="w-3.5 h-3.5"/> Keluar</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Upload Excel */}
          {uploadModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-layout-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-layout-border flex items-center justify-between">
                  <h2 className="text-lg font-bold text-layout-text">Bulk Upload Portofolio</h2>
                  <button onClick={() => setUploadModal(false)} className="text-layout-muted hover:text-layout-text"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleBulkUpload} className="p-6">
                  <button type="button" onClick={handleDownloadTemplate} className="w-full mb-4 px-4 py-2 border border-[#2d7a50] text-[#2d7a50] rounded-lg font-medium text-sm hover:bg-[#2d7a50]/5">📥 Unduh Template CSV Portofolio</button>
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">Format Excel (.xlsx / .csv)</p>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
                      Siapkan file excel dengan minimal dua kolom (header huruf kecil):<br/>
                      <strong className="font-bold">nisn</strong> (Contoh: 0081234567)<br/>
                      <strong className="font-bold">portfolio_url</strong> (Contoh: https://sites.google.com/...)
                    </p>
                  </div>
                  <div className="border-2 border-dashed border-layout-border hover:border-[#2d7a50] rounded-xl p-8 text-center transition-colors">
                    <input type="file" id="bulkUpload" accept=".xlsx,.xls,.csv" onChange={e => setExcelFile(e.target.files?.[0] || null)} className="hidden" />
                    <label htmlFor="bulkUpload" className="cursor-pointer flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-[#2d7a50]/10 rounded-full flex items-center justify-center text-[#2d7a50]">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-layout-text">{excelFile ? excelFile.name : 'Pilih file Excel'}</span>
                    </label>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setUploadModal(false)} className="px-4 py-2 text-sm font-semibold text-layout-muted hover:bg-layout-bg rounded-lg">Batal</button>
                    <button type="submit" disabled={!excelFile || uploading} className="px-4 py-2 bg-[#2d7a50] text-white text-sm font-bold rounded-lg hover:bg-[#3d9968] disabled:opacity-50">
                      {uploading ? 'Mengupload...' : 'Upload Data'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Kelulusan Individual */}
          {gradModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-layout-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-layout-border flex items-center justify-between">
                  <h2 className="text-lg font-bold text-layout-text flex items-center gap-2"><Award className="w-5 h-5 text-[#d4a23a]"/> Status Kelulusan Individual</h2>
                  <button onClick={() => setGradModal(null)} className="text-layout-muted hover:text-layout-text"><X className="w-5 h-5"/></button>
                </div>
                <div className="p-6">
                  <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Siswa Terpilih:</p>
                    <p className="text-sm font-bold text-layout-text">{gradModal.name}</p>
                    <p className="text-xs text-layout-muted">{gradModal.nisn}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-layout-text mb-2">Status Spesifik</label>
                      <select 
                        value={indGradStatus}
                        onChange={e => setIndGradStatus(e.target.value as any)}
                        className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d4a23a]"
                      >
                        <option value="">-- Mengikuti Default Kelas --</option>
                        <option value="lulus">Lulus</option>
                        <option value="tidak_lulus">Tidak Lulus</option>
                        <option value="ditahan">Ditahan Sementara</option>
                      </select>
                      <p className="text-[11px] text-layout-muted mt-1">
                        Jika "Ditahan" atau "Tidak Lulus", siswa tidak akan bisa mengunduh SKL.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-layout-text mb-2 flex items-center gap-1.5">
                        Keterangan / Alasan 
                        <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded">(Wajib diisi jika ditahan/tidak lulus)</span>
                      </label>
                      <textarea 
                        rows={3} 
                        value={indGradMsg} 
                        onChange={e => setIndGradMsg(e.target.value)}
                        className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d4a23a]"
                        placeholder="Contoh: Masih ada tanggungan administrasi. Harap hubungi Tata Usaha."
                      ></textarea>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setGradModal(null)} className="px-4 py-2 text-sm font-semibold text-layout-muted hover:bg-layout-bg rounded-lg">Batal</button>
                    <button type="button" onClick={handleSaveIndGrad} disabled={savingIndGrad} className="px-4 py-2 bg-[#d4a23a] text-white text-sm font-bold rounded-lg hover:bg-[#b5882b] disabled:opacity-50">
                      {savingIndGrad ? 'Menyimpan...' : 'Simpan Status'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Assign Siswa */}
          {assignModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-layout-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="px-6 py-4 border-b border-layout-border flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-3">
                  <h2 className="text-lg font-bold text-layout-text flex items-center gap-2"><UserPlus className="w-5 h-5 text-[#2d7a50]"/> Tambah Siswa</h2>
                  <div className="flex items-center gap-2">
                    <select value={assignFilter} onChange={e=>setAssignFilter(e.target.value)} className="bg-layout-bg border border-layout-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#2d7a50]">
                      <option value="all">Semua Siswa</option>
                      {Array.from(new Set(unassigned.map(s=>s.temp_class).filter(Boolean))).map((tc: any) => (
                        <option key={tc} value={tc}>Kelas Excel: {tc}</option>
                      ))}
                    </select>
                    <button onClick={() => setAssignModal(false)} className="text-layout-muted hover:text-layout-text p-1"><X className="w-5 h-5"/></button>
                  </div>
                </div>
                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                  {unassigned.length === 0 ? (
                    <div className="text-center py-8 text-layout-muted italic">Tidak ada siswa yang belum masuk kelas.</div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-layout-border">
                        <input type="checkbox" checked={selectedStudents.length > 0 && selectedStudents.length === unassigned.filter(s => assignFilter === 'all' || s.temp_class === assignFilter).length} onChange={e => {
                          const filteredIds = unassigned.filter(s => assignFilter === 'all' || s.temp_class === assignFilter).map(s => s.id);
                          if(e.target.checked) {
                            const newSelected = [...new Set([...selectedStudents, ...filteredIds])];
                            setSelectedStudents(newSelected);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => !filteredIds.includes(id)));
                          }
                        }} className="w-4 h-4 rounded text-[#2d7a50]" />
                        <span className="text-sm font-bold text-layout-text">Pilih Semua ({unassigned.filter(s => assignFilter === 'all' || s.temp_class === assignFilter).length})</span>
                      </div>
                      <div className="space-y-2">
                        {unassigned.filter(s => assignFilter === 'all' || s.temp_class === assignFilter).map(s => (
                          <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedStudents.includes(s.id) ? 'border-[#2d7a50] bg-[#2d7a50]/5' : 'border-layout-border hover:bg-layout-bg'}`}>
                            <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={e => setSelectedStudents(e.target.checked ? [...selectedStudents, s.id] : selectedStudents.filter(id => id !== s.id))} className="w-4 h-4 rounded text-[#2d7a50]" />
                            <div>
                              <p className="text-sm font-bold text-layout-text">{s.name}</p>
                              <p className="text-xs text-layout-muted">{s.nisn} • {s.gender}</p>
                              {s.temp_class && <p className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1 inline-block">📋 {s.temp_class}</p>}
                            </div>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {unassigned.length > 0 && (
                  <div className="px-6 py-4 border-t border-layout-border flex justify-end gap-3 shrink-0 bg-layout-bg/50">
                    <button onClick={() => setAssignModal(false)} className="px-4 py-2 text-sm font-semibold text-layout-muted hover:bg-layout-bg rounded-lg">Batal</button>
                    <button onClick={handleAssign} disabled={selectedStudents.length === 0 || assignLoading} className="px-4 py-2 bg-[#2d7a50] text-white text-sm font-bold rounded-lg hover:bg-[#3d9968] disabled:opacity-50 flex items-center gap-2">
                      {assignLoading ? 'Menyimpan...' : <><Check className="w-4 h-4"/> Tambahkan {selectedStudents.length} Siswa</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </AdminLayout>
  );
}
