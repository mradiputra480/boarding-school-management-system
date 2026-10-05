import { useState, useEffect } from 'react';
import { Award, Save } from 'lucide-react';
import InstructorLayout from './InstructorLayout';
import api from '@/lib/axios';
import { alertDialog } from '@/lib/swal';

interface Props {
  type: 'digiart' | 'ekstra';
}

export default function InstructorGradingPage({ type }: Props) {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<string, {predicate: string, notes: string, portfolio_link: string}>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, [type]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/teacher/instructor/${type}/assessments`);
      // Only show published assessments for grading
      setAssessments(res.data.data.filter((a: any) => a.published_at !== null));
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal memuat event');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAssessment = async (id: string) => {
    setSelectedAssessmentId(id);
    if (!id) {
      setStudents([]);
      return;
    }
    
    try {
      setLoading(true);
      const res = await api.get(`/teacher/${type}/assessments/${id}/recap`);
      const groupData = res.data.data;
      
      setStudents(groupData.activity_group?.members || []);
      
      const initialGrades: any = {};
      groupData.grades?.forEach((g: any) => {
        initialGrades[g.student_id] = {
          predicate: g.grade || '',
          notes: g.notes || '',
          portfolio_link: g.portfolio_link || ''
        };
      });
      setGrades(initialGrades);
      
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal memuat siswa');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId: number, field: string, value: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { predicate: '', notes: '', portfolio_link: '' }),
        [field]: value
      }
    }));
  };

  const saveGrades = async () => {
    try {
      const payload = {
        grades: Object.entries(grades).map(([student_id, data]: any) => ({
          student_id: parseInt(student_id),
          predicate: data.predicate,
          notes: data.notes,
          portfolio_link: data.portfolio_link
        }))
      };
      
      await api.post(`/teacher/${type}/assessments/${selectedAssessmentId}/grades`, payload);
      alertDialog('Nilai berhasil disimpan', 'success', 'Berhasil');
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal menyimpan');
    }
  };

  return (
    <InstructorLayout type={type} title={`Input Nilai ${type === 'digiart' ? 'Digiart' : 'Ekstrakurikuler'}`}>
      <div className="bg-layout-bg border border-layout-border rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-layout-text">Pilih Event Penilaian</label>
          <select 
            value={selectedAssessmentId} 
            onChange={(e) => handleSelectAssessment(e.target.value)}
            className="w-full h-[42px] bg-layout-bg border border-layout-border rounded-lg px-3 text-sm focus:ring-2 focus:ring-[#2d7a50]"
          >
            <option value="">-- Pilih Event --</option>
            {assessments.map(a => (
              <option key={a.id} value={a.id}>{a.title} ({a.activity_group?.name})</option>
            ))}
          </select>
        </div>

        {selectedAssessmentId && (
          <div className="border border-layout-border rounded-xl overflow-hidden">
            <div className="p-4 bg-layout-bg border-b border-layout-border flex justify-between items-center">
              <h3 className="font-bold text-layout-text flex items-center gap-2">
                <Award className="w-5 h-5 text-[#2d7a50]" />
                Input Nilai Siswa
              </h3>
              <button onClick={saveGrades} className="px-4 py-2 bg-[#2d7a50] text-white rounded-lg text-sm font-semibold hover:bg-[#235e3d] flex items-center gap-2">
                <Save className="w-4 h-4" /> Simpan Nilai
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-layout-hover text-sm">
                  <tr>
                    <th className="p-4 font-semibold w-[40%]">Nama Siswa</th>
                    <th className="p-4 font-semibold w-[15%]">Predikat (A/B/C/D)</th>
                    <th className="p-4 font-semibold w-[20%]">Link Portofolio (GDrive)</th>
                    <th className="p-4 font-semibold w-[25%]">Catatan Khusus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-layout-border text-sm">
                  {students.length > 0 ? students.map(s => (
                    <tr key={s.student_id}>
                      <td className="p-4">
                        <div className="font-semibold">{s.student?.name}</div>
                        <div className="text-xs text-layout-muted">{s.student?.school_class?.name}</div>
                      </td>

                      <td className="p-4">
                        <select 
                          value={grades[s.student_id]?.predicate || ''}
                          onChange={e => handleGradeChange(s.student_id, 'predicate', e.target.value)}
                          className="w-full p-2 border border-layout-border rounded focus:ring-[#2d7a50]"
                        >
                          <option value="">-</option>
                          <option value="A">A (Sangat Baik)</option>
                          <option value="B">B (Baik)</option>
                          <option value="C">C (Cukup)</option>
                          <option value="D">D (Kurang)</option>
                          <option value="E">E (Sangat Kurang)</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <input type="text" 
                          value={grades[s.student_id]?.portfolio_link || ''}
                          onChange={e => handleGradeChange(s.student_id, 'portfolio_link', e.target.value)}
                          className="w-full p-2 border border-layout-border rounded focus:ring-[#2d7a50]" 
                          placeholder="https://drive.google.com/..." />
                      </td>
                      <td className="p-4">
                        <input type="text" 
                          value={grades[s.student_id]?.notes || ''}
                          onChange={e => handleGradeChange(s.student_id, 'notes', e.target.value)}
                          className="w-full p-2 border border-layout-border rounded focus:ring-[#2d7a50]" 
                          placeholder="Catatan..." />
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="p-8 text-center text-layout-muted">Pilih event terlebih dahulu.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </InstructorLayout>
  );
}
