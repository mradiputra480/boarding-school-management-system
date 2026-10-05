import { useState, useEffect } from 'react';
import ParentLayout from '@/components/layouts/ParentLayout';
import { useLangStore } from '@/stores/langStore';
import api from '@/lib/axios';
import { Calendar } from 'lucide-react';

const DAY_NAMES: Record<string, string[]> = {
  id: ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  en: ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

export default function ParentSchedule() {
  const { t, lang } = useLangStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const res = await api.get('/parent/schedule'); setData(res.data); }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <ParentLayout title={t('parent.schedule')}><div className="flex items-center justify-center h-64 text-layout-muted">{t('common.loading')}</div></ParentLayout>;

  const schedules = data?.data || [];
  const className = data?.class ? `${data.class.level} ${data.class.name}` : '';

  // Group by day
  const grouped: Record<number, any[]> = {};
  schedules.forEach((s: any) => { if (!grouped[s.day]) grouped[s.day] = []; grouped[s.day].push(s); });

  const days = DAY_NAMES[lang] || DAY_NAMES.id;

  return (
    <ParentLayout title={t('parent.schedule')}>
      <div className="space-y-6">
        <div className="bg-layout-card border border-layout-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-[#d4a23a]" />
            <div>
              <h2 className="text-lg font-bold text-layout-text">{t('parent.childSchedule')}</h2>
              {className && <p className="text-sm text-layout-muted">{t('parent.class')}: {className}</p>}
            </div>
          </div>
        </div>

        {schedules.length === 0 ? (
          <div className="bg-layout-card border border-layout-border rounded-xl p-12 text-center text-layout-muted">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-layout-border" />
            <p>{t('parent.noSchedule')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([day, slots]) => (
              <div key={day} className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-[#d4a23a]/10 border-b border-[#d4a23a]/20">
                  <h3 className="font-bold text-[#d4a23a] text-sm">{days[Number(day)] || `Day ${day}`}</h3>
                </div>
                <div className="divide-y divide-layout-border">
                  {slots.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time)).map((slot: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-layout-hover/50 transition-colors">
                      <div className="text-center shrink-0 w-20">
                        <p className="text-xs font-bold text-[#2d7a50]">{slot.start_time?.slice(0, 5)}</p>
                        <p className="text-[10px] text-layout-muted">{slot.end_time?.slice(0, 5)}</p>
                      </div>
                      <div className="h-8 w-px bg-layout-border shrink-0" />
                      <div>
                        <p className="font-semibold text-layout-text text-sm">{slot.subject?.name || '-'}</p>
                        <p className="text-xs text-layout-muted">{slot.teacher?.name || '-'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ParentLayout>
  );
}
