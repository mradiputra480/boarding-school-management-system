import { Printer } from 'lucide-react';
import { useLangStore } from '@/stores/langStore';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';

interface TimeSlot {
  label: string;
  start: string;
  end: string;
  type: 'lesson' | 'break';
}

interface TimePreset {
  id: number;
  name: string;
  slots: TimeSlot[];
  days: string[] | null;
  is_default: boolean;
}

interface Schedule {
  day: string;
  start_time: string;
  end_time: string;
  subject: { name: string; type: string };
  schoolClass: { name: string; level: string };
}

interface TeacherScheduleTableProps {
  schedules: Schedule[];
  teacherName: string;
}

export default function TeacherScheduleTable({ schedules, teacherName }: TeacherScheduleTableProps) {
  const { t } = useLangStore();
  const [dayPresetMap, setDayPresetMap] = useState<Record<string, TimePreset | null>>({
    senin: null, selasa: null, rabu: null, kamis: null, jumat: null, sabtu: null
  });

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const res = await api.get('/shared/time-presets');
        const presets: TimePreset[] = res.data.data;
        
        const map: Record<string, TimePreset | null> = { senin: null, selasa: null, rabu: null, kamis: null, jumat: null, sabtu: null };
        
        // Apply default preset first
        const defaultP = presets.find(p => p.is_default);
        if (defaultP) {
          ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'].forEach(d => {
            map[d] = defaultP;
          });
        }
        
        // Then override with specific presets
        presets.forEach(p => {
          if (!p.is_default && p.days && Array.isArray(p.days)) {
            p.days.forEach(d => {
              map[d] = p;
            });
          }
        });
        
        setDayPresetMap(map);
      } catch (err) {
        console.error('Failed to fetch time presets', err);
      }
    };
    fetchPresets();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
  const dayNames: Record<string, string> = {
    'senin': t('schedule.monday') || 'Senin',
    'selasa': t('schedule.tuesday') || 'Selasa',
    'rabu': t('schedule.wednesday') || 'Rabu',
    'kamis': t('schedule.thursday') || 'Kamis',
    'jumat': t('schedule.friday') || 'Jumat',
    'sabtu': t('schedule.saturday') || 'Sabtu',
  };

  const maxSlots = Math.max(0, ...days.map(d => dayPresetMap[d]?.slots?.length || 0));
  const slotIndices = Array.from({ length: maxSlots }, (_, i) => i);
  
  // Use default preset for left column labels
  const defaultP = dayPresetMap['senin']; 

  return (
    <div className="bg-white text-black border border-layout-border rounded-xl p-6 shadow-sm mt-6 print:p-0 print:border-none print:shadow-none print:m-0">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div>
          <h3 className="font-bold text-layout-text text-lg">Jadwal Mengajar</h3>
          <p className="text-sm text-layout-muted">Satu minggu ajaran</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-[#2d7a50] hover:bg-[#1a4a30] text-white rounded-lg font-semibold text-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          Cetak Jadwal
        </button>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-3xl font-normal mb-1">{teacherName}</h1>
        <p className="text-xs uppercase font-semibold">SMP Progressive Islamic IIS COMMUNITY</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse border-2 border-black print:border-black min-w-[800px]">
          <thead>
            <tr>
              <th className="border-2 border-black print:border-black bg-white p-2 w-32"></th>
              {days.map(day => (
                <th key={day} className="border-2 border-black print:border-black bg-white p-3 font-normal uppercase text-base tracking-wide text-center">
                  {dayNames[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slotIndices.length === 0 ? (
              <tr>
                <td colSpan={7} className="border-2 border-black p-8 text-center text-gray-500">
                  Memuat format jadwal...
                </td>
              </tr>
            ) : (
              slotIndices.map(rowIndex => {
                const defaultSlot = defaultP?.slots[rowIndex] || days.map(d => dayPresetMap[d]?.slots[rowIndex]).find(s => s);
                if (!defaultSlot) return null;
                
                const timeStr = `${defaultSlot.start.substring(0, 5)} - ${defaultSlot.end.substring(0, 5)}`;
                const timeLabel = defaultSlot.label?.toUpperCase() || '';

                if (defaultSlot.type === 'break') {
                  return (
                    <tr key={rowIndex}>
                      <td className="border-2 border-black print:border-black p-2 text-center bg-white">
                        <div className="font-bold text-xs leading-tight mb-1">{timeLabel || 'BREAK TIME'}</div>
                        <div className="text-xs">{defaultSlot.start.substring(0, 5)} - {defaultSlot.end.substring(0, 5)}</div>
                      </td>
                      <td colSpan={6} className="border-2 border-black print:border-black p-2 text-center bg-white uppercase text-base tracking-wide">
                        {timeLabel || 'BREAK TIME'}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={rowIndex}>
                    <td className="border-2 border-black print:border-black p-2 text-center bg-white">
                      <div className="font-bold text-sm leading-tight mb-1">{timeLabel}</div>
                      <div className="text-xs">{defaultSlot.start.substring(0, 5)} - {defaultSlot.end.substring(0, 5)}</div>
                    </td>
                    {days.map(day => {
                      const preset = dayPresetMap[day];
                      const slot = preset?.slots[rowIndex];

                      if (!slot || slot.type === 'break') {
                        return <td key={day} className="border-2 border-black print:border-black bg-white"></td>;
                      }

                      // Find schedule using specific day's time or default time
                      const searchTime = `${slot.start.substring(0, 5)} - ${slot.end.substring(0, 5)}`;
                      const cellSchedules = (schedules || []).filter(s => 
                        s.day.toLowerCase() === day && 
                        `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}` === searchTime
                      );

                      if (cellSchedules.length === 0) {
                        return <td key={day} className="border-2 border-black print:border-black bg-white p-2 text-center h-16 align-top"></td>;
                      }

                      return (
                        <td key={day} className="border-2 border-black print:border-black p-2 text-center align-middle bg-white">
                          {cellSchedules.map((schedule, i) => (
                            <div key={i} className="mb-2 last:mb-0 flex flex-col items-center justify-center">
                              <div className="text-sm text-black print:text-black uppercase leading-tight">{schedule.subject?.name}</div>
                              <div className="text-sm font-bold text-black print:text-black leading-tight mt-1">{schedule.schoolClass?.level} {schedule.schoolClass?.name.replace(schedule.schoolClass?.level + ' ', '')}</div>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="hidden print:flex justify-between mt-1 text-[10px] text-gray-600">
        <div>Menghasilkan jadwal: {new Date().toLocaleDateString('id-ID')}</div>
        <div>aSc Timetables</div>
      </div>
    </div>
  );
}
