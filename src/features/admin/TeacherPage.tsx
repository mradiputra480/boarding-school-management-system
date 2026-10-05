import { useState, useEffect, useRef, useMemo } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { useLangStore } from '@/stores/langStore';
import { Plus, Trash2, Search, UserSquare2, X, Eye, Pencil, KeyRound, ChevronLeft, ChevronRight } from 'lucide-react';
import { storageUrl, thumbnailUrl } from '@/lib/storage';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface Teacher {
  id: number; name: string; nip: string|null; nik: string|null; gender: 'Laki-laki'|'Perempuan';
  positions: string[]|null; birth_place: string|null; birth_date: string|null;
  address: string|null; marital_status: string|null; start_year: number|null;
  employment_status: string|null; last_education: string|null; university: string|null;
  major: string|null; dapodik_status: string|null; ijazah_link: string|null; photo: string|null;
  is_coa: boolean; is_kedisiplinan: boolean; is_icc: boolean; is_humas: boolean; is_tu: boolean;
  is_admin_digiart: boolean; is_admin_ekstra: boolean; is_student_report: boolean; is_curriculum_analytics: boolean;
  is_tentor: boolean;
  master_activities?: { id: number; name: string; type: string }[];
  signature: string|null;
  user: { username: string; is_active: boolean; role: string; };
}

const emptyForm = { name:'',nip:'',nik:'',gender:'Laki-laki',birth_place:'',birth_date:'',address:'',marital_status:'',start_year:'',employment_status:'',last_education:'',university:'',major:'',dapodik_status:'',ijazah_link:'', is_coa: false, is_kedisiplinan: false, is_icc: false, is_humas: false, is_tu: false, is_admin_digiart: false, is_admin_ekstra: false, is_student_report: false, is_curriculum_analytics: false, is_tentor: false, user_role: 'teacher' };
const inp = "w-full h-[42px] bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2d7a50] focus:border-transparent transition-all";
const lbl = "block text-[13px] font-semibold text-layout-text mb-1";

export default function TeacherPage() { 
  const { t } = useLangStore();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add'|'edit'|'upload'|'detail'|null>(null);
  const [editId, setEditId] = useState<number|null>(null);
  const [detailTeacher, setDetailTeacher] = useState<Teacher|null>(null);
  const [excelFile, setExcelFile] = useState<File|null>(null);
  const [photoFile, setPhotoFile] = useState<File|null>(null);
  const [photoPreview, setPhotoPreview] = useState<string|null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [signatureFile, setSignatureFile] = useState<File|null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string|null>(null);
  const signatureRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({...emptyForm});
  const [selPos, setSelPos] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [zipFile, setZipFile] = useState<File|null>(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkTtdModal, setBulkTtdModal] = useState(false);
  const [ttdZipFile, setTtdZipFile] = useState<File|null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [subjectsList, setSubjectsList] = useState<{id:number;name:string;type:string}[]>([]);
  const [masterActivities, setMasterActivities] = useState<any[]>([]);
  const [selMasterActivities, setSelMasterActivities] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchData = async () => { try { const r = await api.get('/admin/teachers'); setTeachers(r.data.data); } catch {} finally { setLoading(false); } };
  const fetchSubjects = async () => { try { const r = await api.get('/admin/subjects'); setSubjectsList(r.data.data); } catch {} };
  const addMa = async () => {
    if (!newMaName) return;
    try {
      await api.post('/admin/master-activities', { name: newMaName, type: newMaType });
      setNewMaName('');
      fetchMasters();
    } catch(e:any) { alertDialog(e.message, 'error', 'Gagal'); }
  };
  const delMa = async (id: number) => {
    if(!confirm('Yakin hapus?')) return;
    try {
      await api.delete('/admin/master-activities/'+id);
      fetchMasters();
    } catch(e:any) { alertDialog(e.message, 'error', 'Gagal'); }
  };
  const fetchMasters = async () => { try { const r = await api.get('/admin/master-activities'); setMasterActivities(r.data.data); } catch {} };
  useEffect(() => { fetchData(); fetchSubjects(); fetchMasters(); }, []);

  const resetForm = () => { setFormData({...emptyForm}); setSelPos([]); setSelMasterActivities([]); setPhotoFile(null); setPhotoPreview(null); setSignatureFile(null); setSignaturePreview(null); setError(''); setEditId(null); };
  const openAdd = () => { resetForm(); setModal('add'); };
  const openEdit = (tchr: Teacher) => {
    setFormData({ name:tchr.name, nip:tchr.nip||'', nik:tchr.nik||'', gender:tchr.gender, birth_place:tchr.birth_place||'', birth_date:tchr.birth_date||'', address:tchr.address||'', marital_status:tchr.marital_status||'', start_year:tchr.start_year?.toString()||'', employment_status:tchr.employment_status||'', last_education:tchr.last_education||'', university:tchr.university||'', major:tchr.major||'', dapodik_status:tchr.dapodik_status||'', ijazah_link:tchr.ijazah_link||'', is_coa: tchr.is_coa||false, is_kedisiplinan: tchr.is_kedisiplinan||false, is_icc: tchr.is_icc||false, is_humas: tchr.is_humas||false, is_tu: tchr.is_tu||false, is_admin_digiart: tchr.is_admin_digiart||false, is_admin_ekstra: tchr.is_admin_ekstra||false, is_student_report: tchr.is_student_report||false, is_curriculum_analytics: tchr.is_curriculum_analytics||false, is_tentor: tchr.is_tentor||false, user_role: tchr.user?.role||'teacher' });
    setSelMasterActivities((tchr.master_activities || []).map((m: any) => m.id));
    setSelPos(tchr.positions||[]); setEditId(tchr.id); 
    setPhotoPreview(storageUrl(tchr.photo)); 
    setSignaturePreview(storageUrl(tchr.signature));
    setModal('edit');
  };
  const openDetail = (tchr: Teacher) => { setDetailTeacher(tchr); setModal('detail'); };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(f){setPhotoFile(f);setPhotoPreview(URL.createObjectURL(f));} };
  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(f){setSignatureFile(f);setSignaturePreview(URL.createObjectURL(f));} };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k,v]) => {
        if (['is_coa', 'is_kedisiplinan', 'is_icc', 'is_humas', 'is_tu', 'is_admin_digiart', 'is_admin_ekstra', 'is_student_report', 'is_curriculum_analytics', 'is_tentor'].includes(k)) fd.append(k, v ? '1' : '0');
        else fd.append(k,v as any);
      });
      selPos.forEach((p,i) => fd.append(`positions[${i}]`,p));
      selMasterActivities.forEach((id,i) => fd.append(`master_activities[${i}]`, id.toString()));
      if (photoFile) fd.append('photo', photoFile);
      if (signatureFile) fd.append('signature', signatureFile);

      if (modal === 'add') {
        await api.post('/admin/teachers', fd, { headers:{'Content-Type':'multipart/form-data'} });
        alertDialog('Guru berhasil ditambahkan! Username di-generate otomatis.');
      } else if (modal === 'edit' && editId) {
        fd.append('_method', 'PUT');
        await api.post(`/admin/teachers/${editId}`, fd, { headers:{'Content-Type':'multipart/form-data'} });
        alertDialog('Data guru berhasil diperbarui!');
      }
      setModal(null); resetForm(); fetchData();
    } catch (err: any) { 
        const msg = err.response?.data?.message || err.message || 'Gagal menyimpan data';
        setError(msg);
        alertDialog(msg, 'error', 'Error');
      }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id: number) => { if(!(await confirmDialog('Yakin hapus guru ini?', 'Konfirmasi', true))) return; try{await api.delete(`/admin/teachers/${id}`);fetchData();}catch{alertDialog('Gagal menghapus');} };

  const handleResetPassword = async (tchr: Teacher) => {
    if (!(await confirmDialog(`Reset password untuk ${tchr.name}?\n\nPassword akan dikembalikan ke default: guru123\nGuru wajib ganti password saat login berikutnya.`, 'Konfirmasi', true))) return;
    try {
      const res = await api.post(`/admin/teachers/${tchr.id}/reset-password`);
      alertDialog(`✅ ${res.data.message}\n\nUsername: ${res.data.username}\nPassword default: ${res.data.default_password}`);
      fetchData();
    } catch { alertDialog('Gagal mereset password'); }
  };

  const handleBulkDelete = async () => {
    if(!(await confirmDialog(`Yakin hapus ${selected.length} guru yang dipilih beserta akunnya?`, 'Konfirmasi', true))) return;
    try { await api.post('/admin/teachers/bulk-delete',{ids:selected}); setSelected([]); fetchData(); } catch{alertDialog('Gagal menghapus');}
  };

  const handleExportAccounts = async () => {
    try {
      const r = await api.get('/admin/teachers/export-accounts', { responseType:'blob' });
      const u = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href=u;
      a.setAttribute('download','Akun_Teacher_IIS.xlsx');
      document.body.appendChild(a); a.click(); a.remove();
    } catch { alertDialog('Gagal export akun'); }
  };

  const handleDownload = async () => { try { const r=await api.get('/admin/teachers/template',{responseType:'blob'}); const u=window.URL.createObjectURL(new Blob([r.data])); const a=document.createElement('a');a.href=u;a.setAttribute('download','Template_Teacher.xlsx');document.body.appendChild(a);a.click();a.remove(); } catch{alertDialog('Gagal unduh');} };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault(); if(!excelFile) return; setFormLoading(true); setError('');
    const fd=new FormData(); fd.append('file',excelFile);
    try { await api.post('/admin/teachers/import',fd,{headers:{'Content-Type':'multipart/form-data'}}); setModal(null); setExcelFile(null); fetchData(); alertDialog('Data guru berhasil diimpor!'); }
    catch(err:any) { setError(err.response?.data?.message||'Gagal impor'); }
    finally { setFormLoading(false); }
  };

  const handleBulkPhoto = async (e: React.FormEvent) => {
    e.preventDefault(); if(!zipFile) return; setFormLoading(true); setError('');
    const fd=new FormData(); fd.append('file',zipFile);
    try { const r=await api.post('/admin/teachers/import-photos',fd,{headers:{'Content-Type':'multipart/form-data'}}); setBulkModal(false); setZipFile(null); fetchData(); alertDialog(r.data.message); }
    catch(err:any) { setError(err.response?.data?.message||'Gagal upload foto'); }
    finally { setFormLoading(false); }
  };

  const filtered = useMemo(() => teachers.filter(tchr => { const q=searchQuery.toLowerCase(); return !q || tchr.name.toLowerCase().includes(q) || tchr.user?.username?.toLowerCase().includes(q) || tchr.nip?.toLowerCase().includes(q); }), [teachers, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedTeachers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  // Reset page when filter changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const isFormModal = modal === 'add' || modal === 'edit';

  return (
    <AdminLayout title={t('teachers.title')}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-layout-card rounded-2xl p-6 border border-layout-border flex items-center gap-4">
          <div className="w-12 h-12 bg-[#2d7a50]/10 rounded-full flex items-center justify-center text-[#2d7a50]"><UserSquare2 className="w-6 h-6"/></div>
          <div><p className="text-layout-muted text-sm">{t('teachers.totalActive')}</p><p className="text-2xl font-bold text-layout-text">{teachers.length}</p></div>
        </div>
      </div>

      <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-layout-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72"><Search className="w-4 h-4 text-layout-muted absolute left-3 top-1/2 -translate-y-1/2"/><input type="text" placeholder={t('teachers.search')} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-layout-bg border border-layout-border rounded-lg text-sm focus:outline-none focus:border-[#2d7a50]"/></div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleExportAccounts} className="bg-layout-card border border-layout-border text-layout-muted px-4 py-2 rounded-lg text-sm font-medium hover:bg-layout-bg">📥 Export Accounts</button>
            <button onClick={()=>setBulkTtdModal(true)} className="bg-layout-card border border-layout-border text-purple-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-layout-bg">✍️ Bulk TTD</button>
            <button onClick={()=>setBulkModal(true)} className="bg-layout-card border border-layout-border text-[#d4a23a] px-4 py-2 rounded-lg text-sm font-medium hover:bg-layout-bg">📷 Bulk Photo</button>
            <button onClick={()=>setModal('upload')} className="bg-layout-card border border-layout-border text-[#2d7a50] px-4 py-2 rounded-lg text-sm font-medium hover:bg-layout-bg">{t('teachers.uploadExcel')}</button>
            <button onClick={openAdd} className="flex items-center gap-2 bg-[#2d7a50] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#3d9968]"><Plus className="w-4 h-4"/>{t('teachers.add')}</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-layout-text">
            <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[11px] font-semibold tracking-wider">
              <tr><th className="px-4 py-4 w-10"><input type="checkbox" checked={filtered.length>0&&selected.length===filtered.length} onChange={e=>{if(e.target.checked){setSelected(filtered.map(tchr=>tchr.id))}else{setSelected([])}}} className="w-4 h-4 rounded border-layout-border text-[#2d7a50] focus:ring-[#2d7a50]"/></th><th className="px-4 py-4">{t("common.fullName")}</th><th className="px-4 py-4">L/P</th><th className="px-4 py-4">{t('teachers.roles')}</th><th className="px-4 py-4">{t("common.username")}</th><th className="px-4 py-4 text-right">{t("common.actions")}</th></tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8e5]">
              {loading ? <tr><td colSpan={6} className="px-6 py-8 text-center text-layout-muted">{t("common.loading")}</td></tr>
              : filtered.length===0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-layout-muted">{searchQuery ? t('common.noResults') : t('teachers.noData')}</td></tr>
              : paginatedTeachers.map(tchr=>(
                <tr key={tchr.id} className={`hover:bg-layout-hover ${selected.includes(tchr.id)?'bg-[#2d7a50]/10':''}`}>
                  <td className="px-4 py-4"><input type="checkbox" checked={selected.includes(tchr.id)} onChange={e=>{if(e.target.checked){setSelected([...selected,tchr.id])}else{setSelected(selected.filter(id=>id!==tchr.id))}}} className="w-4 h-4 rounded border-layout-border text-[#2d7a50] focus:ring-[#2d7a50]"/></td>
                  <td className="px-4 py-4 font-medium flex items-center gap-3">
                    {tchr.photo ? <img src={thumbnailUrl(tchr.photo, 'teachers')!} loading="lazy" className="w-8 h-8 rounded-full object-cover border" onError={(e) => { const el = e.target as HTMLImageElement; if (!el.dataset.fallback) { el.dataset.fallback = '1'; el.src = `${storageUrl(tchr.photo)}?v=${Date.now()}`; }}} /> : <div className="w-8 h-8 rounded-full bg-[#2d7a50]/10 text-[#2d7a50] flex items-center justify-center text-xs font-bold">{tchr.name.charAt(0)}</div>}
                    <div>{tchr.name}</div>
                  </td>
                  <td className="px-6 py-4">{tchr.gender==='Laki-laki'?'M':'F'}</td>
                  <td className="px-6 py-4 text-xs"><div className="flex flex-wrap gap-1">{tchr.positions?.map((p,i)=><span key={i} className="bg-layout-bg px-2 py-0.5 rounded text-layout-text border border-layout-border">{p}</span>)}{Boolean(tchr.is_coa) && <span className="bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-semibold">Admin Nilai</span>}{Boolean(tchr.is_kedisiplinan) && <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded font-semibold">Kedisiplinan</span>}{Boolean(tchr.is_icc) && <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-semibold">ICC</span>}{Boolean(tchr.is_humas) && <span className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-semibold">Humas</span>}{Boolean(tchr.is_tu) && <span className="bg-teal-100 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-semibold">Admin TU</span>}{Boolean(tchr.is_admin_digiart) && <span className="bg-pink-100 text-pink-700 border border-pink-200 px-2 py-0.5 rounded font-semibold">Admin Digiart</span>}{Boolean(tchr.is_admin_ekstra) && <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">Admin Ekstra</span>}{Boolean(tchr.is_student_report) && <span className="bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-semibold">Student Report</span>}{Boolean(tchr.is_curriculum_analytics) && <span className="bg-sky-100 text-sky-700 border border-sky-200 px-2 py-0.5 rounded font-semibold">Analisis Kurikulum</span>}{Boolean(tchr.is_tentor) && <span className="bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded font-semibold whitespace-normal text-left inline-flex flex-col gap-0.5"><span>Tentor</span>{tchr.master_activities?.length > 0 && <span className="text-[9px] opacity-80 leading-tight">{tchr.master_activities.map(ma => ma.name).join(', ')}</span>}</span>}{tchr.user?.role === 'pembimbing' && <span className="bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded font-semibold whitespace-normal text-left inline-flex flex-col gap-0.5"><span>Pembimbing (Eks)</span>{tchr.master_activities?.length > 0 && <span className="text-[9px] opacity-80 leading-tight">{tchr.master_activities.map(ma => ma.name).join(', ')}</span>}</span>}{tchr.user?.role === 'pelatih' && <span className="bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded font-semibold whitespace-normal text-left inline-flex flex-col gap-0.5"><span>Pelatih (Eks)</span>{tchr.master_activities?.length > 0 && <span className="text-[9px] opacity-80 leading-tight">{tchr.master_activities.map(ma => ma.name).join(', ')}</span>}</span>}{(!tchr.positions?.length && !tchr.is_coa && !tchr.is_kedisiplinan && !tchr.is_icc && !tchr.is_humas && !tchr.is_tu && !tchr.is_admin_digiart && !tchr.is_admin_ekstra && !tchr.is_student_report && !tchr.is_curriculum_analytics && !tchr.is_tentor && tchr.user?.role === 'teacher') && <span>-</span>}</div></td>
                  <td className="px-6 py-4 text-[#3a8fd4] font-medium">{tchr.user?.username||'-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={()=>openDetail(tchr)} className="p-1.5 text-[#2d7a50] hover:bg-[#2d7a50]/10 rounded-md" title="Detail"><Eye className="w-4 h-4"/></button>
                      <button onClick={()=>openEdit(tchr)} className="p-1.5 text-[#d4a23a] hover:bg-[#d4a23a]/10 rounded-md" title={t('common.edit')}><Pencil className="w-4 h-4"/></button>
                      <button onClick={()=>handleResetPassword(tchr)} className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-md" title="Reset Password"><KeyRound className="w-4 h-4"/></button>
                      <button onClick={()=>handleDelete(tchr.id)} className="p-1.5 text-[#d45a5a] hover:bg-[#d45a5a]/10 rounded-md" title={t('common.delete')}><Trash2 className="w-4 h-4"/></button>
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
              Menampilkan {((currentPage-1)*PAGE_SIZE)+1}–{Math.min(currentPage*PAGE_SIZE, filtered.length)} dari {filtered.length} guru
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:ml-32 bg-[#1a2e24] text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 z-40 animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">{selected.length} dipilih</span>
          <button onClick={handleBulkDelete} className="bg-[#d45a5a] hover:bg-[#c04040] text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"><Trash2 className="w-4 h-4"/>Hapus</button>
          <button onClick={()=>setSelected([])} className="text-white/60 hover:text-white text-sm">{t("common.cancel")}</button>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT */}
      {isFormModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[740px] max-h-[85vh] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-layout-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border shrink-0">
              <h2 className="text-lg font-bold text-layout-text">{modal==='add'?t('teachers.addNew'):t('teachers.editData')}</h2>
              <button onClick={()=>{setModal(null);resetForm();}} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>{t('teachers.photo')}</label>
                      <input type="file" ref={photoRef} accept="image/*" className="hidden" onChange={handlePhotoChange}/>
                      <div onClick={()=>photoRef.current?.click()} className="w-full h-[100px] border-2 border-dashed border-layout-border hover:border-[#2d7a50] bg-layout-bg rounded-lg flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                        {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover"/> : <><span className="text-layout-muted mb-1">📷</span><span className="text-[10px] text-layout-muted text-center px-1">{modal==='edit'?'Change Photo':'Upload Photo'}</span></>}
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Tanda Tangan</label>
                      <input type="file" ref={signatureRef} accept="image/*" className="hidden" onChange={handleSignatureChange}/>
                      <div onClick={()=>signatureRef.current?.click()} className="w-full h-[100px] border-2 border-dashed border-layout-border hover:border-[#2d7a50] bg-layout-bg rounded-lg flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                        {signaturePreview ? <img src={signaturePreview} className="w-full h-full object-contain p-2"/> : <><span className="text-layout-muted mb-1">✍️</span><span className="text-[10px] text-layout-muted text-center px-1">{modal==='edit'?'Change TTD':'Upload TTD'}</span></>}
                      </div>
                    </div>
                  </div>
                  <div><label className={lbl}>{t("common.fullName")}</label><input required value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className={inp} placeholder={t("common.fullName")}/></div>
                  <div className="grid grid-cols-2 gap-4"><div><label className={lbl}>NIP</label><input value={formData.nip} onChange={e=>setFormData({...formData,nip:e.target.value})} className={inp} placeholder="NIP"/></div><div><label className={lbl}>NIK</label><input value={formData.nik} onChange={e=>setFormData({...formData,nik:e.target.value})} className={inp} placeholder="NIK"/></div></div>
                  <div><label className={lbl}>{t('teachers.gender')}</label><div className="flex gap-4">{['Laki-laki','Perempuan'].map((g,i)=>(<label key={g} className="flex items-center gap-2 cursor-pointer text-layout-text"><input type="radio" name="gender" checked={formData.gender===g} onChange={()=>setFormData({...formData,gender:g as any})} className="w-4 h-4 text-[#2d7a50]"/><span className="text-sm">{i===0?t('teachers.male'):t('teachers.female')}</span></label>))}</div></div>
                  <div><label className={lbl}>{t('teachers.birth')}</label><div className="grid grid-cols-2 gap-2"><input value={formData.birth_place} onChange={e=>setFormData({...formData,birth_place:e.target.value})} className={inp} placeholder="Place"/><input type="date" value={formData.birth_date} onChange={e=>setFormData({...formData,birth_date:e.target.value})} className={inp}/></div></div>
                  <div><label className={lbl}>{t('teachers.address')}</label><textarea value={formData.address} onChange={e=>setFormData({...formData,address:e.target.value})} className="w-full bg-layout-bg text-layout-text border border-layout-border rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2d7a50] resize-none" rows={2} placeholder="Full address"/></div>
                  <div><label className={lbl}>{t('teachers.marital')}</label><select value={formData.marital_status} onChange={e=>setFormData({...formData,marital_status:e.target.value})} className={inp}><option value="">{t('common.select')}</option><option value="Belum Menikah">{t('teachers.single')}</option><option value="Menikah">{t('teachers.married')}</option></select></div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={lbl}>Tipe Akun (Sistem)</label>
                    <select value={formData.user_role} onChange={e=>setFormData({...formData,user_role:e.target.value})} className={inp}>
                      <option value="teacher">Guru / Staff Internal</option>
                      <option value="pembimbing">Pembimbing Digiart Eksternal</option>
                      <option value="pelatih">Pelatih Ekstrakurikuler Eksternal</option>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>{t('teachers.roles')}</label>
                    <div className="border border-layout-border rounded-lg bg-layout-bg text-layout-text max-h-[180px] overflow-y-auto p-2 space-y-0.5 mb-2">
                      {subjectsList.length===0?<p className="text-xs text-layout-muted p-2 italic">No roles available. Add them in Academic → Subjects.</p>:subjectsList.map(sub=>(<label key={sub.id} className="flex items-center gap-2 p-1.5 hover:bg-layout-hover rounded cursor-pointer"><input type="checkbox" checked={selPos.includes(sub.name)} onChange={()=>setSelPos(prev=>prev.includes(sub.name)?prev.filter(p=>p!==sub.name):[...prev,sub.name])} className="w-4 h-4 text-[#2d7a50] rounded"/><span className="text-sm">{sub.name}</span><span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${sub.type==='mapel'?'bg-[#2d7a50]/10 text-[#2d7a50]':'bg-amber-50 text-amber-600'}`}>{sub.type==='mapel'?'Subject':'Role'}</span></label>))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <label className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl cursor-pointer hover:bg-purple-500/20 transition-colors">
                        <input type="checkbox" checked={formData.is_coa} onChange={e => setFormData({...formData, is_coa: e.target.checked})} className="w-4 h-4 text-purple-600 rounded mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-purple-700">Admin Nilai</p>
                          <p className="text-[10px] text-purple-600/70 leading-tight mt-0.5">Akses input nilai terpusat</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl cursor-pointer hover:bg-red-500/20 transition-colors">
                        <input type="checkbox" checked={formData.is_kedisiplinan} onChange={e => setFormData({...formData, is_kedisiplinan: e.target.checked})} className="w-4 h-4 text-red-600 rounded mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-red-700">Kedisiplinan</p>
                          <p className="text-[10px] text-red-600/70 leading-tight mt-0.5">Akses dashboard pelanggaran</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl cursor-pointer hover:bg-amber-500/20 transition-colors">
                        <input type="checkbox" checked={formData.is_icc} onChange={e => setFormData({...formData, is_icc: e.target.checked})} className="w-4 h-4 text-amber-600 rounded mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-700">ICC (Prestasi)</p>
                          <p className="text-[10px] text-amber-600/70 leading-tight mt-0.5">Input data prestasi siswa</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl cursor-pointer hover:bg-blue-500/20 transition-colors">
                        <input type="checkbox" checked={formData.is_humas} onChange={e => setFormData({...formData, is_humas: e.target.checked})} className="w-4 h-4 text-blue-600 rounded mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-blue-700">Humas (Agenda)</p>
                          <p className="text-[10px] text-blue-600/70 leading-tight mt-0.5">Input kegiatan sekolah</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl cursor-pointer hover:bg-teal-500/20 transition-colors">
                        <input type="checkbox" checked={formData.is_tu} onChange={e => setFormData({...formData, is_tu: e.target.checked})} className="w-4 h-4 text-teal-600 rounded mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-teal-700">Admin Tata Usaha</p>
                          <p className="text-[10px] text-teal-600/70 leading-tight mt-0.5">Distribusi dokumen (SKL dll)</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl cursor-pointer hover:bg-pink-500/20 transition-colors">
                        <input type="checkbox" checked={formData.is_admin_digiart} onChange={e => setFormData({...formData, is_admin_digiart: e.target.checked})} className="w-4 h-4 text-pink-600 rounded mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-pink-700">Admin Digiart</p>
                          <p className="text-[10px] text-pink-600/70 leading-tight mt-0.5">Manajemen kelas Digiart</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl cursor-pointer hover:bg-emerald-500/20 transition-colors">
                        <input type="checkbox" checked={formData.is_admin_ekstra} onChange={e => setFormData({...formData, is_admin_ekstra: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-emerald-700">Admin Ekstra</p>
                          <p className="text-[10px] text-emerald-600/70 leading-tight mt-0.5">Manajemen kelas Ekstra</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl cursor-pointer hover:bg-indigo-500/20 transition-colors">
                        <input type="checkbox" checked={formData.is_student_report} onChange={e => setFormData({...formData, is_student_report: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-indigo-700">Student Report</p>
                          <p className="text-[10px] text-indigo-600/70 leading-tight mt-0.5">Akses laporan kesiswaan</p>
                          </div>
                        </label>
                        <label className="flex items-start gap-2 p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl cursor-pointer hover:bg-sky-500/20 transition-colors">
                          <input type="checkbox" checked={formData.is_curriculum_analytics} onChange={e => setFormData({...formData, is_curriculum_analytics: e.target.checked})} className="w-4 h-4 text-sky-600 rounded mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-sky-700">Analisis Kurikulum</p>
                            <p className="text-[10px] text-sky-600/70 leading-tight mt-0.5">Akses fitur statistik kurikulum</p>
                          </div>
                        </label>
                        <label className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl cursor-pointer hover:bg-orange-500/20 transition-colors">
                          <input type="checkbox" checked={formData.is_tentor} onChange={e => setFormData({...formData, is_tentor: e.target.checked})} className="w-4 h-4 text-orange-600 rounded mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-orange-700">Tentor Ekstra / Digiart</p>
                            <p className="text-[10px] text-orange-600/70 leading-tight mt-0.5">Pembimbing / Pelatih kegiatan</p>
                          </div>
                        </label>
                    </div>
                    {formData.is_tentor && (
                      <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-orange-700">Pilih Ekstra / Digiart yang Diampu:</p>
                            <button type="button" onClick={() => setShowMaModal(true)} className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200">Kelola Master</button>
                          </div>
                        {/* Selected badges */}
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {masterActivities.filter(ma => selMasterActivities.includes(ma.id)).map(ma => (
                              <span key={ma.id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${ma.type === 'ekstra' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-blue-100 text-blue-800 border border-blue-300'}`}>
                                <span className="capitalize">{ma.name}</span>
                                <button type="button" onClick={() => setSelMasterActivities(prev => prev.filter(id => id !== ma.id))} className="ml-0.5 hover:text-red-600">&times;</button>
                              </span>
                            ))}
                          </div>
                          {/* Dropdown list with checkboxes */}
                          <div className="border border-layout-border rounded-lg max-h-40 overflow-y-auto bg-white dark:bg-layout-card">
                          {masterActivities.map(ma => (
                            <label key={ma.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/10 border-b border-layout-border last:border-b-0">
                              <input type="checkbox" checked={selMasterActivities.includes(ma.id)} onChange={() => {
                                setSelMasterActivities(prev => prev.includes(ma.id) ? prev.filter(id => id !== ma.id) : [...prev, ma.id]);
                              }} className="w-4 h-4 text-orange-600 rounded shrink-0" />
                              <span className="capitalize text-sm flex-1">{ma.name}</span>
                              <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ma.type === 'ekstra' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{ma.type}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4"><div><label className={lbl}>{t('teachers.startYear')}</label><input type="number" value={formData.start_year} onChange={e=>setFormData({...formData,start_year:e.target.value})} className={inp} placeholder="YYYY"/></div><div><label className={lbl}>{t('teachers.empStatus')}</label><input value={formData.employment_status} onChange={e=>setFormData({...formData,employment_status:e.target.value})} className={inp} placeholder={t('teachers.contract')}/></div></div>
                  <div><label className={lbl}>{t('teachers.education')}</label><select value={formData.last_education} onChange={e=>setFormData({...formData,last_education:e.target.value})} className={inp}><option value="">{t('common.select')}</option><option>D3</option><option>S1</option><option>S2</option><option>S3</option></select></div>
                  <div className="grid grid-cols-2 gap-4"><div><label className={lbl}>{t('teachers.university')}</label><input value={formData.university} onChange={e=>setFormData({...formData,university:e.target.value})} className={inp}/></div><div><label className={lbl}>{t('teachers.major')}</label><input value={formData.major} onChange={e=>setFormData({...formData,major:e.target.value})} className={inp}/></div></div>
                  <div><label className={lbl}>{t('teachers.dapodik')}</label><input value={formData.dapodik_status} onChange={e=>setFormData({...formData,dapodik_status:e.target.value})} className={inp}/></div>
                  {modal==='add' && <div className="p-3 bg-[#2d7a50]/10 border border-[#2d7a50]/20 rounded-xl mt-1">
                    <p className="text-[12px] text-[#2d7a50]/90">🔑 Auto-generated credentials:</p>
                    <p className="text-[13px] text-[#2d7a50] font-semibold mt-1">Username: guru + initial</p>
                    <p className="text-[12px] text-[#2d7a50]/80">Password: <strong>guru1236</strong></p>
                  </div>}
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-layout-border flex items-center justify-end gap-3 shrink-0">
              <button onClick={()=>{setModal(null);resetForm();}} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-layout-bg border border-layout-border text-layout-text hover:bg-layout-hover">{t("common.cancel")}</button>
              <button onClick={handleSubmit} disabled={formLoading} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#1b6b43] disabled:opacity-70">{formLoading ? t('common.saving') : t('common.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD */}
      {modal==='upload' && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-md rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border">
              <h2 className="text-lg font-bold text-layout-text">{t('teachers.uploadData')}</h2>
              <button onClick={()=>setModal(null)} className="text-layout-muted hover:text-layout-text p-1.5 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleUpload} className="p-6">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
              <p className="text-sm text-layout-muted mb-4">Unduh template lalu isi data guru. Username otomatis di-generate.</p>
              <button type="button" onClick={handleDownload} className="w-full mb-4 px-4 py-2 border border-[#2d7a50] text-[#2d7a50] rounded-lg font-medium text-sm hover:bg-[#2d7a50]/5">📥 Unduh Template Excel (.xlsx)</button>
              <div className="border-2 border-dashed border-layout-border hover:border-[#2d7a50] rounded-xl p-6 text-center mb-6">
                <input type="file" accept=".csv,.xlsx,.xls" onChange={e=>setExcelFile(e.target.files?.[0]||null)} className="hidden" id="xls-guru"/>
                <label htmlFor="xls-guru" className="cursor-pointer flex flex-col items-center gap-2"><span className="text-3xl">📄</span><span className="text-sm font-medium text-[#2d7a50]">Pilih File</span><span className="text-xs text-layout-muted">{excelFile?excelFile.name:'Belum ada file'}</span></label>
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
      {modal==='detail' && detailTeacher && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[600px] max-h-[85vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border shrink-0">
              <h2 className="text-lg font-bold text-layout-text">Detail Profil Guru</h2>
              <button onClick={()=>setModal(null)} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-layout-border">
                {detailTeacher.photo ? <img src={`${storageUrl(detailTeacher.photo)}?v=${Date.now()}`} className="w-20 h-20 rounded-xl object-cover border-2 border-layout-border"/> : <div className="w-20 h-20 rounded-xl bg-[#2d7a50]/10 text-[#2d7a50] flex items-center justify-center text-2xl font-bold border-2 border-[#2d7a50]/20">{detailTeacher.name.charAt(0)}</div>}
                <div><h3 className="text-xl font-bold text-layout-text">{detailTeacher.name}</h3><p className="text-sm text-layout-muted">{detailTeacher.gender} • <span className="text-[#3a8fd4] font-medium">{detailTeacher.user?.username}</span></p></div>
              </div>
              {([['NIP',detailTeacher.nip],['NIK',detailTeacher.nik],['Tempat Lahir',detailTeacher.birth_place],['Tanggal Lahir',detailTeacher.birth_date],['Alamat',detailTeacher.address],[t('teachers.marital'),detailTeacher.marital_status],[t('teachers.roles'),detailTeacher.positions?.join(', ')],[t('teachers.startYear'),detailTeacher.start_year],[t('teachers.empStatus'),detailTeacher.employment_status],['Pendidikan',detailTeacher.last_education],[t('teachers.university'),detailTeacher.university],[t('teachers.major'),detailTeacher.major],['Dapodik',detailTeacher.dapodik_status]] as [string,any][]).map(([l,v])=>(
                <div key={l} className="grid grid-cols-3 gap-2 py-2.5 border-b border-[#f0f2f1]"><span className="text-[13px] font-semibold text-layout-muted">{l}</span><span className="col-span-2 text-[14px] text-layout-text">{v||<span className="text-[#c0c8c3] italic">Belum diisi</span>}</span></div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-layout-border flex justify-end gap-3 shrink-0">
              <button onClick={()=>handleResetPassword(detailTeacher)} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-[#d45a5a] border border-[#d45a5a] hover:bg-[#d45a5a]/10">🔑 Reset Akun</button>
              <button onClick={()=>{setModal(null);openEdit(detailTeacher);}} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-[#d4a23a] border border-[#d4a23a] hover:bg-[#d4a23a]/10">Edit Data</button>
              <button onClick={()=>setModal(null)} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#1b6b43]">{t("common.close")}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BULK FOTO GURU */}
      {bulkModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[480px] rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border">
              <h2 className="text-lg font-bold text-layout-text">📷 Upload Foto Guru Massal (ZIP)</h2>
              <button onClick={()=>{setBulkModal(false);setZipFile(null);setError('');}} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleBulkPhoto} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
              <div className="p-4 bg-[#2d7a50]/10 border border-[#2d7a50]/20 rounded-xl text-sm text-[#2d7a50]/90 space-y-2">
                <p className="font-semibold">📋 Cara Penggunaan:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Rename setiap foto guru sesuai <strong>NIP atau NIK</strong></li>
                  <li>Contoh: <code className="bg-layout-card px-1 rounded">198001012005011002.jpg</code></li>
                  <li>Kumpulkan semua foto dalam satu folder</li>
                  <li>Kompres folder menjadi file <strong>.zip</strong></li>
                  <li>Upload file ZIP di bawah ini</li>
                </ol>
                <p className="text-xs mt-2">Format didukung: JPG, JPEG, PNG, WEBP. Maks 50MB.</p>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-layout-text mb-1">File ZIP</label>
                <input type="file" accept=".zip" onChange={e=>setZipFile(e.target.files?.[0]||null)} className="w-full h-[42px] bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-[14px]"/>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>{setBulkModal(false);setZipFile(null);}} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg">{t("common.cancel")}</button>
                <button type="submit" disabled={!zipFile||formLoading} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#3d9968] disabled:opacity-70">{formLoading?'Mengupload...':'Upload Foto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BULK TTD GURU */}
      {bulkTtdModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[480px] rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border">
              <h2 className="text-lg font-bold text-layout-text">✍️ Upload TTD Guru Massal (ZIP)</h2>
              <button onClick={()=>{setBulkTtdModal(false);setTtdZipFile(null);setError('');}} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={async(e)=>{
              e.preventDefault();
              if(!ttdZipFile) return;
              setFormLoading(true); setError('');
              try {
                const fd = new FormData(); fd.append('file', ttdZipFile);
                const r = await api.post('/admin/teachers/import-signatures', fd, {headers:{'Content-Type':'multipart/form-data'}});
                alertDialog('✅ ' + r.data.message);
                setBulkTtdModal(false); setTtdZipFile(null); fetchData();
              } catch(err:any) { setError(err.response?.data?.message || 'Gagal upload'); }
              finally { setFormLoading(false); }
            }} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl text-sm text-purple-700 dark:text-purple-300 space-y-2">
                <p className="font-semibold">📋 Cara Penggunaan:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Scan tanda tangan guru (background transparan/putih)</li>
                  <li>Rename setiap file sesuai <strong>NIP atau NIK</strong></li>
                  <li>Contoh: <code className="bg-layout-card px-1 rounded">198001012005011002.png</code></li>
                  <li>Kompres semua file menjadi <strong>.zip</strong></li>
                  <li>Upload file ZIP di bawah ini</li>
                </ol>
                <p className="text-xs mt-2">Format didukung: JPG, JPEG, PNG, WEBP. Maks 50MB.</p>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-layout-text mb-1">File ZIP</label>
                <input type="file" accept=".zip" onChange={e=>setTtdZipFile(e.target.files?.[0]||null)} className="w-full h-[42px] bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-[14px]"/>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>{setBulkTtdModal(false);setTtdZipFile(null);}} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg">{t("common.cancel")}</button>
                <button type="submit" disabled={!ttdZipFile||formLoading} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-70">{formLoading?'Mengupload...':'Upload TTD'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
