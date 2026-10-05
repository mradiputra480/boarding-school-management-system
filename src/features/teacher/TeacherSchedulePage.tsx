import { useState, useMemo } from 'react';
import TeacherLayout from '@/components/layouts/TeacherLayout';
import { useTeacherStore } from '@/stores/teacherStore';
import { useLangStore } from '@/stores/langStore';
import { Calendar, Clock, MapPin, BookOpen } from 'lucide-react';

export default function TeacherSchedulePage() {
  const { t } = useLangStore();
  const { profile, loading } = useTeacherStore();
  
  const schedules = profile?.schedules || [];

  // Group schedules by day
  const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  
  const groupedSchedules = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    daysOrder.forEach(day => grouped[day] = []);
    
    schedules.forEach(schedule => {
      if (!grouped[schedule.day]) {
        grouped[schedule.day] = [];
      }
      grouped[schedule.day].push(schedule);
    });
    
    // Sort by start_time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    
    return grouped;
  }, [schedules]);

  if (loading) {
    return (
      <TeacherLayout title="Jadwal Mengajar">
        <div className="flex items-center justify-center h-64 text-layout-muted">{t('common.loading')}</div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Jadwal Mengajar">
      <div className="space-y-6">
        <div className="bg-layout-card border border-layout-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-layout-border">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-layout-text text-lg">Jadwal Mengajar Saya</h2>
              <p className="text-sm text-layout-muted">Jadwal yang terhubung otomatis dari pengaturan Admin</p>
            </div>
          </div>

          {schedules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {daysOrder.map(day => (
                groupedSchedules[day].length > 0 && (
                  <div key={day} className="border border-layout-border rounded-xl overflow-hidden bg-layout-bg">
                    <div className="bg-layout-border/30 px-4 py-3 border-b border-layout-border">
                      <h3 className="font-bold text-layout-text">{day}</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {groupedSchedules[day].map((item: any) => (
                        <div key={item.id} className="flex gap-3 items-start relative group">
                          <div className="flex flex-col items-center mt-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20"></div>
                            <div className="w-px h-full bg-layout-border absolute top-4 bottom-[-16px] group-last:hidden"></div>
                          </div>
                          <div className="flex-1 bg-layout-card border border-layout-border p-3 rounded-lg shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                              </span>
                            </div>
                            <p className="font-bold text-layout-text text-sm flex items-center gap-1.5 mb-1">
                              <BookOpen className="w-3.5 h-3.5 text-layout-muted" />
                              {item.subject?.name}
                            </p>
                            <p className="text-xs text-layout-muted flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              Kelas {item.school_class?.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-layout-border mx-auto mb-3" />
              <p className="text-layout-muted">Belum ada jadwal mengajar yang dialokasikan.</p>
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
