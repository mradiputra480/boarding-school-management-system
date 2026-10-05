import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Eye, FileSignature, CheckCircle2, XCircle, Download } from 'lucide-react';
import ActivityAdminLayout from './ActivityAdminLayout';
import api from '@/lib/axios';
import { confirmDialog, alertDialog } from '@/lib/swal';

interface Props {
  type: 'digiart' | 'ekstra';
}

interface Assessment {
  id: number;
  activity_group_id: number;
  semester_id: number;
  title: string;
  description: string | null;
  published_at: string | null;
  created_at: string;
  activity_group: {
    id: number;
    name: string;
    teacher: { name: string } | null;
  };
  semester: {
    id: number;
    name: string;
  };
}

export default function ActivityAssessmentPage({ type }: Props) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [semesters, setSemesters] = useState<any[]>([]);
  
  // Modals state
  const [modalForm, setModalForm] = useState<boolean>(false);
  const [modalRecap, setModalRecap] = useState<boolean>(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [recapData, setRecapData] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    activity_group_ids: [] as string[],
    semester_id: '',
    description: ''
  });

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const [resAss, resGrp, resSem] = await Promise.all([
        api.get(`/teacher/${type}/assessments`),
        api.get(`/teacher/${type}/groups`),
        api.get('/teacher/activity/semesters')
      ]);
      setAssessments(resAss.data.data);
      setGroups(resGrp.data.data);
      setSemesters(resSem.data.data);
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal memuat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [type]);

  const activeSemester = semesters.find(s => s.status === 'Aktif') || semesters[0];

  const openFormModal = (a?: Assessment) => {
    if (a) {
      setSelectedAssessment(a);
      setFormData({
        title: a.title,
        activity_group_ids: [a.activity_group_id.toString()],
        semester_id: a.semester_id.toString(),
        description: a.description || ''
      });
    } else {
      setSelectedAssessment(null);
      setFormData({
        title: '',
        activity_group_ids: [],
        semester_id: activeSemester?.id?.toString() || '',
        description: ''
      });
    }
    setModalForm(true);
  };

  const saveAssessment = async () => {
    const finalSemesterId = formData.semester_id || activeSemester?.id?.toString();
    if (!formData.title || formData.activity_group_ids.length === 0 || !finalSemesterId) {
      return alertDialog('Judul, minimal 1 Grup, dan Semester wajib diisi.', 'error', 'Validasi Error');
    }
    try {
      const finalFormData = { ...formData, semester_id: finalSemesterId };
      if (selectedAssessment) {
        await api.put(`/teacher/${type}/assessments/${selectedAssessment.id}`, finalFormData);
        alertDialog('Event diperbarui', 'success', 'Berhasil');
      } else {
        await api.post(`/teacher/${type}/assessments`, finalFormData);
        alertDialog('Event dibuat', 'success', 'Berhasil');
      }
      setModalForm(false);
      fetchAssessments();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal');
    }
  };

  const deleteAssessment = async (id: number) => {
    const isConfirm = await confirmDialog('Nilai siswa yang terkait dengan event ini akan terhapus juga!', 'Hapus Event?', true);
    if (!isConfirm) return;
    try {
      await api.delete(`/teacher/${type}/assessments/${id}`);
      alertDialog('Event dihapus', 'success', 'Berhasil');
      fetchAssessments();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal menghapus');
    }
  };

  const togglePublish = async (a: Assessment) => {
    const isPublishing = !a.published_at;
    const msg = isPublishing 
      ? 'Buka akses pengisian nilai untuk pelatih/pembimbing?' 
      : 'Tutup akses pengisian nilai?';
    
    const isConfirm = await confirmDialog(msg, isPublishing ? 'Rilis Event?' : 'Tutup Event?');
    if (!isConfirm) return;

    try {
      await api.post(`/teacher/${type}/assessments/${a.id}/publish`, {
        is_published: isPublishing
      });
      alertDialog(isPublishing ? 'Akses dibuka' : 'Akses ditutup', 'success', 'Berhasil');
      fetchAssessments();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal');
    }
  };

  const openRecap = async (a: Assessment) => {
    try {
      const res = await api.get(`/teacher/${type}/assessments/${a.id}/recap`);
      setRecapData(res.data.data);
      setModalRecap(true);
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal');
    }
  };

  const title = `Event Penilaian ${type === 'digiart' ? 'Digiart' : 'Ekstrakurikuler'}`;
  const inputCls = "w-full h-[42px] bg-layout-bg border border-layout-border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d7a50] transition-all";
  const labelCls = "block text-[13px] font-semibold text-layout-text mb-1";

  return (
    <ActivityAdminLayout type={type} title={title}>
      <div className="bg-layout-bg border border-layout-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-layout-border flex justify-between items-center bg-layout-bg/50">
          <h2 className="text-lg font-bold text-layout-text flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-[#2d7a50]" />
            Daftar Event Penilaian
          </h2>
          <button onClick={() => openFormModal()} className="px-4 py-2 bg-[#2d7a50] text-white rounded-lg text-sm font-semibold hover:bg-[#235e3d] transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Buat Event
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-layout-muted">Memuat data...</div>
          ) : assessments.length === 0 ? (
            <div className="p-12 text-center text-layout-muted">Belum ada event penilaian.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-layout-bg border-b border-layout-border text-sm text-layout-muted">
                  <th className="px-6 py-4 font-semibold">Judul Event</th>
                  <th className="px-6 py-4 font-semibold">Grup & Pengajar</th>
                  <th className="px-6 py-4 font-semibold text-center">Status Form</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-layout-border">
                {assessments.map(a => (
                  <tr key={a.id} className="hover:bg-layout-hover transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-layout-text">{a.title}</div>
                      <div className="text-xs text-layout-muted line-clamp-1">{a.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-layout-text">{a.activity_group?.name}</div>
                      <div className="text-xs text-layout-muted">{a.activity_group?.teacher?.name || 'Tanpa Pelatih'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => togglePublish(a)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                          a.published_at 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {a.published_at ? (
                          <><CheckCircle2 className="w-4 h-4" /> DIBUKA</>
                        ) : (
                          <><XCircle className="w-4 h-4" /> DITUTUP</>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openRecap(a)} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                          <Eye className="w-4 h-4" /> Rekap
                        </button>
                        <button onClick={() => openFormModal(a)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteAssessment(a.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus">
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

      {/* Modal CRUD Event */}
      {modalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-layout-bg border border-layout-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-layout-border flex justify-between items-center bg-layout-bg">
              <h2 className="text-lg font-bold text-layout-text">{selectedAssessment ? 'Edit Event Penilaian' : 'Buat Event Penilaian'}</h2>
              <button onClick={() => setModalForm(false)} className="p-1.5 text-layout-muted hover:bg-layout-hover rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Judul Penilaian <span className="text-red-500">*</span></label>
                <input value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className={inputCls} placeholder="Misal: Penilaian Akhir Semester" />
              </div>
              <div>
                <label className={labelCls}>Grup Aktivitas <span className="text-red-500">*</span></label>
                {selectedAssessment ? (
                  <input type="text" disabled value={selectedAssessment.activity_group?.name} className={inputCls + ' opacity-50 cursor-not-allowed'} />
                ) : (
                  <div className="border border-layout-border rounded-lg p-3 max-h-[150px] overflow-y-auto space-y-2 bg-layout-bg">
                    <label className="flex items-center gap-2 cursor-pointer pb-2 border-b border-layout-border">
                      <input 
                        type="checkbox" 
                        className="rounded text-[#2d7a50] focus:ring-[#2d7a50]"
                        checked={formData.activity_group_ids.length === groups.length && groups.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, activity_group_ids: groups.map(g => g.id.toString())});
                          } else {
                            setFormData({...formData, activity_group_ids: []});
                          }
                        }}
                      />
                      <span className="text-sm font-bold">Pilih Semua</span>
                    </label>
                    {groups.map(g => (
                      <label key={g.id} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded text-[#2d7a50] focus:ring-[#2d7a50]"
                          value={g.id.toString()}
                          checked={formData.activity_group_ids.includes(g.id.toString())}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, activity_group_ids: [...formData.activity_group_ids, g.id.toString()]});
                            } else {
                              setFormData({...formData, activity_group_ids: formData.activity_group_ids.filter(id => id !== g.id.toString())});
                            }
                          }}
                        />
                        <span className="text-sm">{g.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {!!selectedAssessment && <p className="text-[10px] text-layout-muted mt-1">Grup tidak dapat diubah setelah event dibuat.</p>}
              </div>
              <div>
                <label className={labelCls}>Semester <span className="text-red-500">*</span></label>
                <select value={formData.semester_id} onChange={e=>setFormData({...formData, semester_id: e.target.value})} className={inputCls}>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name} - {s.year}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Deskripsi / Instruksi</label>
                <textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full h-[80px] bg-layout-bg border border-layout-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d7a50]" placeholder="Opsional..."></textarea>
              </div>
            </div>
            <div className="p-4 border-t border-layout-border flex justify-end gap-2 bg-layout-bg/50">
              <button onClick={() => setModalForm(false)} className="px-4 py-2 text-sm font-semibold text-layout-muted hover:bg-layout-hover rounded-lg">Batal</button>
              <button onClick={saveAssessment} className="px-4 py-2 bg-[#2d7a50] text-white rounded-lg text-sm font-semibold hover:bg-[#235e3d] flex items-center gap-2">
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rekap */}
      {modalRecap && recapData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-layout-bg border border-layout-border rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-layout-border flex justify-between items-center bg-layout-bg">
              <div>
                <h2 className="text-lg font-bold text-layout-text">Rekapitulasi: {recapData.title}</h2>
                <p className="text-sm text-layout-muted">Grup: {recapData.activity_group?.name}</p>
              </div>
              <button onClick={() => setModalRecap(false)} className="p-1.5 text-layout-muted hover:bg-layout-hover rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              {/* This is a simple display for admin. Actual input is done by instructor. */}
              <table className="w-full text-left border-collapse border border-layout-border">
                <thead>
                  <tr className="bg-layout-hover text-sm">
                    <th className="p-3 border border-layout-border">Siswa</th>
                    <th className="p-3 border border-layout-border text-center">Nilai Angka</th>
                    <th className="p-3 border border-layout-border text-center">Predikat</th>
                    <th className="p-3 border border-layout-border">Catatan / Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {recapData.activity_group?.members?.map((m: any) => {
                    // find grade
                    const grade = recapData.grades?.find((g: any) => g.student_id === m.student_id);
                    return (
                      <tr key={m.student_id} className="text-sm border-b border-layout-border hover:bg-layout-bg/50">
                        <td className="p-3 border-r border-layout-border">
                          <div className="font-semibold text-layout-text">{m.student?.name}</div>
                          <div className="text-[10px] text-layout-muted">{m.student?.school_class?.name}</div>
                        </td>
                        <td className="p-3 border-r border-layout-border text-center font-bold text-layout-text">
                          {grade?.grade ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-bold">{grade.grade}</span>
                          ) : '-'}
                        </td>
                        <td className="p-3 border-r border-layout-border text-center">
                          {/* Predicate is identical to grade in this schema */}
                          {grade?.grade || '-'}
                        </td>
                        <td className="p-3 border-r border-layout-border text-xs text-layout-muted italic">
                          {grade?.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {(!recapData.activity_group?.members || recapData.activity_group.members.length === 0) && (
                    <tr><td colSpan={4} className="p-6 text-center text-layout-muted">Belum ada siswa di grup ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-layout-border flex justify-end gap-2 bg-layout-bg/50">
              <button onClick={() => setModalRecap(false)} className="px-4 py-2 text-sm font-semibold bg-white border border-layout-border text-layout-text hover:bg-layout-hover rounded-lg">Tutup</button>
            </div>
          </div>
        </div>
      )}

    </ActivityAdminLayout>
  );
}
