import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { useLangStore } from '@/stores/langStore';
import { Search, Plus, Pencil, Trash2, X, Briefcase } from 'lucide-react';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface Subject { id: number; name: string; type: 'struktural'; teacher_count: number; }

const inp = "w-full bg-layout-card border border-[#bfc9bf] rounded-lg px-3 py-2.5 text-[14px] text-layout-text focus:outline-none focus:border-[#096139] focus:ring-1 focus:ring-[#096139] transition-all";
const lbl = "block text-[12px] font-semibold tracking-wider text-layout-text mb-1.5 uppercase";

export default function PositionPage() { 
  const { t } = useLangStore();
  const [positions, setPositions] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null|'add'|'edit'>(null);
  const [current, setCurrent] = useState<Subject|null>(null);
  const [formData, setFormData] = useState<{name:string,type:'struktural'}>({name:'',type:'struktural'});
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<number[]>([]);

  const fetch = async () => { try { const r=await api.get('/admin/subjects?type=struktural'); setPositions(r.data.data); } catch{} finally{setLoading(false);} };
  useEffect(()=>{fetch();},[]);

  const filtered = positions.filter(s => {
    const q = searchQuery.toLowerCase();
    return !q || s.name.toLowerCase().includes(q);
  });

  const openAdd = () => { setFormData({name:'',type:'struktural'}); setCurrent(null); setModal('add'); };
  const openEdit = (s: Subject) => { setFormData({name:s.name,type:'struktural'}); setCurrent(s); setModal('edit'); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true);
    try {
      if(modal==='add') await api.post('/admin/subjects', formData);
      else if(current) await api.put(`/admin/subjects/${current.id}`, formData);
      setModal(null); fetch();
    } catch(err:any) { alertDialog(err.response?.data?.message || 'Gagal menyimpan'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if(!(await confirmDialog('Yakin hapus data ini?', 'Konfirmasi', true))) return;
    try { await api.delete(`/admin/subjects/${id}`); fetch(); } catch { alertDialog('Gagal menghapus'); }
  };

  const handleBulkDelete = async () => {
    if(!(await confirmDialog(`Yakin hapus ${selected.length} data yang dipilih?`, 'Konfirmasi', true))) return;
    try { await api.post('/admin/subjects/bulk-delete',{ids:selected}); setSelected([]); fetch(); } catch{ alertDialog('Gagal menghapus'); }
  };

  return (
    <AdminLayout title="Data Jabatan Guru">
      {/* Info Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 rounded-xl p-5 mb-6 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <Briefcase className="w-5 h-5 text-amber-600"/>
        </div>
        <div>
          <h3 className="font-bold text-amber-800 text-sm mb-1">Manajemen Jabatan Struktural</h3>
          <p className="text-sm text-amber-700">
            Jabatan struktural seperti "Homeroom", "Kepala Divisi", atau "Guru BP/BK" ditambahkan di sini. Jabatan ini tidak membutuhkan KKM dan digunakan murni untuk label penugasan guru di sistem.
          </p>
        </div>
      </div>

      <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-layout-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-layout-muted absolute left-3 top-1/2 -translate-y-1/2"/>
            <input type="text" placeholder="Cari nama jabatan..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-layout-bg border border-layout-border rounded-lg text-sm focus:outline-none focus:border-[#2d7a50]"/>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-[#2d7a50] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#3d9968] transition-colors">
            <Plus className="w-4 h-4"/>Tambah Jabatan Baru
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-layout-text">
            <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-4 w-10"><input type="checkbox" checked={filtered.length>0&&selected.length===filtered.length} onChange={e=>{if(e.target.checked)setSelected(filtered.map(s=>s.id));else setSelected([])}} className="w-4 h-4 rounded border-layout-border text-[#2d7a50] focus:ring-[#2d7a50]"/></th>
                <th className="px-4 py-4 w-12">#</th>
                <th className="px-4 py-4">Nama Jabatan</th>
                <th className="px-4 py-4 text-center">Jumlah Penugasan</th>
                <th className="px-4 py-4 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8e5]">
              {loading ? <tr><td colSpan={5} className="px-6 py-8 text-center text-layout-muted">{t("common.loading")}</td></tr>
              : filtered.length===0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-layout-muted">{searchQuery?t('common.noResults'):'Belum ada data jabatan.'}</td></tr>
              : filtered.map((s,i)=>(
                <tr key={s.id} className={`hover:bg-layout-hover transition-colors ${selected.includes(s.id)?'bg-[#2d7a50]/10':''}`}>
                  <td className="px-4 py-4"><input type="checkbox" checked={selected.includes(s.id)} onChange={e=>{if(e.target.checked)setSelected([...selected,s.id]);else setSelected(selected.filter(id=>id!==s.id))}} className="w-4 h-4 rounded border-layout-border text-[#2d7a50] focus:ring-[#2d7a50]"/></td>
                  <td className="px-4 py-4 text-layout-muted">{i+1}</td>
                  <td className="px-4 py-4 font-medium">{s.name}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="bg-layout-bg border border-layout-border px-3 py-1 rounded-full text-xs font-semibold">{s.teacher_count} Guru</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={()=>openEdit(s)} className="p-1.5 text-[#d4a23a] hover:bg-[#d4a23a]/10 rounded-md" title={t('common.edit')}><Pencil className="w-4 h-4"/></button>
                      <button onClick={()=>handleDelete(s.id)} className="p-1.5 text-[#d45a5a] hover:bg-[#d45a5a]/10 rounded-md" title="Hapus"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:ml-32 bg-[#1a2e24] text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 z-40">
          <span className="text-sm font-medium">{selected.length} dipilih</span>
          <button onClick={handleBulkDelete} className="bg-[#d45a5a] hover:bg-[#c04040] text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"><Trash2 className="w-4 h-4"/>Hapus</button>
          <button onClick={()=>setSelected([])} className="text-white/60 hover:text-white text-sm">{t("common.cancel")}</button>
        </div>
      )}

      {/* Modal Form */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[440px] rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border">
              <h2 className="text-lg font-bold text-layout-text">{modal==='add'?'Tambah Jabatan Baru':'Edit Jabatan'}</h2>
              <button onClick={()=>setModal(null)} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className={lbl}>Nama Jabatan</label>
                <input required value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className={inp} placeholder="cth: Homeroom"/>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>setModal(null)} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg">{t("common.cancel")}</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#3d9968] disabled:opacity-70">{formLoading?t('common.saving'):t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
