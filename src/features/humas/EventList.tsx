import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Calendar, Link as LinkIcon, Users, Target } from 'lucide-react';
import api from '@/lib/axios';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface TargetAudience {
  type: 'global' | 'level' | 'class' | 'student';
  levels?: string[];
  classes?: number[];
  students?: number[];
}

interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  photo_url: string;
  source: string;
  target_audience: TargetAudience | null;
  creator: {
    id: number;
    name: string;
  };
}

export default function EventList({ source }: { source: 'humas' | 'admin' }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [classes, setClasses] = useState<{id: number, name: string, level: string}[]>([]);
  const [students, setStudents] = useState<{id: number, name: string, nis: string}[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    photo_url: '',
    target_audience: {
      type: 'global' as 'global' | 'level' | 'class' | 'student',
      levels: [] as string[],
      classes: [] as number[],
      students: [] as number[],
    }
  });

  const baseUrl = source === 'admin' ? '/admin/events' : '/teacher/humas/events';

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get(baseUrl);
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get(`${baseUrl}/classes`);
      setClasses(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchStudents = async (classId: string) => {
    try {
      if (!classId) { setStudents([]); return; }
      const res = await api.get(`${baseUrl}/students`, { params: { class_id: classId } });
      setStudents(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchEvents();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) fetchStudents(selectedClassId);
  }, [selectedClassId]);

  const openModal = (ev?: Event) => {
    if (ev) {
      setEditingEvent(ev);
      setForm({
        title: ev.title,
        description: ev.description || '',
        start_date: ev.start_date,
        end_date: ev.end_date || '',
        photo_url: ev.photo_url || '',
        target_audience: ev.target_audience || {
          type: 'global',
          levels: [],
          classes: [],
          students: []
        }
      });
    } else {
      setEditingEvent(null);
      setForm({
        title: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        photo_url: '',
        target_audience: {
          type: 'global',
          levels: [],
          classes: [],
          students: []
        }
      });
    }
    setSelectedClassId('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await api.put(`${baseUrl}/${editingEvent.id}`, form);
      } else {
        await api.post(baseUrl, form);
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (err) {
      console.error(err);
      alertDialog('Gagal menyimpan kegiatan.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirmDialog('Hapus kegiatan ini?', 'Konfirmasi', true))) return;
    try {
      await api.delete(`${baseUrl}/${id}`);
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLevel = (level: string) => {
    const levels = form.target_audience.levels || [];
    const newLevels = levels.includes(level) ? levels.filter(l => l !== level) : [...levels, level];
    setForm({ ...form, target_audience: { ...form.target_audience, levels: newLevels } });
  };

  const toggleClass = (id: number) => {
    const cls = form.target_audience.classes || [];
    const newCls = cls.includes(id) ? cls.filter(c => c !== id) : [...cls, id];
    setForm({ ...form, target_audience: { ...form.target_audience, classes: newCls } });
  };

  const toggleStudent = (id: number) => {
    const stds = form.target_audience.students || [];
    const newStds = stds.includes(id) ? stds.filter(s => s !== id) : [...stds, id];
    setForm({ ...form, target_audience: { ...form.target_audience, students: newStds } });
  };

  const formatDateRange = (start: string, end: string | null) => {
    const startDate = new Date(start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!end || start === end) return startDate;
    const endDate = new Date(end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startDate} - ${endDate}`;
  };

  const getTargetLabel = (ta: TargetAudience | null) => {
    if (!ta || ta.type === 'global') return 'Semua Siswa';
    if (ta.type === 'level') return `Jenjang: ${ta.levels?.join(', ')}`;
    if (ta.type === 'class') return `${ta.classes?.length || 0} Kelas Terpilih`;
    if (ta.type === 'student') return `${ta.students?.length || 0} Siswa Terpilih`;
    return 'Semua Siswa';
  };

  const uniqueLevels = Array.from(new Set(classes.map(c => c.level)));

  return (
    <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-layout-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-layout-text flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2d7a50]" />
            Daftar Agenda Kegiatan
          </h2>
          <p className="text-sm text-layout-muted">Kelola kegiatan sekolah dan target audiens</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#2d7a50] hover:bg-[#3d9968] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Kegiatan
        </button>
      </div>

      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-8 text-layout-muted">Memuat...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-layout-muted border-2 border-dashed border-layout-border rounded-xl">
            Belum ada kegiatan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev) => (
              <div key={ev.id} className="border border-layout-border rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-layout-text leading-tight">{ev.title}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openModal(ev)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(ev.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#2d7a50] flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDateRange(ev.start_date, ev.end_date)}
                  </p>
                  <p className="text-[11px] font-semibold text-[#d4a23a] flex items-center gap-1">
                    <Target className="w-3 h-3" /> Target: {getTargetLabel(ev.target_audience)}
                  </p>
                </div>
                <p className="text-sm text-layout-muted line-clamp-3">{ev.description || '-'}</p>
                
                {ev.photo_url && (
                  <a href={ev.photo_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-auto">
                    <LinkIcon className="w-3 h-3" /> Lihat Foto
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-layout-border flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg">{editingEvent ? 'Edit Kegiatan' : 'Tambah Kegiatan'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-layout-muted hover:text-layout-text">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="event-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">Judul Kegiatan <span className="text-red-500">*</span></label>
                  <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Tanggal Mulai <span className="text-red-500">*</span></label>
                    <input required type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Tanggal Selesai (Opsional)</label>
                    <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} min={form.start_date} className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Target Audiens <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {['global', 'level', 'class', 'student'].map((type) => (
                      <label key={type} className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors ${form.target_audience.type === type ? 'bg-[#2d7a50]/10 border-[#2d7a50] text-[#2d7a50]' : 'bg-layout-bg border-layout-border text-layout-muted hover:bg-layout-hover'}`}>
                        <input 
                          type="radio" 
                          name="target_type" 
                          value={type} 
                          checked={form.target_audience.type === type}
                          onChange={() => setForm({ ...form, target_audience: { ...form.target_audience, type: type as any } })}
                          className="hidden" 
                        />
                        <span className="text-sm font-bold">
                          {type === 'global' ? 'Semua Siswa' : type === 'level' ? 'Jenjang Tertentu' : type === 'class' ? 'Kelas Tertentu' : 'Siswa Tertentu'}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Dynamic Target Selection */}
                  {form.target_audience.type === 'level' && (
                    <div className="p-4 bg-layout-bg border border-layout-border rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {uniqueLevels.map(level => (
                        <label key={level} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={(form.target_audience.levels || []).includes(level)} onChange={() => toggleLevel(level)} className="rounded text-[#2d7a50] focus:ring-[#2d7a50]" />
                          <span className="text-sm font-medium">Jenjang {level}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {form.target_audience.type === 'class' && (
                    <div className="p-4 bg-layout-bg border border-layout-border rounded-xl max-h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {classes.map(c => (
                        <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={(form.target_audience.classes || []).includes(c.id)} onChange={() => toggleClass(c.id)} className="rounded text-[#2d7a50] focus:ring-[#2d7a50]" />
                          <span className="text-sm font-medium">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {form.target_audience.type === 'student' && (
                    <div className="p-4 bg-layout-bg border border-layout-border rounded-xl space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <select 
                          value={selectedClassId} 
                          onChange={e => setSelectedClassId(e.target.value)} 
                          className="w-full sm:w-1/2 bg-layout-card border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]"
                        >
                          <option value="">Pilih Kelas untuk menampilkan siswa...</option>
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="w-full sm:w-1/2 text-sm font-semibold text-[#d4a23a] flex items-center justify-end gap-2">
                          <Users className="w-4 h-4" /> {(form.target_audience.students || []).length} Siswa Terpilih
                        </div>
                      </div>
                      
                      {selectedClassId && (
                        <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-layout-border">
                          {students.length === 0 ? (
                            <p className="text-xs text-layout-muted col-span-2">Belum ada data siswa di kelas ini.</p>
                          ) : (
                            students.map(s => (
                              <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={(form.target_audience.students || []).includes(s.id)} onChange={() => toggleStudent(s.id)} className="rounded text-[#2d7a50] focus:ring-[#2d7a50]" />
                                <span className="text-sm font-medium truncate">{s.name} <span className="text-xs text-layout-muted">({s.nis})</span></span>
                              </label>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Deskripsi</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Link Foto (Google Drive)</label>
                  <input type="url" value={form.photo_url} onChange={e => setForm({...form, photo_url: e.target.value})} placeholder="https://drive.google.com/..." className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]" />
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-layout-border bg-layout-bg flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg font-semibold text-layout-muted hover:bg-layout-hover">Batal</button>
              <button type="submit" form="event-form" className="px-4 py-2 rounded-lg font-semibold bg-[#2d7a50] text-white hover:bg-[#3d9968]">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
