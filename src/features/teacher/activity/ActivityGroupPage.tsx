import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Users, Save, X, Search, UserPlus } from 'lucide-react';
import ActivityAdminLayout from './ActivityAdminLayout';
import api from '@/lib/axios';
import { confirmDialog, alertDialog } from '@/lib/swal';

interface Props {
  type: 'digiart' | 'ekstra';
}

interface Group {
  id: number;
  name: string;
  teacher_id: number | null;
  semester_id: number;
  description: string | null;
  schedule_day: string | null;
  schedule_time: string | null;
  teacher: { id: number; name: string } | null;
  semester: { id: number; name: string } | null;
  members_count: number;
  members?: Array<{ student: { id: number; name: string; school_class: { name: string } } }>;
}

export default function ActivityGroupPage({ type }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);
  
  // Modals state
  const [modalGroup, setModalGroup] = useState<boolean>(false);
  const [modalAssign, setModalAssign] = useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Form Group state
  const [formData, setFormData] = useState({
    name: '',
    teacher_id: '',
    semester_id: '',
    description: '',
    schedule_day: '',
    schedule_time: ''
  });

  // Assign Student state
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/teacher/${type}/groups`);
      setGroups(res.data.data);
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal memuat grup');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [tch, cls, sem] = await Promise.all([
        api.get('/teacher/activity/teachers'),
        api.get('/teacher/activity/classes'),
        api.get('/teacher/activity/semesters')
      ]);
      setTeachers(tch.data.data);
      setClasses(cls.data.data);
      setSemesters(sem.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchDependencies();
  }, [type]);

  const activeSemester = semesters.find(s => s.status === 'Aktif') || semesters[0];

  
  const downloadTemplate = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/teacher/${type}/groups/template`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Template_Data_${type === 'ekstra' ? 'Ekstra' : 'Digiart'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alertDialog('Gagal mendownload template', 'error', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post(`/teacher/${type}/groups/import`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      alertDialog(res.data.message, 'success', 'Import Selesai');
      fetchGroups();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal Upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openGroupModal = (g?: Group) => {
    if (g) {
      setSelectedGroup(g);
      setFormData({
        name: g.name,
        teacher_id: g.teacher_id?.toString() || '',
        semester_id: g.semester_id?.toString() || '',
        description: g.description || '',
        schedule_day: g.schedule_day || '',
        schedule_time: g.schedule_time || ''
      });
      const maTeachers = (g as any).master_activity?.teachers || [];
      setSelectedTeacherIds(maTeachers.map((t: any) => t.id));
    } else {
      setSelectedGroup(null);
      setFormData({
        name: '',
        teacher_id: '',
        semester_id: activeSemester?.id?.toString() || '',
        description: '',
        schedule_day: '',
        schedule_time: ''
      });
      setSelectedTeacherIds([]);
    }
    setModalGroup(true);
  };

  const saveGroup = async () => {
    const finalSemesterId = formData.semester_id || activeSemester?.id?.toString();
    if (!formData.name || !finalSemesterId) return alertDialog('Nama grup dan semester wajib diisi.', 'error', 'Validasi Error');
    try {
      const payload = {
        ...formData,
        semester_id: finalSemesterId,
        teacher_id: formData.teacher_id || null,
        teacher_ids: selectedTeacherIds
      };
      if (selectedGroup) {
        await api.put(`/teacher/${type}/groups/${selectedGroup.id}`, payload);
        alertDialog('Grup diperbarui', 'success', 'Berhasil');
      } else {
        await api.post(`/teacher/${type}/groups`, payload);
        alertDialog('Grup dibuat', 'success', 'Berhasil');
      }
      setModalGroup(false);
      fetchGroups();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal');
    }
  };

  const deleteGroup = async (id: number) => {
    const isConfirm = await confirmDialog('Data presensi dan nilai grup ini akan ikut terhapus!', 'Hapus Grup?', true);
    if (!isConfirm) return;
    try {
      await api.delete(`/teacher/${type}/groups/${id}`);
      alertDialog('Grup dihapus', 'success', 'Berhasil');
      fetchGroups();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal menghapus');
    }
  };

  const openAssignModal = async (g: Group) => {
    setSelectedGroup(g);
    setSelectedClass('');
    setStudentsList([]);
    setSelectedStudents([]);
    setSearchStudent('');
    setModalAssign(true);
    
    // Load members
    try {
      const res = await api.get(`/teacher/${type}/groups/${g.id}`);
      const members = res.data.data.members || [];
      const membersIds = members.map((m: any) => m.student_id);
      setSelectedStudents(membersIds);
      setEnrolledStudents(members.map((m: any) => m.student));
    } catch (err) {}
  };

  const loadStudentsByClass = async (classId: string) => {
    if (!classId) {
      setStudentsList([]);
      return;
    }
    try {
      const url = classId === 'ALL' ? '/teacher/activity/students' : `/teacher/activity/students?class_id=${classId}`;
      const res = await api.get(url);
      setStudentsList(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const assignStudents = async () => {
    if (!selectedGroup) return;
    try {
      await api.post(`/teacher/${type}/groups/${selectedGroup.id}/assign-students`, {
        student_ids: selectedStudents
      });
      alertDialog('Siswa berhasil ditambahkan', 'success', 'Berhasil');
      setModalAssign(false);
      fetchGroups();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal');
    }
  };

  const removeStudent = async (groupId: number, studentId: number) => {
    const isConfirm = await confirmDialog('Siswa akan dikeluarkan dari grup ini.', 'Keluarkan Siswa?', true);
    if (!isConfirm) return;
    try {
      await api.delete(`/teacher/${type}/groups/${groupId}/remove-student/${studentId}`);
      alertDialog('Siswa dikeluarkan', 'success', 'Berhasil');
      fetchGroups();
      if (selectedGroup && selectedGroup.id === groupId) {
         openAssignModal(selectedGroup);
      }
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal');
    }
  };

  const title = `Kelola Grup ${type === 'digiart' ? 'Digiart' : 'Ekstrakurikuler'}`;
  const inputCls = "w-full h-[42px] bg-layout-bg border border-layout-border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d7a50] transition-all";
  const labelCls = "block text-[13px] font-semibold text-layout-text mb-1";

  const filteredStudents = studentsList.filter(s => s.name.toLowerCase().includes(searchStudent.toLowerCase()));

  return (
    <ActivityAdminLayout type={type} title={title}>
      <div className="bg-layout-bg border border-layout-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-layout-border flex justify-between items-center bg-layout-bg/50">
          <h2 className="text-lg font-bold text-layout-text flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2d7a50]" />
            Daftar Grup Aktif
            </h2>
            <div className="flex">
            <button onClick={() => openGroupModal()} className="px-4 py-2 bg-[#2d7a50] text-white rounded-lg text-sm font-semibold hover:bg-[#235e3d] transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Grup
            </button>
            <button onClick={downloadTemplate} disabled={loading} className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2 ml-2">
              Download Template
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls,.csv" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-[#2d7a50] text-white rounded-lg text-sm font-semibold hover:bg-[#235e3d] transition-colors flex items-center gap-2 ml-2 disabled:opacity-50">
              {uploading ? 'Mengupload...' : 'Upload Excel Siswa'}
            </button>
            </div>
          </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-layout-muted">Memuat data...</div>
          ) : groups.length === 0 ? (
            <div className="p-12 text-center text-layout-muted">Belum ada grup yang dibuat.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-layout-bg border-b border-layout-border text-sm text-layout-muted">
                  <th className="px-6 py-4 font-semibold">Nama Grup</th>
                  <th className="px-6 py-4 font-semibold">Pembimbing / Pelatih</th>
                  <th className="px-6 py-4 font-semibold">Jadwal</th>
                  <th className="px-6 py-4 font-semibold text-center">Peserta</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-layout-border">
                {groups.map(g => (
                  <tr key={g.id} className="hover:bg-layout-hover transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-layout-text">{g.name}</div>
                      <div className="text-xs text-layout-muted line-clamp-1">{g.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {(g as any).master_activity?.teachers?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {(g as any).master_activity.teachers.map((t: any) => (
                            <span key={t.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                              {t.name}
                            </span>
                          ))}
                        </div>
                      ) : g.teacher ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                          {g.teacher.name}
                        </span>
                      ) : (
                        <span className="text-xs text-layout-muted italic border border-layout-border px-2.5 py-1 rounded-md bg-layout-bg">Belum ada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-layout-text">
                      {g.schedule_day ? `${g.schedule_day}, ${g.schedule_time || '-'}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => openAssignModal(g)} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2d7a50]/10 text-[#2d7a50] hover:bg-[#2d7a50]/20 rounded-lg text-sm font-bold transition-colors">
                        <Users className="w-4 h-4" />
                        {g.members_count} Siswa
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openGroupModal(g)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteGroup(g.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal CRUD Grup */}
      {modalGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-layout-bg border border-layout-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-layout-border flex justify-between items-center bg-layout-bg">
              <h2 className="text-lg font-bold text-layout-text">{selectedGroup ? 'Edit Grup' : 'Tambah Grup'}</h2>
              <button onClick={() => setModalGroup(false)} className="p-1.5 text-layout-muted hover:bg-layout-hover rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Nama Grup <span className="text-red-500">*</span></label>
                <input value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className={inputCls} placeholder={`Misal: ${type==='digiart'?'Digital Art Class A':'Paskibraka'}`} />
              </div>
              <div>
                <label className={labelCls}>Pembimbing / Pelatih</label>
                {selectedTeacherIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedTeacherIds.map(tid => {
                      const t = teachers.find((x: any) => x.id === tid);
                      return t ? (
                        <span key={tid} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                          {t.name}
                          <button type="button" onClick={() => setSelectedTeacherIds(prev => prev.filter(id => id !== tid))} className="ml-0.5 text-red-400 hover:text-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                <select value="" onChange={e => { const val = Number(e.target.value); if (val && !selectedTeacherIds.includes(val)) { setSelectedTeacherIds(prev => [...prev, val]); if (!formData.teacher_id) setFormData(f => ({...f, teacher_id: String(val)})); } }} className={inputCls}>
                  <option value="">+ Tambah Pelatih...</option>
                  {teachers.filter((t: any) => !selectedTeacherIds.includes(t.id)).map((t: any) => {
                    const actStr = t.master_activities && t.master_activities.length > 0 ? ` (Pelatih: ${t.master_activities.map((ma:any) => ma.name).join(', ')})` : '';
                    return <option key={t.id} value={t.id}>{t.name}{actStr}</option>;
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Hari Jadwal</label>
                  <select value={formData.schedule_day} onChange={e=>setFormData({...formData, schedule_day: e.target.value})} className={inputCls}>
                    <option value="">Pilih Hari...</option>
                    {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Jam Jadwal</label>
                  <input type="time" value={formData.schedule_time} onChange={e=>setFormData({...formData, schedule_time: e.target.value})} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Semester <span className="text-red-500">*</span></label>
                <select value={formData.semester_id} onChange={e=>setFormData({...formData, semester_id: e.target.value})} className={inputCls}>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name} - {s.year}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Deskripsi Singkat</label>
                <textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full h-[80px] bg-layout-bg border border-layout-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d7a50]" placeholder="Opsional..."></textarea>
              </div>
            </div>
            <div className="p-4 border-t border-layout-border flex justify-end gap-2 bg-layout-bg/50">
              <button onClick={() => setModalGroup(false)} className="px-4 py-2 text-sm font-semibold text-layout-muted hover:bg-layout-hover rounded-lg">Batal</button>
              <button onClick={saveGroup} disabled={loading} className="px-4 py-2 bg-[#2d7a50] text-white rounded-lg text-sm font-semibold hover:bg-[#235e3d] flex items-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Assign Siswa Lintas Kelas */}
      {modalAssign && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-layout-bg border border-layout-border rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-layout-border flex justify-between items-center bg-layout-bg">
              <h2 className="text-lg font-bold text-layout-text">Anggota Grup: {selectedGroup.name}</h2>
              <button onClick={() => setModalAssign(false)} className="p-1.5 text-layout-muted hover:bg-layout-hover rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto grid md:grid-cols-2 gap-6 bg-layout-bg/30">
              
              {/* Kiri: Tambah Anggota */}
              <div className="space-y-4">
                <h3 className="font-semibold text-layout-text text-sm flex items-center gap-2 pb-2 border-b border-layout-border">
                  <UserPlus className="w-4 h-4 text-[#2d7a50]" />
                  Tambah Siswa Baru
                </h3>
                
                <div>
                  <label className="text-xs font-semibold text-layout-muted block mb-1">Pilih Kelas</label>
                  <select 
                    value={selectedClass} 
                    onChange={e => {
                      setSelectedClass(e.target.value);
                      loadStudentsByClass(e.target.value);
                    }} 
                    className={inputCls}
                  >
                    <option value="">-- Pilih Kelas --</option>
                    <option value="ALL">-- SEMUA KELAS --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.level} - {c.name}</option>)}
                  </select>
                </div>
                
                {selectedClass && (
                  <div className="border border-layout-border rounded-xl bg-layout-bg overflow-hidden flex flex-col h-[300px]">
                    <div className="p-2 border-b border-layout-border">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-layout-muted" />
                        <input type="text" value={searchStudent} onChange={e=>setSearchStudent(e.target.value)} placeholder="Cari siswa..." className="w-full pl-9 pr-3 py-1.5 text-sm bg-layout-bg border border-layout-border rounded-lg focus:ring-1 focus:ring-[#2d7a50] outline-none" />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {filteredStudents.length === 0 ? (
                        <p className="text-xs text-center p-4 text-layout-muted">Tidak ada data siswa.</p>
                      ) : filteredStudents.map(s => {
                        const isSelected = selectedStudents.includes(s.id);
                        return (
                          <label key={s.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${isSelected ? 'bg-emerald-50 border-emerald-200' : 'hover:bg-layout-hover border-transparent'}`}>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedStudents([...selectedStudents, s.id]);
                                else setSelectedStudents(selectedStudents.filter(id => id !== s.id));
                              }}
                              className="w-4 h-4 text-[#2d7a50] rounded"
                            />
                            <div>
                              <p className="text-sm font-semibold text-layout-text">{s.name}</p>
                              <p className="text-[10px] text-layout-muted">{s.nisn || s.nis}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {selectedClass && (
                  <button onClick={assignStudents} className="w-full py-2 bg-[#2d7a50] text-white rounded-lg text-sm font-semibold hover:bg-[#235e3d] flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> Simpan Anggota
                  </button>
                )}
              </div>

              {/* Kanan: Daftar Anggota Terdaftar */}
              <div className="space-y-4">
                <h3 className="font-semibold text-layout-text text-sm flex items-center gap-2 pb-2 border-b border-layout-border">
                  <Users className="w-4 h-4 text-blue-600" />
                  Siswa Terdaftar ({enrolledStudents.length})
                </h3>
                <div className="border border-layout-border rounded-xl bg-layout-bg overflow-hidden h-[360px] flex flex-col">
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {enrolledStudents.length === 0 ? (
                      <p className="text-xs text-center p-4 text-layout-muted">Belum ada siswa yang ditambahkan ke grup ini.</p>
                    ) : (
                      enrolledStudents.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-layout-hover border border-transparent transition-colors">
                          <div>
                            <p className="text-sm font-semibold text-layout-text">{s.name}</p>
                            <p className="text-[10px] text-layout-muted">{s.school_class?.name || '-'} • {s.nisn || s.nis}</p>
                          </div>
                          <button onClick={() => removeStudent(selectedGroup.id, s.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md" title="Hapus dari grup">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </ActivityAdminLayout>
  );
}
