import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '@/components/layouts/TeacherLayout';
import { useLangStore } from '@/stores/langStore';
import api from '@/lib/axios';
import { Users, Calendar, Award, Save, Search, CheckCircle, XCircle, AlertCircle, Clock, FileText, Printer, Lock, Unlock, ShieldCheck, ShieldAlert, TrendingUp, Image, ExternalLink, Palette, Activity, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import ReportCardPrint from './ReportCardPrint';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface Student {
  id: number;
  name: string;
  nis: string;
  nisn: string;
  gender: string;
}

interface SchoolClass {
  id: number;
  name: string;
  level: string;
}

export default function HomeroomPage() {
  const { t } = useLangStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'attendance_monthly' | 'discipline' | 'discipline_verify' | 'reportcard' | 'activities' | 'analytics'>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolClass, setSchoolClass] = useState<SchoolClass | null>(null);
  const [loading, setLoading] = useState(true);

  // Attendance State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendances, setAttendances] = useState<Record<number, { status: string; notes: string }>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [monthlyAttendances, setMonthlyAttendances] = useState<any[]>([]);

  // Discipline State
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [savingDiscipline, setSavingDiscipline] = useState(false);
  const [pendingRecords, setPendingRecords] = useState<any[]>([]);

  // Achievements State
  const [achievements, setAchievements] = useState<any[]>([]);

  // Report Card State
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const getRemainingAutoApproveTime = (createdAtStr: string) => {
    const createdAt = new Date(createdAtStr).getTime();
    const expiresAt = createdAt + 48 * 60 * 60 * 1000;
    const now = Date.now();
    const diffMs = expiresAt - now;

    if (diffMs <= 0) {
      return {
        label: 'Lewat 48 Jam (Segera Auto-Approve)',
        badgeClass: 'bg-red-500/10 text-red-600 border border-red-500/20 font-bold',
      };
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      return {
        label: `Sisa ${hours}j ${minutes}m`,
        badgeClass: 'bg-green-500/10 text-green-600 border border-green-500/20 font-semibold',
      };
    } else if (hours >= 12) {
      return {
        label: `Sisa ${hours}j ${minutes}m`,
        badgeClass: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 font-semibold',
      };
    } else {
      return {
        label: `Sisa ${hours}j ${minutes}m (Segera)`,
        badgeClass: 'bg-red-500/10 text-red-600 border border-red-500/30 animate-pulse font-bold',
      };
    }
  };
  const [editingNotes, setEditingNotes] = useState<Record<number, string>>({});
  const [savingNote, setSavingNote] = useState<number | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [printStudentId, setPrintStudentId] = useState<number | null>(null);
  const [releaseDate, setReleaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [lockingAll, setLockingAll] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Activities State
  const [activitiesData, setActivitiesData] = useState<any[]>([]);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Month Filter State
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance' && schoolClass) {
      fetchAttendances();
    } else if (activeTab === 'attendance_monthly' && schoolClass) {
      fetchMonthlyAttendances();
    } else if (activeTab === 'discipline' && schoolClass) {
      fetchDisciplines();
    } else if (activeTab === 'discipline_verify' && schoolClass) {
      fetchPendingRecords();
    } else if (activeTab === 'achievements' && schoolClass) {
      fetchAchievements();
    } else if (activeTab === 'reportcard' && schoolClass && !reportData) {
      fetchReportCards();
    } else if (activeTab === 'activities' && schoolClass) {
      fetchActivities();
    } else if (activeTab === 'analytics' && schoolClass && !analyticsData) {
      fetchAnalytics();
    }
  }, [activeTab, selectedDate, schoolClass]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/homeroom/students');
      setStudents(res.data.data);
      setSchoolClass(res.data.class);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/teacher/homeroom/attendances?date=${selectedDate}`);
      const fetched: Record<number, { status: string; notes: string }> = {};
      res.data.data.forEach((att: any) => {
        fetched[att.student_id] = { status: att.status, notes: att.notes || '' };
      });
      // Initialize missing students with 'H'
      const newAtt = { ...fetched };
      students.forEach(s => {
        if (!newAtt[s.id]) {
          newAtt[s.id] = { status: 'H', notes: '' };
        }
      });
      setAttendances(newAtt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveAttendances = async () => {
    try {
      setSavingAttendance(true);
      const payload = Object.entries(attendances).map(([studentId, data]) => ({
        student_id: parseInt(studentId),
        status: data.status,
        notes: data.notes
      }));
      await api.post('/teacher/homeroom/attendances', { date: selectedDate, attendances: payload });
      alertDialog('Presensi berhasil disimpan!');
    } catch (err) {
      console.error(err);
      alertDialog('Gagal menyimpan presensi.');
    } finally {
      setSavingAttendance(false);
    }
  };

  const fetchMonthlyAttendances = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/homeroom/attendances/monthly');
      setMonthlyAttendances(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const monthlyData = useMemo(() => {
    const map = new Map();
    const displayMonthsSet = new Set<string>();
    const allMonthsSet = new Set<string>();
    
    monthlyAttendances.forEach(item => {
      allMonthsSet.add(item.month);
      if (selectedMonth !== 'all' && item.month !== selectedMonth) return;

      const key = selectedMonth === 'all' ? 'Semester Penuh' : item.month;
      displayMonthsSet.add(key);

      if (!map.has(item.student_id)) {
        map.set(item.student_id, {});
      }
      const studentData = map.get(item.student_id);
      if (!studentData[key]) {
        studentData[key] = { H: 0, S: 0, I: 0, A: 0 };
      }
      studentData[key][item.status] += item.count;
    });

    return { 
      map, 
      displayColumns: Array.from(displayMonthsSet).sort(),
      filterOptions: Array.from(allMonthsSet).sort()
    };
  }, [monthlyAttendances, selectedMonth]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/homeroom/achievements');
      setAchievements(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisciplines = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/homeroom/disciplines');
      setDisciplines(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveDisciplines = async () => {
    if (!(await confirmDialog('Kalkulasi ulang dan simpan nilai kedisiplinan secara permanen untuk rapor?', 'Konfirmasi', false))) return;
    try {
      setSavingDiscipline(true);
      await api.post('/teacher/homeroom/disciplines', {});
      alertDialog('Nilai kedisiplinan berhasil dihitung dan disimpan!');
      fetchDisciplines();
    } catch (err) {
      console.error(err);
      alertDialog('Gagal menyimpan nilai kedisiplinan.');
    } finally {
      setSavingDiscipline(false);
    }
  };

  const fetchPendingRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/discipline/homeroom-pending');
      setPendingRecords(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecord = async (id: number, status: 'approved' | 'rejected') => {
    const notes = status === 'rejected' ? (await promptDialog('Alasan penolakan:')) : '';
    if (status === 'rejected' && notes === null) return; // User cancelled
    
    try {
      await api.post(`/teacher/discipline/verify/${id}`, { status, reviewer_notes: notes });
      alertDialog(t('common.saveSuccess') || 'Berhasil diverifikasi');
      fetchPendingRecords();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || 'Gagal verifikasi');
    }
  };

  const fetchReportCards = async () => {
    try {
      setLoadingReport(true);
      const res = await api.get('/teacher/homeroom/report-cards');
      setReportData(res.data);
      // Initialize editing notes from existing data
      const notes: Record<number, string> = {};
      res.data.students?.forEach((s: any) => {
        notes[s.student.id] = s.homeroom_note || '';
      });
      setEditingNotes(notes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReport(false);
    }
  };

  const saveHomeroomNote = async (studentId: number) => {
    try {
      setSavingNote(studentId);
      await api.post('/teacher/homeroom/report-cards/note', {
        student_id: studentId,
        note: editingNotes[studentId] || '',
      });
      // Update reportData with saved note
      if (reportData) {
        const updated = { ...reportData };
        updated.students = updated.students.map((s: any) =>
          s.student.id === studentId ? { ...s, homeroom_note: editingNotes[studentId] || '' } : s
        );
        setReportData(updated);
      }
      alertDialog(t('reportCard.noteSaved') || 'Catatan berhasil disimpan!');
    } catch (err) {
      console.error(err);
      alertDialog(t('reportCard.noteError') || 'Gagal menyimpan catatan.');
    } finally {
      setSavingNote(null);
    }
  };

  const handlePrintAll = () => {
    setPrintStudentId(null);
    setShowPrintView(true);
    setTimeout(() => { window.print(); }, 500);
  };

  const handlePrintSingle = (studentId: number) => {
    setPrintStudentId(studentId);
    setShowPrintView(true);
    setTimeout(() => { window.print(); }, 500);
  };

  const handleLockAll = async () => {
    if (!(await confirmDialog(t('reportCard2.lockConfirm', 'Konfirmasi', false)))) return;
    try {
      setLockingAll(true);
      await api.post('/teacher/homeroom/report-cards/lock');
      fetchReportCards();
    } catch (err) { console.error(err); alertDialog(t('common.saveFailed')); }
    finally { setLockingAll(false); }
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/homeroom/activities');
      setActivitiesData(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportActivities = () => {
    if (activitiesData.length === 0) return;
    const digiartRows: any[] = [];
    const ekstraRows: any[] = [];

    activitiesData.forEach((item: any) => {
      const digiartActs = item.activities?.digiart || [];
      const ekstraActs = item.activities?.ekstra || [];

      if (digiartActs.length === 0) {
        digiartRows.push({ 'Nama Siswa': item.student.name, 'NISN': item.student.nisn, 'Kegiatan': '-', 'Kehadiran': '-', 'Nilai': '-' });
      } else {
        digiartActs.forEach((act: any) => {
          digiartRows.push({
            'Nama Siswa': item.student.name,
            'NISN': item.student.nisn,
            'Kegiatan': act.group,
            'Kehadiran': `${act.attendance_percentage}%`,
            'Nilai': act.predicate || '-',
          });
        });
      }

      if (ekstraActs.length === 0) {
        ekstraRows.push({ 'Nama Siswa': item.student.name, 'NISN': item.student.nisn, 'Kegiatan': '-', 'Kehadiran': '-', 'Nilai': '-' });
      } else {
        ekstraActs.forEach((act: any) => {
          ekstraRows.push({
            'Nama Siswa': item.student.name,
            'NISN': item.student.nisn,
            'Kegiatan': act.group,
            'Kehadiran': `${act.attendance_percentage}%`,
            'Nilai': act.predicate || '-',
          });
        });
      }
    });

    const wbDigiart = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbDigiart, XLSX.utils.json_to_sheet(digiartRows), 'Digiart');
    XLSX.writeFile(wbDigiart, `Rekap_Digiart_${schoolClass?.name || ''}.xlsx`);

    const wbEkstra = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbEkstra, XLSX.utils.json_to_sheet(ekstraRows), 'Ekstrakurikuler');
    XLSX.writeFile(wbEkstra, `Rekap_Ekstra_${schoolClass?.name || ''}.xlsx`);
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/homeroom/analytics');
      setAnalyticsData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !schoolClass) {
    return (
      <TeacherLayout title={t('homeroom.title') || 'Homeroom'}>
        <div className="flex items-center justify-center h-64 text-layout-muted">
          {t('homeroom.loadingClass') || 'Memuat data kelas...'}
        </div>
      </TeacherLayout>
    );
  }

  if (!schoolClass) {
    return (
      <TeacherLayout title={t('homeroom.title') || 'Homeroom'}>
        <div className="flex items-center justify-center h-64 text-layout-muted">
          {t('homeroom.notAssigned') || 'Anda tidak ditugaskan sebagai homeroom.'}
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title={t('homeroom.title') || 'Homeroom'}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-layout-card border border-layout-border rounded-xl p-6 shadow-sm print:hidden">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-layout-text">{t('homeroom.title') || 'Homeroom'}: {schoolClass.level} {schoolClass.name}</h1>
              <p className="text-layout-muted font-medium mt-1">
                {t('homeroom.totalStudents') || 'Total'}: {students.length} {t('homeroom.students') || 'Siswa'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto space-x-1 bg-layout-card border border-layout-border p-1 rounded-xl print:hidden pb-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 shrink-0 px-4 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'students' ? 'bg-[#2d7a50] text-white shadow-sm' : 'text-layout-muted hover:text-layout-text hover:bg-layout-hover'}`}
          >
            <Users className="w-4 h-4" />
            {t('homeroom.studentList') || 'Daftar Siswa'}
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 shrink-0 px-4 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'attendance' ? 'bg-[#2d7a50] text-white shadow-sm' : 'text-layout-muted hover:text-layout-text hover:bg-layout-hover'}`}
          >
            <Calendar className="w-4 h-4" />
            {t('homeroom.dailyAttendance') || 'Presensi Harian'}
          </button>
          <button
            onClick={() => setActiveTab('attendance_monthly')}
            className={`flex-1 shrink-0 px-4 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'attendance_monthly' ? 'bg-[#2d7a50] text-white shadow-sm' : 'text-layout-muted hover:text-layout-text hover:bg-layout-hover'}`}
          >
            <Calendar className="w-4 h-4" />
            Rekap Bulanan
          </button>
          <button
            onClick={() => setActiveTab('discipline')}
            className={`flex-1 shrink-0 px-4 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'discipline' ? 'bg-[#2d7a50] text-white shadow-sm' : 'text-layout-muted hover:text-layout-text hover:bg-layout-hover'}`}
          >
            <Award className="w-4 h-4" />
            {t('homeroom.disciplineScore') || 'Nilai Kedisiplinan'}
          </button>
          <button
            onClick={() => setActiveTab('discipline_verify')}
            className={`flex-1 shrink-0 px-4 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'discipline_verify' ? 'bg-[#2d7a50] text-white shadow-sm' : 'text-layout-muted hover:text-layout-text hover:bg-layout-hover'}`}
          >
            <ShieldCheck className="w-4 h-4" />
            Verifikasi Pelanggaran
            {pendingRecords.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingRecords.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab('reportcard')}
            className={`flex-1 shrink-0 px-4 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'reportcard' ? 'bg-[#2d7a50] text-white shadow-sm' : 'text-layout-muted hover:text-layout-text hover:bg-layout-hover'}`}
          >
            <FileText className="w-4 h-4" />
            {t('homeroom.reportCard') || 'Rekap Nilai Akademis'}
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 shrink-0 px-4 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'achievements' ? 'bg-[#2d7a50] text-white shadow-sm' : 'text-layout-muted hover:text-layout-text hover:bg-layout-hover'}`}
          >
            <Award className="w-4 h-4" />
            Rekap Prestasi
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex-1 shrink-0 px-4 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'activities' ? 'bg-[#2d7a50] text-white shadow-sm' : 'text-layout-muted hover:text-layout-text hover:bg-layout-hover'}`}
          >
            <Palette className="w-4 h-4" />
            Rekap Digiart & Ekstra
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 shrink-0 px-4 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'analytics' ? 'bg-[#2d7a50] text-white shadow-sm' : 'text-layout-muted hover:text-layout-text hover:bg-layout-hover'}`}
          >
            <TrendingUp className="w-4 h-4" />
            Analisis Kelas
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'students' && (
          <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-layout-hover text-layout-muted text-xs uppercase font-bold border-b border-layout-border">
                  <tr>
                    <th className="px-6 py-4">{t('common.rowNo') || 'No'}</th>
                    <th className="px-6 py-4">{t('homeroom.nisnNis') || 'NISN / NIS'}</th>
                    <th className="px-6 py-4">{t('homeroom.studentName') || 'Nama Siswa'}</th>
                    <th className="px-6 py-4 text-center">{t('homeroom.genderShort') || 'L/P'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-layout-border">
                  {students.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-layout-hover/50 whitespace-nowrap">
                      <td className="px-6 py-4 font-medium text-layout-muted">{idx + 1}</td>
                      <td className="px-6 py-4 text-layout-text">
                        <div className="font-semibold">{student.nisn}</div>
                        <div className="text-xs text-layout-muted">{student.nis}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-layout-text">{student.name}</td>
                      <td className="px-6 py-4 text-center text-layout-muted">{student.gender === 'Laki-laki' ? 'L' : 'P'}</td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-layout-muted">Belum ada data siswa.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-layout-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="font-semibold text-layout-text text-sm">{t('common.date') || 'Tanggal'}:</label>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 border border-layout-border rounded-lg bg-layout-bg text-layout-text focus:outline-none focus:border-[#2d7a50] text-sm"
                />
              </div>
              <button 
                onClick={saveAttendances}
                disabled={savingAttendance || loading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2d7a50] hover:bg-[#1a4a30] text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingAttendance ? (t('common.saving') || 'Menyimpan...') : (t('homeroom.saveAttendance') || 'Simpan Presensi')}
              </button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-layout-hover text-layout-muted text-xs uppercase font-bold border-b border-layout-border">
                  <tr>
                    <th className="px-6 py-4 w-12 whitespace-nowrap">{t('common.rowNo') || 'No'}</th>
                    <th className="px-6 py-4 whitespace-nowrap">{t('homeroom.studentName') || 'Nama Siswa'}</th>
                    <th className="px-6 py-4 text-center whitespace-nowrap">{t('homeroom.attendanceStatus') || 'Status Kehadiran'}</th>
                    <th className="px-6 py-4 whitespace-nowrap min-w-[200px]">{t('common.notes') || 'Keterangan'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-layout-border">
                  {students.map((student, idx) => {
                    const status = attendances[student.id]?.status || 'H';
                    const notes = attendances[student.id]?.notes || '';
                    return (
                      <tr key={student.id} className="hover:bg-layout-hover/50 whitespace-nowrap">
                        <td className="px-6 py-4 font-medium text-layout-muted">{idx + 1}</td>
                        <td className="px-6 py-4 font-bold text-layout-text truncate max-w-[200px]">{student.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {['H', 'S', 'I', 'A'].map(opt => (
                              <button
                                key={opt}
                                onClick={() => setAttendances({ ...attendances, [student.id]: { ...attendances[student.id], status: opt }})}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                                  status === opt 
                                    ? opt === 'H' ? 'bg-green-500 text-white' : opt === 'S' ? 'bg-blue-500 text-white' : opt === 'I' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                                    : 'bg-layout-bg border border-layout-border text-layout-muted hover:border-layout-text'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <input 
                            type="text" 
                            placeholder={t('common.optional') || 'Opsional...'}
                            value={notes}
                            onChange={(e) => setAttendances({ ...attendances, [student.id]: { ...attendances[student.id], notes: e.target.value }})}
                            className="w-full px-3 py-1.5 border border-layout-border rounded-lg bg-layout-bg text-layout-text focus:outline-none focus:border-[#2d7a50] text-sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-layout-muted">{t('homeroom.noStudents') || 'Belum ada data siswa.'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-layout-border bg-layout-hover text-xs text-layout-muted flex flex-wrap justify-center gap-4 sm:gap-6">
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> H: {t('homeroom.present') || 'Hadir'}</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> S: {t('homeroom.sick') || 'Sakit'}</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> I: {t('homeroom.leave') || 'Izin'}</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> A: {t('homeroom.absent') || 'Alpha'}</span>
            </div>
          </div>
        )}

        {activeTab === 'attendance_monthly' && (
          <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden flex flex-col mb-6">
            <div className="p-5 border-b border-layout-border bg-layout-bg/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-layout-text text-sm">Rekap Presensi</h3>
                <p className="text-xs text-layout-muted mt-1">Total kehadiran berdasarkan waktu yang dipilih</p>
              </div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-layout-card border border-layout-border text-layout-text text-sm rounded-lg focus:ring-[#2d7a50] focus:border-[#2d7a50] block p-2"
              >
                <option value="all">Satu Semester Penuh</option>
                {monthlyData.filterOptions.map((m: string) => (
                  <option key={m} value={m}>Bulan: {m}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-layout-hover text-layout-muted text-[11px] uppercase font-bold border-b border-layout-border">
                  <tr>
                    <th className="px-6 py-4">{t('homeroom.studentName') || 'Nama Siswa'}</th>
                    {monthlyData.displayColumns.length === 0 && <th className="px-6 py-4">Bulan</th>}
                    {monthlyData.displayColumns.map((m: string) => (
                      <th key={m} className="px-4 py-4 text-center">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-layout-border">
                  {students.map(student => {
                    const studentRecords = monthlyData.map.get(student.id) || {};
                    return (
                      <tr key={student.id} className="hover:bg-layout-hover/50">
                        <td className="px-6 py-4 font-bold text-layout-text truncate max-w-[200px]">{student.name}</td>
                        {monthlyData.displayColumns.length === 0 && <td className="px-6 py-4 text-layout-muted text-xs">-</td>}
                        {monthlyData.displayColumns.map((m: string) => {
                          const counts = studentRecords[m] || { H: 0, S: 0, I: 0, A: 0 };
                          return (
                            <td key={m} className="px-4 py-3 text-center text-[11px]">
                              <div className="flex gap-2 justify-center bg-layout-bg p-2 rounded-lg border border-layout-border">
                                <span className="text-green-600 font-bold" title="Hadir">H:{counts.H || 0}</span>
                                <span className="text-blue-600 font-bold" title="Sakit">S:{counts.S || 0}</span>
                                <span className="text-amber-600 font-bold" title="Izin">I:{counts.I || 0}</span>
                                <span className="text-red-600 font-bold" title="Alpha">A:{counts.A || 0}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={monthlyData.displayColumns.length + 1} className="px-6 py-8 text-center text-layout-muted">Belum ada data siswa.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden flex flex-col mb-6">
            <div className="p-5 border-b border-layout-border bg-layout-bg/50">
              <h3 className="font-bold text-layout-text text-sm">Rekap Prestasi Siswa</h3>
              <p className="text-xs text-layout-muted mt-1">Daftar penghargaan yang didapatkan oleh siswa di kelas ini</p>
            </div>
            
            {achievements.length > 0 && (() => {
              const studentCounts = achievements.reduce((acc: any, curr: any) => {
                const name = curr.student?.name || 'Unknown';
                acc[name] = (acc[name] || 0) + 1;
                return acc;
              }, {});
              const topStudent = Object.keys(studentCounts).reduce((a, b) => studentCounts[a] > studentCounts[b] ? a : b, '');

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 border-b border-layout-border bg-yellow-50/30">
                  <div className="bg-white p-4 rounded-xl border border-yellow-200 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-xs text-yellow-700 font-bold uppercase tracking-wider mb-0.5">Total Prestasi Kelas</p>
                      <p className="text-2xl font-black text-yellow-800">{achievements.length} <span className="text-sm font-medium">Penghargaan</span></p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-yellow-200 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                      <TrendingUp className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-xs text-yellow-700 font-bold uppercase tracking-wider mb-0.5">Peraih Terbanyak</p>
                      <p className="text-lg font-black text-yellow-800 line-clamp-1">{topStudent}</p>
                      <p className="text-xs text-yellow-600 font-medium">{studentCounts[topStudent]} Penghargaan</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {achievements.length > 0 ? achievements.map((ach: any) => (
                <div key={ach.id} className="border border-layout-border rounded-xl p-4 flex flex-col gap-3 bg-white shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div className="w-10 h-10 shrink-0 bg-[#d4a23a]/10 text-[#d4a23a] rounded-full flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-layout-text text-sm truncate">{ach.achievement || ach.title || 'Prestasi'}</h4>
                      <p className="text-xs text-layout-text truncate">{ach.competition_name || ach.description || '-'}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="text-[9px] font-bold text-white bg-[#d4a23a] px-1.5 py-0.5 rounded">Tingkat {ach.level || '-'}</span>
                        <span className="text-[9px] font-semibold text-layout-muted bg-layout-border/50 px-1.5 py-0.5 rounded">{ach.competition_branch || '-'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-layout-muted mt-2 border-t border-layout-border pt-2 space-y-1">
                    <p>Penyelenggara: <span className="font-medium text-layout-text">{ach.organizer || '-'}</span></p>
                    <p>Tanggal: <span className="font-medium text-layout-text">{ach.date ? new Date(ach.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span></p>
                    <p className="pt-1 mt-1 border-t border-layout-border/50">Siswa: <span className="font-bold text-layout-text">{ach.student?.name}</span></p>
                  </div>

                  <div className="flex gap-2 mt-auto pt-2">
                    {ach.photo_url && (
                      <a href={ach.photo_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 flex-1 px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-colors">
                        <Image className="w-3 h-3" /> Foto
                      </a>
                    )}
                    {ach.certificate_url && (
                      <a href={ach.certificate_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 flex-1 px-2 py-1.5 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold hover:bg-green-100 transition-colors">
                        <ExternalLink className="w-3 h-3" /> Sertifikat
                      </a>
                    )}
                    {(!ach.photo_url && !ach.certificate_url) && (
                      <span className="flex items-center justify-center gap-1 flex-1 px-2 py-1.5 bg-layout-hover text-layout-muted rounded-lg text-[10px] font-semibold">
                        Tidak ada lampiran
                      </span>
                    )}
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center text-layout-muted border-2 border-dashed border-layout-border rounded-xl">
                  Belum ada catatan prestasi di kelas ini.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'discipline' && (
          <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-layout-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-layout-text text-sm">Daftar Siswa Bermasalah (Poin &lt; 100)</h3>
                <p className="text-xs text-layout-muted mt-1">Siswa dengan poin utuh 100 otomatis disembunyikan dari daftar ini.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    // F3: Export Poin Kedisiplinan to Excel
                    const allStudentsList = (students || []).map((s: any) => s).sort((a: any, b: any) => a.name.localeCompare(b.name));
                    const disciplineMap: Record<number, number> = {};
                    (disciplines || []).forEach((d: any) => { disciplineMap[d.student_id] = d.score; });
                    
                    const exportData = allStudentsList.map((s: any, idx: number) => ({
                      'No': idx + 1,
                      'Nama': s.name,
                      'NISN': s.nisn || '-',
                      'Poin': disciplineMap[s.id] !== undefined ? disciplineMap[s.id] : 100,
                    }));
                    
                    const ws = XLSX.utils.json_to_sheet(exportData);
                    ws['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 18 }, { wch: 8 }];
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Poin Kedisiplinan');
                    XLSX.writeFile(wb, `Poin_Kedisiplinan_${schoolClass?.name || 'Kelas'}.xlsx`);
                  }}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#3a8fd4] hover:bg-[#2e78b8] text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export Poin
                </button>
                <button 
                  onClick={saveDisciplines}
                  disabled={savingDiscipline || loading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2d7a50] hover:bg-[#1a4a30] text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingDiscipline ? (t('common.processing') || 'Memproses...') : 'Kalkulasi & Simpan Rapor'}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-layout-hover text-layout-muted text-xs uppercase font-bold border-b border-layout-border">
                  <tr>
                    <th className="px-6 py-4 w-12 whitespace-nowrap">{t('common.rowNo') || 'No'}</th>
                    <th className="px-6 py-4 whitespace-nowrap">{t('homeroom.studentName') || 'Nama Siswa'}</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Total Poin (100)</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-layout-border">
                  {disciplines.map((disc, idx) => (
                    <tr key={disc.student_id} className={`hover:bg-layout-hover/50 whitespace-nowrap ${disc.is_red_zone ? 'bg-red-500/5' : ''}`}>
                      <td className="px-6 py-4 font-medium text-layout-muted">{idx + 1}</td>
                      <td className="px-6 py-4 text-layout-text">
                        <div className="font-bold">{disc.student_name}</div>
                        <div className="text-xs text-layout-muted">{disc.nisn}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-bold text-lg ${disc.is_red_zone ? 'text-red-500' : 'text-amber-500'}`}>
                          {disc.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {disc.is_red_zone ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            RED ZONE (&lt; {disc.threshold})
                          </span>
                        ) : (
                          <span className="text-layout-muted text-xs font-semibold">Perlu Perhatian</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {disciplines.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                          <p className="font-bold text-layout-text">Luar Biasa!</p>
                          <p className="text-sm text-layout-muted mt-1">Semua siswa di kelas ini memiliki poin kedisiplinan utuh (100).</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'discipline_verify' && (
          <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-layout-border">
              <h3 className="font-bold text-layout-text text-sm">Menunggu Verifikasi Homeroom</h3>
              <p className="text-xs text-layout-muted mt-1">Daftar laporan pelanggaran siswa yang butuh persetujuan</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-layout-hover text-layout-muted text-xs uppercase font-bold border-b border-layout-border">
                  <tr>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Siswa</th>
                    <th className="px-6 py-4">Pelanggaran/Aktivitas</th>
                    <th className="px-6 py-4">Poin</th>
                    <th className="px-6 py-4 text-center">Batas Waktu (48 Jam)</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-layout-border">
                  {pendingRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-layout-hover/50">
                      <td className="px-6 py-4 text-xs whitespace-nowrap">{new Date(r.occurred_at).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-layout-text">{r.student.name}</div>
                        <div className="text-[11px] text-layout-muted">{r.student.school_class?.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold">{r.violation.description}</div>
                        <div className="text-[11px] text-layout-muted mt-1">Pelapor: {r.reporter.name}</div>
                        {r.reporter_notes && <div className="text-xs bg-layout-bg p-2 mt-1 rounded italic">"{r.reporter_notes}"</div>}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span className={r.violation.type === 'penalty' ? 'text-red-500' : 'text-green-500'}>
                          {r.violation.type === 'penalty' ? '-' : '+'}{r.violation.points}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {(() => {
                          const timer = getRemainingAutoApproveTime(r.created_at || r.occurred_at);
                          return (
                            <div className="flex flex-col items-center gap-1">
                              <span className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 ${timer.badgeClass}`}>
                                <Clock className="w-3.5 h-3.5" />
                                {timer.label}
                              </span>
                              <span className="text-[10px] text-layout-muted">Auto-approve jika diabaikan</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleVerifyRecord(r.id, 'approved')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Setujui</button>
                          <button onClick={() => handleVerifyRecord(r.id, 'rejected')} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Tolak</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-layout-muted">Tidak ada laporan yang menunggu verifikasi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reportcard' && (
          <div className="space-y-6">
            {/* Grades locked indicator */}
            {reportData?.grades_locked && (
              <div className="bg-[#2d7a50]/10 border border-[#2d7a50]/20 rounded-xl p-4 flex items-start gap-3 print:hidden">
                <ShieldCheck className="w-5 h-5 text-[#2d7a50] mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-[#2d7a50] text-sm">{t('reportCard2.gradesFinal')}</p>
                  <p className="text-xs text-layout-muted mt-0.5">{t('reportCard2.gradesFinalDesc')}</p>
                </div>
              </div>
            )}
            {!reportData?.grades_locked && reportData?.students?.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 print:hidden">
                <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-amber-600 text-sm">{t('reportCard2.gradesNotFinal')}</p>
                  <p className="text-xs text-layout-muted mt-0.5">{t('reportCard2.gradesNotFinalDesc')}</p>
                </div>
              </div>
            )}

            {/* All locked banner */}
            {reportData?.all_locked && (
              <div className="bg-[#3a8fd4]/10 border border-[#3a8fd4]/20 rounded-xl p-4 flex items-start gap-3 print:hidden">
                <Lock className="w-5 h-5 text-[#3a8fd4] mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-[#3a8fd4] text-sm">{t('reportCard2.allLocked')}</p>
                  <p className="text-xs text-layout-muted mt-0.5">{t('reportCard2.allLockedDesc')}</p>
                </div>
              </div>
            )}

            {/* Header with date & print & lock */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
              <h2 className="text-lg font-bold text-layout-text flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2d7a50]" />
                {t('reportCard.title') || 'Rekap Nilai Siswa'}
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-layout-text">{t('reportCard.releaseDate') || 'Tanggal Rilis'}:</label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="px-3 py-1.5 border border-layout-border rounded-lg bg-layout-bg text-layout-text focus:outline-none focus:border-[#2d7a50] text-sm"
                  />
                </div>
                {!reportData?.all_locked && reportData?.grades_locked && (
                  <button
                    onClick={handleLockAll}
                    disabled={lockingAll}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#d4a23a] hover:bg-[#b8882e] text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    {lockingAll ? t('common.processing') : t('reportCard2.lockAll')}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!reportData?.students?.length) return;
                    // Collect all unique subject names
                    const subjectNames: string[] = [];
                    reportData.students.forEach((s: any) => {
                      s.grades?.forEach((g: any) => {
                        if (!subjectNames.includes(g.subject_name)) subjectNames.push(g.subject_name);
                      });
                    });

                    const exportRows = reportData.students.map((s: any, idx: number) => {
                      const row: Record<string, any> = {
                        'No': idx + 1,
                        'Nama': s.student.name,
                        'NISN': s.student.nisn || '-',
                        'NIS': s.student.nis || '-',
                      };
                      // Add each subject's completion percentage
                      subjectNames.forEach((subj: string) => {
                        const grade = s.grades?.find((g: any) => g.subject_name === subj);
                        row[subj] = grade?.completion_percentage !== undefined ? `${grade.completion_percentage}%` : '-';
                      });
                      // Add discipline and attendance
                      row['Kedisiplinan'] = s.discipline?.score ?? '-';
                      row['H'] = s.attendance?.H ?? 0;
                      row['S'] = s.attendance?.S ?? 0;
                      row['I'] = s.attendance?.I ?? 0;
                      row['A'] = s.attendance?.A ?? 0;
                      return row;
                    });

                    const ws = XLSX.utils.json_to_sheet(exportRows);
                    // Auto-size columns
                    const colWidths = [{ wch: 4 }, { wch: 32 }, { wch: 14 }, { wch: 14 }];
                    subjectNames.forEach(() => colWidths.push({ wch: 14 }));
                    colWidths.push({ wch: 12 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 });
                    ws['!cols'] = colWidths;
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Nilai');
                    XLSX.writeFile(wb, `Rekap_Nilai_${schoolClass?.name || 'Kelas'}.xlsx`);
                  }}
                  disabled={loadingReport || !reportData?.students?.length}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#3a8fd4] hover:bg-[#2e78b8] text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export Nilai
                </button>
                <button
                  onClick={handlePrintAll}
                  disabled={loadingReport || !reportData?.students?.length}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#2d7a50] hover:bg-[#1a4a30] text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  {t('reportCard.printAll') || 'Cetak Semua Rekap Nilai'}
                </button>
              </div>
            </div>

            {loadingReport ? (
              <div className="flex items-center justify-center h-40 text-layout-muted">
                {t('reportCard.loadingReport') || 'Memuat data rapor...'}
              </div>
            ) : !reportData?.students?.length ? (
              <div className="bg-layout-card border border-layout-border rounded-xl p-8 text-center text-layout-muted">
                {t('reportCard.noGradeData') || 'Belum ada data nilai untuk ditampilkan.'}
              </div>
            ) : (
              <>
                {/* Homeroom notes input per student */}
                <div className="space-y-4 print:hidden">
                  {reportData.students.map((s: any) => (
                    <div key={s.student.id} className={`bg-layout-card border rounded-xl p-4 shadow-sm ${s.is_locked ? 'border-[#3a8fd4]/30 bg-[#3a8fd4]/5' : 'border-layout-border'}`}>
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-layout-text text-sm">{s.student.name}</h3>
                            {s.is_locked && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#3a8fd4]/10 text-[#3a8fd4] border border-[#3a8fd4]/20">
                                <Lock className="w-3 h-3" />{t('reportCard2.locked')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-layout-muted mb-2">{s.student.nisn} / {s.student.nis}</p>
                          <div className="flex items-center gap-3 text-xs text-layout-muted mb-3">
                            {s.discipline && (
                              <span className={`font-semibold ${
                                s.discipline.score >= 90 ? 'text-green-600' :
                                s.discipline.score >= 75 ? 'text-blue-600' :
                                s.discipline.score >= 60 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {t('reportCard.disciplinePoints') || 'Kedisiplinan'}: {s.discipline.score}/100
                              </span>
                            )}
                            <span>H:{s.attendance.H} S:{s.attendance.S} I:{s.attendance.I} A:{s.attendance.A}</span>
                          </div>
                          <textarea
                            placeholder={t('reportCard.homeroomNotePlaceholder') || 'Tulis catatan untuk siswa ini...'}
                            value={editingNotes[s.student.id] || ''}
                            onChange={(e) => setEditingNotes({ ...editingNotes, [s.student.id]: e.target.value })}
                            rows={2}
                            disabled={s.is_locked}
                            className={`w-full px-3 py-2 border border-layout-border rounded-lg bg-layout-bg text-layout-text focus:outline-none focus:border-[#2d7a50] text-sm resize-none ${s.is_locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                          />
                        </div>
                        <div className="flex flex-row sm:flex-col gap-2 shrink-0 sm:mt-6 w-full sm:w-auto">
                          {!s.is_locked && (
                            <button
                              onClick={() => saveHomeroomNote(s.student.id)}
                              disabled={savingNote === s.student.id}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-[#2d7a50] hover:bg-[#1a4a30] text-white rounded-lg font-semibold text-xs transition-colors disabled:opacity-50"
                            >
                              <Save className="w-3.5 h-3.5" />
                              {savingNote === s.student.id ? '...' : (t('reportCard.saveNote') || 'Simpan')}
                            </button>
                          )}
                          <button
                            onClick={() => handlePrintSingle(s.student.id)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-[#3a8fd4] hover:bg-[#2e78b8] text-white rounded-lg font-semibold text-xs transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            {t('reportCard2.printSingle') || 'Cetak'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Print Preview Area */}
                {showPrintView && (
                  <div className="print:block">
                    <div className="flex justify-end mb-4 print:hidden">
                      <button
                        onClick={() => setShowPrintView(false)}
                        className="text-sm text-layout-muted hover:text-layout-text font-medium"
                      >
                        ✕ {t('common.close') || 'Tutup'} Preview
                      </button>
                    </div>
                    <div ref={printRef}>
                      <ReportCardPrint
                        students={printStudentId ? reportData.students.filter((s: any) => s.student.id === printStudentId) : reportData.students}
                        schoolProfile={reportData.school_profile}
                        className={reportData.class?.name || ''}
                        classLevel={reportData.class?.level || ''}
                        semesterName={reportData.semester?.name || ''}
                        semesterYear={reportData.semester?.year || ''}
                        teacherName={reportData.teacher?.name || ''}
                        teacherNip={reportData.teacher?.nip || null}
                        teacherSignature={reportData.teacher?.signature || null}
                        releaseDate={releaseDate}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-layout-text text-sm">Rekap Digiart & Ekstrakurikuler</h3>
                <p className="text-xs text-layout-muted mt-1">Presensi dan nilai kegiatan per siswa</p>
              </div>
              <button
                onClick={handleExportActivities}
                disabled={activitiesData.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-[#2d7a50] text-white rounded-lg text-sm font-semibold hover:bg-[#1a4a30] transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Export Excel
              </button>
            </div>
            <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-layout-hover text-layout-muted text-xs uppercase font-bold border-b border-layout-border">
                    <tr>
                      <th className="px-6 py-4">Nama Siswa</th>
                      <th className="px-6 py-4">Kegiatan</th>
                      <th className="px-6 py-4 text-center">Jenis</th>
                      <th className="px-6 py-4 text-center">Kehadiran</th>
                      <th className="px-6 py-4 text-center">Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-layout-border">
                    {activitiesData.length > 0 ? activitiesData.map((item: any) => {
                      const allActs = [...(item.activities?.digiart || []), ...(item.activities?.ekstra || [])];
                      if (allActs.length === 0) {
                        return (
                          <tr key={item.student.id} className="hover:bg-layout-hover/50">
                            <td className="px-6 py-4">
                              <div className="font-bold text-layout-text">{item.student.name}</div>
                              <div className="text-[11px] text-layout-muted">{item.student.nisn}</div>
                            </td>
                            <td className="px-6 py-4 text-layout-muted text-xs" colSpan={4}>Belum mengikuti kegiatan Digiart/Ekstra</td>
                          </tr>
                        );
                      }
                      return allActs.map((act: any, idx: number) => (
                        <tr key={`${item.student.id}-${idx}`} className="hover:bg-layout-hover/50">
                          {idx === 0 && (
                            <td className="px-6 py-4" rowSpan={allActs.length}>
                              <div className="font-bold text-layout-text">{item.student.name}</div>
                              <div className="text-[11px] text-layout-muted">{item.student.nisn}</div>
                            </td>
                          )}
                          <td className="px-6 py-4 font-semibold text-layout-text">{act.group}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.activities?.digiart?.includes(act) ? 'bg-[#2d7a50]/10 text-[#2d7a50]' : 'bg-[#3a8fd4]/10 text-[#3a8fd4]'}`}>
                              {item.activities?.digiart?.includes(act) ? 'Digiart' : 'Ekstra'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-bold px-2 py-0.5 rounded-md text-xs ${act.attendance_percentage >= 80 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {act.attendance_percentage}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {act.predicate ? (
                              <span className="font-black text-lg text-layout-text">{act.predicate}</span>
                            ) : (
                              <span className="text-layout-muted text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ));
                    }) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-layout-muted">Belum ada data kegiatan siswa.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Summary widgets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-layout-card p-5 rounded-xl border border-layout-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-[#2d7a50]/10 text-[#2d7a50] rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-layout-muted uppercase">Rata-rata Akademik</p>
                  <h3 className="text-2xl font-bold text-layout-text">{analyticsData?.class_average || 0}</h3>
                </div>
              </div>
              <div className="bg-layout-card p-5 rounded-xl border border-layout-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-[#3a8fd4]/10 text-[#3a8fd4] rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-layout-muted uppercase">Rata-rata Disiplin</p>
                  <h3 className="text-2xl font-bold text-layout-text">{analyticsData?.class_discipline_average || 100}</h3>
                </div>
              </div>
              <div 
                className={`bg-layout-card p-5 rounded-xl border border-layout-border shadow-sm flex items-center gap-4 ${analyticsData?.at_risk_count > 0 ? 'cursor-pointer hover:border-red-300 transition-colors' : ''}`}
                onClick={() => {
                  if (analyticsData?.at_risk_count > 0) {
                    const atRiskStudents = analyticsData.students.filter((s:any) => s.is_at_risk).map((s:any) => s.name).join(', ');
                    alertDialog(`Siswa At-Risk:\n\n${atRiskStudents}\n\nSilakan cek tabel detail siswa di bawah untuk informasi selengkapnya atau klik tab Analisis Lengkap per Siswa.`);
                  }
                }}
              >
                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-layout-muted uppercase">Siswa "At Risk"</p>
                  <h3 className="text-2xl font-bold text-layout-text">{analyticsData?.at_risk_count || 0}</h3>
                </div>
              </div>
              <div className="bg-layout-card p-5 rounded-xl border border-layout-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-[#d4a23a]/10 text-[#d4a23a] rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-layout-muted uppercase">Total Prestasi</p>
                  <h3 className="text-2xl font-bold text-layout-text">{analyticsData?.total_achievements || 0}</h3>
                </div>
              </div>
            </div>

            {/* Frequent Violations and Achievers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-layout-card rounded-xl border border-layout-border shadow-sm p-5 flex flex-col">
                <h3 className="font-bold text-layout-text mb-4 text-sm flex items-center gap-2"><Award className="w-4 h-4 text-[#d4a23a]" /> Juara Kelas</h3>
                {analyticsData?.top_student ? (
                  <div 
                    onClick={() => navigate(`/teacher/student-progress/${analyticsData.top_student.student.id}`)}
                    className="flex-1 flex flex-col justify-center items-center text-center p-4 border border-[#d4a23a]/30 bg-[#d4a23a]/5 rounded-xl cursor-pointer hover:bg-[#d4a23a]/10 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4a23a] to-[#b8882e] text-white flex items-center justify-center mb-3 shadow-lg shadow-amber-500/20">
                      <Award className="w-8 h-8" />
                    </div>
                    <h4 className="font-black text-lg text-layout-text leading-tight">{analyticsData.top_student.student.name}</h4>
                    <p className="text-xs text-layout-muted mt-1">{analyticsData.top_student.student.nisn}</p>
                    <div className="flex items-center gap-3 mt-3 text-[10px] font-bold uppercase tracking-wider text-layout-muted">
                      <span>Nilai: <span className="text-[#3a8fd4]">{analyticsData.top_student.average_grade}</span></span>
                      <span>•</span>
                      <span>Disiplin: <span className="text-[#2d7a50]">{analyticsData.top_student.discipline_score}</span></span>
                      <span>•</span>
                      <span>Prestasi: <span className="text-[#d4a23a]">{analyticsData.top_student.achievements_count}</span></span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-layout-muted text-center py-8">Belum ada data nilai akademik yang mencukupi.</p>
                )}
              </div>

              <div className="bg-layout-card rounded-xl border border-layout-border shadow-sm p-5">
                <h3 className="font-bold text-layout-text mb-4 text-sm">Siswa Berprestasi</h3>
                {analyticsData?.top_achievers?.length > 0 ? (
                  <ul className="space-y-3">
                    {analyticsData.top_achievers.map((s: any) => (
                      <li key={s.student.id} className="flex items-center justify-between cursor-pointer group" onClick={() => navigate(`/teacher/student-progress/${s.student.id}`)}>
                        <div>
                          <p className="font-bold text-sm text-layout-text group-hover:text-[#2d7a50] transition-colors">{s.student.name}</p>
                          <p className="text-[10px] text-layout-muted">{s.student.nisn}</p>
                        </div>
                        <span className="font-bold text-[#d4a23a] bg-[#d4a23a]/10 px-2.5 py-1 rounded-full text-xs">
                          {s.achievements_count} Prestasi
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-layout-muted">Belum ada data prestasi siswa.</p>
                )}
              </div>

              <div className="bg-layout-card rounded-xl border border-layout-border shadow-sm p-5">
                <h3 className="font-bold text-layout-text mb-4 text-sm">Siswa Sering Melanggar</h3>
                {analyticsData?.frequent_violators?.length > 0 ? (
                  <ul className="space-y-3">
                    {analyticsData.frequent_violators.map((v: any) => (
                      <li key={v.student.id} className="flex items-center justify-between cursor-pointer group" onClick={() => navigate(`/teacher/student-progress/${v.student.id}`)}>
                        <div>
                          <p className="font-bold text-sm text-layout-text group-hover:text-red-500 transition-colors">{v.student.name}</p>
                          <p className="text-[10px] text-layout-muted">{v.student.nisn}</p>
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

            </div>

            {/* Student List with Analysis link */}
            <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-layout-border">
                <h3 className="font-bold text-layout-text text-sm">Analisis Lengkap per Siswa</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-layout-hover text-layout-muted text-xs uppercase font-bold border-b border-layout-border">
                    <tr>
                      <th className="px-6 py-4">Nama Siswa</th>
                      <th className="px-6 py-4 text-center">Kehadiran</th>
                      <th className="px-6 py-4 text-center">Akademik</th>
                      <th className="px-6 py-4 text-center">Disiplin</th>
                      <th className="px-6 py-4 text-center">Prestasi</th>
                      <th className="px-6 py-4 text-center">Digiart</th>
                      <th className="px-6 py-4 text-center">Ekstra</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-layout-border">
                    {analyticsData?.students?.map((s: any) => (
                      <tr key={s.student.id} className={`hover:bg-layout-hover/50 ${s.is_at_risk ? 'bg-red-500/5' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-layout-text">{s.student.name}</div>
                          <div className="text-[11px] text-layout-muted">{s.student.nisn}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold">{s.attendance_percentage}%</td>
                        <td className="px-6 py-4 text-center font-semibold">{s.average_grade}</td>
                        <td className="px-6 py-4 text-center font-semibold">{s.discipline_score}</td>
                        <td className="px-6 py-4 text-center font-semibold">{s.achievements_count || 0}</td>
                        <td className="px-6 py-4 text-center">
                          {s.digiart_score ? (
                            <span className="font-bold text-[#2d7a50]">{s.digiart_score}</span>
                          ) : (
                            <span className="text-layout-muted text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {s.ekstra_score ? (
                            <span className="font-bold text-[#3a8fd4]">{s.ekstra_score}</span>
                          ) : (
                            <span className="text-layout-muted text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {s.is_at_risk ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500">
                              AT RISK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500">
                              AMAN
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => navigate(`/teacher/student-progress/${s.student.id}`)}
                            className="bg-[#2d7a50]/10 hover:bg-[#2d7a50] text-[#2d7a50] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            Detail Analisis
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!analyticsData?.students?.length && (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-layout-muted">Belum ada data siswa.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </TeacherLayout>
  );
}
