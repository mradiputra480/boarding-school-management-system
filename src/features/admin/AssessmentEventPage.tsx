import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import TuLayout from '@/components/layouts/TuLayout';
import api from '@/lib/axios';
import { Plus, Edit2, Trash2, Search, X, Eye, EyeOff, Upload, Download, Users, FileText, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { storageUrl } from '@/lib/storage';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface Subject {
  name: string;
  criteria: string[];
}

interface AssessmentEvent {
  id: number;
  name: string;
  description: string;
  academic_year: string;
  target_level: string;
  target_class_ids: number[] | null;
  subjects: Subject[];
  status: 'draft' | 'published';
  has_certificates: boolean;
  drive_link?: string | null;
  results_count?: number;
}

interface AssessmentResult {
  id: number;
  student_id: number;
  student_name?: string;
  student_nisn?: string;
  student?: {
    schoolClass?: {
      name?: string;
    }
  };
  scores: any;
  metadata: any;
  certificate_path: string | null;
  portfolio_link?: string | null;
}

const emptyForm = { name: '', description: '', academic_year: '', target_level: '', target_class_ids: [] as number[], subjects: [] as Subject[], has_certificates: false, drive_link: '' };
const inp = "w-full bg-layout-card border border-[#bfc9bf] rounded-lg px-3 py-2.5 text-[14px] text-layout-text focus:outline-none focus:border-[#096139] focus:ring-1 focus:ring-[#096139]";
const lbl = "block text-[12px] font-semibold tracking-wider text-layout-text mb-1.5 uppercase";

export default function AssessmentEventPage() {
  const { user } = useAuthStore();
  const Layout = user?.role === 'admin' ? AdminLayout : TuLayout;
  
  const [events, setEvents] = useState<AssessmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formOptions, setFormOptions] = useState<any>({ academic_years: [], classes: [], subjects: [] });
  
  // States for CRUD
  const [modal, setModal] = useState<'add'|'edit'|null>(null);
  const [editId, setEditId] = useState<number|null>(null);
  const [formData, setFormData] = useState({...emptyForm});
  const [formLoading, setFormLoading] = useState(false);
  
  // Subject editor state
  const [newSubject, setNewSubject] = useState('');

  // States for Detail View
  const [viewingEvent, setViewingEvent] = useState<AssessmentEvent | null>(null);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  // States for Upload Modal (Excel & ZIP)
  const [uploadModal, setUploadModal] = useState<'excel' | 'zip' | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<any>(null);

  // States for Portfolio Link Edit
  const [editingPortfolioStudentId, setEditingPortfolioStudentId] = useState<number | null>(null);
  const [portfolioLinkValue, setPortfolioLinkValue] = useState('');
  const [portfolioSaving, setPortfolioSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [res, options] = await Promise.all([
        api.get('/admin/assessment-events'),
        api.get('/admin/assessment-events/form-options')
      ]);
      setEvents(res.data.data);
      setFormOptions(options.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setFormData({...emptyForm}); setEditId(null); setNewSubject(''); };
  
  const openAdd = () => { resetForm(); setModal('add'); };
  
  const openEdit = (e: AssessmentEvent) => {
    setFormData({
      name: e.name,
      description: e.description || '',
      academic_year: e.academic_year,
      target_level: e.target_class_ids && e.target_class_ids.length > 0 ? 'custom' : (e.target_level || ''),
      target_class_ids: e.target_class_ids || [],
      subjects: e.subjects || [],
      has_certificates: e.has_certificates || false,
      drive_link: e.drive_link || ''
    });
    setEditId(e.id);
    setModal('edit');
  };

  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, { name: newSubject.trim(), criteria: [] }]
    }));
    setNewSubject('');
  };

  const handleRemoveSubject = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    // Process form data for API
    const payload = {
      ...formData,
      target_level: formData.target_level === 'custom' ? null : formData.target_level,
      target_class_ids: formData.target_level === 'custom' ? formData.target_class_ids : []
    };

    try {
      if (modal === 'add') {
        await api.post('/admin/assessment-events', payload);
        alertDialog('Event berhasil dibuat');
      } else if (modal === 'edit' && editId) {
        await api.put(`/admin/assessment-events/${editId}`, payload);
        alertDialog('Event berhasil diupdate');
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
    if (!(await confirmDialog('Yakin ingin menghapus event ini? Semua data nilai akan hilang!', 'Konfirmasi', true))) return;
    try {
      await api.delete(`/admin/assessment-events/${id}`);
      fetchData();
    } catch {
      alertDialog('Gagal menghapus');
    }
  };

  const handleTogglePublish = async (id: number) => {
    if (!(await confirmDialog('Ubah status publikasi event ini?', 'Konfirmasi', false))) return;
    try {
      await api.post(`/admin/assessment-events/${id}/publish`);
      fetchData();
      if (viewingEvent) fetchResults(id);
    } catch {
      alertDialog('Gagal mengubah status');
    }
  };

  const fetchResults = async (id: number) => {
    setResultsLoading(true);
    try {
      const res = await api.get(`/admin/assessment-events/${id}/results`);
      setResults(res.data.data);
    } catch {
      alertDialog('Gagal memuat hasil');
    } finally {
      setResultsLoading(false);
    }
  };

  const openView = (ev: AssessmentEvent) => {
    setViewingEvent(ev);
    fetchResults(ev.id);
  };

  const closeView = () => {
    setViewingEvent(null);
    setResults([]);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !viewingEvent) return;
    
    setUploading(true);
    setUploadSummary(null);
    const fd = new FormData();
    fd.append('file', uploadFile);

    try {
      const endpoint = uploadModal === 'excel' ? 'import-results' : 'upload-certificates';
      const res = await api.post(`/admin/assessment-events/${viewingEvent.id}/${endpoint}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSummary(res.data);
      fetchResults(viewingEvent.id);
      fetchData();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || 'Gagal upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSavePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingEvent || !editingPortfolioStudentId) return;

    setPortfolioSaving(true);
    try {
      await api.put(`/admin/assessment-events/${viewingEvent.id}/results/${editingPortfolioStudentId}/portfolio`, {
        portfolio_link: portfolioLinkValue
      });
      setEditingPortfolioStudentId(null);
      fetchResults(viewingEvent.id);
    } catch (err: any) {
      alertDialog(err.response?.data?.message || 'Gagal menyimpan link portofolio');
    } finally {
      setPortfolioSaving(false);
    }
  };

  const filtered = events.filter(ev => 
    !searchQuery || ev.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (viewingEvent) {
    return (
      <Layout title={`Detail: ${viewingEvent.name}`}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <button onClick={closeView} className="flex items-center gap-2 text-layout-muted hover:text-layout-text transition-colors font-medium">
              <ChevronLeft className="w-5 h-5" /> Kembali
            </button>
            <div className="flex gap-2">
              <button onClick={() => { setUploadModal('excel'); setUploadFile(null); setUploadSummary(null); }} className="bg-[#3a8fd4] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2c77b3] flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload Excel Hasil
              </button>
              {viewingEvent.has_certificates && (
                <button onClick={() => { setUploadModal('zip'); setUploadFile(null); setUploadSummary(null); }} className="bg-[#d4a23a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#b5882b] flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload ZIP Sertifikat
                </button>
              )}
              <button onClick={() => handleTogglePublish(viewingEvent.id)} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${viewingEvent.status === 'published' ? 'bg-[#d45a5a] text-white' : 'bg-[#2d7a50] text-white'}`}>
                {viewingEvent.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {viewingEvent.status === 'published' ? 'Unpublish' : 'Publish Event'}
              </button>
            </div>
          </div>

          <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-layout-border">
              <h3 className="font-bold text-layout-text text-lg">Hasil Penilaian</h3>
              <p className="text-sm text-layout-muted">Total data: {results.length}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-layout-text whitespace-nowrap">
                <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[11px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-5 py-4">NISN</th>
                    <th className="px-5 py-4">Nama Siswa</th>
                    <th className="px-5 py-4">Kelas</th>
                    {viewingEvent.subjects.map(s => (
                      <th key={s.name} className="px-5 py-4 text-center">{s.name}</th>
                    ))}
                    <th className="px-5 py-4 text-center">Portofolio</th>
                    {viewingEvent.has_certificates && <th className="px-5 py-4 text-center">Sertifikat</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8e5]">
                  {resultsLoading ? <tr><td colSpan={viewingEvent.subjects.length + 4 + (viewingEvent.has_certificates ? 0 : -1)} className="px-6 py-8 text-center text-layout-muted">Loading...</td></tr>
                  : results.length === 0 ? <tr><td colSpan={viewingEvent.subjects.length + 4 + (viewingEvent.has_certificates ? 0 : -1)} className="px-6 py-8 text-center text-layout-muted">Belum ada hasil penilaian</td></tr>
                  : results.map(r => (
                    <tr key={r.id} className="hover:bg-layout-hover">
                      <td className="px-5 py-3">{r.student?.nisn || '-'}</td>
                      <td className="px-5 py-3 font-medium">{r.student?.name || 'Tidak ditemukan'}</td>
                      <td className="px-5 py-3">{r.student?.schoolClass?.name || '-'}</td>
                      {viewingEvent.subjects.map(s => (
                        <td key={s.name} className="px-5 py-3 text-center">
                          <span className="font-bold">{r.scores[s.name]?.score || '-'}</span>
                          {r.scores[s.name]?.criteria && <span className="ml-1 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{r.scores[s.name]?.criteria}</span>}
                        </td>
                      ))}
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {r.portfolio_link ? (
                            <a href={r.portfolio_link} target="_blank" rel="noreferrer" className="text-[#3a8fd4] hover:underline text-xs font-semibold inline-flex items-center gap-1">
                              Lihat
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs italic">-</span>
                          )}
                          <button onClick={() => { setEditingPortfolioStudentId(r.student_id); setPortfolioLinkValue(r.portfolio_link || ''); }} className="p-1 text-gray-400 hover:text-[#d4a23a] transition-colors" title="Edit Portofolio">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      {viewingEvent.has_certificates && (
                        <td className="px-5 py-3 text-center">
                          {r.certificate_path ? (
                            <a href={storageUrl(r.certificate_path)} target="_blank" rel="noreferrer" className="text-[#3a8fd4] hover:underline text-xs font-semibold inline-flex items-center gap-1">
                              <Download className="w-3.5 h-3.5" /> Preview
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs italic">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PORTFOLIO EDIT MODAL */}
        {editingPortfolioStudentId && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
            <div className="bg-layout-card w-full max-w-[500px] rounded-2xl shadow-xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border shrink-0">
                <h2 className="text-lg font-bold text-layout-text">Link Hasil Karya / Portofolio</h2>
                <button onClick={() => setEditingPortfolioStudentId(null)} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSavePortfolio} className="p-6 space-y-4">
                <p className="text-sm text-layout-muted mb-2">Siswa: <strong>{results.find(r => r.student_id === editingPortfolioStudentId)?.student?.name}</strong></p>
                <div>
                  <label className={lbl}>Link Google Drive / URL</label>
                  <input type="url" value={portfolioLinkValue} onChange={e => setPortfolioLinkValue(e.target.value)} className={inp} placeholder="https://drive.google.com/..." />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setEditingPortfolioStudentId(null)} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg">Batal</button>
                  <button type="submit" disabled={portfolioSaving} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#3d9968] disabled:opacity-70">
                    {portfolioSaving ? 'Menyimpan...' : 'Simpan Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* UPLOAD MODAL */}
        {uploadModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
            <div className="bg-layout-card w-full max-w-[500px] rounded-2xl shadow-xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border shrink-0">
                <h2 className="text-lg font-bold text-layout-text">
                  {uploadModal === 'excel' ? 'Upload Excel Hasil' : 'Upload ZIP Sertifikat'}
                </h2>
                <button onClick={() => { setUploadModal(null); setUploadSummary(null); }} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
              </div>
              
              {!uploadSummary ? (
                <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
                  {uploadModal === 'excel' && (
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-4">
                      <p className="font-bold mb-1">Format Excel:</p>
                      <p>Pastikan menggunakan format yang sama dengan template. Kolom NISN wajib ada dan valid. Data akan dicocokkan berdasarkan NISN.</p>
                      <div className="mt-3">
                        <button type="button" onClick={async () => {
                          try {
                            const response = await api.get(`/admin/assessment-events/${viewingEvent.id}/export-template`, { responseType: 'blob' });
                            const url = window.URL.createObjectURL(new Blob([response.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `Template_Nilai_${viewingEvent.name.replace(/\s+/g, '_')}.xlsx`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } catch (error) {
                            alertDialog('Gagal mendownload template');
                          }
                        }} className="text-sm bg-white border border-blue-200 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors">
                          <Download className="w-3.5 h-3.5" /> Download Template Excel
                        </button>
                      </div>
                    </div>
                  )}
                  {uploadModal === 'zip' && (
                    <div className="bg-orange-50 text-orange-800 p-4 rounded-lg text-sm mb-4">
                      <p className="font-bold mb-1">Aturan ZIP Sertifikat:</p>
                      <p>Nama file harus menggunakan NISN (contoh: <strong>0012345678.pdf</strong> atau <strong>12345.jpg</strong>). Kumpulkan semua dalam 1 file ZIP.</p>
                    </div>
                  )}
                  
                  <div>
                    <label className={lbl}>Pilih File ({uploadModal === 'excel' ? '.xlsx, .xls' : '.zip'})</label>
                    <input type="file" accept={uploadModal === 'excel' ? '.xlsx, .xls' : '.zip'} required onChange={e => setUploadFile(e.target.files?.[0] || null)} className={inp} />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setUploadModal(null)} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg">Batal</button>
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
                      <p className="text-2xl font-bold text-[#2d7a50]">{uploadSummary.imported || uploadSummary.matched || 0}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-red-500 uppercase font-bold">Gagal/Tidak Ditemukan</p>
                      <p className="text-2xl font-bold text-red-600">{uploadSummary.not_found?.length || 0}</p>
                    </div>
                  </div>
                  
                  {uploadSummary.not_found?.length > 0 && (
                    <div className="mt-4 max-h-40 overflow-y-auto border border-red-100 rounded-lg p-3 bg-red-50/50">
                      <p className="text-xs font-bold text-red-600 mb-2">Daftar NISN tidak ditemukan:</p>
                      <ul className="text-xs text-gray-700 list-disc pl-4 space-y-1">
                        {uploadSummary.not_found.map((n: string) => <li key={n}>{n}</li>)}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex justify-center pt-4">
                    <button type="button" onClick={() => { setUploadModal(null); setUploadSummary(null); }} className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">Tutup</button>
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
    <Layout title="Event Penilaian">
      <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-layout-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-layout-muted absolute left-3 top-1/2 -translate-y-1/2"/>
            <input type="text" placeholder="Cari event..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-layout-bg border border-layout-border rounded-lg text-sm focus:outline-none focus:border-[#2d7a50]"/>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-[#2d7a50] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#3d9968] transition-colors whitespace-nowrap">
            <Plus className="w-4 h-4"/> Buat Event
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-layout-text whitespace-nowrap">
            <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-4">Nama Event</th>
                <th className="px-5 py-4">Tahun Ajaran</th>
                <th className="px-5 py-4">Target Kelas</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Hasil</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8e5]">
              {loading ? <tr><td colSpan={6} className="px-6 py-8 text-center text-layout-muted">Memuat...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-layout-muted">Belum ada event penilaian.</td></tr>
              : filtered.map(ev => (
                <tr key={ev.id} className="hover:bg-layout-hover transition-colors">
                  <td className="px-5 py-4 font-bold text-layout-text">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#3a8fd4]" /> {ev.name}
                    </div>
                  </td>
                  <td className="px-5 py-4">{ev.academic_year}</td>
                  <td className="px-5 py-4">
                    {ev.target_class_ids && ev.target_class_ids.length > 0 
                      ? `${ev.target_class_ids.length} Kelas Terpilih`
                      : ev.target_level ? `Level ${ev.target_level}` : 'Semua Level'}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${ev.status==='published'?'bg-[#2d7a50]/10 text-[#2d7a50]':'bg-gray-100 text-gray-500'}`}>
                      {ev.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center font-bold">
                    {ev.results_count || 0} Siswa
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleTogglePublish(ev.id)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 ${ev.status === 'published' ? 'bg-[#d45a5a]/10 text-[#d45a5a] hover:bg-[#d45a5a]/20' : 'bg-[#2d7a50]/10 text-[#2d7a50] hover:bg-[#2d7a50]/20'}`}>
                        {ev.status === 'published' ? <><EyeOff className="w-3.5 h-3.5" /> Nonaktifkan</> : <><Eye className="w-3.5 h-3.5" /> Aktifkan</>}
                      </button>
                      <button onClick={() => openView(ev)} className="px-3 py-1.5 text-xs font-semibold bg-[#3a8fd4]/10 text-[#3a8fd4] hover:bg-[#3a8fd4]/20 rounded-lg flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Kelola Hasil
                      </button>
                      <button onClick={() => openEdit(ev)} className="p-1.5 text-[#d4a23a] hover:bg-[#d4a23a]/10 rounded-md" title="Edit"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(ev.id)} className="p-1.5 text-[#d45a5a] hover:bg-[#d45a5a]/10 rounded-md" title="Hapus"><Trash2 className="w-4 h-4"/></button>
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
          <div className="bg-layout-card w-full max-w-[600px] rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border shrink-0">
              <h2 className="text-lg font-bold text-layout-text">{modal === 'add' ? 'Buat Event Penilaian' : 'Edit Event'}</h2>
              <button onClick={() => { setModal(null); resetForm(); }} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div><label className={lbl}>Nama Event</label><input required value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className={inp} placeholder="Contoh: Tryout TKA Kelas IX 2026"/></div>
              <div><label className={lbl}>Link Google Drive (Opsional)</label><input type="url" value={formData.drive_link} onChange={e=>setFormData({...formData,drive_link:e.target.value})} className={inp} placeholder="https://drive.google.com/..."/></div>
              <div>
                <label className={lbl}>Tahun Ajaran</label>
                <select required value={formData.academic_year} onChange={e=>setFormData({...formData,academic_year:e.target.value})} className={inp}>
                  <option value="">Pilih Tahun Ajaran...</option>
                  {formOptions.academic_years.map((y: string) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Target Level Kelas</label>
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
              
              <div className="border-t border-layout-border pt-4 mt-2">
                <label className={lbl}>Mata Pelajaran (Format Penilaian)</label>
                
                {formData.subjects.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {formData.subjects.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-layout-bg p-3 rounded-lg border border-layout-border">
                        <div>
                          <p className="font-bold text-sm text-layout-text">{sub.name}</p>
                        </div>
                        <button type="button" onClick={() => handleRemoveSubject(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="mb-3">
                    <input list="subjects-list" value={newSubject} onChange={e=>setNewSubject(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#2d7a50] focus:ring-1 focus:ring-[#2d7a50] outline-none" placeholder="Pilih atau Ketik Nama Mapel..." />
                    <datalist id="subjects-list">
                      {formOptions.subjects.map((s:any) => <option key={s.id} value={s.name} />)}
                    </datalist>
                  </div>
                  <button type="button" onClick={handleAddSubject} className="w-full bg-white border border-gray-300 text-gray-700 font-semibold text-sm py-2 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Tambah Mapel
                  </button>
                  <p className="text-[11px] text-gray-500 mt-2 text-center">Tambahkan mapel yang akan dinilai pada event ini terlebih dahulu.</p>
                </div>
              </div>

              {/* Checkbox Dokumen Pendukung */}
              <div className="border-t border-layout-border pt-4 mt-2">
                <label className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl cursor-pointer hover:bg-amber-500/10 transition-colors">
                  <input type="checkbox" checked={formData.has_certificates} onChange={e => setFormData({...formData, has_certificates: e.target.checked})} className="w-5 h-5 text-amber-600 rounded mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Ada Dokumen Pendukung (Sertifikat / Piagam)</p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/60 leading-relaxed mt-1">Centang jika event ini memiliki sertifikat atau dokumen pendukung yang akan diupload per siswa. Jika belum diupload, orang tua akan melihat notifikasi "Sertifikat belum tersedia".</p>
                  </div>
                </label>
              </div>
            </form>
            
            <div className="border-t border-layout-border p-4 bg-layout-card shrink-0 flex justify-end gap-3">
              <button type="button" onClick={() => { setModal(null); resetForm(); }} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg">Batal</button>
              <button type="submit" onClick={handleSubmit} disabled={formLoading || formData.subjects.length === 0} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#3d9968] disabled:opacity-70">
                {formLoading ? 'Menyimpan...' : 'Simpan Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
