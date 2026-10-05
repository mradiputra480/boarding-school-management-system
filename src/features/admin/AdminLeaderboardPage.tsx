import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Award, Trophy, Users, Star, Medal } from 'lucide-react';
import api from '@/lib/axios';

export default function AdminLeaderboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/admin/leaderboard/discipline');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Leaderboard & Nominasi">
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-[#d4a23a] to-[#b8882e] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Trophy className="w-48 h-48" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
              <Award className="w-8 h-8" />
              Nominasi Prestasi & Penghargaan Sekolah
            </h1>
            <p className="text-amber-100 text-lg">
              Leaderboard untuk mengapresiasi kinerja guru berdasarkan data aktual pada semester ini.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* The Most Caring Teacher */}
          <div className="bg-layout-card border border-layout-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-layout-border bg-layout-bg/50 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#2d7a50]/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-[#2d7a50]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-layout-text">The Most Caring Teacher</h2>
                <p className="text-sm text-layout-muted">Berdasarkan keaktifan pelaporan & verifikasi kedisiplinan.</p>
              </div>
            </div>
            
            <div className="flex-1 p-0">
              {loading ? (
                <div className="p-8 text-center text-layout-muted">Memuat data...</div>
              ) : data?.most_caring_teachers?.length > 0 ? (
                <ul className="divide-y divide-layout-border">
                  {data.most_caring_teachers.map((t: any, idx: number) => (
                    <li key={t.teacher_id} className="p-5 flex items-center justify-between hover:bg-layout-hover transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-sm ${idx === 0 ? 'bg-gradient-to-br from-[#d4a23a] to-[#b8882e] text-white scale-110 shadow-amber-500/40' : idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800' : idx === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-amber-100' : 'bg-layout-bg border border-layout-border text-layout-muted'}`}>
                          {idx === 0 ? <Trophy className="w-5 h-5" /> : idx === 1 || idx === 2 ? <Medal className="w-5 h-5" /> : idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-layout-text">{t.teacher_name}</p>
                          {idx === 0 && <p className="text-xs font-bold text-[#d4a23a] uppercase tracking-wider">Top Contributor</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-black text-2xl text-[#2d7a50]">{t.count}</span>
                        <span className="text-xs uppercase font-bold text-layout-muted tracking-wider">Laporan</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-layout-muted">Belum ada data laporan kedisiplinan guru.</div>
              )}
            </div>
          </div>

          {/* Placeholder for future leaderboards */}
          <div className="bg-layout-card border border-layout-border border-dashed rounded-2xl shadow-sm flex flex-col items-center justify-center p-12 text-center text-layout-muted">
            <Users className="w-16 h-16 opacity-20 mb-4" />
            <h3 className="text-xl font-bold mb-2">Best Teacher (Segera Hadir)</h3>
            <p className="max-w-xs">Nominasi Best Teacher berdasarkan perolehan raport kinerja tertinggi akan segera diimplementasikan pada pembaruan mendatang.</p>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
