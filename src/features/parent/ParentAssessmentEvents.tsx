import { useState, useEffect } from 'react';
import ParentLayout from '@/components/layouts/ParentLayout';
import api from '@/lib/axios';
import { ClipboardList, ChevronRight, Download, Award, ExternalLink, Folder, Palette } from 'lucide-react';
import { storageUrl } from '@/lib/storage';

export default function ParentAssessmentEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/parent/assessment-events');
        setEvents(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const loadDetail = async (id: number) => {
    setSelectedEventId(id);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await api.get(`/parent/assessment-events/${id}`);
      setDetailData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <ParentLayout title="Penilaian Eksternal"><div className="flex items-center justify-center h-64 text-layout-muted">Memuat...</div></ParentLayout>;

  return (
    <ParentLayout title="Penilaian Eksternal">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Events List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-layout-muted uppercase">Daftar Penilaian</h2>
          {events.length === 0 ? (
            <div className="bg-layout-card border border-layout-border rounded-xl p-8 text-center text-layout-muted">
              Belum ada penilaian.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => loadDetail(evt.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selectedEventId === evt.id ? 'bg-[#d4a23a]/10 border-[#d4a23a] shadow-sm' : 'bg-layout-card border-layout-border hover:border-[#d4a23a]/50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${selectedEventId === evt.id ? 'bg-[#d4a23a] text-white' : 'bg-layout-bg text-layout-muted'}`}>
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`font-bold ${selectedEventId === evt.id ? 'text-[#d4a23a]' : 'text-layout-text'}`}>{evt.name}</h3>
                        <p className="text-xs text-layout-muted">{evt.academic_year}</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${selectedEventId === evt.id ? 'text-[#d4a23a]' : 'text-layout-muted'}`} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2">
          {!selectedEventId ? (
            <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[300px] border border-dashed border-layout-border rounded-2xl text-layout-muted">
              <ClipboardList className="w-12 h-12 mb-4 opacity-50" />
              <p>Pilih penilaian di samping untuk melihat detail</p>
            </div>
          ) : detailLoading ? (
            <div className="flex items-center justify-center h-64 text-layout-muted bg-layout-card rounded-2xl border border-layout-border">
              Memuat detail...
            </div>
          ) : detailData ? (
            <div className="bg-layout-card border border-layout-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-layout-border bg-layout-bg">
                <h2 className="text-2xl font-bold text-layout-text mb-2">{detailData.event.name}</h2>
                <p className="text-layout-muted">{detailData.event.description || 'Tidak ada deskripsi'}</p>
                
                {detailData.result?.certificate_path ? (
                  <div className="mt-6">
                    <a 
                      href={storageUrl(detailData.result.certificate_path)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d4a23a] hover:bg-yellow-600 text-white rounded-xl font-bold transition-colors shadow-sm shadow-[#d4a23a]/30"
                    >
                      <Download className="w-5 h-5" />
                      Unduh Sertifikat
                    </a>
                  </div>
                ) : detailData.event?.has_certificates ? (
                  <div className="mt-6 flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800/40 rounded-lg flex items-center justify-center shrink-0">
                      <ClipboardList className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Sertifikat belum tersedia</p>
                      <p className="text-xs text-amber-600/70 dark:text-amber-400/60 mt-0.5">Dokumen sertifikat belum diupload oleh admin. Silakan cek kembali nanti.</p>
                    </div>
                  </div>
                ) : null}

                {(detailData.event?.drive_link || detailData.result?.portfolio_link) && (
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {detailData.event?.drive_link && (
                      <a 
                        href={detailData.event.drive_link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2d7a50] hover:bg-[#3d9968] text-white rounded-xl font-bold transition-colors shadow-sm shadow-[#2d7a50]/30"
                      >
                        <Folder className="w-5 h-5" />
                        Dokumentasi Event
                        <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
                      </a>
                    )}
                    {detailData.result?.portfolio_link && (
                      <a 
                        href={detailData.result.portfolio_link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3a8fd4] hover:bg-[#2c77b3] text-white rounded-xl font-bold transition-colors shadow-sm shadow-[#3a8fd4]/30"
                      >
                        <Palette className="w-5 h-5" />
                        File Pendukung (GDrive)
                        <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-sm font-bold text-layout-muted uppercase mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#d4a23a]" /> Hasil Penilaian
                </h3>
                
                {!detailData.result ? (
                  <div className="text-center p-8 border border-dashed border-layout-border rounded-xl">
                    <p className="text-layout-muted">Hasil belum tersedia untuk siswa ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                       const subjects = typeof detailData.event.subjects === 'string' ? JSON.parse(detailData.event.subjects) : detailData.event.subjects;
                       const scores = typeof detailData.result.scores === 'string' ? JSON.parse(detailData.result.scores) : detailData.result.scores;
                       
                       if (!subjects || !Array.isArray(subjects)) return null;

                       return subjects.map((subj: any, idx: number) => {
                         const studentScore = scores?.[subj.name];
                         
                         return (
                           <div key={idx} className="p-4 border border-layout-border rounded-xl bg-layout-bg flex flex-col gap-2">
                             <div className="font-bold text-layout-text">{subj.name}</div>
                             {studentScore ? (
                               <div className="flex justify-between items-end mt-2">
                                 <div className="text-3xl font-black text-[#d4a23a]">{studentScore.score ?? '-'}</div>
                                 {studentScore.criteria && (
                                   <div className="px-3 py-1 bg-[#d4a23a]/10 text-[#d4a23a] rounded-lg text-sm font-bold border border-[#d4a23a]/20">
                                     {studentScore.criteria}
                                   </div>
                                 )}
                               </div>
                             ) : (
                               <div className="text-sm text-layout-muted mt-auto">Nilai belum diinput</div>
                             )}
                           </div>
                         );
                       });
                    })()}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-layout-muted bg-layout-card rounded-2xl border border-layout-border">
              Data tidak ditemukan
            </div>
          )}
        </div>
      </div>
    </ParentLayout>
  );
}
