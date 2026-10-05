import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { useLangStore } from '@/stores/langStore';
import { Search, KeyRound, Ban, CheckCircle2, Plus, X, Shield } from 'lucide-react';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface Account {
  id: number; name: string; username: string;
  role: 'admin'|'teacher'|'homeroom'|'parent';
  is_active: boolean;
}

const inp = "w-full bg-layout-card border border-[#bfc9bf] rounded-lg px-3 py-2.5 text-[14px] text-layout-text focus:outline-none focus:border-[#096139] focus:ring-1 focus:ring-[#096139]";
const lbl = "block text-[12px] font-semibold tracking-wider text-layout-text mb-1.5 uppercase";

export default function AccountPage() { 
  const { t } = useLangStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [formData, setFormData] = useState({name:'',username:'',password:''});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  const fetch = async () => { try { const r=await api.get('/admin/accounts'); setAccounts(r.data.data); } catch{} finally{setLoading(false);} };
  useEffect(()=>{fetch();},[]);

  const handleToggleStatus = async (acc: Account) => {
    if(acc.id===1) { alertDialog('⚠️ Akun admin utama tidak dapat diubah.'); return; }
    if(!(await confirmDialog(`${acc.is_active?'Inactivekan':'Activekan'} akun ${acc.name}?`, 'Konfirmasi', false))) return;
    try { await api.post(`/admin/accounts/${acc.id}/toggle`); fetch(); } catch(e:any){ alertDialog(e.response?.data?.message||'Gagal'); }
  };

  const handleResetPassword = async (acc: Account) => {
    if(acc.id===1) { alertDialog('⚠️ Akun admin utama tidak dapat diubah.'); return; }
    const defaultPass = acc.role==='teacher'?'guru1236':acc.role==='parent'?'parents123':'admin123';
    const newPass = await promptDialog(`Reset password untuk ${acc.name}?\nPassword baru (min 6 karakter):`, defaultPass);
    if(!newPass||newPass.length<6) return;
    try { await api.post(`/admin/accounts/${acc.id}/reset-password`,{password:newPass}); alertDialog('✅ Password berhasil direset!'); } catch(e:any){ alertDialog(e.response?.data?.message||'Gagal'); }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true); setError('');
    try {
      await api.post('/admin/accounts', formData);
      alertDialog('✅ Akun administrator baru berhasil dibuat!');
      setAddModal(false); setFormData({name:'',username:'',password:''}); fetch();
    } catch(err:any) { setError(err.response?.data?.message||'Gagal membuat akun'); }
    finally { setFormLoading(false); }
  };

  const roleColors: Record<string,string> = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    teacher: 'bg-blue-100 text-blue-700 border-blue-200',
    homeroom: 'bg-amber-100 text-amber-700 border-amber-200',
    parent: 'bg-green-100 text-green-700 border-green-200',
  };

  const roleLabels: Record<string,string> = {
    admin: 'Administrator', teacher: t('accounts.teacher'), homeroom: t('accounts.homeroom'), parent: t('accounts.parent'),
  };

  const filtered = accounts.filter(a => {
    const q = searchQuery.toLowerCase();
    return !q || a.name.toLowerCase().includes(q) || a.username.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
  });

  return (
    <AdminLayout title={t('accounts.title')}>
      <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-layout-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-layout-muted absolute left-3 top-1/2 -translate-y-1/2"/>
            <input type="text" placeholder={t('accounts.search')} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-layout-bg border border-layout-border rounded-lg text-sm focus:outline-none focus:border-[#2d7a50]"/>
          </div>
          <button onClick={()=>setAddModal(true)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
            <Plus className="w-4 h-4"/>{t('accounts.add')}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-layout-text">
            <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[11px] font-semibold tracking-wider">
              <tr><th className="px-6 py-4">{t("common.fullName")}</th><th className="px-6 py-4">{t("common.username")}</th><th className="px-6 py-4">{t("common.role")}</th><th className="px-6 py-4">{t("common.status")}</th><th className="px-6 py-4 text-right">{t("common.actions")}</th></tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8e5]">
              {loading ? <tr><td colSpan={5} className="px-6 py-8 text-center text-layout-muted">{t("common.loading")}</td></tr>
              : filtered.length===0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-layout-muted">{searchQuery?t('common.noResults'):t('accounts.noData')}</td></tr>
              : filtered.map(acc=>(
                <tr key={acc.id} className={`hover:bg-layout-hover transition-colors ${acc.id===1?'bg-purple-50/50':''}`}>
                  <td className="px-6 py-4 font-medium flex items-center gap-2">
                    {acc.id===1 && <Shield className="w-4 h-4 text-purple-500" title="Admin Utama"/>}
                    {acc.name}
                  </td>
                  <td className="px-6 py-4 font-mono text-[#3a8fd4] text-xs">{acc.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${roleColors[acc.role]||'bg-layout-bg text-layout-muted border-layout-border'}`}>
                      {roleLabels[acc.role]||acc.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {acc.is_active
                      ? <span className="flex items-center gap-1.5 text-[#2d7a50] text-xs font-semibold"><CheckCircle2 className="w-4 h-4"/>{t('common.active')}</span>
                      : <span className="flex items-center gap-1.5 text-[#d45a5a] text-xs font-semibold"><Ban className="w-4 h-4"/>{t('common.inactive')}</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {acc.id === 1 ? (
                      <span className="text-xs text-purple-400 italic">Dilindungi</span>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={()=>handleResetPassword(acc)} className="px-2 py-1.5 text-xs font-medium text-[#d4a23a] bg-[#d4a23a]/10 hover:bg-[#d4a23a]/20 rounded-md transition-colors flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5"/>Reset Pass
                        </button>
                        <button onClick={()=>handleToggleStatus(acc)} className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${acc.is_active?'text-layout-muted bg-layout-bg hover:bg-gray-200':'text-[#2d7a50] bg-[#2d7a50]/10 hover:bg-[#d4f0e0]'}`}>
                          {acc.is_active ? <><Ban className="w-3.5 h-3.5"/>Suspend</> : <><CheckCircle2 className="w-3.5 h-3.5"/>Activekan</>}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH ADMIN */}
      {addModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[440px] rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border">
              <h2 className="text-lg font-bold text-layout-text flex items-center gap-2"><Shield className="w-5 h-5 text-purple-500"/>Add Administrator</h2>
              <button onClick={()=>{setAddModal(false);setError('');}} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
              <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-700">
                <p>⚠️ Akun ini akan memiliki akses <strong>penuh</strong> ke seluruh sistem IIS COMMUNITY CONNECT termasuk data guru, siswa, nilai, dan pengaturan.</p>
              </div>
              <div><label className={lbl}>{t("common.fullName")}</label><input required value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className={inp} placeholder="cth: Waka Kurikulum"/></div>
              <div><label className={lbl}>{t("common.username")}</label><input required value={formData.username} onChange={e=>setFormData({...formData,username:e.target.value.toLowerCase().replace(/\s/g,'')})} className={inp} placeholder="cth: admin.kurikulum"/></div>
              <div><label className={lbl}>Password</label><input required type="password" value={formData.password} onChange={e=>setFormData({...formData,password:e.target.value})} className={inp} placeholder="Minimal 6 karakter" minLength={6}/></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>{setAddModal(false);setError('');}} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg">{t("common.cancel")}</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-70">{formLoading?'Membuat...':'Buat Akun Admin'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
