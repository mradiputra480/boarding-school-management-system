import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { useLangStore } from '@/stores/langStore';
import { Search, Plus, Pencil, Trash2, X, BookOpen } from 'lucide-react';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface Subject { id: number; name: string; type: 'mapel'; group?: 'A'|'B'|'C'; kkm?: number; teacher_count: number; }

const inp = "w-full bg-layout-card border border-[#bfc9bf] rounded-lg px-3 py-2.5 text-[14px] text-layout-text focus:outline-none focus:border-[#096139] focus:ring-1 focus:ring-[#096139] transition-all";
const lbl = "block text-[12px] font-semibold tracking-wider text-layout-text mb-1.5 uppercase";

export default function SubjectPage() { 
  const { t } = useLangStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null|'add'|'edit'>(null);
  const [current, setCurrent] = useState<Subject|null>(null);
  const [formData, setFormData] = useState<{name:string,type:'mapel',group?:'A'|'B'|'C',kkm?:number}>({name:'',type:'mapel',group:'A',kkm:75});
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [minActiveNa, setMinActiveNa] = useState(1);
  const [defaultKkm, setDefaultKkm] = useState(83);
  const [allowBelowKkm, setAllowBelowKkm] = useState(false);
  const [savingMinNa, setSavingMinNa] = useState(false);

  const fetch = async () => { try { const r=await api.get('/admin/subjects?type=mapel'); setSubjects(r.data.data); } catch{} finally{setLoading(false);} };
  const fetchProfile = async () => { try { const r=await api.get('/admin/school-profile'); setMinActiveNa(r.data.data.min_active_na || 1); setDefaultKkm(r.data.data.default_kkm || 83); setAllowBelowKkm(r.data.data.allow_below_kkm || false); } catch{} };
  useEffect(()=>{fetch(); fetchProfile();},[]);

  const filtered = subjects.filter(s => {
    const q = searchQuery.toLowerCase();
    return !q || s.name.toLowerCase().includes(q);
  });

  const openAdd = () => { setFormData({name:'',type:'mapel',group:'A',kkm:defaultKkm}); setCurrent(null); setModal('add'); };
  const openEdit = (s: Subject) => { setFormData({name:s.name,type:'mapel',group:s.group||'A',kkm:s.kkm||defaultKkm}); setCurrent(s); setModal('edit'); };

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

  const handleSaveMinNa = async () => {
    setSavingMinNa(true);
    try {
      await api.post('/admin/school-profile/curriculum', { min_active_na: minActiveNa, default_kkm: defaultKkm, allow_below_kkm: allowBelowKkm });
      alertDialog('Target Kurikulum berhasil disimpan!');
    } catch(err:any) {
      alertDialog(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSavingMinNa(false);
    }
  };

  return (
    <AdminLayout title="Daftar Mata Pelajaran">
      {/* Target Kurikulum Banner */}
      <div className="bg-[#2d7a50]/10 border-l-4 border-[#2d7a50] rounded-xl p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2d7a50]/10 flex items-center justify-center shrink-0 mt-0.5">
            <BookOpen className="w-5 h-5 text-[#2d7a50]"/>
          </div>
          <div>
            <h3 className="font-bold text-layout-text text-sm mb-1">Target Kurikulum Global</h3>
            <p className="text-sm text-layout-text">
              Tentukan Default KKM dan batas minimal jumlah NA aktif per mapel untuk seluruh sekolah.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 mt-4 md:mt-0">
          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap items-center gap-3 justify-end">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-layout-text whitespace-nowrap">KKM Minimum:</label>
                <input type="number" min="0" max="100" value={defaultKkm} onChange={e=>setDefaultKkm(Number(e.target.value))} className="w-16 px-2 py-1 border border-layout-border rounded bg-layout-bg focus:border-[#2d7a50] focus:ring-1 focus:ring-[#2d7a50] text-sm text-center font-bold" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-layout-text whitespace-nowrap">Minimal NA:</label>
                <input type="number" min="1" max="10" value={minActiveNa} onChange={e=>setMinActiveNa(Number(e.target.value))} className="w-16 px-2 py-1 border border-layout-border rounded bg-layout-bg focus:border-[#2d7a50] focus:ring-1 focus:ring-[#2d7a50] text-sm text-center font-bold" />
              </div>
            </div>
            
            <label className="flex items-center justify-end gap-3 cursor-pointer group">
              <span className="text-[11px] font-semibold text-layout-muted group-hover:text-layout-text transition-colors">Izinkan Simpan Nilai di Bawah KKM</span>
              <div className="relative shrink-0">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={allowBelowKkm}
                  onChange={(e) => setAllowBelowKkm(e.target.checked)}
                />
                <div className={`block w-9 h-5 rounded-full transition-colors ${allowBelowKkm ? 'bg-[#2d7a50]' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className={`dot absolute left-[2px] top-[2px] bg-white w-4 h-4 rounded-full transition-transform ${allowBelowKkm ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
          
          <button onClick={handleSaveMinNa} disabled={savingMinNa} className="bg-[#2d7a50] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#3d9968] disabled:opacity-70 transition-colors shadow-sm ml-2 shrink-0">
            {savingMinNa ? 'Menyimpan...' : 'Simpan Target'}
          </button>
        </div>
      </div>

      <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-layout-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-layout-muted absolute left-3 top-1/2 -translate-y-1/2"/>
            <input type="text" placeholder="Cari nama mapel..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-layout-bg border border-layout-border rounded-lg text-sm focus:outline-none focus:border-[#2d7a50]"/>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-[#2d7a50] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#3d9968] transition-colors">
            <Plus className="w-4 h-4"/>Tambah Mapel Baru
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-layout-text">
            <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-4 w-10"><input type="checkbox" checked={filtered.length>0&&selected.length===filtered.length} onChange={e=>{if(e.target.checked)setSelected(filtered.map(s=>s.id));else setSelected([])}} className="w-4 h-4 rounded border-layout-border text-[#2d7a50] focus:ring-[#2d7a50]"/></th>
                <th className="px-4 py-4 w-12">#</th>
                <th className="px-4 py-4">Nama Mapel</th>
                <th className="px-4 py-4 text-center">KKM</th>
                <th className="px-4 py-4 text-center">Jumlah Guru</th>
                <th className="px-4 py-4 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8e5]">
              {loading ? <tr><td colSpan={6} className="px-6 py-8 text-center text-layout-muted">{t("common.loading")}</td></tr>
              : filtered.length===0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-layout-muted">{searchQuery?t('common.noResults'):'Belum ada data mapel.'}</td></tr>
              : filtered.map((s,i)=>(
                <tr key={s.id} className={`hover:bg-layout-hover transition-colors ${selected.includes(s.id)?'bg-[#2d7a50]/10':''}`}>
                  <td className="px-4 py-4"><input type="checkbox" checked={selected.includes(s.id)} onChange={e=>{if(e.target.checked)setSelected([...selected,s.id]);else setSelected(selected.filter(id=>id!==s.id))}} className="w-4 h-4 rounded border-layout-border text-[#2d7a50] focus:ring-[#2d7a50]"/></td>
                  <td className="px-4 py-4 text-layout-muted">{i+1}</td>
                  <td className="px-4 py-4 font-medium">{s.name}</td>
                  <td className="px-4 py-4 text-center font-bold text-layout-text">
                    {s.kkm}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="bg-layout-bg border border-layout-border px-3 py-1 rounded-full text-xs font-semibold">{s.teacher_count}</span>
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
              <h2 className="text-lg font-bold text-layout-text">{modal==='add'?'Tambah Mapel Baru':'Edit Mapel'}</h2>
              <button onClick={()=>setModal(null)} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className={lbl}>Nama Mapel</label>
                <input required value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className={inp} placeholder="cth: Matematika Dasar"/>
              </div>
              <div className="flex gap-4">
                <div className="w-full">
                  <label className={lbl}>Nilai KKM</label>
                  <input type="number" min="0" max="100" value={formData.kkm} onChange={e=>setFormData({...formData,kkm:Number(e.target.value)})} className={inp} />
                </div>
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
