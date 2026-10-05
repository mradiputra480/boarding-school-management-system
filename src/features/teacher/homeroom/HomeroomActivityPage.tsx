import { useState, useEffect } from 'react';
import { Download, Loader2, Palette, Activity } from 'lucide-react';
import TeacherLayout from '@/components/layouts/TeacherLayout';
import api from '@/lib/axios';
import { alertDialog } from '@/lib/swal';
import * as XLSX from 'xlsx';

export default function HomeroomActivityPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/homeroom/activities');
      setData(res.data.data || []);
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal memuat rekap aktivitas');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (data.length === 0) return;
    
    const excelData = data.map((row, idx) => {
      const digiart = row.activities?.digiart?.[0];
      const ekstra = row.activities?.ekstra?.[0];
      
      return {
        'No': idx + 1,
        'NIM': row.student.nisn || row.student.nip || '-',
        'Nama Siswa': row.student.name,
        'Kelas': row.student.school_class?.name || '-',
        'Jenis Digiart': digiart?.group || '-',
        'Kehadiran Digiart (%)': digiart?.attendance_percentage || '-',
        'Nilai Digiart': digiart?.predicate || '-',
        'Jenis Ekstrakurikuler': ekstra?.group || '-',
        'Kehadiran Ekstra (%)': ekstra?.attendance_percentage || '-',
        'Nilai Ekstra': ekstra?.predicate || '-'
      };
    });
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap_Digiart_Ekstra");
    XLSX.writeFile(workbook, `Rekap_Digiart_Ekstra_Homeroom.xlsx`);
  };

  return (
    <TeacherLayout title="Rekap Digiart & Ekstrakurikuler">
      <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-5 border-b border-layout-border bg-layout-bg/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-layout-text text-sm">Rekap Aktivitas Kelas</h3>
            <p className="text-xs text-layout-muted mt-1">Digiart dan Ekstrakurikuler yang diikuti oleh siswa kelas Anda</p>
          </div>
          <button 
            onClick={handleExportExcel}
            disabled={loading || data.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#d4a23a] text-white rounded-lg text-sm font-semibold hover:bg-[#b0852e] transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export ke Excel
          </button>
        </div>

        <div className="flex-1 overflow-x-auto p-4">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#2d7a50]" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center p-12 text-layout-muted border-2 border-dashed border-layout-border rounded-xl">
              Belum ada data siswa.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((row) => (
                <div key={row.student.id} className="border border-layout-border rounded-xl bg-layout-bg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3 pb-3 border-b border-layout-border">
                    <div>
                      <h4 className="font-bold text-layout-text text-sm">{row.student.name}</h4>
                      <p className="text-xs text-layout-muted">{row.student.nisn}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Digiart Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-layout-muted uppercase tracking-wider">
                        <Palette className="w-3.5 h-3.5 text-[#2d7a50]" /> Digiart
                      </div>
                      {row.activities?.digiart?.length > 0 ? (
                        <div className="space-y-2">
                          {row.activities.digiart.map((d: any, idx: number) => (
                            <div key={idx} className="bg-white rounded-lg p-2.5 border border-layout-border/50 text-xs">
                              <div className="font-bold text-layout-text truncate">{d.group}</div>
                              <div className="flex justify-between mt-1.5">
                                <span className="text-layout-muted">Kehadiran: <span className="font-semibold text-layout-text">{d.attendance_percentage}%</span></span>
                                <span className="text-layout-muted">Nilai: <span className="font-bold text-[#2d7a50]">{d.predicate || '-'}</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-layout-muted italic bg-layout-hover p-2 rounded-lg text-center border border-dashed border-layout-border">Tidak ikut Digiart</div>
                      )}
                    </div>

                    {/* Ekstra Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-layout-muted uppercase tracking-wider">
                        <Activity className="w-3.5 h-3.5 text-[#3a8fd4]" /> Ekstrakurikuler
                      </div>
                      {row.activities?.ekstra?.length > 0 ? (
                        <div className="space-y-2">
                          {row.activities.ekstra.map((e: any, idx: number) => (
                            <div key={idx} className="bg-white rounded-lg p-2.5 border border-layout-border/50 text-xs">
                              <div className="font-bold text-layout-text truncate">{e.group}</div>
                              <div className="flex justify-between mt-1.5">
                                <span className="text-layout-muted">Kehadiran: <span className="font-semibold text-layout-text">{e.attendance_percentage}%</span></span>
                                <span className="text-layout-muted">Nilai: <span className="font-bold text-[#3a8fd4]">{e.predicate || '-'}</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-layout-muted italic bg-layout-hover p-2 rounded-lg text-center border border-dashed border-layout-border">Tidak ikut Ekstra</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
