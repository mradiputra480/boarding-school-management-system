import { useState, useEffect } from 'react';
import TeacherLayout from '@/components/layouts/TeacherLayout';
import { FileSearch, Activity, Trophy, ShieldAlert, Award, Clock, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import api from '@/lib/axios';
import { useTeacherStore } from '@/stores/teacherStore';
import { useLangStore } from '@/stores/langStore';

export default function StudentReportPage() {
  const { profile } = useTeacherStore();
  const { t } = useLangStore();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kehadiran' | 'prestasi' | 'pelanggaran' | 'caring'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  
  const [attendanceMode, setAttendanceMode] = useState<'daily' | 'monthly' | 'semester'>('daily');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMonth, setAttendanceMonth] = useState(new Date().toISOString().slice(0, 7));

  const [expandedClassId, setExpandedClassId] = useState<number | null>(null);

  const isReportAuth = profile?.is_student_report;

  useEffect(() => {
    if (isReportAuth) {
      fetchData();
    }
  }, [activeTab, attendanceMode, attendanceDate, attendanceMonth, isReportAuth]);

  const fetchData = async () => {
    setLoading(true);
    setData(null);
    try {
      if (activeTab === 'dashboard') {
        const res = await api.get('/teacher/student-report/dashboard');
        setData(res.data);
      } else if (activeTab === 'kehadiran') {
        const params: any = { mode: attendanceMode };
        if (attendanceMode === 'daily') params.date = attendanceDate;
        if (attendanceMode === 'monthly') params.month = attendanceMonth;
        const res = await api.get('/teacher/student-report/attendance', { params });
        setData(res.data.report);
      } else if (activeTab === 'prestasi') {
        const res = await api.get('/teacher/student-report/achievements');
        setData(res.data.report);
      } else if (activeTab === 'pelanggaran') {
        const res = await api.get('/teacher/student-report/violations');
        setData(res.data);
      } else if (activeTab === 'caring') {
        const res = await api.get('/teacher/student-report/most-caring');
        setData(res.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  if (!isReportAuth) {
    return (
      <TeacherLayout title="Student Report">
        <div className="p-8 text-center text-red-500 font-bold">Akses Ditolak. Anda tidak memiliki akses Student Report.</div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Student Report">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3|e font-bold text-layout-text flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-xl">
              <FileSearch className="w-7 h-7" />
            </div>
            Student Report
          </h1>
          <p className="text-sm text-layout-muted mt-1">Pusat Laporan & Monitoring Kesiswaan</p>
        </div>
      </div>

      <div className="flex overflow-x-auto space-x-2 bg-layout-card border border-layout-border p-1.5 rounded-|e pb-2">
        <button onClick={() => { setActiveTab('dashboard'); setData(null); }} className={`shrink-0 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-layout-muted hover:bg-layout-hover hover:text-layout-text'}`}><Activity className="w-4 h-4" /> Dashboard</button>
        <button onClick={() => { setActiveTab('kehadiran'); setData(null); }} className={`shrink-0 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'kehadiran' ? 'bg-indigo-600 text-white' : 'text-layout-muted hover:bg-layout-hover hover:text-layout-text'}`}><Clock className="w-4 h-4" /> Kehadiran</button>
        <button onClick={() => { setActiveTab('prestasi'); setData(null); }} className={`shrink-0 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'prestasi' ? 'bg-indigo-600 text-white' : 'text-layout-muted hover:bg-layout-hover hover:text-layout-text'}`}><Trophy className="w-4 h-4" /> Prestasi</button>
        <button onClick={() => { setActiveTab('pelanggaran'); setData(null); }} className={`shrink-0 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'pelanggaran' ? 'bg-indigo-600 text-white' : 'text-layout-muted hover:bg-layout-hover hover:text-layout-text'}`}><ShieldAlert className="w-4 h-4" /> Poin & Kedisiplinan</button>
        <button onClick={() => { setActiveTab('caring'); setData(null); }} className={`shrink-0 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'caring' ? 'bg-indigo-600 text-white' : 'text-layout-muted hover:bg-layout-hover hover:text-layout-text'}`}><Award className="w-4 h-4" /> The Most Caring Teacher</button>
      </div>

      {loading && <div className="p-8 text-center text-layout-muted">Memuat data...</div>}

      {!loading && activeTab === 'dashboard' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-layout-card border border-layout-border rounded-xl p-6 flex flex-col justify-center shadow-sm">
              <h3 className="text-sm font-semibold text-layout-muted mb-2">Persentase Kehadiran Hari Ini</h3>
              <div className="text-5xl font-bold text-emerald-600">{data.today_percentage}%</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-6 shadow-sm col-span-1 md:col-span-2">
              <h3 className="text-sm font-bold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" />{data.missed_classes_count} Kelas Belum Mengisi Absensi Hari Ini</h3>
              {data.missed_classes_count === 0 ? <p className="text-sm text-green-700 dark:text-green-400">Semua homeroom telah mengisi absensi.</p> : (
                <div className="flex flex-wrap gap-2 mt-3">{Array.isArray(data.missed_classes) && data.missed_classes.map((c: any) => <span key={c.id} className="bg-white dark:bg-black/20 text-red-700 px-3 py-1 rounded-md text-xs font-bold border border-red-200 dark:border-red-800">{c.name}</span>) }</div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-layout-card border border-layout-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-layout-text mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-emerald-500" /> Rekap Prestasi (Semester Ini)</h3>
              <div className="space-y-3">
                {Array.isArray(data.achievements) && data.achievements.slice(0, 5).map((a: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-layout-bg border border-layout-border">
                    <span className="font-bold text-sm text-layout-text">{a.class_name}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold border border-emerald-200">{a.count} Prestasi</span>
                  </div>
                ))}
                {(!data.achievements || data.achievements.length === 0) && <p className="text-xs text-layout-muted text-center py-4">Belum ada data prestasi</p>}
              </div>
            </div>
            
            <div className="bg-layout-card border border-layout-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-layout-text mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-500" /> Kelas Kedisiplinan Terendah (Semester Ini)</h3>
              <div className="space-y-3">
                {Array.isArray(data.discipline) && [...data.discipline].reverse().slice(0, 5).map((d: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-layout-bg border border-layout-border">
                    <span className="font-bold text-sm text-layout-text">{d.class_name}</span>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold border border-red-200">{d.average_points} Poin Rerata</span>
                  </div>
                ))}
                {(!data.discipline || data.discipline.length === 0) && <p className="text-xs text-layout-muted text-center py-4">Belum ada data pelanggaran</p>}
              </div>
            </div>
          </div>
          
          <div className="bg-layout-card border border-layout-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-layout-text mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-[#d4a23a]" /> Top 5 Most Caring Teachers (Semester Ini)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.isArray(data.caring_teachers) && data.caring_teachers.map((t: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-xl border flex flex-col items-center text-center ${idx === 0 ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30' : 'bg-layout-bg border-layout-border'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-3 ${idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-amber-700/50 text-white' : 'bg-layout-hover text-layout-muted'}`}>{idx + 1}</div>
                  <h4 className="font-bold text-layout-text text-sm mb-1">{t.teacher_name}</h4>
                  <span className="text-xl font-bold text-[#d4a23a]">{t.count} <span className="text-xs text-layout-muted">laporan</span></span>
                </div>
              ))}
              {(!data.caring_teachers || data.caring_teachers.length === 0) && <p className="text-xs text-layout-muted text-center py-4 col-span-full">Belum ada guru yang mencatat kedisiplinan</p>}
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'kehadiran' && (
        <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-layout-border flex flex-wrap gap-4 items-center justify-between">
            <div className="flex bg-layout-bg rounded-lg border border-layout-border p-1">
              <button onClick={() => { setAttendanceMode('daily'); setData(null); }} className={`px-4 py-1.5 text-xs font-bold rounded-md ${attendanceMode==='daily'?'bg-indigo-500 text-white':'text-layout-muted hover:text-layout-text'}`}>Harian</button>
              <button onClick={() => { setAttendanceMode('monthly'); setData(null); }} className={`px-4 py-1.5 text-xs font-bold rounded-md ${attendanceMode==='monthly'?'bg-indigo-500 text-white':'text-layout-muted hover:text-layout-text'}`}>Bulanan</button>
              <button onClick={() => { setAttendanceMode('semester'); setData(null); }} className={`px-4 py-1.5 text-xs font-bold rounded-md ${attendanceMode==='semester'?'bg-indigo-500 text-white':'text-layout-muted hover:text-layout-text'}`}>Semester</button>
            </div>
            {attendanceMode === 'daily' && <input type="date" value={attendanceDate} onChange={e => { setAttendanceDate(e.target.value); setData(null); }} className="bg-layout-bg border border-layout-border rounded-lg px-3 py-1.5 text-sm" />}
            {attendanceMode === 'monthly' && <input type="month" value={attendanceMonth} onChange={e => { setAttendanceMonth(e.target.value); setData(null); }} className="bg-layout-bg border border-layout-border rounded-lg px-3 py-1.5 text-sm" />}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-layout-bg border-b border-layout-border text-xs uppercase text-layout-muted">
                  <th className="p-4">Kelas</th>
                  <th className="p-4">Homeroom</th>
                  <th className="p-4 text-center">Persentase</th>
                  {attendanceMode === 'daily' && <th className="p-4 text-center">Status Presensi</th>}
                  {attendanceMode === 'monthly' && <th className="p-4 text-center">Terlewat Presensi</th>}
                  <th className="p-4 text-center">H</th><th className="p-4 text-center text-amber-500">S</th><th className="p-4 text-center text-blue-500">I</th><th className="p-4 text-center text-red-500">A</th>
                  {attendanceMode === 'daily' && <th className="p-4"></th>}
                </tr>
              </thead>
              <tbody className="text-sm">
                {Array.isArray(data) && data.map((row: any) => (
                  <div key={row.class_id} className="contents">
                  <tr className="border-b border-layout-border hover:bg-layout-hover/50">
                    <td className="p-4 font-bold">{row.class_name}</td>
                    <td className="p-4">{row.homeroom_teacher}</td>
                    <td className="p-4 text-center font-bold text-emerald-600">{row.percentage}%</td>
                    {attendanceMode === 'daily' && (
                      <td className="p-4 text-center">
                        {row.is_filled ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-semibold border border-emerald-200">Sudah</span> : <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-semibold border border-red-200">Belum</span>}
                      </td>
                    )}
                    {attendanceMode === 'monthly' && (
                      <td className="p-4 text-center">
                        {row.missed_days_count > 0 ? <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold border border-red-200">{row.missed_days_count} Hari</span> : <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold border border-emerald-200">Lengkap</span>}
                      </td>
                    )}
                    <td className="p-4 text-center font-semibold">{row.counts.H}</td><td className="p-4 text-center font-semibold text-amber-600">{row.counts.S}</td><td className="p-4 text-center font-semibold text-blue-600">{row.counts.I}</td><td className="p-4 text-center font-semibold text-red-600">{row.counts.A}</td>
                    {attendanceMode === 'daily' && <td className="p-4 text-right"><button onClick={() => setExpandedClassId(expandedClassId === row.class_id ? null : row.class_id)} className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold px-3 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors">Detail S/I/A</button></td>}
                  </tr>
                  {attendanceMode === 'daily' && expandedClassId === row.class_id && row.absent_students && (
                    <tr className="bg-layout-bg/50 border-b border-layout-border"><td colSpan={10} className="p-4">
                        {row.absent_students.length === 0 ? <p className="text-xs text-layout-muted text-center italic">Tidak ada siswa yang tidak hadir.</p> : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">{row.absent_students.map((stu: any, idx: number) => <div key={idx} className="bg-layout-card border border-layout-border p-2 rounded-lg flex items-center justify-between shadow-sm"><span className="text-xs font-semibold text-layout-text truncate mr-2">{stu.name}</span><span className={`shrink-0 text-xs px-2 py-0.5 rounded font-bold ${stu.status === 'S' ? 'bg-amber-100 text-amber-700 border border-amber-200' : stu.status === 'I' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>{stu.status}</span></div>)}</div>
                        )}
                    </td></tr>
                  )}
                  </div>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'prestasi' && (
        <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-layout-bg border-b border-layout-border text-xs uppercase text-layout-muted"><th className="p-4">Kelas</th><th className="p-4 text-center">Total Prestasi</th><th className="p-4"></th></tr>
            </thead>
            <tbody className="text-sm">
              {Array.isArray(data) && data.map((row: any) => (
                <div key={row.class_id} className="contents">
                <tr className="border-b border-layout-border hover:bg-layout-hover/50">
                  <td className="p-4 font-bold">{row.class_name}</td><td className="p-4 text-center font-bold text-emerald-600">{row.total_achievements}</td><td className="p-4 text-right"><button onClick={() => setExpandedClassId(expandedClassId === row.class_id ? null : row.class_id)} className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold px-3 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors">Lihat Siswa</button></td>
                </tr>
                {expandedClassId === row.class_id && (
                  <tr className="bg-layout-bg/50 border-b border-layout-border"><td colSpan={3} className="p-4">
                      {row.details.length === 0 ? <p className="text-xs text-center text-layout-muted">Belum ada prestasi.</p> : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{row.details.map((ach: any, idx: number) => <div key={idx} className="bg-layout-card border border-layout-border p-3 rounded-lg shadow-sm"><p className="text-xs font-bold text-layout-text mb-1 truncate">{ach.student?.name}</p><p className="text-[10px] text-layout-muted line-clamp-2 mb-1">{ach.title}</p></div>)}</div>
                      )}
                  </td></tr>
                )}
                </div>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && activeTab === 'pelanggaran' && data && (
        <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-layout-bg border-b border-layout-border text-xs uppercase text-layout-muted"><th className="p-4">Kelas</th><th className="p-4 text-center">Rerata Poin</th><th className="p-4 text-center text-red-500">Siswa Red Zone</th><th className="p-4"></th></tr>
            </thead>
            <tbody className="text-sm">
              {Array.isArray(data.report) && data.report.map((row: any) => (
                <div key={row.class_id} className="contents">
                <tr className="border-b border-layout-border hover:bg-layout-hover/50">
                  <td className="p-4 font-bold">{row.class_name}</td><td className="p-4 text-center font-bold text-layout-text">{row.average_points}</td>
                  <td className="p-4 text-center">{row.red_zone_count > 0 ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">{row.red_zone_count} Siswa</span> : <span>-</span>}</td>
                  <td className="p-4 text-right"><button onClick={() => setExpandedClassId(expandedClassId === row.class_id ? null : row.class_id)} className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold px-3 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors">Detail Redzone</button></td>
                </tr>
                {expandedClassId === row.class_id && (
                  <tr className="bg-red-50/50 dark:bg-red-900/5 border-b border-layout-border"><td colSpan={4} className="p-4">
                      {row.red_zone_students.length === 0 ? <p className="text-xs text-center text-layout-muted">Tidak ada siswa red zone.</p> : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{row.red_zone_students.map((stu: any, idx: number) => <div key={idx} className="bg-white dark:bg-layout-card border border-red-200 dark:border-red-900/30 p-3 rounded-lg shadow-sm flex justify-between items-center"><p className="text-xs font-bold text-red-800 dark:text-red-400 truncate mr-2">{stu.name}</p><span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-bold">{stu.points}</span></div>)}</div>
                      )}
                  </td></tr>
                )}
                </div>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && activeTab === 'caring' && (
        <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden p-4 sm:p-6">
          <h2 className="text-lg font-bold text-[#d4a23a] mb-4 flex items-center gap-2"><Award className="w-5 h-5" /> The Most Caring Teachers Leaderboard</h2>
          <div className="grid grid-cols-1 gap-3">
            {Array.isArray(data) && data.map((t: any, idx: number) => (
              <div key={t.teacher_id} className={`flex items-center justify-between p-3 rounded-lg border ${idx < 3 ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/20' : 'bg-layout-bg border-layout-border'}`}>
                <div className="flex items-center gap-4">
                  <div className= {`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-amber-700/50 text-white' : 'bg-layout-hover text-layout-muted'}`}>{idx + 1}</div>
                  <div><h4 className="font-bold text-layout-text text-sm">{t.teacher_name}</h4></div>
                </div>
                <div className="text-right"><span className="text-xl font-bold text-[#d4a23a]">{t.count}</span><span className="text-xs text-layout-muted ml-1">laporan</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </TeacherLayout>
  );
}
