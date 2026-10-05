import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ParentLayout from '@/components/layouts/ParentLayout';
import { useLangStore } from '@/stores/langStore';
import api from '@/lib/axios';
import { useSchoolStore } from '@/stores/schoolStore';
import { GraduationCap, CheckCircle, XCircle, Award, FileText, BookOpen, ExternalLink, Calendar, Trophy, AlertTriangle, ShieldAlert, Image as ImageIcon } from 'lucide-react';
import { storageUrl } from '@/lib/storage';
import { appSwal } from '@/lib/swal';

export default function ParentDashboard() {
  const { t } = useLangStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { profile: schoolProfile } = useSchoolStore();

  const [historyMode, setHistoryMode] = useState<'semester' | 'year'>('semester');
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const viewPhoto = (url: string) => {
    const isImageExt = url.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i);
    const isLocalStorage = url.includes('/storage/');
    
    // Jika kemungkinan besar bukan file gambar langsung (seperti link Google Drive atau link website)
    if (!isImageExt && !isLocalStorage && (url.startsWith('http://') || url.startsWith('https://'))) {
      window.open(url, '_blank');
      return;
    }

    appSwal.fire({
      imageUrl: url,
      imageAlt: 'Foto Kegiatan',
      showConfirmButton: true,
      confirmButtonText: 'Buka Link Asli',
      showCancelButton: true,
      cancelButtonText: 'Tutup',
      showCloseButton: true,
      customClass: {
        popup: 'rounded-2xl border border-layout-border shadow-xl p-2 sm:p-4',
        image: 'max-w-full h-auto rounded-lg mx-auto block max-h-[80vh] object-contain',
        confirmButton: 'bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors mr-2',
        cancelButton: 'bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold border border-gray-300 hover:bg-gray-200 transition-colors'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        window.open(url, '_blank');
      }
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/parent/dashboard');
        setData(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <ParentLayout title={t('parent.dashboard')}><div className="flex items-center justify-center h-64 text-layout-muted">{t('common.loading')}</div></ParentLayout>;
  if (!data) return <ParentLayout title={t('parent.dashboard')}><div className="flex items-center justify-center h-64 text-layout-muted">{t('parent.noChild')}</div></ParentLayout>;

  const { student, discipline, achievements, events, grade_summary, historical_grades, is_published, graduation_info, document_count, assessment_count } = data;
  const getDisciplinePredicate = (score: number, isRedZone: boolean) => {
    if (isRedZone) return { label: 'Peringatan (Red Zone)', color: 'text-red-600', bg: 'bg-red-500/10 border-red-500/20' };
    if (score >= 90) return { label: t('parent.excellent'), color: 'text-green-600', bg: 'bg-green-500/10 border-green-500/20' };
    if (score >= 75) return { label: t('parent.good'), color: 'text-blue-600', bg: 'bg-blue-500/10 border-blue-500/20' };
    if (score >= 60) return { label: t('parent.sufficient'), color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20' };
    return { label: t('parent.poor'), color: 'text-red-600', bg: 'bg-red-500/10 border-red-500/20' };
  };

  const parentMenuAccess = schoolProfile?.parent_menu_access || {
    report_card: false,
    discipline: false,
    achievements: false,
    assessment_events: true,
    documents: true,
    graduation: true
  };

  return (
    <ParentLayout title={t('parent.dashboard')}>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-[#d4a23a]/10 via-[#d4a23a]/5 to-transparent border border-[#d4a23a]/20 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <h2 className="text-xl font-bold text-layout-text">{t('parent.welcomeParent')}</h2>
          <p className="text-sm text-layout-muted mt-1">{t('parent.welcomeDesc')}</p>
        </div>

        {/* Child Profile Card */}
        <div className="bg-layout-card border border-layout-border rounded-xl p-6 shadow-sm animate-fade-in-up hover:shadow-md transition-shadow" style={{ animationDelay: '100ms' }}>
          <h3 className="text-xs font-bold text-layout-muted uppercase tracking-wider mb-4">{t('parent.childProfile')}</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#d4a23a]/20 flex items-center justify-center text-[#d4a23a] font-bold text-2xl overflow-hidden border border-[#d4a23a]/30">
              {student.photo ? (
                <img src={storageUrl(student.photo)!} alt="" className="w-full h-full object-cover" />
              ) : (
                student.name.charAt(0)
              )}
            </div>
            <div>
              <p className="text-lg font-bold text-layout-text">{student.name}</p>
              <p className="text-sm text-layout-muted">NISN: {student.nisn} | NIS: {student.nis}</p>
              <p className="text-sm text-layout-muted">{t('parent.class')}: {student.class || '-'}</p>
              {student.portfolio_url ? (
                <a href={student.portfolio_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-[#2d7a50] text-white text-xs font-semibold rounded-lg hover:bg-[#3d9968] transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Lihat Portofolio
                </a>
              ) : (
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-lg border border-gray-200">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Link portofolio belum tersedia
                </div>
              )}
            </div>
          </div>

          {(document_count > 0 || assessment_count > 0) && (
            <div className="mt-6 pt-6 border-t border-layout-border flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              {document_count > 0 && (
                <Link to="/parent/documents" className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-700 w-full sm:w-auto animate-bounce-subtle hover:scale-105 transition-transform cursor-pointer">
                  <FileText className="w-5 h-5 shrink-0" />
                  <div className="text-sm">
                    <span className="font-bold">Ada {document_count} dokumen baru!</span> Silakan cek menu Distribusi Dokumen.
                  </div>
                </Link>
              )}
              {assessment_count > 0 && (
                <Link to="/parent/assessment-events" className="flex items-center gap-3 px-4 py-3 bg-[#d4a23a]/10 border border-[#d4a23a]/20 rounded-xl text-[#d4a23a] w-full sm:w-auto animate-bounce-subtle hover:scale-105 transition-transform cursor-pointer" style={{ animationDelay: '500ms' }}>
                  <BookOpen className="w-5 h-5 shrink-0" />
                  <div className="text-sm">
                    <span className="font-bold">Ada {assessment_count} hasil penilaian baru!</span> Silakan cek menu Event Penilaian.
                  </div>
                </Link>
              )}
            </div>
          )}

        </div>

        {/* Grade Summary Table */}
        {is_published && parentMenuAccess.report_card && grade_summary.length > 0 && (
          <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="p-4 border-b border-layout-border">
              <h3 className="text-xs font-bold text-layout-muted uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Tabel Nilai Siswa (Semester Ini)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-layout-bg text-layout-muted text-xs uppercase font-bold border-b border-layout-border">
                  <tr>
                    <th className="px-6 py-3 whitespace-nowrap">{t('common.rowNo')}</th>
                    <th className="px-6 py-3 whitespace-nowrap">{t('parent.subject')}</th>
                    <th className="px-6 py-3 text-center whitespace-nowrap">Ketuntasan</th>
                    {Array.from({ length: 10 }, (_, i) => (
                      <th key={i} className="px-6 py-3 text-center whitespace-nowrap">NA{i + 1}</th>
                    ))}
                    <th className="px-6 py-3 text-center whitespace-nowrap bg-layout-hover">{t('parent.average')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-layout-border">
                  {grade_summary.map((g: any, i: number) => {
                    const hasAnyValue = g.na_values && g.na_values.some((v:any, idx:number) => v !== null && g.column_types[idx] !== 'kosong');
                    if (!hasAnyValue && g.average === null) return null;
                    return (
                      <tr key={i} className="hover:bg-layout-hover/50 whitespace-nowrap">
                        <td className="px-6 py-3 text-layout-muted">{i + 1}</td>
                        <td className="px-6 py-3 font-medium text-layout-text truncate max-w-[200px]">{g.subject_name}</td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-layout-border rounded-full overflow-hidden">
                              <div className="h-full bg-[#2d7a50]" style={{ width: `${g.completion_percentage}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-layout-muted w-8 text-right">{g.completion_percentage}%</span>
                          </div>
                        </td>
                        {g.na_values && g.na_values.map((val:any, naIdx:number) => {
                          const colType = g.column_types[naIdx];
                          const isKosong = colType === 'kosong';
                          const isBelowKkm = val !== null && g.kkm && val < g.kkm;
                          const textColor = isKosong ? 'text-layout-border bg-layout-bg/50' : isBelowKkm ? 'text-red-600 font-bold' : 'text-layout-text font-semibold';
                          return (
                            <td key={naIdx} className={`px-2 py-2 text-center align-middle min-w-[70px] ${textColor}`}>
                              {!isKosong && (
                                <div className="text-[9px] text-layout-muted uppercase font-bold mb-1 tracking-wider leading-none">
                                  {colType === 'ujian' ? 'Ujian' : colType === 'proyek' ? 'Proyek' : colType}
                                </div>
                              )}
                              <div className="text-sm leading-none">{isKosong ? '-' : (val !== null ? val : '-')}</div>
                            </td>
                          );
                        })}
                        <td className={`px-6 py-3 text-center font-bold bg-layout-hover/50 ${g.average !== null && g.kkm && g.average < g.kkm ? 'text-red-600' : 'text-[#2d7a50]'}`}>
                          {g.average !== null ? g.average : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Discipline */}
          {parentMenuAccess.discipline && (
            <div className="bg-layout-card border border-layout-border rounded-xl p-6 shadow-sm flex flex-col lg:h-[600px] overflow-hidden animate-fade-in-up hover:shadow-md transition-shadow group" style={{ animationDelay: '300ms' }}>
            <h3 className="text-xs font-bold text-layout-muted uppercase tracking-wider mb-4 shrink-0 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />{t('parent.disciplineStatus')}
            </h3>
            {discipline ? (() => {
              const pred = getDisciplinePredicate(discipline.score, discipline.is_red_zone);
              const circumference = 2 * Math.PI * 40;
              const strokeDashoffset = Math.max(0, circumference - (Math.min(100, Math.max(0, discipline.score)) / 100) * circumference);
              
              return (
                <div className="flex flex-col gap-6 flex-1 min-h-0">
                  <div className="flex items-center justify-start gap-6 mt-2 shrink-0">
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-layout-border" />
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className={`${pred.color} transition-all duration-1000 ease-out`} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-black ${pred.color}`}>{discipline.score}</span>
                        <span className="text-[9px] text-layout-muted font-bold tracking-wider">/ 100</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-layout-muted uppercase font-bold tracking-wider">Status Kedisiplinan:</span>
                      <span className={`px-4 py-2 rounded-xl text-sm font-bold border ${pred.bg} ${pred.color} text-center shadow-sm`}>{pred.label}</span>
                    </div>
                  </div>

                  {parentMenuAccess.discipline_show_detail && (
                    <div className="flex-1 bg-layout-bg rounded-lg border border-layout-border p-3 overflow-y-auto min-h-0 custom-scrollbar">
                      <h4 className="text-[10px] font-bold text-layout-muted uppercase tracking-wider mb-2">Riwayat Poin & Pelanggaran</h4>
                      {discipline.records && discipline.records.length > 0 ? (
                        <ul className="space-y-2">
                          {discipline.records.map((r: any) => (
                            <li key={r.id} className="flex gap-2 items-start text-xs border-b border-layout-border/50 pb-2 last:border-0 last:pb-0">
                              <span className={`font-bold shrink-0 ${r.violation.points > 0 ? 'text-[#2d7a50]' : 'text-red-500'}`}>
                                {r.violation.points > 0 ? '+' : ''}{r.violation.points}
                              </span>
                              <div>
                                <p className="text-layout-text font-medium">{r.violation.description}</p>
                                <p className="text-[10px] text-layout-muted">{new Date(r.occurred_at).toLocaleDateString('id-ID')}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-layout-muted italic">Belum ada catatan pelanggaran/kegiatan positif.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })() : <p className="text-sm text-layout-muted">{t('parent.noDiscipline')}</p>}
            </div>
          )}

          <div className="flex flex-col gap-6 lg:h-[600px]">
            {/* Agenda Kegiatan */}
            <div className="bg-layout-card border border-layout-border rounded-xl p-6 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden animate-fade-in-up hover:shadow-md transition-shadow" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-layout-muted uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Agenda Kegiatan Sekolah
                </h3>
                <button onClick={() => setShowCalendar(true)} className="text-[10px] bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg font-bold border border-blue-500/20 transition-colors">
                  Lihat Kalender
                </button>
              </div>
              {events && events.length > 0 ? (
                <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 min-h-0 pr-2">
                  {events.map((ev: any) => (
                    <div key={ev.id} className="flex gap-3 items-center p-3 rounded-lg bg-layout-bg border border-layout-border">
                      <div className="w-12 h-12 shrink-0 bg-[#2d7a50]/10 text-[#2d7a50] rounded-lg flex flex-col items-center justify-center border border-[#2d7a50]/20">
                        <span className="text-[10px] font-bold uppercase">{new Date(ev.start_date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                        <span className="text-lg font-black leading-none">{new Date(ev.start_date).getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-layout-text truncate">{ev.title}</p>
                        <p className="text-xs text-layout-muted truncate">{ev.description || '-'}</p>
                        {ev.end_date && ev.end_date !== ev.start_date && (
                           <p className="text-[10px] font-semibold text-[#2d7a50] mt-0.5">
                             s/d {new Date(ev.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                           </p>
                        )}
                        {ev.photo_url && (
                          <button 
                            onClick={() => viewPhoto(storageUrl(ev.photo_url)!)} 
                            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-[10px] font-bold rounded-lg border border-blue-500/20 transition-colors w-fit"
                          >
                            <ExternalLink className="w-3 h-3" /> Lihat Lampiran / Foto
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-layout-muted">Belum ada agenda kegiatan mendatang.</p>
              )}
            </div>

            {/* Prestasi */}
            {parentMenuAccess.achievements && (
              <div className="bg-layout-card border border-layout-border rounded-xl p-6 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden animate-fade-in-up hover:shadow-md transition-shadow" style={{ animationDelay: '500ms' }}>
              <h3 className="text-xs font-bold text-layout-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Prestasi & Penghargaan
              </h3>
              {achievements && achievements.length > 0 ? (
                <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 min-h-0 pr-2">
                  {achievements.map((ach: any) => (
                    <div key={ach.id} className="flex gap-3 items-center p-3 rounded-lg bg-gradient-to-r from-[#d4a23a]/10 to-transparent border border-[#d4a23a]/20">
                      <div className="w-10 h-10 shrink-0 bg-[#d4a23a]/20 text-[#d4a23a] rounded-full flex items-center justify-center">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-layout-text truncate">{ach.achievement}</p>
                        <p className="text-xs text-layout-muted truncate">{ach.competition_name} ({ach.level})</p>
                      </div>
                      {(ach.photo_url || ach.certificate_url) && (
                        <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                          {ach.photo_url && (
                            <a href={ach.photo_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-lg text-[10px] font-bold transition-colors border border-blue-500/20">
                              <ExternalLink className="w-3 h-3" /> Foto
                            </a>
                          )}
                          {ach.certificate_url && (
                            <a href={ach.certificate_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-[#d4a23a]/10 text-[#d4a23a] hover:bg-[#d4a23a]/20 rounded-lg text-[10px] font-bold transition-colors border border-[#d4a23a]/20">
                              <ExternalLink className="w-3 h-3" /> Sertifikat
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-layout-muted">Belum ada catatan prestasi.</p>
              )}
              </div>
            )}
          </div>
        </div>

        {/* Historical Grades Chart */}
        {parentMenuAccess.report_card && historical_grades && historical_grades.length > 0 && (() => {
          // Process data based on filter
          let chartData = [];
          if (historyMode === 'year') {
            const byYear = historical_grades.reduce((acc: any, curr: any) => {
              if (!acc[curr.year]) acc[curr.year] = { year: curr.year, harian: [], uas: [] };
              acc[curr.year].harian.push(curr.average_harian);
              acc[curr.year].uas.push(curr.average_uas);
              return acc;
            }, {});
            chartData = Object.values(byYear).map((d: any) => ({
              label: `Tahun ${d.year}`,
              harian: Math.round(d.harian.reduce((a:number,b:number)=>a+b,0)/d.harian.length),
              uas: Math.round(d.uas.reduce((a:number,b:number)=>a+b,0)/d.uas.length)
            }));
          } else {
            chartData = historical_grades.map((g: any) => ({
              label: g.semester_name,
              harian: g.average_harian,
              uas: g.average_uas
            }));
          }

          return (
            <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden p-6 animate-fade-in-up hover:shadow-md transition-shadow" style={{ animationDelay: '600ms' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <h3 className="text-sm font-bold text-layout-text flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#d4a23a]" /> Perkembangan Nilai Akademik
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-3 text-[11px] font-semibold text-layout-muted bg-layout-bg px-3 py-1.5 rounded-lg border border-layout-border">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500"></span> Harian / UTS</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#2d7a50]"></span> UAS</div>
                  </div>
                  <select 
                    value={historyMode} 
                    onChange={(e) => setHistoryMode(e.target.value as 'semester'|'year')}
                    className="text-xs border border-layout-border bg-layout-bg text-layout-text rounded-lg px-3 py-1.5 outline-none font-medium hover:bg-layout-hover transition-colors cursor-pointer"
                  >
                    <option value="semester">Per Semester</option>
                    <option value="year">Per Tahun</option>
                  </select>
                </div>
              </div>
              
              <div className="h-64 flex items-end justify-around gap-2 mt-4 px-2 sm:px-8 border-b border-layout-border pb-8 relative">
                {/* Y-axis lines (bg grid) */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                  {[100, 75, 50, 25, 0].map(val => (
                    <div key={val} className="flex items-center w-full h-0">
                      <span className="text-[10px] text-layout-muted font-medium w-8 text-right pr-2">{val}</span>
                      <div className="flex-1 border-b border-dashed border-layout-border/60"></div>
                    </div>
                  ))}
                </div>

                {/* Bars */}
                {chartData.map((d: any, i: number) => (
                  <div key={i} className="flex flex-col items-center z-10 w-full h-full group">
                    <div className="flex items-end justify-center gap-1 sm:gap-2 flex-1 w-full relative">
                      {/* Tooltip */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20">
                        {d.label}<br/>Harian: {d.harian} | UAS: {d.uas}
                      </div>
                      <div 
                        className="w-1/3 max-w-[24px] bg-blue-500 rounded-t-md transition-all duration-700 ease-out group-hover:bg-blue-400" 
                        style={{ height: `${d.harian}%` }}
                      ></div>
                      <div 
                        className="w-1/3 max-w-[24px] bg-[#2d7a50] rounded-t-md transition-all duration-700 ease-out group-hover:bg-[#3d9968]" 
                        style={{ height: `${d.uas}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold text-layout-muted text-center leading-tight mt-1 h-8 flex flex-col justify-start">
                      {d.label.split(' ').map((w:string, idx:number) => <div key={idx}>{w}</div>)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}


      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Kalender Kegiatan Akademik
              </h2>
              <button onClick={() => setShowCalendar(false)} className="text-gray-500 hover:bg-gray-200 p-2 rounded-full">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold hover:bg-gray-200">
                  &laquo; Bulan Sebelumnya
                </button>
                <h3 className="text-xl font-black text-gray-800">
                  {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold hover:bg-gray-200">
                  Bulan Berikutnya &raquo;
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                  <div key={d} className="text-center text-xs font-bold text-gray-500 uppercase">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }, (_, i) => (
                  <div key={`b-${i}`} className="aspect-square sm:aspect-auto sm:h-24 bg-gray-50 rounded-lg border border-transparent"></div>
                ))}
                {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }, (_, i) => {
                  const dateNum = i + 1;
                  const dObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), dateNum);
                  dObj.setHours(0,0,0,0);
                  const targetTime = dObj.getTime();
                  
                  const dayEvents = (events || []).filter((ev: any) => {
                    const start = new Date(ev.start_date); start.setHours(0,0,0,0);
                    const end = ev.end_date ? new Date(ev.end_date) : start; end.setHours(0,0,0,0);
                    return targetTime >= start.getTime() && targetTime <= end.getTime();
                  });

                  const isToday = new Date().getDate() === dateNum && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
                  const isSelected = selectedDate && selectedDate.getDate() === dateNum && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();
                  
                  return (
                    <div key={dateNum} onClick={() => setSelectedDate(dObj)} className={`aspect-square sm:aspect-auto sm:h-24 p-1 sm:p-2 border rounded-lg overflow-hidden sm:overflow-y-auto custom-scrollbar flex flex-col cursor-pointer transition-colors ${isSelected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : isToday ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
                      <span className={`text-xs font-bold inline-block w-6 h-6 text-center leading-6 rounded-full mb-1 shrink-0 ${isToday ? 'bg-blue-600 text-white shadow-md' : isSelected ? 'bg-blue-500 text-white' : 'text-gray-700'}`}>
                        {dateNum}
                      </span>
                      
                      {/* Desktop Events */}
                      <div className="hidden sm:flex flex-col gap-1.5 min-h-0">
                        {dayEvents.map((ev:any, idx:number) => (
                          <div key={idx} className="text-[10px] font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded px-1.5 py-1 leading-tight shadow-sm" title={ev.title}>
                            <div className="line-clamp-2">{ev.title}</div>
                          </div>
                        ))}
                      </div>

                      {/* Mobile Event Dots */}
                      <div className="flex sm:hidden flex-wrap gap-1 mt-auto pb-1 justify-center">
                        {dayEvents.map((ev:any, idx:number) => (
                          <div key={idx} className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Date Details */}
              <div className="mt-6 border-t pt-4">
                <h4 className="text-sm font-bold text-gray-800 mb-3">
                  Agenda: {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h4>
                {(() => {
                  const targetTime = selectedDate.getTime();
                  const selectedEvents = (events || []).filter((ev: any) => {
                    const start = new Date(ev.start_date); start.setHours(0,0,0,0);
                    const end = ev.end_date ? new Date(ev.end_date) : start; end.setHours(0,0,0,0);
                    return targetTime >= start.getTime() && targetTime <= end.getTime();
                  });
                  
                  if (selectedEvents.length === 0) {
                    return <p className="text-xs text-gray-500 italic">Tidak ada agenda pada tanggal ini.</p>;
                  }
                  
                  return (
                    <div className="space-y-2">
                      {selectedEvents.map((ev: any, idx: number) => (
                        <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                          <div>
                            <p className="text-sm font-bold text-blue-900">{ev.title}</p>
                            {ev.description && <p className="text-xs text-blue-800/70 mt-1">{ev.description}</p>}
                            {ev.photo_url && (
                              <button 
                                onClick={() => viewPhoto(storageUrl(ev.photo_url)!)} 
                                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 text-[10px] font-bold rounded-lg transition-colors w-fit shadow-sm"
                              >
                                <ExternalLink className="w-3 h-3" /> Lihat Lampiran / Foto
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

    </ParentLayout>
  );
}
