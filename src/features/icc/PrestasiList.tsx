import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Trophy, Link as LinkIcon, Search, Download } from 'lucide-react';
import api from '@/lib/axios';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface Achievement {
  id: number;
  date: string;
  competition_name: string;
  competition_branch: string | null;
  organizer: string;
  achievement: string;
  level: string;
  photo_url: string | null;
  certificate_url: string | null;
  student: {
    id: number;
    name: string;
    nis: string;
    nisn: string;
  };
  school_class: {
    id: number;
    name: string;
  };
}

export default function PrestasiList() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [classes, setClasses] = useState<{id: number, name: string}[]>([]);
  const [students, setStudents] = useState<{id: number, name: string}[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Achievement | null>(null);

  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');

  const [form, setForm] = useState({
    class_id: '',
    student_id: '',
    date: '',
    competition_name: '',
    competition_branch: '',
    organizer: '',
    achievement: '',
    level: '',
    photo_url: '',
    certificate_url: '',
  });

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/icc/achievements', {
        params: { search, class_id: filterClass }
      });
      setAchievements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/teacher/icc/classes');
      setClasses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async (classId: string) => {
    try {
      if (!classId) {
        setStudents([]);
        return;
      }
      const res = await api.get('/teacher/icc/students', { params: { class_id: classId } });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAchievements();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, filterClass]);

  // When form class_id changes, fetch students
  useEffect(() => {
    if (form.class_id) {
      fetchStudents(form.class_id);
    }
  }, [form.class_id]);

  const openModal = (item?: Achievement) => {
    if (item) {
      setEditingItem(item);
      setForm({
        class_id: item.school_class.id.toString(),
        student_id: item.student.id.toString(),
        date: item.date,
        competition_name: item.competition_name,
        competition_branch: item.competition_branch || '',
        organizer: item.organizer,
        achievement: item.achievement,
        level: item.level,
        photo_url: item.photo_url || '',
        certificate_url: item.certificate_url || '',
      });
    } else {
      setEditingItem(null);
      setForm({
        class_id: '',
        student_id: '',
        date: new Date().toISOString().split('T')[0],
        competition_name: '',
        competition_branch: '',
        organizer: '',
        achievement: '',
        level: 'Sekolah',
        photo_url: '',
        certificate_url: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/teacher/icc/achievements/${editingItem.id}`, form);
      } else {
        await api.post('/teacher/icc/achievements', form);
      }
      setIsModalOpen(false);
      fetchAchievements();
    } catch (err) {
      console.error(err);
      alertDialog('Gagal menyimpan prestasi.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirmDialog('Hapus prestasi ini?', 'Konfirmasi', true))) return;
    try {
      await api.delete(`/teacher/icc/achievements/${id}`);
      fetchAchievements();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/teacher/icc/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rekap_Prestasi_ICC_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alertDialog('Gagal mengunduh file Excel.');
    }
  };

  return (
    <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-layout-border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-layout-text flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#d4a23a]" />
            Daftar Prestasi Siswa
          </h2>
          <p className="text-sm text-layout-muted">Catat dan kelola prestasi akademik/non-akademik siswa</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-layout-muted" />
            <input 
              type="text" 
              placeholder="Cari siswa..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-layout-bg border border-layout-border rounded-lg focus:outline-none focus:border-[#2d7a50]"
            />
          </div>
          <select 
            value={filterClass} 
            onChange={e => setFilterClass(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 text-sm bg-layout-bg border border-layout-border rounded-lg focus:outline-none focus:border-[#2d7a50]"
          >
            <option value="">Semua Kelas</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button
            onClick={handleExport}
            className="w-full sm:w-auto bg-[#3a8fd4] hover:bg-[#2e78b8] text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={() => openModal()}
            className="w-full sm:w-auto bg-[#2d7a50] hover:bg-[#3d9968] text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Tambah Prestasi
          </button>
        </div>
      </div>

      <div className="p-0 overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm text-left">
          <thead className="bg-layout-bg border-b border-layout-border text-layout-muted uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Siswa</th>
              <th className="px-6 py-4">Kompetisi</th>
              <th className="px-6 py-4">Prestasi & Tingkat</th>
              <th className="px-6 py-4">Lampiran</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-layout-border text-layout-text">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-layout-muted">Memuat...</td></tr>
            ) : achievements.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-layout-muted">Belum ada prestasi.</td></tr>
            ) : (
              achievements.map((item) => (
                <tr key={item.id} className="hover:bg-layout-hover/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#2d7a50]">{item.student.name}</div>
                    <div className="text-xs text-layout-muted">{item.school_class.name} • NIS: {item.student.nis}</div>
                    <div className="text-xs text-layout-muted mt-1">{new Date(item.date).toLocaleDateString('id-ID')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold">{item.competition_name}</div>
                    <div className="text-xs text-layout-muted">
                      {item.competition_branch ? `Cabang: ${item.competition_branch} • ` : ''}
                      Penyelenggara: {item.organizer}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex px-2 py-1 bg-[#d4a23a]/10 text-[#d4a23a] border border-[#d4a23a]/20 rounded font-bold text-xs">
                      {item.achievement}
                    </div>
                    <div className="text-xs text-layout-muted mt-1">Tingkat: {item.level}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {item.photo_url ? (
                        <a href={item.photo_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" /> Foto
                        </a>
                      ) : <span className="text-xs text-layout-muted">- Foto</span>}
                      {item.certificate_url ? (
                        <a href={item.certificate_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" /> Sertifikat
                        </a>
                      ) : <span className="text-xs text-layout-muted">- Sertifikat</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-layout-border flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg">{editingItem ? 'Edit Prestasi' : 'Tambah Prestasi'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-layout-muted hover:text-layout-text">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Kelas <span className="text-red-500">*</span></label>
                  <select required disabled={!!editingItem} value={form.class_id} onChange={e => setForm({...form, class_id: e.target.value})} className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50] disabled:bg-layout-hover">
                    <option value="">Pilih Kelas</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Siswa <span className="text-red-500">*</span></label>
                  <select required disabled={!!editingItem || !form.class_id} value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})} className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50] disabled:bg-layout-hover">
                    <option value="">Pilih Siswa</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.nis})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Tanggal <span className="text-red-500">*</span></label>
                  <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Tingkat <span className="text-red-500">*</span></label>
                  <select required value={form.level} onChange={e => setForm({...form, level: e.target.value})} className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]">
                    <option value="Sekolah">Sekolah</option>
                    <option value="Kota/Kabupaten">Kota/Kabupaten</option>
                    <option value="Provinsi">Provinsi</option>
                    <option value="Nasional">Nasional</option>
                    <option value="Internasional">Internasional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Nama Kompetisi <span className="text-red-500">*</span></label>
                  <input required type="text" value={form.competition_name} onChange={e => setForm({...form, competition_name: e.target.value})} className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]" placeholder="Misal: Olimpiade Sains Nasional" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Cabang Lomba (Opsional)</label>
                  <input type="text" value={form.competition_branch} onChange={e => setForm({...form, competition_branch: e.target.value})} className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]" placeholder="Misal: Matematika" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Penyelenggara <span className="text-red-500">*</span></label>
                  <input required type="text" value={form.organizer} onChange={e => setForm({...form, organizer: e.target.value})} className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]" placeholder="Misal: Kemdikbud" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Prestasi yang Diraih <span className="text-red-500">*</span></label>
                  <input required type="text" value={form.achievement} onChange={e => setForm({...form, achievement: e.target.value})} className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]" placeholder="Misal: Medali Emas / Juara 1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-layout-border">
                <div>
                  <label className="block text-sm font-semibold mb-1">Link Foto URL (Opsional)</label>
                  <input type="url" value={form.photo_url} onChange={e => setForm({...form, photo_url: e.target.value})} placeholder="https://drive.google.com/..." className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Link Sertifikat URL (Opsional)</label>
                  <input type="url" value={form.certificate_url} onChange={e => setForm({...form, certificate_url: e.target.value})} placeholder="https://drive.google.com/..." className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg font-semibold text-layout-muted hover:bg-layout-hover">Batal</button>
                <button type="submit" className="px-4 py-2 rounded-lg font-semibold bg-[#2d7a50] text-white hover:bg-[#3d9968]">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
