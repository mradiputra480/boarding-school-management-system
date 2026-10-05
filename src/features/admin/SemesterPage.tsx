import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { useLangStore } from '@/stores/langStore';
import { Plus, Edit2, Trash2, Search, X, Calendar, Eye, EyeOff, Lock, Unlock, Clock } from 'lucide-react';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface Semester {
  id: number; name: string; year: string;
  start_date: string; end_date: string;
  status: 'active' | 'inactive';
  is_published: boolean;
}

const emptyForm = { name: '', year: '', start_date: '', end_date: '', status: 'inactive' as const };
const inp = "w-full bg-layout-card border border-[#bfc9bf] rounded-lg px-3 py-2.5 text-[14px] text-layout-text focus:outline-none focus:border-[#096139] focus:ring-1 focus:ring-[#096139]";
const lbl = "block text-[12px] font-semibold tracking-wider text-layout-text mb-1.5 uppercase";

export default function SemesterPage() { 
  const { t } = useLangStore();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add'|'edit'|null>(null);
  const [editId, setEditId] = useState<number|null>(null);
  const [formData, setFormData] = useState({...emptyForm});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => { try { const r=await api.get('/admin/semesters'); setSemesters(r.data.data); } catch{} finally{setLoading(false);} };
  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setFormData({...emptyForm}); setError(''); setEditId(null); };
  const openAdd = () => { resetForm(); setModal('add'); };
  const openEdit = (s: Semester) => {
    setFormData({ name:s.name, year:s.year, start_date:s.start_date, end_date:s.end_date, status:s.status });
    setEditId(s.id); setModal('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true); setError('');
    try {
      if (modal==='add') {
        await api.post('/admin/semesters', formData);
        alertDialog(t('semesters.addSuccess'));
      } else if (modal==='edit' && editId) {
        await api.put(`/admin/semesters/${editId}`, formData);
        alertDialog(t('semesters.editSuccess'));
      }
      setModal(null); resetForm(); fetchData();
    } catch(err:any) { setError(err.response?.data?.message || t('common.saveFailed')); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if(!(await confirmDialog(t('semesters.confirmDelete', 'Konfirmasi', true)))) return;
    try { await api.delete(`/admin/semesters/${id}`); fetchData(); } catch{ alertDialog(t('common.deleteFailed')); }
  };

  const handleTogglePublish = async (s: Semester) => {
    const msg = s.is_published ? t('semesters2.unpublishConfirm') : t('semesters2.publishConfirm');
    if (!(await confirmDialog(msg, 'Konfirmasi', false))) return;
    try { await api.post(`/admin/semesters/${s.id}/toggle-publish`); fetchData(); } catch { alertDialog(t('common.saveFailed')); }
  };

  const filtered = semesters.filter(s => {
    const q = searchQuery.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.year.toLowerCase().includes(q);
  });

  return (
    <AdminLayout title={t('semesters.title')}>
      <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-layout-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72"><Search className="w-4 h-4 text-layout-muted absolute left-3 top-1/2 -translate-y-1/2"/><input type="text" placeholder={t('semesters.search')} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-layout-bg border border-layout-border rounded-lg text-sm focus:outline-none focus:border-[#2d7a50]"/></div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-[#2d7a50] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#3d9968] transition-colors whitespace-nowrap"><Plus className="w-4 h-4"/>{t('semesters.add')}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-layout-text">
            <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-4">{t('semesters.name')}</th>
                <th className="px-5 py-4">{t('semesters.year')}</th>
                <th className="px-5 py-4">{t('semesters.startDate')}</th>
                <th className="px-5 py-4">{t('semesters.endDate')}</th>
                <th className="px-5 py-4">{t("common.status")}</th>
                <th className="px-5 py-4 text-center">{t('semesters2.publishReport')}</th>
                <th className="px-5 py-4 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8e5]">
              {loading ? <tr><td colSpan={8} className="px-6 py-8 text-center text-layout-muted">{t("common.loading")}</td></tr>
              : filtered.length===0 ? <tr><td colSpan={8} className="px-6 py-8 text-center text-layout-muted">{searchQuery?t('common.noResults'):t('semesters.noData')}</td></tr>
              : filtered.map(s=>(
                <tr key={s.id} className="hover:bg-layout-hover transition-colors">
                  <td className="px-5 py-4 font-medium">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#2d7a50]"/>{s.name}</div>
                  </td>
                  <td className="px-5 py-4">{s.year}</td>
                  <td className="px-5 py-4">{s.start_date}</td>
                  <td className="px-5 py-4">{s.end_date}</td>
                  <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${s.status==='active'?'bg-[#2d7a50]/10 text-[#2d7a50] border border-[#2d7a50]/20':'bg-layout-bg text-layout-muted border border-layout-border'}`}>{s.status==='active'?t('common.active'):t('common.inactive')}</span></td>
                  
                  {/* Publish Toggle */}
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => handleTogglePublish(s)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        s.is_published
                          ? 'bg-[#2d7a50]/10 text-[#2d7a50] border border-[#2d7a50]/20 hover:bg-[#2d7a50]/20'
                          : 'bg-layout-bg text-layout-muted border border-layout-border hover:border-[#2d7a50]/40 hover:text-[#2d7a50]'
                      }`}
                    >
                      {s.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {s.is_published ? t('semesters2.published') : t('semesters2.notPublished')}
                    </button>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={()=>openEdit(s)} className="p-1.5 text-[#3a8fd4] hover:bg-[#3a8fd4]/10 rounded-md" title={t('common.edit')}><Edit2 className="w-4 h-4"/></button>
                      <button onClick={()=>handleDelete(s.id)} className="p-1.5 text-[#d45a5a] hover:bg-[#d45a5a]/10 rounded-md" title={t('common.delete')}><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT SEMESTER */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[480px] rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border shrink-0">
              <h2 className="text-lg font-bold text-layout-text">{modal==='add'?t('semesters.addNew'):t('semesters.editData')}</h2>
              <button onClick={()=>{setModal(null);resetForm();}} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
              <div><label className={lbl}>{t('semesters.name')}</label><input required value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className={inp} placeholder="e.g. Ganjil 2025/2026"/></div>
              <div><label className={lbl}>{t('semesters.year')}</label><input required value={formData.year} onChange={e=>setFormData({...formData,year:e.target.value})} className={inp} placeholder="e.g. 2025/2026"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lbl}>{t('semesters.startDate')}</label><input type="date" required value={formData.start_date} onChange={e=>setFormData({...formData,start_date:e.target.value})} className={inp}/></div>
                <div><label className={lbl}>{t('semesters.endDate')}</label><input type="date" required value={formData.end_date} onChange={e=>setFormData({...formData,end_date:e.target.value})} className={inp}/></div>
              </div>
              <div><label className={lbl}>{t("common.status")}</label>
                <div className="flex gap-4">
                  {(['active','inactive'] as const).map(st=>(
                    <label key={st} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="status" checked={formData.status===st} onChange={()=>setFormData({...formData,status:st})} className="w-4 h-4 text-[#2d7a50]"/>
                      <span className="text-sm">{st==='active'?t('common.active'):t('common.inactive')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>{setModal(null);resetForm();}} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg">{t("common.cancel")}</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#3d9968] disabled:opacity-70">{formLoading?t('common.saving'):t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
