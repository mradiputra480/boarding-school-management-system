import { useState, useEffect } from 'react';
import ParentLayout from '@/components/layouts/ParentLayout';
import api from '@/lib/axios';
import { FileText, Download, CheckCircle2, FileArchive } from 'lucide-react';
import { storageUrl } from '@/lib/storage';

export default function ParentDocuments() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/parent/documents');
        setDocuments(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleDownload = async (docId: number, path: string | null) => {
    if (!path) return;
    try {
      const res = await api.get(`/parent/documents/${docId}/download`);
      window.open(storageUrl(res.data.file_path), '_blank');
      // refresh data to update downloaded_at
      const refreshRes = await api.get('/parent/documents');
      setDocuments(refreshRes.data.data);
    } catch (err) {
      console.error(err);
      window.open(storageUrl(path), '_blank');
    }
  };

  if (loading) return <ParentLayout title="Dokumen Siswa"><div className="flex items-center justify-center h-64 text-layout-muted">Memuat...</div></ParentLayout>;

  return (
    <ParentLayout title="Dokumen Siswa">
      <div className="space-y-6">
        <div className="bg-layout-card border border-layout-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#d4a23a]/10 text-[#d4a23a] rounded-lg">
              <FileArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-layout-text">Distribusi Dokumen</h2>
              <p className="text-sm text-layout-muted">SKL, Rapor, dan Dokumen Penting Lainnya</p>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-layout-border rounded-xl">
              <FileText className="w-12 h-12 text-layout-border mx-auto mb-3" />
              <p className="text-layout-muted">Belum ada dokumen yang dibagikan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border border-layout-border bg-layout-bg rounded-xl p-5 flex flex-col hover:border-[#d4a23a]/50 transition-colors shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="inline-block px-2.5 py-1 bg-layout-border/50 text-layout-muted text-[10px] font-bold uppercase rounded-md mb-2">
                        {doc.type}
                      </div>
                      <h3 className="font-bold text-lg text-layout-text leading-tight">{doc.title}</h3>
                      {doc.description && <p className="text-sm text-layout-muted mt-1">{doc.description}</p>}
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-layout-border flex items-center justify-between">
                    <div>
                      {doc.file_available ? (
                        doc.downloaded_at ? (
                          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Diunduh: {new Date(doc.downloaded_at).toLocaleDateString('id-ID')}
                          </div>
                        ) : (
                          <div className="text-xs text-[#d4a23a] font-medium animate-pulse">
                            Dokumen baru tersedia
                          </div>
                        )
                      ) : (
                        <div className="text-xs text-layout-muted">
                          File belum diunggah
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {doc.file_available && doc.file_path && (
                        <button
                          onClick={() => handleDownload(doc.id, doc.file_path)}
                          className="flex items-center gap-2 px-4 py-2 bg-layout-text text-layout-bg hover:bg-[#d4a23a] rounded-lg text-sm font-bold transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Unduh
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ParentLayout>
  );
}
