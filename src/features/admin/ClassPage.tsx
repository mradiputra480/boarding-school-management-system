import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { useLangStore } from '@/stores/langStore';
import { Search, Plus, Pencil, Trash2, X, Users, Eye, Download, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface Teacher { id: number; name: string; }
interface Semester { id: number; name: string; is_active?: boolean; }
interface Student { id: number; nisn: string; nis: string|null; name: string; gender: string; }
interface ClassItem {
  id: number; name: string; level: string; status: string; semester: string; semester_id: number;
  homeroom_teacher_id: number|null; homeroom_teacher: {id:number;name:string}|null; students_count: number;
  graduation_announced?: boolean;
  grad_stats?: { lulus: number; tidak_lulus: number; ditahan: number; belum_diumumkan: number };
}

const inp = "w-full bg-layout-card border border-[#bfc9bf] rounded-lg px-3 py-2.5 text-[14px] text-layout-text focus:outline-none focus:border-[#096139] focus:ring-1 focus:ring-[#096139] transition-all";
const lbl = "block text-[12px] font-semibold tracking-wider text-layout-text mb-1.5 uppercase";

export default function ClassPage() { 
  const { t } = useLangStore();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [globalAnalytics, setGlobalAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semesterId, setSemesterId] = useState<number|''>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form modal
  const [modal, setModal] = useState<null|'add'|'edit'>(null);
  const [current, setCurrent] = useState<ClassItem|null>(null);
  const [formData, setFormData] = useState({name:'',level:'7',semester_id:'',homeroom_teacher_id:'',status:'active'});
  const [formLoading, setFormLoading] = useState(false);

  const navigate = useNavigate();

  const fetchClasses = async (sid?: number|'') => {
    setLoading(true);
    try {
      const useSid = sid !== undefined ? sid : semesterId;
      const params: any = {};
      if(useSid) params.semester_id = useSid;
      const r = await api.get('/admin/classes', {params});
      setClasses(r.data.data);
      if (useSid) {
        api.get('/admin/classes-analytics', { params: { semester_id: useSid } }).then(res => setGlobalAnalytics(res.data.data)).catch(()=>{});
      }
    } catch{} finally { setLoading(false); }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [t, s] = await Promise.all([api.get('/admin/teachers'), api.get('/admin/semesters')]);
        setTeachers(t.data.data.map((x:any) => ({id:x.id, name:x.name})));
        const sems = s.data.data;
        setSemesters(sems);
        const active = sems.find((x:any) => x.is_active);
        const activeSid = active ? active.id : (sems.length > 0 ? sems[0].id : '');
        setSemesterId(activeSid);
        await fetchClasses(activeSid);
      } catch { setLoading(false); }
    };
    init();
  }, []);

  const filtered = classes.filter(c => {
    const q = searchQuery.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.homeroom_teacher?.name.toLowerCase().includes(q);
  });

  const openAdd = () => {
    setFormData({name:'',level:'7',semester_id:String(semesterId||''),homeroom_teacher_id:'',status:'active'});
    setCurrent(null); setModal('add');
  };
  const openEdit = (c: ClassItem) => {
    setFormData({name:c.name,level:c.level,semester_id:String(c.semester_id),homeroom_teacher_id:String(c.homeroom_teacher_id||''),status:c.status});
    setCurrent(c); setModal('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true);
    const payload = {...formData, semester_id: Number(formData.semester_id), homeroom_teacher_id: formData.homeroom_teacher_id ? Number(formData.homeroom_teacher_id) : null};
    try {
      if(modal==='add') await api.post('/admin/classes', payload);
      else if(current) await api.put(`/admin/classes/${current.id}`, payload);
      setModal(null); fetchClasses();
    } catch(err:any) { alertDialog(err.response?.data?.message || 'Gagal menyimpan'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if(!(await confirmDialog('Yakin hapus kelas ini? Semua siswa akan di-unassign.', 'Konfirmasi', true))) return;
    try { await api.delete(`/admin/classes/${id}`); fetchClasses(); } catch { alertDialog('Gagal menghapus'); }
  };

  // Navigation to Detail
  const openDetail = (c: ClassItem) => {
    navigate(`/admin/classes/${c.id}`);
  };

  const handleExportParent = async (c: ClassItem) => {
    try {
      const r = await api.get(`/admin/classes/${c.id}/export-parent-accounts`, {responseType:'blob'});
      const u = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href=u; a.setAttribute('download',`Akun_Ortu_${c.name.replace(/\s/g,'_')}.csv`);
      document.body.appendChild(a); a.click(); a.remove();
    } catch { alertDialog('Gagal export'); }
  };

  const topGradeClass = globalAnalytics.length > 0 ? [...globalAnalytics].sort((a,b) => b.average_grade - a.average_grade)[0] : null;
  const topDisciplineClass = globalAnalytics.length > 0 ? [...globalAnalytics].sort((a,b) => b.average_discipline - a.average_discipline)[0] : null;
  const topAchievementClass = globalAnalytics.length > 0 ? [...globalAnalytics].sort((a,b) => b.total_achievements - a.total_achievements)[0] : null;
  const topAttendanceClass = globalAnalytics.length > 0 ? [...globalAnalytics].sort((a,b) => b.average_attendance - a.average_attendance)[0] : null;

  return (
    <AdminLayout title={t('classes.management')}>
      {/* Global Analytics */}
      {globalAnalytics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-layout-card border border-layout-border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#3a8fd4]/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-[#3a8fd4]" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-layout-muted">Juara Akademik</p>
                <h3 className="text-sm font-bold text-layout-text truncate max-w-[120px]">{topGradeClass.name}</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-[#3a8fd4]">{topGradeClass.average_grade}</p>
              <p className="text-[10px] text-layout-muted">Rata-rata</p>
            </div>
          </div>
          <div className="bg-layout-card border border-layout-border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#2d7a50]/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-[#2d7a50]" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-layout-muted">Juara Disiplin</p>
                <h3 className="text-sm font-bold text-layout-text truncate max-w-[120px]">{topDisciplineClass.name}</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-[#2d7a50]">{topDisciplineClass.average_discipline}</p>
              <p className="text-[10px] text-layout-muted">Rata-rata</p>
            </div>
          </div>
          <div className="bg-layout-card border border-layout-border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#d4a23a]/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-[#d4a23a]" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-layout-muted">Juara Prestasi</p>
                <h3 className="text-sm font-bold text-layout-text truncate max-w-[120px]">{topAchievementClass.name}</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-[#d4a23a]">{topAchievementClass.total_achievements}</p>
              <p className="text-[10px] text-layout-muted">Prestasi</p>
            </div>
          </div>
          <div className="bg-layout-card border border-layout-border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-[#8b5cf6]" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-layout-muted">Kehadiran Terbaik</p>
                <h3 className="text-sm font-bold text-layout-text truncate max-w-[120px]">{topAttendanceClass.name}</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-[#8b5cf6]">{topAttendanceClass.average_attendance}%</p>
              <p className="text-[10px] text-layout-muted">Kehadiran</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <select value={semesterId} onChange={e=>{const v=Number(e.target.value);setSemesterId(v);fetchClasses(v);}} className="bg-layout-card border border-layout-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#2d7a50] min-w-[200px]">
          {semesters.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-layout-muted absolute left-3 top-1/2 -translate-y-1/2"/>
          <input type="text" placeholder={t('classes.search')} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-layout-card border border-layout-border rounded-lg text-sm focus:outline-none focus:border-[#2d7a50]"/>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#2d7a50] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#3d9968] transition-colors ml-auto">
          <Plus className="w-4 h-4"/>{t('classes.create')}</button>
      </div>

      {/* Class Cards Grid */}
      {loading ? <div className="flex items-center justify-center h-40 text-layout-muted">{t("common.loading")}</div>
      : filtered.length===0 ? <div className="flex items-center justify-center h-40 text-layout-muted">{searchQuery?t('common.noResults'):'Belum ada kelas di semester ini.'}</div>
      : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(c=>(
            <div key={c.id} className="bg-layout-card border border-layout-border rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-2xl font-bold text-layout-text">{c.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${c.status==='active'?'bg-[#2d7a50]/10 text-[#2d7a50] border-[#2d7a50]/20':'bg-amber-50 text-amber-600 border-amber-200'}`}>
                    {c.status==='active'?t('common.active'):'Draft'}
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#2d7a50]/10 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-[#2d7a50]"/>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-layout-muted font-semibold">{t('accounts.homeroom')}</p>
                      <p className="text-sm font-medium text-layout-text">{c.homeroom_teacher?.name || <em className="text-layout-muted font-normal">Belum di set</em>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#3a8fd4]/10 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-[#3a8fd4]"/>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-layout-muted font-semibold">Siswa</p>
                      <p className="text-sm font-medium text-layout-text">{c.students_count} Siswa</p>
                    </div>
                  </div>
                  {(c.level === 'IX' || c.level === '9') && c.grad_stats && (
                    <div className="pt-2 mt-2 border-t border-layout-border border-dashed">
                      <p className="text-[10px] uppercase tracking-wider text-[#d4a23a] font-bold mb-1.5 flex items-center gap-1">
                        <Award className="w-3 h-3" /> Info Kelulusan
                      </p>
                      <div className="flex items-center gap-2 text-xs font-bold">
                        {c.graduation_announced ? (
                          <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Lulus: {c.grad_stats.lulus}</span>
                        ) : (
                          <span className="text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">Belum Diumumkan: {c.grad_stats.belum_diumumkan}</span>
                        )}
                        {c.grad_stats.tidak_lulus > 0 && <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Tdk Lulus: {c.grad_stats.tidak_lulus}</span>}
                        {c.grad_stats.ditahan > 0 && <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Ditahan: {c.grad_stats.ditahan}</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-layout-border px-5 py-3 flex items-center gap-3 bg-layout-bg/50">
                <button onClick={()=>openDetail(c)} className="flex items-center gap-1 text-xs font-semibold text-[#2d7a50] hover:text-[#1b5e3a] transition-colors">
                  <Eye className="w-3.5 h-3.5"/>Detail Kelas
                </button>
                <button onClick={()=>openEdit(c)} className="flex items-center gap-1 text-xs font-semibold text-layout-muted hover:text-layout-text transition-colors">
                  <Pencil className="w-3.5 h-3.5"/>{t('common.edit')}</button>
                <button onClick={()=>handleExportParent(c)} className="flex items-center gap-1 text-xs font-semibold text-[#3a8fd4] hover:text-[#2d6ab0] transition-colors ml-auto" title="Export akun ortu">
                  <Download className="w-3.5 h-3.5"/>
                </button>
                <button onClick={()=>handleDelete(c.id)} className="text-[#d45a5a] hover:text-[#c04040] transition-colors" title="Hapus">
                  <Trash2 className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL BUAT/EDIT KELAS */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[480px] rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border">
              <h2 className="text-lg font-bold text-layout-text">{modal==='add'?'Buat Kelas Baru':'Edit Kelas'}</h2>
              <button onClick={()=>setModal(null)} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Nama Kelas</label>
                  <input required value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className={inp} placeholder="cth: 7A"/>
                </div>
                <div>
                  <label className={lbl}>{t('classes.grade')}</label>
                  <select value={formData.level} onChange={e=>setFormData({...formData,level:e.target.value})} className={inp}>
                    <option value="7">Kelas 7</option>
                    <option value="8">Kelas 8</option>
                    <option value="9">Kelas 9</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={lbl}>Semester</label>
                <select required value={formData.semester_id} onChange={e=>setFormData({...formData,semester_id:e.target.value})} className={inp}>
                  <option value="">Pilih semester</option>
                  {semesters.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>{t('accounts.homeroom')}</label>
                <select value={formData.homeroom_teacher_id} onChange={e=>setFormData({...formData,homeroom_teacher_id:e.target.value})} className={inp}>
                  <option value="">Belum ditentukan</option>
                  {teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>{t("common.status")}</label>
                <select value={formData.status} onChange={e=>setFormData({...formData,status:e.target.value})} className={inp}>
                  <option value="active">{t('common.active')}</option>
                  <option value="inactive">Draft / Inactive</option>
                </select>
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
