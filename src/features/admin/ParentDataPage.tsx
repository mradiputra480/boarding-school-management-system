import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { useLangStore } from '@/stores/langStore';
import { Search, Phone, User as UserIcon, Eye, X, Download } from 'lucide-react';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface ParentData {
  id: number; nisn: string; name: string;
  father_name: string|null; father_wa: string|null;
  mother_name: string|null; mother_wa: string|null;
  guardian_name: string|null; guardian_wa: string|null;
  user: { username: string; is_active: boolean; } | null;
  schoolClass: { id: number; name: string } | null;
  class_id: number | null;
  temp_class: string|null;
}

export default function ParentDataPage() { 
  const { t } = useLangStore();
  const [students, setStudents] = useState<ParentData[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [detail, setDetail] = useState<ParentData|null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [studentsRes, classesRes] = await Promise.all([
          api.get('/admin/students'),
          api.get('/admin/classes')
        ]);
        setStudents(studentsRes.data.data);
        setClasses(classesRes.data.data);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = students.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.nisn.toLowerCase().includes(q) || s.father_name?.toLowerCase().includes(q) || s.mother_name?.toLowerCase().includes(q);
    let matchClass = true;
    if (filterClass === 'unassigned') matchClass = !s.class_id && !s.temp_class;
    else if (filterClass === 'temp_only') matchClass = !s.class_id && !!s.temp_class;
    else if (filterClass !== 'all') matchClass = s.class_id === Number(filterClass);
    return matchSearch && matchClass;
  });

  const handleExportParents = async () => {
    try {
      const r = await api.get('/admin/students/export-parent-accounts', { 
        params: { class_id: filterClass === 'unassigned' || filterClass === 'temp_only' ? '' : filterClass },
        responseType: 'blob' 
      });
      const u = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href = u;
      a.setAttribute('download', 'Akun_OrangTua.xlsx');
      document.body.appendChild(a); a.click(); a.remove();
    } catch { alertDialog(t('common.exportFailed')); }
  };

  const ContactCard = ({label,name,wa}:{label:string;name:string|null;wa:string|null}) => (
    <div className="bg-layout-card border border-layout-border rounded-xl p-4">
      <p className="text-[11px] uppercase tracking-wider text-layout-muted font-semibold mb-2">{label}</p>
      <p className="font-semibold text-layout-text flex items-center gap-1.5"><UserIcon className="w-4 h-4 text-[#2d7a50]"/>{name||'-'}</p>
      {wa && <p className="text-sm text-[#2d7a50] flex items-center gap-1.5 mt-1"><Phone className="w-3.5 h-3.5"/>{wa}</p>}
    </div>
  );

  return (
    <AdminLayout title={t('parents.title')}>
      <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-layout-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-layout-muted absolute left-3 top-1/2 -translate-y-1/2"/>
              <input type="text" placeholder={t('parents.search')} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-layout-bg border border-layout-border rounded-lg text-sm focus:outline-none focus:border-[#2d7a50]"/>
            </div>
            <select value={filterClass} onChange={e=>setFilterClass(e.target.value)} className="w-full sm:w-48 bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]">
              <option value="all">Semua Kelas</option>
              <option value="unassigned">Belum Ada Kelas</option>
              <option value="temp_only">Kelas (Hanya dari Excel)</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button onClick={handleExportParents} className="flex items-center gap-2 bg-layout-card border border-layout-border text-[#2d7a50] px-4 py-2 rounded-lg text-sm font-medium hover:bg-layout-bg transition-colors whitespace-nowrap">
            <Download className="w-4 h-4"/>📥 {t('parents.exportAccounts')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-layout-text">
            <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-[11px] font-semibold tracking-wider">
              <tr><th className="px-6 py-4">{t('parents.studentName')}</th><th className="px-6 py-4">Kelas</th><th className="px-6 py-4">{t('parents.fatherData')}</th><th className="px-6 py-4">{t('parents.motherData')}</th><th className="px-6 py-4">{t('parents.guardianData')}</th><th className="px-6 py-4 text-right">{t("common.actions")}</th></tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8e5]">
              {loading ? <tr><td colSpan={6} className="px-6 py-8 text-center text-layout-muted">{t("common.loading")}</td></tr>
              : filtered.length===0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-layout-muted">{searchQuery?t('common.noResults'):t('common.noData')}</td></tr>
              : filtered.map(s=>(
                <tr key={s.id} className="hover:bg-layout-hover transition-colors">
                  <td className="px-6 py-4"><span className="font-semibold">{s.name}</span><br/><span className="text-xs text-layout-muted">NISN: {s.nisn}</span></td>
                  <td className="px-6 py-4 text-sm">
                    {(s as any).school_class?.name || s.schoolClass?.name ? (
                      <span className="font-semibold text-layout-text">{(s as any).school_class?.name || s.schoolClass?.name}</span>
                    ) : s.temp_class ? (
                      <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-xs font-semibold border border-amber-200">📋 {s.temp_class}</span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Belum ada</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{s.father_name ? <div className="flex flex-col gap-1"><span className="flex items-center gap-1 font-medium"><UserIcon className="w-3.5 h-3.5 text-layout-muted"/>{s.father_name}</span><span className="flex items-center gap-1 text-xs text-[#2d7a50]"><Phone className="w-3.5 h-3.5"/>{s.father_wa||t('parents.noWa')}</span></div> : '-'}</td>
                  <td className="px-6 py-4">{s.mother_name ? <div className="flex flex-col gap-1"><span className="flex items-center gap-1 font-medium"><UserIcon className="w-3.5 h-3.5 text-layout-muted"/>{s.mother_name}</span><span className="flex items-center gap-1 text-xs text-[#2d7a50]"><Phone className="w-3.5 h-3.5"/>{s.mother_wa||t('parents.noWa')}</span></div> : '-'}</td>
                  <td className="px-6 py-4">{s.guardian_name ? <div className="flex flex-col gap-1"><span className="flex items-center gap-1 font-medium"><UserIcon className="w-3.5 h-3.5 text-layout-muted"/>{s.guardian_name}</span><span className="flex items-center gap-1 text-xs text-[#2d7a50]"><Phone className="w-3.5 h-3.5"/>{s.guardian_wa||t('parents.noWa')}</span></div> : '-'}</td>
                  <td className="px-6 py-4 text-right"><button onClick={()=>setDetail(s)} className="p-1.5 text-[#2d7a50] hover:bg-[#2d7a50]/10 rounded-md" title="Detail"><Eye className="w-4 h-4"/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL ORANG TUA MODAL */}
      {detail && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[520px] rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border">
              <h2 className="text-lg font-bold text-layout-text">{t('parents.detailTitle')}</h2>
              <button onClick={()=>setDetail(null)} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Data Anak */}
              <div className="bg-[#2d7a50]/10 border border-[#2d7a50]/20 rounded-xl p-4">
                <p className="text-[11px] uppercase tracking-wider text-[#2d7a50] font-semibold mb-2">👶 {t('parents.childData')}</p>
                <p className="font-bold text-layout-text text-lg">{detail.name}</p>
                <p className="text-sm text-layout-muted">NISN: {detail.nisn}</p>
              </div>

              {/* Kontak Parent */}
              <div className="grid grid-cols-2 gap-3">
                <ContactCard label={t('parents.father')} name={detail.father_name} wa={detail.father_wa}/>
                <ContactCard label={t('parents.mother')} name={detail.mother_name} wa={detail.mother_wa}/>
              </div>
              {detail.guardian_name && <ContactCard label={t('parents.guardian')} name={detail.guardian_name} wa={detail.guardian_wa}/>}

              {/* Akun Portal */}
              <div className="bg-layout-card border border-layout-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] uppercase tracking-wider text-layout-muted font-semibold">🔑 {t('parents.portalAccount')}</p>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${detail.user?.is_active ? 'bg-[#2d7a50]/10 text-[#2d7a50]' : 'bg-red-50 text-red-500'}`}>{detail.user?.is_active ? t('common.active') : t('common.inactive')}</span>
                </div>
                <p className="text-sm"><span className="text-layout-muted">Username:</span> <span className="font-mono font-semibold text-[#3a8fd4]">{detail.user?.username || detail.nisn}</span></p>
                <p className="text-sm"><span className="text-layout-muted">Password:</span> <span className="font-mono">parents123</span></p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-layout-border flex justify-end">
              <button onClick={()=>setDetail(null)} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#1b6b43]">{t("common.close")}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
