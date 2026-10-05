import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import TuLayout from '@/components/layouts/TuLayout';
import TeacherLayout from '@/components/layouts/TeacherLayout';
import api from '@/lib/axios';
import { Plus, Edit2, Trash2, Search, X, Eye, EyeOff, Upload, Download, Users, Files, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { storageUrl } from '@/lib/storage';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface DistributedDocument {
  id: number;
  title: string;
  type: string;
  description: string | null;
  target_level: string | null;
  status: 'draft' | 'published';
  recipients_count?: number;
}

interface DocumentRecipient {
  id: number;
  student_id: number;
  student_name?: string;
  student_nisn?: string;
  student?: {
    schoolClass?: {
      name?: string;
    }
  };
  file_path: string;
  downloaded_at: string | null;
}

const emptyForm = { title: '', type: 'skl', description: '', target_level: '', target_class_ids: [] as number[] };
const inp = "w-full bg-layout-card border border-[#bfc9bf] rounded-lg px-3 py-2.5 text-[14px] text-layout-text focus:outline-none focus:border-[#096139] focus:ring-1 focus:ring-[#096139]";
const lbl = "block text-[12px] font-semibold tracking-wider text-layout-text mb-1.5 uppercase";

export default function DocumentDistributionPage() {
  const { user } = useAuthStore();
  const Layout = user?.role === 'admin' ? AdminLayout : user?.role === 'teacher' ? TeacherLayout : TuLayout;
  
  const [docs, setDocs] = useState<DistributedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formOptions, setFormOptions] = useState<any>({ classes: [] });
  
  // CRUD States
  const [modal, setModal] = useState<'add'|'edit'|null>(null);
  const [editId, setEditId] = useState<number|null>(null);
  const [formData, setFormData] = useState({...emptyForm});
  const [formLoading, setFormLoading] = useState(false);

  // Detail/Recipients States
  const [viewingDoc, setViewingDoc] = useState<DistributedDocument | null>(null);
  const [recipients, setRecipients] = useState<DocumentRecipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);

  // Upload States
  const [uploadModal, setUploadModal] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [res, options] = await Promise.all([
        api.get('/admin/documents'),
        api.get('/admin/documents/form-options')
      ]);
      setDocs(res.data.data);
      setFormOptions(options.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setFormData({...emptyForm}); setEditId(null); };
  
  const openAdd = () => { resetForm(); setModal('add'); };
  
  const openEdit = (d: DistributedDocument) => {
    setFormData({
      title: d.title,
      type: d.type,
      description: d.description || '',
      target_level: (d as any).target_class_ids && (d as any).target_class_ids.length > 0 ? 'custom' : (d.target_level || ''),
      target_class_ids: (d as any).target_class_ids || []
    });
    setEditId(d.id);
    setModal('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const payload = {
      ...formData,
      target_level: formData.target_level === 'custom' ? null : formData.target_level,
      target_class_ids: formData.target_level === 'custom' ? formData.target_class_ids : []
    };

    try {
      if (modal === 'add') {
        await api.post('/admin/documents', payload);
        alertDialog('Dokumen berhasil dibuat');
      } else if (modal === 'edit' && editId) {
        await api.put(`/admin/documents/${editId}`, payload);
        alertDialog('Dokumen berhasil diupdate');
      }
      setModal(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirmDialog('Yakin ingin menghapus dokumen ini beserta semua file siswa?', 'Konfirmasi', true))) return;
    try {
      await api.delete(`/admin/documents/${id}`);
      fetchData();
    } catch {
      alertDialog('Gagal menghapus');
    }
  };

  const handleTogglePublish = async (id: number) => {
    if (!(await confirmDialog('Ubah status publikasi dokumen ini?', 'Konfirmasi', false))) return;
    try {
      await api.post(`/admin/documents/${id}/publish`);
      fetchData();
      if (viewingDoc) fetchRecipients(id);
    } catch {
      alertDialog('Gagal mengubah status');
    }
  };

  const fetchRecipients = async (id: number) => {
    setRecipientsLoading(true);
    try {
      const res = await api.get(`/admin/documents/${id}/recipients`);
      setRecipients(res.data.data);
    } catch {
      alertDialog('Gagal memuat penerima');
    } finally {
      setRecipientsLoading(false);
    }
  };

  const openView = (doc: DistributedDocument) => {
    setViewingDoc(doc);
    fetchRecipients(doc.id);
  };

  const closeView = () => {
    setViewingDoc(null);
    setRecipients([]);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !viewingDoc) return;
    
    setUploading(true);
    setUploadSummary(null);
    const fd = new FormData();
    fd.append('file', uploadFile);

    try {
      const res = await api.post(`/admin/documents/${viewingDoc.id}/upload-bulk`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSummary(res.data);
      fetchRecipients(viewingDoc.id);
      fetchData();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || 'Gagal upload file');
    } finally {
      setUploading(false);
    }
  };

  const filtered = docs.filter(d => 
    !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      certificate: 'Sertifikat',
      skl: 'SKL',
      report: 'Laporan',
      other: 'Lainnya'
    };
    return types[type] || type;
  };

  if (viewingDoc) {
    return (
      <Layout title={`Detail: ${viewingDoc.title}`}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <button onClick={closeView} className="flex items-center gap-2 text-layout-muted hover:text-layout-text transition-colors font-medium">
              <ChevronLeft className="w-5 h-5" /> Kembali
            </button>
            <div className="flex gap-2">
              <button onClick={() => { setUploadModal(true); setUploadFile(null); setUploadSummary(null); }} className="bg-[#3a8fd4] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2c77b3] flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload Bulk ZIP
              </button>
              <button onClick={() => handleTogglePublish(viewingDoc.id)} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${viewingDoc.status === 'published' ? 'bg-[#d45a5a] text-white' : 'bg-[#2d7a50] text-white'}`}>
                {viewingDoc.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {viewingDoc.status === 'published' ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </div>
          </div>

          <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-layout-border">
              <h3 className="font-bold text-layout-text text-lg">Daftar Penerima Dokumen</h3>
              <p className="text-sm text-layout-muted">Total penerima: {recipients.length} file</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-layout-text whitespace-nowrap">
                <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[11px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-5 py-4">NISN</th>
                    <th className="px-5 py-4">Nama Siswa</th>
                    <th className="px-5 py-4">Kelas</th>
                    <th className="px-5 py-4">Status Download</th>
                    <th className="px-5 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8e5]">
                  {recipientsLoading ? <tr><td colSpan={5} className="px-6 py-8 text-center text-layout-muted">Loading...</td></tr>
                  : recipients.length === 0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-layout-muted">Belum ada dokumen yang diupload</td></tr>
                  : recipients.map(r => (
                    <tr key={r.id} className="hover:bg-layout-hover">
                      <td className="px-5 py-3 font-mono">{r.student?.nisn || '-'}</td>
                      <td className="px-5 py-3 font-medium">{r.student?.name || 'Tidak diketahui'}</td>
                      <td className="px-5 py-3">{r.student?.schoolClass?.name || '-'}</td>
                      <td className="px-5 py-3">
                        {r.downloaded_at 
                          ? <span className="text-green-600 text-xs font-bold">Diunduh pada {new Date(r.downloaded_at).toLocaleDateString('id-ID')}</span> 
                          : <span className="text-gray-400 text-xs italic">Belum diunduh</span>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {r.file_path ? (
                          <a href={storageUrl(r.file_path)} target="_blank" rel="noreferrer" className="text-[#3a8fd4] hover:underline text-xs font-semibold inline-flex items-center gap-1">
                            <Download className="w-3.5 h-3.5" /> Preview
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs italic">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* UPLOAD MODAL */}
        {uploadModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
            <div className="bg-layout-card w-full max-w-[500px] rounded-2xl shadow-xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border shrink-0">
                <h2 className="text-lg font-bold text-layout-text">Upload Bulk ZIP Dokumen</h2>
                <button onClick={() => { setUploadModal(false); setUploadSummary(null); }} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
              </div>
              
              {!uploadSummary ? (
                <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
                  <div className="bg-orange-50 text-orange-800 p-4 rounded-lg text-sm mb-4">
                    <p className="font-bold mb-1">Aturan ZIP File:</p>
                    <p>Nama file dokumen WAJIB menggunakan format NISN. Contoh: <strong>0012345678.pdf</strong>.</p>
                    <p className="mt-1">Sistem akan otomatis mendistribusikan file ke masing-masing akun orang tua/siswa sesuai NISN.</p>
                  </div>
                  
                  <div>
                    <label className={lbl}>Pilih File .ZIP</label>
                    <input type="file" accept=".zip" required onChange={e => setUploadFile(e.target.files?.[0] || null)} className={inp} />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setUploadModal(false)} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg">Batal</button>
                    <button type="submit" disabled={uploading || !uploadFile} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#3d9968] disabled:opacity-70">
                      {uploading ? 'Mengupload...' : 'Upload File'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 space-y-4">
                  <div className="text-center mb-6">
                    <CheckCircle2 className="w-12 h-12 text-[#2d7a50] mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-layout-text">Upload Selesai</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-500 uppercase font-bold">Berhasil</p>
                      <p className="text-2xl font-bold text-[#2d7a50]">{uploadSummary.matched || 0}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-red-500 uppercase font-bold">Gagal/Tidak Ditemukan</p>
                      <p className="text-2xl font-bold text-red-600">{uploadSummary.not_found?.length || 0}</p>
                    </div>
                  </div>
                  
                  {uploadSummary.not_found?.length > 0 && (
                    <div className="mt-4 max-h-40 overflow-y-auto border border-red-100 rounded-lg p-3 bg-red-50/50">
                      <p className="text-xs font-bold text-red-600 mb-2">File tidak cocok (NISN tidak valid/tidak ditemukan):</p>
                      <ul className="text-xs text-gray-700 list-disc pl-4 space-y-1">
                        {uploadSummary.not_found.map((n: string) => <li key={n}>{n}</li>)}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex justify-center pt-4">
                    <button type="button" onClick={() => { setUploadModal(false); setUploadSummary(null); }} className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">Tutup</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Layout>
    );
  }

  return (
    <Layout title="Distribusi Dokumen">
      <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-layout-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-layout-muted absolute left-3 top-1/2 -translate-y-1/2"/>
            <input type="text" placeholder="Cari dokumen..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-layout-bg border border-layout-border rounded-lg text-sm focus:outline-none focus:border-[#2d7a50]"/>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-[#2d7a50] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#3d9968] transition-colors whitespace-nowrap">
            <Plus className="w-4 h-4"/> Buat Dokumen
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-layout-text whitespace-nowrap">
            <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-4">Judul Dokumen</th>
                <th className="px-5 py-4">Tipe</th>
                <th className="px-5 py-4">Target Kelas</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Terdidistribusi</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8e5]">
              {loading ? <tr><td colSpan={6} className="px-6 py-8 text-center text-layout-muted">Memuat...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-layout-muted">Belum ada distribusi dokumen.</td></tr>
              : filtered.map(doc => (
                <tr key={doc.id} className="hover:bg-layout-hover transition-colors">
                  <td className="px-5 py-4 font-bold text-layout-text">
                    <div className="flex items-center gap-2">
                      <Files className="w-4 h-4 text-[#d4a23a]" /> {doc.title}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-semibold">{getTypeLabel(doc.type)}</span>
                  </td>
                  <td className="px-5 py-4">
                    {(doc as any).target_class_ids && (doc as any).target_class_ids.length > 0 
                      ? `${(doc as any).target_class_ids.length} Kelas Terpilih`
                      : doc.target_level ? `Level ${doc.target_level}` : 'Semua Level'}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${doc.status==='published'?'bg-[#2d7a50]/10 text-[#2d7a50]':'bg-gray-100 text-gray-500'}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center font-bold">
                    {doc.recipients_count || 0} Siswa
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleTogglePublish(doc.id)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 ${doc.status === 'published' ? 'bg-[#d45a5a]/10 text-[#d45a5a] hover:bg-[#d45a5a]/20' : 'bg-[#2d7a50]/10 text-[#2d7a50] hover:bg-[#2d7a50]/20'}`}>
                        {doc.status === 'published' ? <><EyeOff className="w-3.5 h-3.5" /> Nonaktifkan</> : <><Eye className="w-3.5 h-3.5" /> Aktifkan</>}
                      </button>
                      <button onClick={() => openView(doc)} className="px-3 py-1.5 text-xs font-semibold bg-[#3a8fd4]/10 text-[#3a8fd4] hover:bg-[#3a8fd4]/20 rounded-lg flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Kelola File
                      </button>
                      <button onClick={() => openEdit(doc)} className="p-1.5 text-[#d4a23a] hover:bg-[#d4a23a]/10 rounded-md" title="Edit"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-[#d45a5a] hover:bg-[#d45a5a]/10 rounded-md" title="Hapus"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[500px] rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border shrink-0">
              <h2 className="text-lg font-bold text-layout-text">{modal === 'add' ? 'Buat Distribusi Dokumen' : 'Edit Dokumen'}</h2>
              <button onClick={() => { setModal(null); resetForm(); }} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
              <div><label className={lbl}>Judul Dokumen</label><input required value={formData.title} onChange={e=>setFormData({...formData,title:e.target.value})} className={inp} placeholder="Contoh: SKL Tahun 2026"/></div>
              
              <div>
                <label className={lbl}>Tipe Dokumen</label>
                <select required value={formData.type} onChange={e=>setFormData({...formData,type:e.target.value})} className={inp}>
                  <option value="skl">SKL (Surat Keterangan Lulus)</option>
                  <option value="certificate">Sertifikat / Piagam</option>
                  <option value="report">Laporan</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>

              <div>
                <label className={lbl}>Target Level Kelas (Opsional)</label>
                <select value={formData.target_level} onChange={e=>setFormData({...formData,target_level:e.target.value, target_class_ids:[]})} className={inp}>
                  <option value="">Semua Level</option>
                  <option value="VII">Hanya Level VII</option>
                  <option value="VIII">Hanya Level VIII</option>
                  <option value="IX">Hanya Level IX</option>
                  <option value="custom">Pilih Kelas Tertentu...</option>
                </select>
              </div>

              {formData.target_level === 'custom' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className={lbl}>Pilih Kelas Spesifik:</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {formOptions.classes.map((c:any) => (
                      <label key={c.id} className="flex items-center gap-2 text-sm text-layout-text cursor-pointer hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                        <input type="checkbox" 
                          checked={formData.target_class_ids?.includes(c.id)}
                          onChange={(e) => {
                            const ids = formData.target_class_ids || [];
                            setFormData({
                              ...formData, 
                              target_class_ids: e.target.checked ? [...ids, c.id] : ids.filter(i => i !== c.id)
                            });
                          }} 
                          className="w-4 h-4 text-[#2d7a50] rounded border-gray-300 focus:ring-[#2d7a50]/30"
                        /> 
                        <span className="font-medium">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className={lbl}>Deskripsi (Opsional)</label>
                <textarea rows={3} value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})} className={inp} placeholder="Keterangan singkat tentang dokumen ini..."></textarea>
              </div>
            </form>
            
            <div className="border-t border-layout-border p-4 bg-layout-card shrink-0 flex justify-end gap-3">
              <button type="button" onClick={() => { setModal(null); resetForm(); }} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg">Batal</button>
              <button type="button" onClick={handleSubmit} disabled={formLoading} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#3d9968] disabled:opacity-70">
                {formLoading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
