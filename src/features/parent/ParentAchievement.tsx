import { useState, useEffect } from 'react';
import ParentLayout from '@/components/layouts/ParentLayout';
import { useLangStore } from '@/stores/langStore';
import api from '@/lib/axios';
import { Award, Medal, ExternalLink, Image } from 'lucide-react';

export default function ParentAchievement() {
  const { t } = useLangStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const res = await api.get('/parent/achievements'); setData(res.data); }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <ParentLayout title="Prestasi & Penghargaan"><div className="flex items-center justify-center h-64 text-layout-muted">{t('common.loading')}</div></ParentLayout>;

  const achievements = data?.achievements || [];

  return (
    <ParentLayout title="Prestasi & Penghargaan">
      <div className="space-y-6">
        <div className="bg-layout-card border border-layout-border rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-layout-muted uppercase tracking-wider mb-6 flex items-center gap-2">
            <Medal className="w-4 h-4 text-[#d4a23a]" /> Daftar Prestasi
          </h3>

          {achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((ach: any) => (
                <div key={ach.id} className="border border-layout-border rounded-xl p-4 flex flex-col gap-3 bg-layout-bg hover:shadow-md transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div className="w-12 h-12 shrink-0 bg-[#d4a23a]/10 text-[#d4a23a] rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-layout-text truncate">{ach.achievement}</h4>
                      <p className="text-sm text-layout-text truncate">{ach.competition_name}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[10px] font-bold text-white bg-[#d4a23a] px-2 py-0.5 rounded">Tingkat {ach.level}</span>
                        <span className="text-[10px] font-semibold text-layout-muted bg-layout-border/50 px-2 py-0.5 rounded">{ach.competition_branch}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-layout-muted mt-2 border-t border-layout-border pt-3 space-y-1">
                    <p>Penyelenggara: <span className="font-medium text-layout-text">{ach.organizer}</span></p>
                    <p>Tanggal: <span className="font-medium text-layout-text">{new Date(ach.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
                  </div>

                  <div className="flex gap-2 mt-auto pt-2">
                    {ach.photo_url && (
                      <a href={ach.photo_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
                        <Image className="w-3.5 h-3.5" /> Foto
                      </a>
                    )}
                    {ach.certificate_url && (
                      <a href={ach.certificate_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" /> Sertifikat
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Medal className="w-12 h-12 text-layout-border mx-auto mb-3" />
              <p className="text-layout-muted">Belum ada catatan prestasi atau penghargaan.</p>
            </div>
          )}
        </div>
      </div>
    </ParentLayout>
  );
}
