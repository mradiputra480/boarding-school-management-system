import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { useLangStore } from '@/stores/langStore';
import { useSchoolStore } from '@/stores/schoolStore';
import { X, Plus, Pencil, Trash2, CalendarDays, Clock, Printer, Settings2 } from 'lucide-react';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface ClassItem { id: number; name: string; level: string; homeroom_teacher?: { name: string }; }
interface Semester { id: number; name: string; is_active?: boolean; }
interface Subject { id: number; name: string; type: string; }
interface Teacher { id: number; name: string; }
interface ScheduleItem {
  id: number; class_id: number; subject_id: number; teacher_id: number; semester_id: number;
  day: string; start_time: string; end_time: string;
  subject: { id: number; name: string; type: string } | null;
  teacher: { id: number; name: string } | null;
}
interface TimeSlot { label: string; start: string; end: string; type: 'lesson'|'break'; }
interface TimePreset { id: number; name: string; slots: TimeSlot[]; days: string[]|null; is_default: boolean; }

const DAYS = ['senin','selasa','rabu','kamis','jumat','sabtu'] as const;

const COLORS = [
  'bg-[#2d7a50]/15 text-[#2d7a50] border-[#2d7a50]/25',
  'bg-[#3a8fd4]/15 text-[#3a8fd4] border-[#3a8fd4]/25',
  'bg-[#d4a23a]/15 text-[#d4a23a] border-[#d4a23a]/25',
  'bg-[#d45a5a]/15 text-[#d45a5a] border-[#d45a5a]/25',
  'bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/25',
  'bg-[#06b6d4]/15 text-[#06b6d4] border-[#06b6d4]/25',
  'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/25',
  'bg-[#ec4899]/15 text-[#ec4899] border-[#ec4899]/25',
];

const inp = "w-full bg-layout-card border border-[#bfc9bf] rounded-lg px-3 py-2.5 text-[14px] text-layout-text focus:outline-none focus:border-[#096139] focus:ring-1 focus:ring-[#096139] transition-all";
const lbl = "block text-[12px] font-semibold tracking-wider text-layout-text mb-1.5 uppercase";

export default function SchedulePage() {
  const { t } = useLangStore();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [classId, setClassId] = useState<number|''>('');
  const [semesterId, setSemesterId] = useState<number|''>('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<'add'|'edit'|null>(null);
  const [editItem, setEditItem] = useState<ScheduleItem|null>(null);
  const [formData, setFormData] = useState({ subject_id: '', teacher_id: '', day: '', start_time: '', end_time: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const { profile: school } = useSchoolStore();
  const [presets, setPresets] = useState<TimePreset[]>([]);
  const [selectedPresetIds, setSelectedPresetIds] = useState<number[]>([]);
  const [presetModal, setPresetModal] = useState(false);
  const [editPreset, setEditPreset] = useState<TimePreset|null>(null);
  const [presetForm, setPresetForm] = useState<{name:string;slots:TimeSlot[];days:string[];is_default:boolean}>({name:'',slots:[{label:'',start:'07:00',end:'07:40',type:'lesson'}],days:['senin','selasa','rabu','kamis','jumat','sabtu'],is_default:false});
  const [presetSaving, setPresetSaving] = useState(false);

  const selectedClass = classes.find(c => c.id === classId);

  // Build day->preset mapping from all checked presets
  const dayPresetMap: Record<string, TimePreset|null> = {};
  DAYS.forEach(d => { dayPresetMap[d] = null; });
  selectedPresetIds.forEach(pid => {
    const p = presets.find(x => x.id === pid);
    if (p && p.days) p.days.forEach(d => { dayPresetMap[d] = p; });
  });

  // Find max slots to determine row count
  const maxSlots = Math.max(0, ...DAYS.map(d => dayPresetMap[d]?.slots.length || 0));
  const gridRows = Array.from({ length: maxSlots });
  const selectedSemester = semesters.find(s => s.id === semesterId);

  const handlePrint = () => {
    window.print();
  };

  const defaultPreset = presets.find(p => p.is_default);

  const dayLabels: Record<string, string> = {
    senin: t('schedule.monday'), selasa: t('schedule.tuesday'), rabu: t('schedule.wednesday'),
    kamis: t('schedule.thursday'), jumat: t('schedule.friday'), sabtu: t('schedule.saturday'),
  };

  const fetchPresets = async () => {
    try { const r = await api.get('/admin/time-presets'); setPresets(r.data.data); const def = r.data.data.find((p:TimePreset)=>p.is_default); if(def && !presetId) setPresetId(def.id); } catch{}
  };

  useEffect(() => {
    (async () => {
      try {
        const [cr, sr, subr, tr, pr] = await Promise.all([
          api.get('/admin/classes'), api.get('/admin/semesters'),
          api.get('/admin/subjects'), api.get('/admin/teachers'),
          api.get('/admin/time-presets'),
        ]);
        setClasses(cr.data.data); setSemesters(sr.data.data);
        setSubjects(subr.data.data); setTeachers(tr.data.data);
        setPresets(pr.data.data);
        // Auto-select all presets
        setSelectedPresetIds(pr.data.data.map((p:TimePreset) => p.id));
        const active = sr.data.data.find((s: Semester) => s.is_active);
        if (active) setSemesterId(active.id);
      } catch {}
    })();
  }, []);

  const fetchSchedules = async () => {
    if (!classId || !semesterId) return;
    setLoading(true);
    try {
      const r = await api.get('/admin/schedules', { params: { class_id: classId, semester_id: semesterId } });
      setSchedules(r.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchSchedules(); }, [classId, semesterId]);

  const getSlot = (day: string, start: string): ScheduleItem | undefined =>
    schedules.find(s => s.day === day && s.start_time === start);

  const openAdd = (day: string, start: string, end: string) => {
    setFormData({ subject_id: '', teacher_id: '', day, start_time: start, end_time: end });
    setEditItem(null); setError(''); setModal('add');
  };

  const openEdit = (item: ScheduleItem) => {
    setFormData({ subject_id: String(item.subject_id), teacher_id: String(item.teacher_id), day: item.day, start_time: item.start_time, end_time: item.end_time });
    setEditItem(item); setError(''); setModal('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true); setError('');
    try {
      if (modal === 'add') {
        await api.post('/admin/schedules', { ...formData, class_id: classId, semester_id: semesterId });
      } else if (editItem) {
        await api.put(`/admin/schedules/${editItem.id}`, { subject_id: formData.subject_id, teacher_id: formData.teacher_id });
      }
      setModal(null); fetchSchedules();
    } catch (err: any) { setError(err.response?.data?.message || t('common.saveFailed')); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirmDialog(t('schedule.confirmDelete', 'Konfirmasi', true)))) return;
    try { await api.delete(`/admin/schedules/${id}`); fetchSchedules(); } catch { alertDialog(t('common.deleteFailed')); }
  };

  const hasSelection = classId && semesterId && selectedPresetIds.length > 0;

  return (
    <AdminLayout title={t('schedule.title')}>
      <style>{`
        @media print {
          @page { size: landscape; margin: 8mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          table { width: 100% !important; }
        }
      `}</style>

      {/* Filter Bar */}
      <div className="print:hidden bg-layout-card border border-layout-border rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-[#2d7a50]"><CalendarDays className="w-5 h-5"/><span className="font-bold text-layout-text text-sm">{t('schedule.title')}</span></div>
        <div className="flex gap-3 flex-1 flex-wrap">
          <select value={classId} onChange={e => setClassId(e.target.value ? Number(e.target.value) : '')} className="bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50] min-w-[180px]">
            <option value="">{t('schedule.selectClass')}</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.level} - {c.name}</option>)}
          </select>
          <select value={semesterId} onChange={e => setSemesterId(e.target.value ? Number(e.target.value) : '')} className="bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50] min-w-[180px]">
            <option value="">{t('schedule.selectSemester')}</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {presets.map(p=>{
            const checked = selectedPresetIds.includes(p.id);
            return <label key={p.id} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer text-xs font-semibold transition-all ${checked?'bg-[#2d7a50]/10 border-[#2d7a50]/30 text-[#2d7a50]':'bg-layout-bg border-layout-border text-layout-muted'}`}>
              <input type="checkbox" checked={checked} onChange={e=>{setSelectedPresetIds(e.target.checked?[...selectedPresetIds,p.id]:selectedPresetIds.filter(x=>x!==p.id));}} className="w-3.5 h-3.5 rounded"/>{p.name}{p.days&&p.days.length>0?` (${p.days.map(d=>dayLabels[d]?.slice(0,3)).join(', ')})`:''}
            </label>;
          })}
        </div>
        <div className="flex gap-2">
          <button onClick={()=>{setEditPreset(null);setPresetForm({name:'',slots:[{label:'Jam ke-1',start:'07:00',end:'07:40',type:'lesson'}],days:['senin','selasa','rabu','kamis','jumat','sabtu'],is_default:false});setPresetModal(true);}} className="flex items-center gap-1.5 bg-layout-card border border-layout-border text-layout-text px-3 py-2 rounded-lg text-sm font-medium hover:bg-layout-bg transition-colors print:hidden" title="Atur Preset">
            <Settings2 className="w-4 h-4"/>
          </button>
          {hasSelection && schedules.length > 0 && (
            <button onClick={handlePrint} className="flex items-center gap-2 bg-[#2d7a50] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#3d9968] transition-colors whitespace-nowrap print:hidden">
              <Printer className="w-4 h-4"/>PDF
            </button>
          )}
        </div>
      </div>

      {/* Print Header - only visible when printing */}
      <div className="hidden print:flex mb-4 border-b-2 border-black pb-3 items-center gap-6">
        {school?.logoUrl && (
          <img src={school.logoUrl} alt="Logo" className="w-20 h-20 object-contain" />
        )}
        <div className="flex-1 flex flex-col justify-center items-center">
          <h1 className="text-xl font-bold uppercase tracking-widest text-center mb-2">
            {t('schedule.title')} - {school?.name || 'IIS COMMUNITY CONNECT'}
          </h1>
          <div className="flex justify-center items-center gap-10 text-[13px] font-bold">
            <span>Kelas: {selectedClass?.level} - {selectedClass?.name}</span>
            {selectedClass?.homeroom_teacher && <span>Homeroom: {selectedClass.homeroom_teacher.name}</span>}
            <span>Semester: {selectedSemester?.name}</span>
          </div>
        </div>
      </div>

      {!hasSelection ? (
        <div className="bg-layout-card border border-layout-border rounded-xl p-12 text-center text-layout-muted">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30"/>
          <p className="text-sm">{t('schedule.noClass')}</p>
        </div>
      ) : loading ? (
        <div className="bg-layout-card border border-layout-border rounded-xl p-12 text-center text-layout-muted">{t('common.loading')}</div>
      ) : (
        <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-layout-bg border-b border-layout-border">
                  <th className="px-3 py-3 text-[11px] uppercase tracking-wider text-layout-muted font-semibold text-center w-20 border-r border-layout-border">
                    <Clock className="w-4 h-4 mx-auto mb-0.5"/>{t('schedule.hour')}
                  </th>
                  {DAYS.map(d => (
                    <th key={d} className="px-2 py-3 text-[11px] uppercase tracking-wider text-layout-muted font-semibold text-center border-r border-layout-border last:border-r-0">
                      {dayLabels[d]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridRows.map((_, idx) => {
                  const defaultSlot = defaultPreset?.slots[idx];
                  return (
                  <tr key={idx} className="border-b border-layout-border last:border-b-0">
                    <td className="px-2 py-1 print:py-0.5 text-center border-r border-layout-border bg-layout-bg w-20 print:w-16">
                      <div className="text-[14px] print:text-[12px] font-bold text-layout-text/70">{idx + 1}</div>
                      {defaultSlot && <div className="text-[10px] print:text-[8px] font-bold text-layout-muted/70 mt-1 print:mt-0">{defaultSlot.start}<br/>{defaultSlot.end}</div>}
                    </td>
                    {DAYS.map(day => {
                      const daySlot = dayPresetMap[day]?.slots[idx];
                      if (!daySlot) return <td key={day} className="px-1 py-1 border-r border-layout-border last:border-r-0 h-[80px] print:h-[50px] bg-layout-bg/50"><div className="h-full rounded-lg bg-layout-bg/30"/></td>;
                      
                      const isDefaultTime = defaultSlot && daySlot.start === defaultSlot.start && daySlot.end === defaultSlot.end && daySlot.label === defaultSlot.label;

                      if (daySlot.type === 'break') return (
                        <td key={day} className="px-1 py-1 border-r border-layout-border last:border-r-0 h-[80px] print:h-[50px]">
                          <div className="h-full rounded-lg bg-[#f59e0b]/8 border border-[#f59e0b]/20 p-2 print:p-1 flex flex-col justify-center items-center text-center">
                            <p className={`text-[12px] print:text-[10px] font-bold text-[#f59e0b] leading-tight ${!isDefaultTime ? 'mb-1 print:mb-0.5' : ''}`}>{daySlot.label}</p>
                            {!isDefaultTime && <p className="text-[11px] print:text-[9px] font-bold text-[#f59e0b]/80">{daySlot.start} - {daySlot.end}</p>}
                          </div>
                        </td>
                      );

                      const item = getSlot(day, daySlot.start);

                      return (
                        <td key={day} className="px-1 py-1 border-r border-layout-border last:border-r-0 h-[80px] print:h-[50px]">
                          {item ? (
                            <div onClick={() => openEdit(item)} className="h-full rounded-lg border p-2 print:p-1 cursor-pointer hover:shadow-md transition-all flex flex-col justify-center items-center text-center bg-[#3a8fd4]/10 text-[#3a8fd4] border-[#3a8fd4]/30">
                              {!isDefaultTime && (
                                <div className="flex flex-col items-center gap-0.5 mb-1.5 print:mb-0.5 w-full border-b border-[#3a8fd4]/20 pb-1.5 print:pb-0.5">
                                  <p className="text-[11px] print:text-[9px] font-bold opacity-90 leading-tight truncate w-full">{daySlot.label}</p>
                                  <p className="text-[10px] print:text-[8px] font-bold opacity-80 whitespace-nowrap">{daySlot.start} - {daySlot.end}</p>
                                </div>
                              )}
                              <div className="w-full">
                                <p className="text-[12px] print:text-[10px] font-bold leading-tight truncate w-full">{item.subject?.name}</p>
                                <p className="text-[10px] print:text-[8px] mt-0.5 print:mt-0 opacity-80 truncate w-full">{item.teacher?.name}</p>
                              </div>
                            </div>
                          ) : (
                            <div onClick={() => openAdd(day, daySlot.start, daySlot.end)} className="h-full rounded-lg border border-dashed border-layout-border hover:border-[#2d7a50] hover:bg-[#2d7a50]/5 p-2 print:p-1 flex flex-col items-center justify-center cursor-pointer transition-all group">
                                {!isDefaultTime && (
                                  <div className="flex flex-col items-center mb-1.5 print:mb-0.5 w-full border-b border-layout-border pb-1 print:pb-0.5">
                                    <p className="text-[11px] print:text-[9px] font-bold text-layout-text/60 leading-tight mb-0.5 print:mb-0 text-center w-full truncate">{daySlot.label}</p>
                                    <p className="text-[10px] print:text-[8px] font-bold text-layout-muted/70 text-center">{daySlot.start} - {daySlot.end}</p>
                                  </div>
                                )}
                                <Plus className="w-5 h-5 print:w-3 print:h-3 text-layout-muted group-hover:text-[#2d7a50] transition-colors print:hidden"/>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL ADD/EDIT */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[440px] rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border">
              <h2 className="text-lg font-bold text-layout-text">{modal === 'add' ? t('schedule.addSlot') : t('schedule.editSlot')}</h2>
              <button onClick={() => setModal(null)} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

              {modal === 'add' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={lbl}>{t('schedule.day')}</label>
                    <input readOnly value={dayLabels[formData.day] || formData.day} className={inp + ' bg-layout-bg'}/>
                  </div>
                  <div>
                    <label className={lbl}>{t('schedule.startTime')}</label>
                    <input readOnly value={formData.start_time} className={inp + ' bg-layout-bg'}/>
                  </div>
                  <div>
                    <label className={lbl}>{t('schedule.endTime')}</label>
                    <input readOnly value={formData.end_time} className={inp + ' bg-layout-bg'}/>
                  </div>
                </div>
              )}

              <div>
                <label className={lbl}>{t('schedule.selectSubject')}</label>
                <select required value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})} className={inp}>
                  <option value="">-- {t('schedule.selectSubject')} --</option>
                  {subjects.filter(s => s.type === 'mapel').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className={lbl}>{t('schedule.selectTeacher')}</label>
                <select required value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})} className={inp}>
                  <option value="">-- {t('schedule.selectTeacher')} --</option>
                  {teachers.map(tc => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
                </select>
              </div>

              <div className="flex justify-between items-center pt-2">
                {modal === 'edit' && editItem && (
                  <button type="button" onClick={() => { setModal(null); handleDelete(editItem.id); }} className="text-[#d45a5a] text-sm font-semibold hover:underline flex items-center gap-1">
                    <Trash2 className="w-4 h-4"/>{t('common.delete')}
                  </button>
                )}
                <div className={`flex gap-3 ${modal === 'add' ? 'ml-auto' : ''}`}>
                  <button type="button" onClick={() => setModal(null)} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg">{t('common.cancel')}</button>
                  <button type="submit" disabled={formLoading} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#3d9968] disabled:opacity-70">{formLoading ? t('common.saving') : t('common.save')}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRESET EDITOR MODAL */}
      {presetModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[560px] max-h-[85vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border shrink-0">
              <h2 className="text-lg font-bold text-layout-text">{editPreset ? 'Edit Preset' : 'Buat Preset Baru'}</h2>
              <button onClick={()=>setPresetModal(false)} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Existing presets list */}
              {!editPreset && presets.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-[12px] font-semibold text-layout-muted uppercase tracking-wider">Preset Tersedia</p>
                  {presets.map(p=>(
                    <div key={p.id} className="flex items-center justify-between p-3 bg-layout-bg rounded-lg border border-layout-border">
                      <div>
                        <span className="font-semibold text-sm text-layout-text">{p.name}</span>
                        {p.is_default && <span className="ml-2 text-[10px] bg-[#2d7a50]/10 text-[#2d7a50] px-2 py-0.5 rounded-full font-semibold">Default</span>}
                        <span className="ml-2 text-xs text-layout-muted">{p.slots.length} slot</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={()=>{setEditPreset(p);setPresetForm({name:p.name,slots:p.slots.map(s=>({label:s.label||'',start:s.start,end:s.end,type:s.type||'lesson'})),days:p.days||[],is_default:p.is_default});}} className="p-1.5 text-[#3a8fd4] hover:bg-[#3a8fd4]/10 rounded-md"><Pencil className="w-3.5 h-3.5"/></button>
                        <button onClick={async()=>{if(!(await confirmDialog('Hapus preset ini?', 'Konfirmasi', true)))return;try{await api.delete(`/admin/time-presets/${p.id}`);fetchPresets();}catch{alertDialog('Gagal hapus');}}} className="p-1.5 text-[#d45a5a] hover:bg-[#d45a5a]/10 rounded-md"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                  ))}
                  <hr className="border-layout-border my-3"/>
                </div>
              )}

              <div><label className={lbl}>Nama Preset</label><input value={presetForm.name} onChange={e=>setPresetForm({...presetForm,name:e.target.value})} className={inp} placeholder="cth: Regular / Ramadhan"/></div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={presetForm.is_default} onChange={e=>setPresetForm({...presetForm,is_default:e.target.checked})} className="w-4 h-4 text-[#2d7a50] rounded"/><span className="text-sm text-layout-text">Jadikan Default</span></label>

              <div>
                <p className={lbl}>Terapkan di Hari</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(d=>(<label key={d} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs font-medium ${presetForm.days.includes(d)?'bg-[#2d7a50]/10 border-[#2d7a50]/30 text-[#2d7a50]':'bg-layout-bg border-layout-border text-layout-muted'}`}><input type="checkbox" checked={presetForm.days.includes(d)} onChange={e=>{const days=e.target.checked?[...presetForm.days,d]:presetForm.days.filter(x=>x!==d);setPresetForm({...presetForm,days});}} className="w-3.5 h-3.5 rounded"/>{dayLabels[d]}</label>))}
                </div>
              </div>

              <div>
                <p className={lbl}>Daftar Slot Waktu</p>
                <div className="space-y-2">
                  {presetForm.slots.map((sl,i)=>(
                    <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border ${sl.type==='break'?'border-[#f59e0b]/30 bg-[#f59e0b]/5':'border-layout-border bg-layout-bg'}`}>
                      <input value={sl.label} onChange={e=>{const s=[...presetForm.slots];s[i]={...s[i],label:e.target.value};setPresetForm({...presetForm,slots:s});}} className="flex-1 bg-layout-card border border-layout-border rounded px-2 py-1.5 text-xs" placeholder="Label"/>
                      <input type="time" value={sl.start} onChange={e=>{const s=[...presetForm.slots];s[i]={...s[i],start:e.target.value};setPresetForm({...presetForm,slots:s});}} className="bg-layout-card border border-layout-border rounded px-2 py-1.5 text-xs w-[90px]"/>
                      <input type="time" value={sl.end} onChange={e=>{const s=[...presetForm.slots];s[i]={...s[i],end:e.target.value};setPresetForm({...presetForm,slots:s});}} className="bg-layout-card border border-layout-border rounded px-2 py-1.5 text-xs w-[90px]"/>
                      <select value={sl.type} onChange={e=>{const s=[...presetForm.slots];s[i]={...s[i],type:e.target.value as 'lesson'|'break'};setPresetForm({...presetForm,slots:s});}} className="bg-layout-card border border-layout-border rounded px-2 py-1.5 text-xs w-[90px]">
                        <option value="lesson">Pelajaran</option>
                        <option value="break">Free Time</option>
                      </select>
                      <button type="button" onClick={()=>{const s=presetForm.slots.filter((_,j)=>j!==i);setPresetForm({...presetForm,slots:s});}} className="p-1 text-[#d45a5a] hover:bg-[#d45a5a]/10 rounded"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={()=>setPresetForm({...presetForm,slots:[...presetForm.slots,{label:`Jam ke-${presetForm.slots.filter(s=>s.type==='lesson').length+1}`,start:'07:00',end:'07:40',type:'lesson'}]})} className="mt-2 text-[#2d7a50] text-sm font-semibold hover:underline flex items-center gap-1"><Plus className="w-3.5 h-3.5"/>Tambah Slot</button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-layout-border flex justify-end gap-3 shrink-0">
              <button onClick={()=>{setPresetModal(false);setEditPreset(null);}} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg">{t('common.cancel')}</button>
              <button disabled={presetSaving||!presetForm.name||presetForm.slots.length===0} onClick={async()=>{
                setPresetSaving(true);
                try{
                  if(editPreset){await api.put(`/admin/time-presets/${editPreset.id}`,presetForm);}else{await api.post('/admin/time-presets',presetForm);}
                  await fetchPresets();setPresetModal(false);setEditPreset(null);
                }catch(err:any){alertDialog(err.response?.data?.message||'Gagal menyimpan');}
                finally{setPresetSaving(false);}
              }} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#3d9968] disabled:opacity-70">{presetSaving?t('common.saving'):t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
