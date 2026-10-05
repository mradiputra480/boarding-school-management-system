import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '@/components/layouts/TeacherLayout';
import { useLangStore } from '@/stores/langStore';
import api from '@/lib/axios';
import { Users, Award, Eye, AlertCircle, BookOpen, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { alertDialog } from '@/lib/swal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell, ReferenceLine } from 'recharts';

export default function CurriculumAnalyticsPage() {
  const { t } = useLangStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'kelas' | 'mapel' | 'at-risk'>('ringkasan');
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');

  const fetchData = async (sid: number | 'all') => {
    setLoading(true);
    try {
      const params = { semester_id: sid };
      const res = await api.get('/teacher/curriculum-analytics', { params });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const s = await api.get('/teacher/activity/semesters');
        const sems = s.data.data;
        setSemesters(sems);
        const activeSem = sems.find((x: any) => x.is_active);
        if (activeSem) {
          setSelectedSemester(activeSem.id);
          fetchData(activeSem.id);
        } else {
          fetchData('all');
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  const th = "px-6 py-4 font-bold tracking-wider";
  const td = "px-6 py-4 font-medium text-layout-text";

  return (
    <TeacherLayout title="Analisis Kurikulum">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-layout-text">Analisis Kurikulum</h1>
          <p className="text-sm text-layout-muted">Pantau kesehatan akademik dan kedisiplinan seluruh elemen sekolah secara mendetail.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedSemester}
            onChange={(e) => {
              const sid = e.target.value === 'all' ? 'all' : Number(e.target.value);
              setSelectedSemester(sid);
              fetchData(sid);
            }}
            className="px-4 py-2 bg-layout-card border border-layout-border rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2d7a50]"
          >
            <option value="all">Semua Semester</option>
            {semesters.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button onClick={() => fetchData(selectedSemester)} className="p-2.5 bg-layout-card border border-layout-border rounded-xl hover:bg-layout-hover transition-colors">
            <RefreshCcw className="w-4 h-4 text-layout-muted" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-[#2d7a50]/20 border-t-[#2d7a50] rounded-full animate-spin mb-4"></div>
          <p className="text-layout-muted font-medium">Menganalisis Data Kurikulum...</p>
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center h-64 text-layout-muted bg-layout-card rounded-2xl border border-layout-border">Gagal memuat data.</div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-layout-card border border-layout-border rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-[#3a8fd4]/5 rounded-bl-full"></div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-layout-muted mb-1 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-[#3a8fd4]"/> Rata-Rata Akademik</p>
              <h3 className="text-3xl font-black text-[#3a8fd4]">{data.school_averages?.average_grade || 0}</h3>
              <p className="text-xs text-layout-muted mt-1 font-medium">Dari {data.school_averages?.total_students || 0} Siswa Aktif</p>
            </div>
            <div className="bg-layout-card border border-layout-border rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-[#2d7a50]/5 rounded-bl-full"></div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-layout-muted mb-1 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-[#2d7a50]"/> Rata-Rata Disiplin</p>
              <h3 className="text-3xl font-black text-[#2d7a50]">{data.school_averages?.average_discipline || 0}</h3>
              <p className="text-xs text-layout-muted mt-1 font-medium">Poin Kedisiplinan Sekolah</p>
            </div>
            <div className="bg-layout-card border border-layout-border rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-[#8b5cf6]/5 rounded-bl-full"></div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-layout-muted mb-1 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#8b5cf6]"/> Rata-Rata Kehadiran</p>
              <h3 className="text-3xl font-black text-[#8b5cf6]">{data.school_averages?.average_attendance || 0}%</h3>
              <p className="text-xs text-layout-muted mt-1 font-medium">Persentase Tingkat Sekolah</p>
            </div>
            <div className="bg-layout-card border border-layout-border rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-[#d4a23a]/5 rounded-bl-full"></div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-layout-muted mb-1 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-[#d4a23a]"/> Total Prestasi</p>
              <h3 className="text-3xl font-black text-[#d4a23a]">{data.school_averages?.total_achievements || 0}</h3>
              <p className="text-xs text-layout-muted mt-1 font-medium">Penghargaan Siswa</p>
            </div>
            <div className="bg-layout-card border border-red-500/20 rounded-xl p-5 shadow-sm relative overflow-hidden bg-red-50/50">
              <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/5 rounded-bl-full"></div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-red-500/80 mb-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5"/> Siswa "At-Risk"</p>
              <h3 className="text-3xl font-black text-red-500">{data.at_risk_students?.length || 0}</h3>
              <p className="text-xs text-red-500/70 mt-1 font-medium">Butuh Intervensi Segera</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'ringkasan', label: 'Ringkasan Kinerja', icon: TrendingUp },
              { id: 'kelas', label: 'Perbandingan Kelas', icon: Users },
              { id: 'mapel', label: 'Evaluasi Mapel', icon: BookOpen },
              { id: 'at-risk', label: 'Daftar Pantauan Siswa', icon: AlertCircle },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === t.id 
                      ? 'bg-[#2d7a50] text-white shadow-md shadow-[#2d7a50]/20' 
                      : 'bg-layout-card text-layout-muted border border-layout-border hover:bg-layout-hover'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="bg-layout-card border border-layout-border rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
            
            {activeTab === 'ringkasan' && (
              <div className="p-6 space-y-8">
                <div className="grid grid-cols-1 gap-8">
                  {/* Grafik Perbandingan Kelas */}
                  <div className="bg-white p-6 rounded-xl border border-layout-border shadow-sm">
                    <h3 className="text-lg font-bold text-layout-text mb-6">Skor Keseluruhan Kelas (Akademik + Disiplin + Kehadiran)</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.classes?.map((c:any) => ({...c, name: c.class ? `${c.class.level} ${c.class.name}` : c.name})) || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: 'transparent' }}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          <Bar dataKey="overall_score" name="Skor Keseluruhan" fill="#2d7a50" radius={[4, 4, 0, 0]} barSize={60} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Grafik Evaluasi Mapel */}
                  <div className="bg-white p-6 rounded-xl border border-layout-border shadow-sm">
                    <h3 className="text-lg font-bold text-layout-text mb-6">Evaluasi Mata Pelajaran terhadap KKM</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {(() => {
                          const SUBJECT_COLORS = [
                            '#3a8fd4', '#2d7a50', '#d4a23a', '#8b5cf6', 
                            '#e07a5f', '#3d5a80', '#5f9ea0', '#ee6c4d', 
                            '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'
                          ];
                          return (
                            <BarChart data={data.subjects || []} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: 'transparent' }}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          <ReferenceLine y={75} stroke="#d45a5a" strokeDasharray="3 3" label={{ position: 'top', value: 'Batas KKM Umum (75)', fill: '#d45a5a', fontSize: 10 }} />
                          <Bar dataKey="average" name="Rata-rata Nilai" radius={[4, 4, 0, 0]} barSize={40}>
                            {data.subjects?.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                          );
                        })()}
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'kelas' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-layout-bg text-layout-muted uppercase text-[10px] tracking-wider border-b border-layout-border">
                    <tr>
                      <th className="px-6 py-4">Nama Kelas</th>
                      <th className="px-6 py-4 text-center">Rata-rata Nilai</th>
                      <th className="px-6 py-4 text-center">Rata-rata Disiplin</th>
                      <th className="px-6 py-4 text-center">Kehadiran</th>
                      <th className="px-6 py-4 text-center">Digiart</th>
                      <th className="px-6 py-4 text-center">Ekstra</th>
                      <th className="px-6 py-4 text-center">Prestasi</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-layout-border">
                    {data.classes?.length > 0 ? data.classes.map((c: any) => (
                      <tr key={c.class?.id || c.id} className="hover:bg-layout-hover transition-colors">
                        <td className="px-6 py-4 font-bold text-layout-text">{c.class ? `${c.class.level} ${c.class.name}` : c.name}</td>
                        <td className="px-6 py-4 text-center font-black text-[#3a8fd4]">{c.average_grade}</td>
                        <td className="px-6 py-4 text-center font-black text-[#2d7a50]">{c.average_discipline}</td>
                        <td className="px-6 py-4 text-center font-black text-[#8b5cf6]">{c.average_attendance || c.attendance_percentage}%</td>
                        <td className="px-6 py-4 text-center font-black text-[#2d7a50]">{c.average_digiart || '-'}</td>
                        <td className="px-6 py-4 text-center font-black text-[#3a8fd4]">{c.average_ekstra || '-'}</td>
                        <td className="px-6 py-4 text-center font-black text-[#d4a23a]">{c.total_achievements}</td>
                        <td className="px-6 py-4 text-center">
                          
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={8} className="px-6 py-8 text-center text-layout-muted">Belum ada data evaluasi kelas.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'mapel' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-layout-bg text-layout-muted uppercase text-[10px] tracking-wider border-b border-layout-border">
                    <tr>
                      <th className="px-6 py-4">Mata Pelajaran</th>
                      <th className="px-6 py-4 text-center">Nilai Rata-Rata</th>
                      <th className="px-6 py-4 text-center">Siswa Evaluasi</th>
                      <th className="px-6 py-4 text-center">Di Bawah KKM</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-layout-border">
                    {data.subjects?.length > 0 ? data.subjects.map((s: any) => (
                      <tr key={s.id} className="hover:bg-layout-hover transition-colors">
                        <td className="px-6 py-4 font-bold text-layout-text">{s.name}</td>
                        <td className="px-6 py-4 text-center font-black text-layout-text">{s.average}</td>
                        <td className="px-6 py-4 text-center font-medium">{s.total_students}</td>
                        <td className="px-6 py-4 text-center">
                          {s.below_kkm > 0 ? (
                            <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded-full text-xs">{s.below_kkm} Siswa</span>
                          ) : (
                            <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full text-xs">Tuntas</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {s.average < 75 ? (
                            <span className="flex items-center gap-1.5 text-red-600 text-xs font-bold"><TrendingDown className="w-3.5 h-3.5"/> Perlu Perbaikan</span>
                          ) : s.average >= 85 ? (
                            <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold"><TrendingUp className="w-3.5 h-3.5"/> Unggul</span>
                          ) : (
                            <span className="text-layout-muted text-xs font-medium">Normal</span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-layout-muted">Belum ada data nilai mata pelajaran.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'at-risk' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-red-50/50 text-red-500 uppercase text-[10px] tracking-wider border-b border-red-100">
                    <tr>
                      <th className="px-6 py-4">Nama Siswa</th>
                      <th className="px-6 py-4">Kelas</th>
                      <th className="px-6 py-4 text-center">Akademik</th>
                      <th className="px-6 py-4 text-center">Disiplin</th>
                      <th className="px-6 py-4 text-center">Kehadiran</th>
                      <th className="px-6 py-4 text-center">Prestasi</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-layout-border">
                    {data.at_risk_students?.length > 0 ? data.at_risk_students.map((s: any) => (
                      <tr key={s.id} className="hover:bg-red-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-layout-text">{s.name}</p>
                          <p className="text-[10px] text-layout-muted">{s.nisn}</p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-layout-text">{s.class_name}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-black ${s.average_grade < 75 ? 'text-red-500' : 'text-layout-text'}`}>{s.average_grade}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-black ${s.discipline_score < 80 ? 'text-red-500' : 'text-layout-text'}`}>{s.discipline_score}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-black ${s.attendance_percentage < 80 ? 'text-red-500' : 'text-layout-text'}`}>{s.attendance_percentage}%</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => navigate(`/teacher/student-progress/${s.id}?tab=prestasi`)} className="font-black text-[#d4a23a] hover:underline">{s.achievements_count}</button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => navigate(`/teacher/student-progress/${s.id}`)} className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-200">Buka Profil</button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Award className="w-8 h-8" />
                          </div>
                          <h3 className="font-bold text-layout-text">Luar Biasa!</h3>
                          <p className="text-sm text-layout-muted">Tidak ada siswa dalam zona pantauan saat ini.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
