import { useState, useEffect } from 'react';
import ParentLayout from '@/components/layouts/ParentLayout';
import { useLangStore } from '@/stores/langStore';
import { useSchoolStore } from '@/stores/schoolStore';
import api from '@/lib/axios';
import { Award, Lock } from 'lucide-react';

export default function ParentDiscipline() {
  const { t } = useLangStore();
  const { profile: schoolProfile } = useSchoolStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const res = await api.get('/parent/discipline'); setData(res.data); }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <ParentLayout title={t('parent.discipline')}><div className="flex items-center justify-center h-64 text-layout-muted">{t('common.loading')}</div></ParentLayout>;

  const discipline = data?.discipline;
  const showDetail = schoolProfile?.parent_menu_access?.discipline_show_detail ?? true;

  const getPredicate = (score: number) => {
    if (score >= 90) return { label: t('parent.excellent'), color: 'text-green-600', bg: 'bg-green-500', ring: 'ring-green-500/20', glow: 'shadow-green-500/20' };
    if (score >= 75) return { label: t('parent.good'), color: 'text-blue-600', bg: 'bg-blue-500', ring: 'ring-blue-500/20', glow: 'shadow-blue-500/20' };
    if (score >= 60) return { label: t('parent.sufficient'), color: 'text-amber-600', bg: 'bg-amber-500', ring: 'ring-amber-500/20', glow: 'shadow-amber-500/20' };
    return { label: t('parent.poor'), color: 'text-red-600', bg: 'bg-red-500', ring: 'ring-red-500/20', glow: 'shadow-red-500/20' };
  };

  return (
    <ParentLayout title={t('parent.discipline')}>
      <div className="space-y-6">
        <div className="bg-layout-card border border-layout-border rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-layout-muted uppercase tracking-wider mb-6 flex items-center gap-2">
            <Award className="w-4 h-4" />{t('parent.disciplineStatus')}
          </h3>

          {discipline ? (() => {
            const pred = getPredicate(discipline.score);
            const pct = discipline.score;
            return (
              <div className="flex flex-col items-center gap-6">
                {/* Score Circle */}
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="12" className="text-layout-border" />
                    <circle cx="100" cy="100" r="85" fill="none" strokeWidth="12" strokeLinecap="round" className={pred.bg.replace('bg-', 'text-')} strokeDasharray={`${2 * Math.PI * 85}`} strokeDashoffset={`${2 * Math.PI * 85 * (1 - pct / 100)}`} style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-5xl font-black ${pred.color}`}>{discipline.score}</span>
                    <span className="text-sm text-layout-muted font-medium">/100</span>
                  </div>
                </div>

                {/* Predicate Badge */}
                <div className={`px-6 py-3 rounded-2xl text-lg font-bold border-2 ${pred.color} ${pred.bg.replace('bg-', 'border-')}/20 ${pred.bg}/10`}>
                  {pred.label}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  {[
                    { range: '90 - 100', label: t('parent.excellent'), color: 'text-green-600', bg: 'bg-green-500/10' },
                    { range: '75 - 89', label: t('parent.good'), color: 'text-blue-600', bg: 'bg-blue-500/10' },
                    { range: '60 - 74', label: t('parent.sufficient'), color: 'text-amber-600', bg: 'bg-amber-500/10' },
                    { range: '0 - 59', label: t('parent.poor'), color: 'text-red-600', bg: 'bg-red-500/10' },
                  ].map(item => (
                    <div key={item.range} className={`flex items-center gap-3 p-3 rounded-lg ${item.bg}`}>
                      <span className={`text-xs font-bold ${item.color}`}>{item.range}</span>
                      <span className="text-xs text-layout-muted">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })() : (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-layout-border mx-auto mb-3" />
              <p className="text-layout-muted">{t('parent.noDiscipline')}</p>
            </div>
          )}
        </div>

        {/* Riwayat Pelanggaran & Perbaikan */}
        {showDetail ? (
          <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-layout-border">
              <h3 className="text-xs font-bold text-layout-muted uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4" /> Riwayat Poin & Pelanggaran
              </h3>
            </div>
            <div className="p-4">
              {discipline?.records && discipline.records.length > 0 ? (
                <div className="space-y-4">
                  {discipline.records.map((r: any) => (
                    <div key={r.id} className="flex gap-4 items-start p-4 bg-layout-bg border border-layout-border rounded-lg">
                      <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-bold text-lg ${r.violation.points > 0 ? 'bg-[#2d7a50]/20 text-[#2d7a50]' : 'bg-red-500/20 text-red-600'}`}>
                        {r.violation.points > 0 ? '+' : ''}{r.violation.points}
                      </div>
                      <div>
                        <p className="font-bold text-layout-text mb-1">{r.violation.description}</p>
                        <div className="flex gap-4 text-xs text-layout-muted">
                          <span>Tanggal: {new Date(r.occurred_at).toLocaleDateString('id-ID')}</span>
                          {r.reviewer_notes && <span>Catatan: {r.reviewer_notes}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-layout-muted italic text-center py-8">Belum ada catatan pelanggaran/kegiatan positif.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-layout-card border border-layout-border rounded-xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-layout-text mb-2">Detail Disembunyikan</h3>
            <p className="text-layout-muted text-sm max-w-md mx-auto">
              Sesuai kebijakan administrasi sekolah, detail rincian pelanggaran dan perbaikan saat ini tidak ditampilkan. Silakan hubungi Homeroom atau Admin Sekolah untuk informasi lebih lanjut.
            </p>
          </div>
        )}
      </div>
    </ParentLayout>
  );
}
