import { useState, useEffect, useRef, useMemo } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { useLangStore } from '@/stores/langStore';
import { Plus, Trash2, Search, Users, X, Eye, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { storageUrl, thumbnailUrl } from '@/lib/storage';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface Student {
  id: number; nisn: string; nis: string|null; name: string;
  gender: 'Laki-laki'|'Perempuan'; photo: string|null;
  birth_place: string|null; birth_date: string|null; address: string|null;
  father_name: string|null; father_wa: string|null;
  mother_name: string|null; mother_wa: string|null;
  guardian_name: string|null; guardian_wa: string|null;
  portfolio_url: string|null;
  is_active: boolean;
  temp_class: string|null;
  schoolClass: { id: number; name: string } | null;
  user: { username: string; is_active: boolean; } | null;
}

const emptyForm = { nisn:'', nis:'', name:'', gender:'Laki-laki', class_id:'', father_name:'', father_wa:'', mother_name:'', mother_wa:'', guardian_name:'', guardian_wa:'', portfolio_url:'' };
const inp = "w-full bg-[#ffffff] border border-[#bfc9bf] rounded-lg px-3 py-2 text-[14px] text-layout-text focus:outline-none focus:border-[#096139] focus:ring-1 focus:ring-[#096139]";
const lbl = "block text-[12px] font-[500] tracking-[0.05em] text-layout-text mb-1";

export default function StudentPage() { 
  const { t } = useLangStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add'|'edit'|'upload'|'detail'|null>(null);
  const [editId, setEditId] = useState<number|null>(null);
  const [detailStudent, setDetailStudent] = useState<Student|null>(null);
  const [formData, setFormData] = useState({...emptyForm});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [excelFile, setExcelFile] = useState<File|null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [photoFile, setPhotoFile] = useState<File|null>(null);
  const [photoPreview, setPhotoPreview] = useState<string|null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [zipFile, setZipFile] = useState<File|null>(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetch = async () => { try { const r = await api.get('/admin/students'); setStudents(r.data.data); } catch {} finally { setLoading(false); } };
  const fetchClasses = async () => { try { const r = await api.get('/admin/classes'); setClasses(r.data.data); } catch {} };
  useEffect(() => { fetch(); fetchClasses(); }, []);

  const resetForm = () => { setFormData({...emptyForm}); setError(''); setEditId(null); setPhotoFile(null); setPhotoPreview(null); };
  const openAdd = () => { resetForm(); setModal('add'); };
  const openEdit = (s: Student) => {
    setFormData({ nisn:s.nisn, nis:s.nis||'', name:s.name, gender:s.gender, class_id:'',
      father_name:s.father_name||'', father_wa:s.father_wa||'',
      mother_name:s.mother_name||'', mother_wa:s.mother_wa||'',
      guardian_name:s.guardian_name||'', guardian_wa:s.guardian_wa||'', portfolio_url:s.portfolio_url||'' });
    setEditId(s.id); setModal('edit');
    if(s.photo) setPhotoPreview(storageUrl(s.photo));
  };
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(f){setPhotoFile(f);setPhotoPreview(URL.createObjectURL(f));} };
  const openDetail = (s: Student) => { setDetailStudent(s); setModal('detail'); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true); setError('');
    try {
      if (modal === 'add') {
        await api.post('/admin/students', formData);
        alertDialog('Siswa berhasil ditambahkan!');
      } else if (modal === 'edit' && editId) {
        const fd = new FormData();
        fd.append('_method','PUT');
        Object.entries(formData).forEach(([k,v])=>fd.append(k,v));
        if(photoFile) fd.append('photo',photoFile);
        await api.post(`/admin/students/${editId}`,fd,{headers:{'Content-Type':'multipart/form-data'}});
        alertDialog('Data siswa berhasil diperbarui!');
      }
      setModal(null); resetForm(); fetch();
    } catch (err: any) { setError(err.response?.data?.message || 'Gagal menyimpan data'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id: number) => { if(!(await confirmDialog('Yakin hapus siswa ini beserta akun wali muridnya?', 'Konfirmasi', true))) return; try{await api.delete(`/admin/students/${id}`);fetch();}catch{alertDialog('Gagal menghapus');} };

  const handleBulkDelete = async () => {
    if(!(await confirmDialog(`Yakin hapus ${selected.length} siswa yang dipilih beserta akun wali muridnya?`, 'Konfirmasi', true))) return;
    try { await api.post('/admin/students/bulk-delete',{ids:selected}); setSelected([]); fetch(); } catch{alertDialog('Gagal menghapus');}
  };

  const handleDownload = async () => { try { const r=await api.get('/admin/students/template',{responseType:'blob'}); const u=window.URL.createObjectURL(new Blob([r.data])); const a=document.createElement('a');a.href=u;a.setAttribute('download','Template_Siswa.xlsx');document.body.appendChild(a);a.click();a.remove(); } catch{alertDialog('Gagal unduh template');} };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault(); if(!excelFile) return; setFormLoading(true); setError('');
    const fd=new FormData(); fd.append('file',excelFile);
    try { await api.post('/admin/students/import',fd,{headers:{'Content-Type':'multipart/form-data'}}); setModal(null); setExcelFile(null); fetch(); alertDialog('Data siswa berhasil diimpor!'); }
    catch(err:any) { setError(err.response?.data?.message||'Gagal impor'); }
    finally { setFormLoading(false); }
  };

  const handleExportParents = async () => { try { const r=await api.get('/admin/students/export-parent-accounts',{responseType:'blob'}); const u=window.URL.createObjectURL(new Blob([r.data])); const a=document.createElement('a');a.href=u;a.setAttribute('download','Akun_OrangTua.xlsx');document.body.appendChild(a);a.click();a.remove(); } catch{alertDialog('Gagal export');} };

  const handleBulkPhoto = async (e: React.FormEvent) => {
    e.preventDefault(); if(!zipFile) return; setFormLoading(true); setError('');
    const fd=new FormData(); fd.append('file',zipFile);
    try { const r=await api.post('/admin/students/import-photos',fd,{headers:{'Content-Type':'multipart/form-data'}}); setBulkModal(false); setZipFile(null); fetch(); alertDialog(r.data.message); }
    catch(err:any) { setError(err.response?.data?.message||'Gagal upload foto'); }
    finally { setFormLoading(false); }
  };

  const filtered = useMemo(() => students.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.nisn.toLowerCase().includes(q) || (s.nis?.toLowerCase().includes(q));
    let matchClass = true;
    if (filterClass === 'unassigned') matchClass = !s.class_id && !s.temp_class;
    else if (filterClass === 'temp_only') matchClass = !s.class_id && !!s.temp_class;
    else if (filterClass !== 'all') matchClass = s.class_id === Number(filterClass);
    return matchSearch && matchClass;
  }), [students, searchQuery, filterClass]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  // Reset page when filter changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterClass]);

  const handleToggleStatus = async (s: Student) => {
    const action = s.is_active ? 'Non-aktifkan' : 'Aktifkan kembali';
    if (!(await confirmDialog(`Yakin ingin ${action} siswa ${s.name}?`, 'Konfirmasi', false))) return;
    try {
      await api.post(`/admin/students/${s.id}/toggle-status`);
      fetch();
    } catch {
      alertDialog('Gagal mengubah status');
    }
  };

  const activeCount = students.filter(s => s.is_active).length;

  const isFormModal = modal === 'add' || modal === 'edit';

  return (
    <AdminLayout title={t('students.mainData')}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-layout-card rounded-2xl p-6 border border-layout-border flex items-center gap-4">
          <div className="w-12 h-12 bg-[#3a8fd4]/10 rounded-full flex items-center justify-center text-[#3a8fd4]"><Users className="w-6 h-6"/></div>
          <div><p className="text-layout-muted text-sm">Total Siswa Aktif</p><p className="text-2xl font-bold text-layout-text">{activeCount}</p></div>
        </div>
      </div>

      <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-layout-border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
            <div className="relative w-full sm:w-72"><Search className="w-4 h-4 text-layout-muted absolute left-3 top-1/2 -translate-y-1/2"/><input type="text" placeholder={t('students.searchName')} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-layout-bg border border-layout-border rounded-lg text-sm focus:outline-none focus:border-[#2d7a50]"/></div>
            <select value={filterClass} onChange={e=>setFilterClass(e.target.value)} className="w-full sm:w-48 bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]">
              <option value="all">Semua Kelas</option>
              <option value="unassigned">Belum Ada Kelas</option>
              <option value="temp_only">Kelas (Hanya dari Excel)</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={()=>setBulkModal(true)} className="bg-layout-card border border-layout-border text-[#d4a23a] px-4 py-2 rounded-lg text-sm font-medium hover:bg-layout-bg">📷 Bulk Photo</button>
            <button onClick={()=>setModal('upload')} className="bg-layout-card border border-layout-border text-[#2d7a50] px-4 py-2 rounded-lg text-sm font-medium hover:bg-layout-bg">{t('teachers.uploadExcel')}</button>
            <button onClick={openAdd} className="flex items-center gap-2 bg-[#2d7a50] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#3d9968]"><Plus className="w-4 h-4"/>{t('students.add')}</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-layout-text">
            <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[11px] font-semibold tracking-wider">
              <tr><th className="px-4 py-4 w-10"><input type="checkbox" checked={filtered.length>0&&selected.length===filtered.length} onChange={e=>{if(e.target.checked){setSelected(filtered.map(s=>s.id))}else{setSelected([])}}} className="w-4 h-4 rounded border-layout-border text-[#2d7a50] focus:ring-[#2d7a50]"/></th><th className="px-4 py-4">NISN / NIS</th><th className="px-4 py-4">Nama Siswa</th><th className="px-4 py-4">Kelas</th><th className="px-4 py-4">L/P</th><th className="px-4 py-4">Nama Wali (Ayah)</th><th className="px-4 py-4">Status</th><th className="px-4 py-4 text-right">{t("common.actions")}</th></tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8e5]">
              {loading ? <tr><td colSpan={7} className="px-6 py-8 text-center text-layout-muted">{t("common.loading")}</td></tr>
              : filtered.length===0 ? <tr><td colSpan={7} className="px-6 py-8 text-center text-layout-muted">{searchQuery ? t('common.noResults') : 'Belum ada data siswa.'}</td></tr>
              : paginatedStudents.map(s=>(
                <tr key={s.id} className={`hover:bg-layout-hover ${selected.includes(s.id)?'bg-[#2d7a50]/10':''}`}>
                  <td className="px-4 py-4"><input type="checkbox" checked={selected.includes(s.id)} onChange={e=>{if(e.target.checked){setSelected([...selected,s.id])}else{setSelected(selected.filter(id=>id!==s.id))}}} className="w-4 h-4 rounded border-layout-border text-[#2d7a50] focus:ring-[#2d7a50]"/></td>
                  <td className="px-6 py-4"><span className="font-semibold text-[#2d7a50]">{s.nisn}</span><br/><span className="text-xs text-layout-muted">{s.nis||'-'}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-layout-bg border border-layout-border flex items-center justify-center overflow-hidden bg-[#2d7a50]/5">
                        {s.photo ? (
                          <img src={thumbnailUrl(s.photo, 'students')} alt={s.name} loading="lazy" className="w-full h-full object-cover" onError={(e) => { const el = e.target as HTMLImageElement; if (!el.dataset.fallback) { el.dataset.fallback = '1'; el.src = `${storageUrl(s.photo)}?v=${Date.now()}`; } else { el.style.display = 'none'; }}} />
                        ) : (
                          <span className="text-[#2d7a50] font-bold text-sm">{s.name.charAt(0)}</span>
                        )}
                      </div>
                      <span className="font-medium text-layout-text">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {s.schoolClass?.name ? (
                      <span className="font-semibold text-layout-text">{s.schoolClass.name}</span>
                    ) : s.temp_class ? (
                      <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-xs font-semibold border border-amber-200" title="Kelas dari Excel, belum masuk sistem">📋 {s.temp_class}</span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Belum ada</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{s.gender==='Laki-laki'?'L':'P'}</td>
                  <td className="px-6 py-4">{s.father_name||'-'}</td>
                  <td className="px-6 py-4">
                    <button onClick={()=>handleToggleStatus(s)} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${s.is_active ? 'bg-[#2d7a50]/10 text-[#2d7a50] border-[#2d7a50]/20 hover:bg-[#2d7a50]/20' : 'bg-[#d45a5a]/10 text-[#d45a5a] border-[#d45a5a]/20 hover:bg-[#d45a5a]/20'}`}>
                      {s.is_active ? 'Aktif' : 'Non-aktif'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={()=>openDetail(s)} className="p-1.5 text-[#2d7a50] hover:bg-[#2d7a50]/10 rounded-md" title="Detail"><Eye className="w-4 h-4"/></button>
                      <button onClick={()=>openEdit(s)} className="p-1.5 text-[#d4a23a] hover:bg-[#d4a23a]/10 rounded-md" title={t('common.edit')}><Pencil className="w-4 h-4"/></button>
                      <button onClick={()=>handleDelete(s.id)} className="p-1.5 text-[#d45a5a] hover:bg-[#d45a5a]/10 rounded-md" title="Hapus"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-layout-border flex items-center justify-between bg-layout-bg/30">
            <p className="text-xs text-layout-muted">
              Menampilkan {((currentPage-1)*PAGE_SIZE)+1}–{Math.min(currentPage*PAGE_SIZE, filtered.length)} dari {filtered.length} siswa
            </p>
            <div className="flex items-center gap-1">
              <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1} className="p-1.5 rounded-lg border border-layout-border text-layout-muted hover:bg-layout-hover disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4"/></button>
              {Array.from({length: totalPages}, (_,i) => i+1).filter(p => p===1 || p===totalPages || Math.abs(p-currentPage)<=1).map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx-1] !== p-1 && <span className="text-layout-muted text-xs px-1">…</span>}
                  <button onClick={()=>setCurrentPage(p)} className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${p===currentPage ? 'bg-[#2d7a50] text-white' : 'border border-layout-border text-layout-muted hover:bg-layout-hover'}`}>{p}</button>
                </span>
              ))}
              <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages} className="p-1.5 rounded-lg border border-layout-border text-layout-muted hover:bg-layout-hover disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
        )}
      </div>

      {/* Floating bulk action bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:ml-32 bg-[#1a2e24] text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 z-40">
          <span className="text-sm font-medium">{selected.length} dipilih</span>
          <button onClick={handleBulkDelete} className="bg-[#d45a5a] hover:bg-[#c04040] text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"><Trash2 className="w-4 h-4"/>Hapus</button>
          <button onClick={()=>setSelected([])} className="text-white/60 hover:text-white text-sm">{t("common.cancel")}</button>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT */}
      {isFormModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[660px] max-h-[85vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border shrink-0">
              <h2 className="text-lg font-bold text-layout-text">{modal==='add'?'Tambah Siswa Baru':'Edit Data Siswa'}</h2>
              <button onClick={()=>{setModal(null);resetForm();}} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kolom Kiri: Data Siswa */}
                <div className="space-y-4">
                  <div className="pb-2 border-b border-[#c8e0d1]"><h3 className="text-[15px] font-semibold text-layout-text">Data Siswa</h3></div>
                  <div><label className={lbl}>LINK PORTOFOLIO (GOOGLE SITES)</label><input type="url" value={formData.portfolio_url} onChange={e=>setFormData({...formData,portfolio_url:e.target.value})} className={inp} placeholder="https://sites.google.com/..."/></div>
                  <div>
                    <label className={lbl}>{t('teachers.photo')}</label>
                    <input type="file" ref={photoRef} accept="image/*" className="hidden" onChange={handlePhotoChange}/>
                    <div onClick={()=>photoRef.current?.click()} className="w-[80px] h-[80px] border-2 border-dashed border-layout-border hover:border-[#2d7a50] bg-layout-bg rounded-lg flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                      {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover"/> : <><span className="text-layout-muted mb-1">📷</span><span className="text-[10px] text-layout-muted">{modal==='edit'?'Ganti':'Upload'}</span></>}
                    </div>
                  </div>
                  <div><label className={lbl}>NISN</label><input required value={formData.nisn} onChange={e=>setFormData({...formData,nisn:e.target.value.replace(/\D/g,'').substring(0,10)})} className={inp} placeholder="NISN (10 digit)" disabled={modal==='edit'}/></div>
                  <div><label className={lbl}>NIS</label><input value={formData.nis} onChange={e=>setFormData({...formData,nis:e.target.value})} className={inp} placeholder="NIS"/></div>
                  <div><label className={lbl}>NAMA LENGKAP</label><input required value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className={inp} placeholder="Nama lengkap siswa"/></div>
                  <div><label className={lbl}>JENIS KELAMIN</label><div className="flex gap-4">{['Laki-laki','Perempuan'].map(g=>(<label key={g} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="sgender" checked={formData.gender===g} onChange={()=>setFormData({...formData,gender:g as 'Laki-laki'|'Perempuan'})} className="w-4 h-4 text-layout-text"/><span className="text-sm">{g==='Laki-laki'?t('teachers.male'):t('teachers.female')}</span></label>))}</div></div>
                  {modal==='add' && <div className="p-3 bg-[#2d7a50]/10 border border-[#2d7a50]/20 rounded-xl">
                    <p className="text-[12px] text-[#2d7a50]/90">🔑 Akun orang tua otomatis dibuat:</p>
                    <p className="text-[13px] text-[#2d7a50] font-semibold mt-1">Username: NISN siswa</p>
                    <p className="text-[12px] text-[#2d7a50]/80">Password: <strong>parents123</strong></p>
                  </div>}
                </div>
                {/* Kolom Kanan: Data Parent */}
                <div className="space-y-4">
                  <div className="pb-2 border-b border-[#c8e0d1]"><h3 className="text-[15px] font-semibold text-layout-text">Data Parent / Wali</h3></div>
                  <div className="bg-[#dcf4e4] rounded-lg p-3 flex items-start gap-3 border border-[#d0e8d9]">
                    <span className="text-layout-text shrink-0">ℹ️</span>
                    <p className="text-[13px] text-layout-text">No. WA format: <strong>628...</strong> untuk notifikasi.</p>
                  </div>
                  <div><label className={lbl}>NAMA AYAH</label><input value={formData.father_name} onChange={e=>setFormData({...formData,father_name:e.target.value})} className={inp} placeholder="Nama ayah"/></div>
                  <div><label className={lbl}>NO. WA AYAH</label><input type="tel" value={formData.father_wa} onChange={e=>setFormData({...formData,father_wa:e.target.value})} className={inp} placeholder="628..."/></div>
                  <div><label className={lbl}>NAMA IBU</label><input value={formData.mother_name} onChange={e=>setFormData({...formData,mother_name:e.target.value})} className={inp} placeholder="Nama ibu"/></div>
                  <div><label className={lbl}>NO. WA IBU</label><input type="tel" value={formData.mother_wa} onChange={e=>setFormData({...formData,mother_wa:e.target.value})} className={inp} placeholder="628..."/></div>
                  <div className="border-t border-dashed border-[#c8e0d1] pt-4"><label className={lbl}>NAMA WALI (OPSIONAL)</label><input value={formData.guardian_name} onChange={e=>setFormData({...formData,guardian_name:e.target.value})} className={inp} placeholder="Nama wali"/></div>
                  <div><label className={lbl}>NO. WA WALI</label><input type="tel" value={formData.guardian_wa} onChange={e=>setFormData({...formData,guardian_wa:e.target.value})} className={inp} placeholder="628..."/></div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-layout-border flex items-center justify-end gap-3 shrink-0">
              <button onClick={()=>{setModal(null);resetForm();}} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-text hover:bg-[#d0e8d9]">{t("common.cancel")}</button>
              <button onClick={handleSubmit} disabled={formLoading} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#096139] text-white hover:bg-[#2d7a50] disabled:opacity-70">{formLoading ? t('common.saving') : t('common.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD */}
      {modal==='upload' && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-md rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border">
              <h2 className="text-lg font-bold text-layout-text">Upload Data Siswa</h2>
              <button onClick={()=>setModal(null)} className="text-layout-muted hover:text-layout-text p-1.5 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleUpload} className="p-6">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
              <p className="text-sm text-layout-muted mb-4">Unduh template, isi data siswa lalu upload. Akun orang tua otomatis dibuat.</p>
              <button type="button" onClick={handleDownload} className="w-full mb-4 px-4 py-2 border border-[#2d7a50] text-[#2d7a50] rounded-lg font-medium text-sm hover:bg-[#2d7a50]/5">📥 Unduh Template Excel (.xlsx)</button>
              <div className="border-2 border-dashed border-layout-border hover:border-[#2d7a50] rounded-xl p-6 text-center mb-6">
                <input type="file" accept=".csv,.xlsx,.xls" onChange={e=>setExcelFile(e.target.files?.[0]||null)} className="hidden" id="xls-siswa"/>
                <label htmlFor="xls-siswa" className="cursor-pointer flex flex-col items-center gap-2"><span className="text-3xl">📄</span><span className="text-sm font-medium text-[#2d7a50]">Pilih File</span><span className="text-xs text-layout-muted">{excelFile?excelFile.name:'Belum ada file'}</span></label>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={()=>setModal(null)} className="px-4 py-2 rounded-lg text-sm text-layout-muted hover:bg-layout-bg">{t("common.cancel")}</button>
                <button type="submit" disabled={!excelFile||formLoading} className="px-4 py-2 rounded-lg text-sm bg-[#2d7a50] text-white hover:bg-[#3d9968] disabled:opacity-50">{formLoading?'Memproses...':'Upload Data'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL */}
      {modal==='detail' && detailStudent && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[600px] max-h-[85vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border shrink-0">
              <h2 className="text-lg font-bold text-layout-text">Detail Data Siswa</h2>
              <button onClick={()=>setModal(null)} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-layout-border">
                <div className="w-16 h-16 rounded-xl bg-[#3a8fd4]/10 text-[#3a8fd4] flex items-center justify-center text-2xl font-bold border-2 border-[#3a8fd4]/20">{detailStudent.name.charAt(0)}</div>
                <div><h3 className="text-xl font-bold text-layout-text">{detailStudent.name}</h3><p className="text-sm text-layout-muted">{detailStudent.gender} • NISN: <span className="text-[#2d7a50] font-semibold">{detailStudent.nisn}</span></p></div>
              </div>
              <h4 className="text-[13px] font-bold text-layout-text mb-3 uppercase tracking-wider">Identitas Siswa</h4>
              {([['NISN',detailStudent.nisn],['NIS',detailStudent.nis],[t('teachers.gender'),detailStudent.gender==='Laki-laki'?t('teachers.male'):t('teachers.female')],['Tempat Lahir',detailStudent.birth_place],['Tanggal Lahir',detailStudent.birth_date],['Alamat',detailStudent.address],['Link Portofolio',detailStudent.portfolio_url ? <a href={detailStudent.portfolio_url} target="_blank" rel="noreferrer" className="text-[#2d7a50] hover:underline">Buka Link</a> : '']] as [string,any][]).map(([l,v])=>(
                <div key={l} className="grid grid-cols-3 gap-2 py-2.5 border-b border-[#f0f2f1]"><span className="text-[13px] font-semibold text-layout-muted">{l}</span><span className="col-span-2 text-[14px] text-layout-text">{v||<span className="text-[#c0c8c3] italic">Belum diisi</span>}</span></div>
              ))}
              <h4 className="text-[13px] font-bold text-layout-text mb-3 mt-6 uppercase tracking-wider">Data Parent / Wali</h4>
              {([['Nama Ayah',detailStudent.father_name],['No. WA Ayah',detailStudent.father_wa],['Nama Ibu',detailStudent.mother_name],['No. WA Ibu',detailStudent.mother_wa],['Nama Wali',detailStudent.guardian_name],['No. WA Wali',detailStudent.guardian_wa]] as [string,any][]).map(([l,v])=>(
                <div key={l} className="grid grid-cols-3 gap-2 py-2.5 border-b border-[#f0f2f1]"><span className="text-[13px] font-semibold text-layout-muted">{l}</span><span className="col-span-2 text-[14px] text-layout-text">{v||<span className="text-[#c0c8c3] italic">Belum diisi</span>}</span></div>
              ))}
              <div className="mt-6 p-3 bg-[#3a8fd4]/5 rounded-xl border border-[#3a8fd4]/15">
                <p className="text-[12px] text-[#3a8fd4] font-semibold">🔑 Parent Login</p>
                <p className="text-[13px] text-layout-text mt-1">Username: <strong>{detailStudent.nisn}</strong> | Password: <strong>parents123</strong></p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-layout-border flex justify-end gap-3 shrink-0">
              <button onClick={()=>{setModal(null);openEdit(detailStudent);}} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-[#d4a23a] border border-[#d4a23a] hover:bg-[#d4a23a]/10">Edit Data</button>
              <button onClick={()=>setModal(null)} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#1b6b43]">{t("common.close")}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BULK FOTO */}
      {bulkModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[480px] rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border">
              <h2 className="text-lg font-bold text-layout-text">📷 Upload Foto Massal (ZIP)</h2>
              <button onClick={()=>{setBulkModal(false);setZipFile(null);setError('');}} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleBulkPhoto} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
              <div className="p-4 bg-[#2d7a50]/10 border border-[#2d7a50]/20 rounded-xl text-sm text-[#2d7a50]/90 space-y-2">
                <p className="font-semibold">📋 Cara Penggunaan:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Rename setiap foto siswa sesuai <strong>NISN</strong></li>
                  <li>Contoh: <code className="bg-layout-card px-1 rounded">0081234567.jpg</code></li>
                  <li>Kumpulkan semua foto dalam satu folder</li>
                  <li>Kompres folder menjadi file <strong>.zip</strong></li>
                  <li>Upload file ZIP di bawah ini</li>
                </ol>
                <p className="text-xs mt-2">Format didukung: JPG, JPEG, PNG, WEBP. Maks 50MB.</p>
              </div>
              <div>
                <label className={lbl}>File ZIP</label>
                <input type="file" accept=".zip" onChange={e=>setZipFile(e.target.files?.[0]||null)} className={inp}/>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>{setBulkModal(false);setZipFile(null);}} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg">{t("common.cancel")}</button>
                <button type="submit" disabled={!zipFile||formLoading} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#3d9968] disabled:opacity-70">{formLoading?'Mengupload...':'Upload Foto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
