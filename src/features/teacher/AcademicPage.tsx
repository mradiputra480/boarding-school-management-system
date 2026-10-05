import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import TeacherLayout from '@/components/layouts/TeacherLayout';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { useSchoolStore } from '@/stores/schoolStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { useLangStore } from '@/stores/langStore';
import { Save, AlertCircle, BookOpen, Lock, Unlock, CheckCircle, X, ShieldCheck, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface FilterOption {
  id: number;
  name: string;
}

interface GradeData {
  student_id: number;
  na1: string; na2: string; na3: string; na4: string; na5: string;
  na6: string; na7: string; na8: string; na9: string; na10: string;
}

interface StudentGrade {
  id: number;
  name: string;
  nisn: string;
  grade: GradeData;
}

const emptyGrade = (studentId: number): GradeData => ({
  student_id: studentId,
  na1: '', na2: '', na3: '', na4: '', na5: '',
  na6: '', na7: '', na8: '', na9: '', na10: ''
});

export default function AcademicPage() {
  const { t } = useLangStore();
  const { profile, loading: profileLoading } = useTeacherStore();
  
  const columnTypeOptions = [
    { value: 'ujian', label: t('academic.typeUjian') || 'Ujian' },
    { value: 'proyek', label: t('academic.typeProyek') || 'Proyek' },
    { value: 'kosong', label: '-' }
  ];
  
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [classes, setClasses] = useState<FilterOption[]>([]);
  const [subjects, setSubjects] = useState<FilterOption[]>([]);
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  
  const [loadingData, setLoadingData] = useState(false);
  const [studentsData, setStudentsData] = useState<StudentGrade[]>([]);
  const [columnTypes, setColumnTypes] = useState<string[]>(Array(10).fill('kosong'));
  const [kkm, setKkm] = useState<number>(75);
  const [activeNaCount, setActiveNaCount] = useState<number>(10);
  const [minActiveNa, setMinActiveNa] = useState<number>(1);
  const [defaultKkm, setDefaultKkm] = useState<number>(83);
  const [kktpNa, setKktpNa] = useState<(string|number)[]>(Array(10).fill(''));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [gradesLocked, setGradesLocked] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  
  const schoolProfile = useSchoolStore(state => state.profile);
  const allowBelowKkm = schoolProfile?.allow_below_kkm || false;
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (profile && profile.is_coa) {
      fetchFilters();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchGrades();
    } else {
      setStudentsData([]);
    }
  }, [selectedClass, selectedSubject]);

  const fetchFilters = async () => {
    try {
      const res = await api.get('/teacher/academic/filters');
      setClasses(res.data.classes);
      setSubjects(res.data.subjects);
      
      // Auto-select if only 1 subject available
      if (res.data.subjects.length === 1) {
        setSelectedSubject(res.data.subjects[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFilters(false);
    }
  };

  const fetchGrades = async () => {
    setLoadingData(true);
    setMessage(null);
    try {
      const res = await api.get(`/teacher/academic/grades?class_id=${selectedClass}&subject_id=${selectedSubject}`);
      const students = res.data.students;
      const dbGrades = res.data.grades;
      
      setColumnTypes(res.data.column_types || Array(10).fill('kosong'));
      setKkm(res.data.kkm ?? 75);
      setActiveNaCount(res.data.active_na_count ?? 10);
      setMinActiveNa(res.data.min_active_na ?? 1);
      setDefaultKkm(res.data.default_kkm ?? 83);
      
      const kktp = [];
      for (let i = 1; i <= 10; i++) {
        kktp.push(res.data[`kktp_na${i}`] ?? '');
      }
      setKktpNa(kktp);
      
      setGradesLocked(res.data.grades_locked || false);
      setIsSubmitted(res.data.is_submitted || false);
      setSubmittedAt(res.data.submitted_at || null);

      const mapped: StudentGrade[] = students.map((std: any) => {
        const existing = dbGrades.find((g: any) => g.student_id === std.id);
        const grade: GradeData = emptyGrade(std.id);
        if (existing) {
          for (let i = 1; i <= 10; i++) grade[`na${i}` as keyof GradeData] = existing[`na${i}`] ?? '';
        }
        return {
          id: std.id,
          name: std.name,
          nisn: std.nisn,
          grade
        };
      });
      setStudentsData(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleGradeChange = (studentId: number, field: keyof GradeData, value: string) => {
    // Only allow numbers and empty string
    if (value !== '' && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 100)) return;

    setStudentsData(prev => prev.map(std => {
      if (std.id === studentId) {
        return { ...std, grade: { ...std.grade, [field]: value } };
      }
      return std;
    }));
  };

  const handleColumnTypeChange = (index: number, val: string) => {
    const newTypes = [...columnTypes];
    newTypes[index] = val;
    setColumnTypes(newTypes);
  };

  const handleSave = async () => {
    if (!allowBelowKkm) {
      if (kkm < defaultKkm) {
        alertDialog(`KKM Mapel tidak boleh kurang dari Min KKM Sekolah (${defaultKkm}).`);
        return;
      }
      
      for (let i = 0; i < activeNaCount; i++) {
        if (columnTypes[i] !== 'kosong' && kktpNa[i] !== '' && Number(kktpNa[i]) < defaultKkm) {
          alertDialog(`KKTP NA${i + 1} tidak boleh kurang dari Min KKM Sekolah (${defaultKkm}).`);
          return;
        }
      }
    }

    setSaving(true);
    setMessage(null);
    try {
      const payload = studentsData.map(std => {
        const g: any = { student_id: std.id };
        for (let i = 1; i <= 10; i++) {
          const val = std.grade[`na${i}` as keyof GradeData];
          g[`na${i}`] = val === '' ? null : val;
        }
        return g;
      });

      await api.post('/teacher/academic/grades', {
        class_id: selectedClass,
        subject_id: selectedSubject,
        column_types: columnTypes,
        kkm: kkm,
        active_na_count: activeNaCount,
        kktp_na1: kktpNa[0] === '' ? null : Number(kktpNa[0]),
        kktp_na2: kktpNa[1] === '' ? null : Number(kktpNa[1]),
        kktp_na3: kktpNa[2] === '' ? null : Number(kktpNa[2]),
        kktp_na4: kktpNa[3] === '' ? null : Number(kktpNa[3]),
        kktp_na5: kktpNa[4] === '' ? null : Number(kktpNa[4]),
        kktp_na6: kktpNa[5] === '' ? null : Number(kktpNa[5]),
        kktp_na7: kktpNa[6] === '' ? null : Number(kktpNa[6]),
        kktp_na8: kktpNa[7] === '' ? null : Number(kktpNa[7]),
        kktp_na9: kktpNa[8] === '' ? null : Number(kktpNa[8]),
        kktp_na10: kktpNa[9] === '' ? null : Number(kktpNa[9]),
        grades: payload
      });
      
      setMessage({ type: 'success', text: t('academic.saveSuccess') });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('academic.saveFailed') });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitGrades = async () => {
    if (!allowBelowKkm) {
      for (const std of studentsData) {
        for (let i = 0; i < activeNaCount; i++) {
          const val = std.grade[`na${i + 1}` as keyof GradeData];
          if (val !== '') {
            const kktpValue = kktpNa[i] !== '' ? Number(kktpNa[i]) : kkm;
            if (Number(val) < kktpValue) {
              alertDialog(`Tidak dapat submit! Nilai NA${i + 1} atas nama ${std.name} berada di bawah KKM/KKTP (${kktpValue}).`);
              setShowSubmitModal(false);
              return;
            }
          }
        }
      }
    }

    setSubmitting(true);
    try {
      await api.post('/teacher/academic/submit', {
        class_id: selectedClass,
        subject_id: selectedSubject,
      });
      setIsSubmitted(true);
      setSubmittedAt(new Date().toISOString());
      setShowSubmitModal(false);
      setMessage({ type: 'success', text: t('academic.submitSuccess') });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('academic.saveFailed') });
      setShowSubmitModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get(`/teacher/academic/export-template?class_id=${selectedClass}&subject_id=${selectedSubject}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      let fileName = 'Template_Nilai.xlsx';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch.length >= 2) {
          fileName = fileNameMatch[1];
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: t('common.exportFailed') || 'Gagal mengunduh template' });
    }
  };

  const handleImportExcel = async () => {
    if (!importFile) return;
    setImporting(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('class_id', selectedClass);
    formData.append('subject_id', selectedSubject);
    formData.append('file', importFile);
    
    try {
      await api.post('/teacher/academic/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: t('common.importSuccess') || 'Data berhasil diimpor!' });
      setShowImportModal(false);
      setImportFile(null);
      fetchGrades();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('common.saveFailed') });
    } finally {
      setImporting(false);
    }
  };

  const isDisabled = gradesLocked || isSubmitted;

  if (profileLoading || loadingFilters) {
    return <TeacherLayout title={t('academic.title')}><div className="p-6 text-layout-muted">{t('common.loading')}</div></TeacherLayout>;
  }

  if (!profile?.is_coa) {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  return (
    <TeacherLayout title={t('academic.title')}>
      <div className="mb-6 bg-layout-card border border-layout-border rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/3">
            <label className="block text-[13px] font-semibold text-layout-text mb-1.5">{t('academic.selectClass')}</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full bg-layout-bg border border-layout-border text-layout-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]">
              <option value="">-- {t('common.select')} --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="w-full md:w-1/3">
            <label className="block text-[13px] font-semibold text-layout-text mb-1.5">{t('academic.selectSubject')}</label>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full bg-layout-bg border border-layout-border text-layout-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]">
              <option value="">-- {t('common.select')} --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="w-full md:w-1/3 flex items-center p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-700 dark:text-purple-400 gap-3">
            <BookOpen className="w-5 h-5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">{t('teacher.coaBadge')}</p>
              <p className="text-[11px] opacity-80 leading-tight">Akses Master Nilai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grades locked banner */}
      {gradesLocked && selectedClass && selectedSubject && (
        <div className="mb-6 p-4 rounded-xl border flex items-start gap-3 bg-[#d45a5a]/10 border-[#d45a5a]/20">
          <Lock className="w-5 h-5 text-[#d45a5a] mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-[#d45a5a] text-sm">{t('academic.gradesLocked')}</p>
            <p className="text-xs text-layout-muted mt-0.5">{t('academic.gradesLockedDesc')}</p>
          </div>
        </div>
      )}

      {/* Submitted banner */}
      {isSubmitted && !gradesLocked && selectedClass && selectedSubject && (
        <div className="mb-6 p-4 rounded-xl border flex items-center justify-between gap-3 bg-[#3a8fd4]/10 border-[#3a8fd4]/20">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#3a8fd4] mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-[#3a8fd4] text-sm">{t('academic.submitted')}</p>
              <p className="text-xs text-layout-muted mt-0.5">{t('academic.submittedDesc')}</p>
              {submittedAt && <p className="text-[10px] text-layout-muted mt-1">{t('academic.submittedAt')}: {new Date(submittedAt).toLocaleString()}</p>}
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 text-sm font-medium animate-in fade-in ${message.type === 'success' ? 'bg-[#2d7a50]/10 border-[#2d7a50]/20 text-[#2d7a50]' : 'bg-[#d45a5a]/10 border-[#d45a5a]/20 text-[#d45a5a]'}`}>
          <AlertCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      {selectedClass && selectedSubject ? (
        <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm flex flex-col">
          <div className="p-4 border-b border-layout-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-layout-bg/50">
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-layout-text">KKM Mapel:</label>
                <input
                  type="number"
                  min={defaultKkm}
                  max={100}
                  value={kkm}
                  onChange={(e) => setKkm(Number(e.target.value))}
                  disabled={isDisabled}
                  className={`w-16 h-9 text-center text-sm font-bold bg-layout-bg border border-layout-border rounded-lg text-layout-text focus:outline-none focus:border-[#2d7a50] focus:ring-2 focus:ring-[#2d7a50]/20 ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''} ${kkm < defaultKkm ? 'border-red-400 text-red-500' : ''}`}
                  title="KKM Mapel (Fallback jika KKTP per NA kosong)"
                />
              </div>
              <div className="text-[10px] bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-semibold px-2 py-0.5 rounded ml-[88px]">Min KKM: {defaultKkm}</div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-layout-text hidden sm:block">Jumlah NA Aktif:</label>
              <label className="text-sm font-semibold text-layout-text sm:hidden">NA Aktif:</label>
              <select
                value={activeNaCount}
                onChange={(e) => setActiveNaCount(Number(e.target.value))}
                disabled={isDisabled}
                className={`w-16 h-9 text-center text-sm font-bold bg-layout-bg border border-layout-border rounded-lg text-layout-text focus:outline-none focus:border-[#2d7a50] focus:ring-2 focus:ring-[#2d7a50]/20 ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                title={`Minimal ${minActiveNa} NA (Target Kurikulum)`}
              >
                {[...Array(10)].map((_, i) => <option key={i+1} value={i+1} disabled={i+1 < minActiveNa}>{i+1}</option>)}
              </select>
            </div>
            {minActiveNa > 1 && (
              <div className="hidden md:flex items-center gap-1.5 ml-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Target kurikulum minimal {minActiveNa} NA aktif
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 ml-auto">
              {isSubmitted && (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#3a8fd4]/10 text-[#3a8fd4] border border-[#3a8fd4]/20">
                  <CheckCircle className="w-4 h-4" />
                  {t('academic.submitted')}
                </span>
              )}
              {!isDisabled && (
                <button 
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 bg-[#2d7a50]/10 text-[#2d7a50] px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#2d7a50]/20 transition-colors border border-[#2d7a50]/20 shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  {t('academic.importExcel') || 'Import Excel'}
                </button>
              )}
              {!isDisabled && (
                <button 
                  onClick={handleSave} 
                  disabled={saving || loadingData}
                  className="flex items-center gap-2 bg-[#2d7a50] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1b6b43] transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {saving ? t('common.saving') : t('academic.saveGrades')}
                </button>
              )}
              {!isDisabled && studentsData.length > 0 && (
                <button 
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-2 bg-[#d4a23a] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#b8882e] transition-colors shadow-sm"
                >
                  <Lock className="w-4 h-4" />
                  {t('academic.submitGrades')}
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-layout-text">
              <thead className="bg-layout-bg border-b border-layout-border text-layout-muted text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3 min-w-[200px] border-r border-layout-border sticky left-0 z-10 bg-layout-bg">{t('academic.studentName')}</th>
                  {[...Array(10)].map((_, i) => {
                    if (i >= activeNaCount) return null;
                    return (
                    <th key={i} className="px-2 py-2 w-[85px] text-center border-r border-layout-border align-top">
                      <div className="mb-1">NA{i + 1}</div>
                      <select
                        value={columnTypes[i]}
                        onChange={(e) => handleColumnTypeChange(i, e.target.value)}
                        className={`w-full text-[10px] py-1 px-0.5 rounded border focus:outline-none appearance-none text-center cursor-pointer
                          ${columnTypes[i] === 'ujian' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                            columnTypes[i] === 'proyek' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' :
                            columnTypes[i] === 'kosong' ? 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700' :
                            'bg-white text-gray-700 border-gray-200 dark:bg-[#1e293b] dark:text-gray-300 dark:border-gray-600'
                          }`}
                      >
                        {columnTypeOptions.map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1 flex flex-col items-center justify-center gap-0.5">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[9px] text-layout-muted">KKTP:</span>
                          <input
                             type="number"
                             min={defaultKkm} max="100"
                             value={kktpNa[i]}
                             onChange={(e) => {
                               const newKktp = [...kktpNa];
                               newKktp[i] = e.target.value;
                               setKktpNa(newKktp);
                             }}
                             disabled={isDisabled || columnTypes[i] === 'kosong'}
                             className={`w-10 text-[10px] py-0.5 px-0.5 rounded border focus:outline-none text-center font-semibold
                               ${columnTypes[i] === 'kosong' || isDisabled ? 'bg-layout-bg opacity-60 text-layout-muted cursor-not-allowed border-transparent' : 
                               (kktpNa[i] !== '' && Number(kktpNa[i]) < defaultKkm ? 'bg-red-50 text-red-600 border-red-300 focus:border-red-500' : 'bg-white text-gray-800 border-gray-300 focus:border-[#2d7a50]')}`}
                             placeholder={kkm.toString()}
                             title={`Minimal KKTP adalah ${defaultKkm}`}
                          />
                        </div>
                        {columnTypes[i] !== 'kosong' && (
                          <div className="text-[8px] text-red-500/70 dark:text-red-400/70 font-semibold px-1 rounded bg-red-500/10 dark:bg-red-900/20">
                            Min: {defaultKkm}
                          </div>
                        )}
                      </div>
                    </th>
                  )})}
                </tr>
              </thead>
              <tbody className="divide-y divide-layout-border">
                {loadingData ? (
                  <tr><td colSpan={11} className="px-6 py-8 text-center text-layout-muted">{t('common.loadingData')}</td></tr>
                ) : studentsData.length === 0 ? (
                  <tr><td colSpan={11} className="px-6 py-8 text-center text-layout-muted">{t('students.noData')}</td></tr>
                ) : studentsData.map(std => (
                  <tr key={std.id} className="hover:bg-layout-hover transition-colors">
                    <td className="px-4 py-3 border-r border-layout-border sticky left-0 z-10 bg-layout-card group-hover:bg-layout-hover">
                      <div className="font-semibold text-layout-text truncate max-w-[250px]" title={std.name}>{std.name}</div>
                      <div className="text-[11px] text-layout-muted">{std.nisn}</div>
                    </td>
                    {[...Array(10)].map((_, i) => {
                      if (i >= activeNaCount) return null;
                      
                      const gradeValue = std.grade[`na${i+1}` as keyof GradeData];
                      const kktpValue = kktpNa[i] !== '' ? Number(kktpNa[i]) : kkm;
                      const isBelowKktp = gradeValue !== '' && Number(gradeValue) < kktpValue;
                      
                      return (
                      <td key={i} className={`px-1 py-1 border-r border-layout-border ${
                        columnTypes[i] === 'ujian' ? 'bg-blue-50/30 dark:bg-blue-900/5' :
                        columnTypes[i] === 'proyek' ? 'bg-amber-50/30 dark:bg-amber-900/5' :
                        columnTypes[i] === 'kosong' ? 'bg-gray-50/50 dark:bg-gray-900/20 opacity-50' : ''
                      }`}>
                        <input 
                          type="text" 
                          value={gradeValue} 
                          onChange={e => handleGradeChange(std.id, `na${i+1}` as keyof GradeData, e.target.value)}
                          disabled={columnTypes[i] === 'kosong' || isDisabled}
                          className={`w-full h-8 text-center text-sm bg-transparent border-none focus:ring-2 focus:ring-[#2d7a50] rounded-md transition-all placeholder:text-layout-muted/30 ${
                            isBelowKktp ? 'font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' :
                            columnTypes[i] === 'ujian' ? 'font-medium text-blue-700 dark:text-blue-300' :
                            columnTypes[i] === 'proyek' ? 'font-medium text-amber-700 dark:text-amber-300' : ''
                          }`}
                          placeholder="-"
                        />
                      </td>
                    )})}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-layout-card border border-layout-border rounded-xl p-12 text-center text-layout-muted flex flex-col items-center justify-center">
          <BookOpen className="w-16 h-16 text-layout-border mb-4" />
          <p className="text-lg font-medium text-layout-text mb-1">{t('academic.title')}</p>
          <p className="text-sm">{t('academic.noData')}</p>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[440px] rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-layout-border">
              <h2 className="text-lg font-bold text-layout-text flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#d4a23a]" />
                {t('academic.submitConfirmTitle')}
              </h2>
              <button onClick={() => setShowSubmitModal(false)} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                  {t('academic.submitConfirmMsg')}
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg transition-colors"
                >
                  {t('academic.confirmNo')}
                </button>
                <button
                  onClick={handleSubmitGrades}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#d4a23a] text-white hover:bg-[#b8882e] transition-colors disabled:opacity-70"
                >
                  <Lock className="w-4 h-4" />
                  {submitting ? t('common.processing') : t('academic.confirmYes')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[440px] rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-layout-border">
              <h2 className="text-lg font-bold text-layout-text flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#2d7a50]" />
                {t('academic.importExcel') || 'Import Excel'}
              </h2>
              <button onClick={() => { setShowImportModal(false); setImportFile(null); }} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-layout-muted mb-4">{t('academic.importExcelDesc') || 'Unduh template, isi nilai, lalu upload file excel di sini.'}</p>
              
              <button
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2d7a50]/10 text-[#2d7a50] border border-[#2d7a50]/20 rounded-xl font-semibold text-sm hover:bg-[#2d7a50]/20 transition-colors mb-6"
              >
                <Download className="w-4 h-4" />
                {t('academic.downloadTemplate') || 'Unduh Template'}
              </button>

              <div className="mb-6">
                <label className="block text-sm font-medium text-layout-text mb-2">Upload File Excel (.xlsx)</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={e => setImportFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm text-layout-text file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#2d7a50]/10 file:text-[#2d7a50] hover:file:bg-[#2d7a50]/20 file:cursor-pointer border border-layout-border rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowImportModal(false); setImportFile(null); }}
                  className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleImportExcel}
                  disabled={importing || !importFile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#1b6b43] transition-colors disabled:opacity-70"
                >
                  {importing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                  {importing ? t('common.uploading') : t('common.uploadData')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
