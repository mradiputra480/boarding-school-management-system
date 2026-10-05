import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherLayout from '@/components/layouts/TeacherLayout';
import AdminLayout from '@/components/layouts/AdminLayout';
import { ArrowLeft, User, Calendar, BookOpen, AlertCircle, Award, ShieldAlert, TrendingUp, Image, ExternalLink, Palette, Activity } from 'lucide-react';
import api from '@/lib/axios';
import { useLangStore } from '@/stores/langStore';
import { useAuthStore } from '@/stores/authStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function TeacherStudentProgressPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLangStore();
  const { user } = useAuthStore();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';
  const Layout = isAdmin ? AdminLayout : TeacherLayout;
  const backUrl = isAdmin ? '/admin/curriculum-analytics' : '';
  const goBack = () => { if (isAdmin) navigate(backUrl); else navigate(-1); };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = isAdmin ? `/admin/student-progress/${id}` : `/teacher/student-progress/${id}`;
        const res = await api.get(endpoint);
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch student progress', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isAdmin]);

  if (loading) {
    return (
      <Layout title="Analisis Siswa">
        <div className="flex justify-center items-center h-64 text-layout-muted">Loading...</div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout title="Analisis Siswa">
        <div className="flex flex-col items-center justify-center h-64 text-layout-muted gap-4">
          <p>Data tidak ditemukan.</p>
          <button onClick={() => goBack()} className="text-[#2d7a50] underline">Kembali</button>
        </div>
      </Layout>
    );
  }

  const { student, attendance, academic, discipline, achievements, activities } = data;

  const attendanceData = [
    { name: 'Hadir', value: attendance.total.H || 0, color: '#2d7a50' },
    { name: 'Sakit', value: attendance.total.S || 0, color: '#3a8fd4' },
    { name: 'Izin', value: attendance.total.I || 0, color: '#d4a23a' },
    { name: 'Alpa', value: attendance.total.A || 0, color: '#d45a5a' },
  ].filter(item => item.value > 0);

  const formatGradeChartData = () => {
    // Kita buat line chart: X-axis = Subject, Y-axis = Nilai Rata-rata
    return academic.grades.map((g: any) => ({
      subject: g.subject_name.substring(0, 15) + (g.subject_name.length > 15 ? '...' : ''),
      nilai: g.avg,
      kkm: g.kkm
    }));
  };

  return (
    <Layout title={`Analisis: ${student.name}`}>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 bg-layout-card p-6 rounded-2xl shadow-sm border border-layout-border">
          <button onClick={() => goBack()} className="w-10 h-10 rounded-full flex items-center justify-center bg-layout-bg hover:bg-layout-hover text-layout-muted hover:text-layout-text transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-layout-text">{student.name}</h1>
            <p className="text-layout-muted flex items-center gap-2 text-sm mt-1">
              <User className="w-4 h-4" /> NISN: {student.nisn} • Kelas: {student.school_class?.name}
            </p>
          </div>
        </div>

        {/* Highlight Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-layout-card p-5 rounded-2xl shadow-sm border border-layout-border flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${attendance.percentage >= 80 ? 'bg-[#2d7a50]/10 text-[#2d7a50]' : 'bg-[#d45a5a]/10 text-[#d45a5a]'}`}>
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-layout-muted uppercase font-bold tracking-wider">Kehadiran</p>
              <h3 className="text-2xl font-bold text-layout-text">{attendance.percentage}%</h3>
            </div>
          </div>
          
          <div className="bg-layout-card p-5 rounded-2xl shadow-sm border border-layout-border flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${academic.average >= 75 ? 'bg-[#3a8fd4]/10 text-[#3a8fd4]' : 'bg-[#d45a5a]/10 text-[#d45a5a]'}`}>
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-layout-muted uppercase font-bold tracking-wider">Rata-rata Nilai</p>
              <h3 className="text-2xl font-bold text-layout-text">{academic.average}</h3>
            </div>
          </div>

          <div className="bg-layout-card p-5 rounded-2xl shadow-sm border border-layout-border flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${discipline.score >= 80 ? 'bg-[#2d7a50]/10 text-[#2d7a50]' : 'bg-[#d45a5a]/10 text-[#d45a5a]'}`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-layout-muted uppercase font-bold tracking-wider">Skor Disiplin</p>
              <h3 className="text-2xl font-bold text-layout-text">{discipline.score}</h3>
            </div>
          </div>

          <div className="bg-layout-card p-5 rounded-2xl shadow-sm border border-layout-border flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#d4a23a]/10 text-[#d4a23a]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-layout-muted uppercase font-bold tracking-wider">Total Prestasi</p>
              <h3 className="text-2xl font-bold text-layout-text">{achievements.length}</h3>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kehadiran Pie Chart */}
          <div className="bg-layout-card rounded-2xl shadow-sm border border-layout-border p-6 flex flex-col">
            <h3 className="font-bold text-layout-text mb-4">Grafik Kehadiran</h3>
            <div className="flex-1 flex items-center justify-center min-h-[250px]">
              {attendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-layout-muted text-sm">Belum ada data kehadiran.</div>
              )}
            </div>
          </div>

          {/* Academic Line Chart */}
          <div className="lg:col-span-2 bg-layout-card rounded-2xl shadow-sm border border-layout-border p-6 flex flex-col">
            <h3 className="font-bold text-layout-text mb-4">Rata-rata Nilai per Mata Pelajaran</h3>
            <div className="flex-1 min-h-[250px]">
              {academic.grades.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatGradeChartData()} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8e5" />
                    <XAxis dataKey="subject" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="nilai" name="Nilai Rata-rata" stroke="#3a8fd4" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="kkm" name="KKM" stroke="#d45a5a" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-layout-muted text-sm">Belum ada data nilai.</div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Lists: Discipline & Achievement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-layout-card rounded-2xl shadow-sm border border-layout-border overflow-hidden">
            <div className="p-5 border-b border-layout-border flex items-center justify-between">
              <h3 className="font-bold text-layout-text flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#d45a5a]" />
                Riwayat Kedisiplinan Terakhir
              </h3>
            </div>
            <div className="p-0">
              {discipline.recent_records.length > 0 ? (
                <ul className="divide-y divide-layout-border">
                  {discipline.recent_records.map((rec: any) => (
                    <li key={rec.id} className="p-4 flex items-start gap-3 hover:bg-layout-hover transition-colors">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${rec.violation.type === 'penalty' ? 'bg-[#d45a5a]' : 'bg-[#2d7a50]'}`}></div>
                      <div>
                        <p className="font-medium text-sm text-layout-text">{rec.violation.description}</p>
                        <p className="text-xs text-layout-muted mt-1">
                          {new Date(rec.occurred_at).toLocaleDateString('id-ID')} • Poin: {rec.violation.points}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center text-layout-muted text-sm">Belum ada catatan kedisiplinan.</div>
              )}
            </div>
          </div>

          <div className="bg-layout-card rounded-2xl shadow-sm border border-layout-border overflow-hidden">
            <div className="p-5 border-b border-layout-border flex items-center justify-between">
              <h3 className="font-bold text-layout-text flex items-center gap-2">
                <Award className="w-5 h-5 text-[#d4a23a]" />
                Prestasi Akademik & Non-Akademik
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
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
                <div className="col-span-full p-6 text-center text-layout-muted text-sm border-2 border-dashed border-layout-border rounded-xl">Belum ada data prestasi.</div>
              )}
            </div>
          </div>
        </div>

        {/* Digiart & Ekstrakurikuler */}
        {(activities?.digiart?.length > 0 || activities?.ekstra?.length > 0) && (
          <div className="bg-layout-card rounded-2xl shadow-sm border border-layout-border overflow-hidden">
            <div className="p-5 border-b border-layout-border flex items-center justify-between">
              <h3 className="font-bold text-layout-text flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#2d7a50]" />
                Digiart & Ekstrakurikuler
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Digiart */}
              {activities.digiart?.map((act: any, idx: number) => (
                <div key={`d-${idx}`} className="border border-layout-border rounded-xl p-4 flex flex-col gap-3 bg-white shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div className="w-10 h-10 shrink-0 bg-[#2d7a50]/10 text-[#2d7a50] rounded-full flex items-center justify-center">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-layout-text text-sm truncate">{act.group}</h4>
                      <p className="text-xs text-layout-muted mt-1">Digiart</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-layout-text leading-none">{act.predicate || '-'}</div>
                      <div className="text-[10px] text-layout-muted uppercase font-bold mt-1">Nilai</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-3 border-t border-layout-border flex justify-between items-center text-xs">
                    <span className="text-layout-muted">Kehadiran</span>
                    <span className={`font-bold px-2 py-0.5 rounded-md ${act.attendance_percentage >= 80 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {act.attendance_percentage}%
                    </span>
                  </div>
                </div>
              ))}

              {/* Ekstra */}
              {activities.ekstra?.map((act: any, idx: number) => (
                <div key={`e-${idx}`} className="border border-layout-border rounded-xl p-4 flex flex-col gap-3 bg-white shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div className="w-10 h-10 shrink-0 bg-[#3a8fd4]/10 text-[#3a8fd4] rounded-full flex items-center justify-center">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-layout-text text-sm truncate">{act.group}</h4>
                      <p className="text-xs text-layout-muted mt-1">Ekstrakurikuler</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-layout-text leading-none">{act.predicate || '-'}</div>
                      <div className="text-[10px] text-layout-muted uppercase font-bold mt-1">Nilai</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-3 border-t border-layout-border flex justify-between items-center text-xs">
                    <span className="text-layout-muted">Kehadiran</span>
                    <span className={`font-bold px-2 py-0.5 rounded-md ${act.attendance_percentage >= 80 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {act.attendance_percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
