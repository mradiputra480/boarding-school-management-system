import { useState, useEffect } from 'react';
import { CalendarCheck, Save, Search, AlertCircle } from 'lucide-react';
import InstructorLayout from './InstructorLayout';
import api from '@/lib/axios';
import { alertDialog } from '@/lib/swal';

interface Props {
  type: 'digiart' | 'ekstra';
}

export default function InstructorAttendancePage({ type }: Props) {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<Record<string, string>>({});
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [topic, setTopic] = useState<string>('');
  const [isOffDay, setIsOffDay] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, [type]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/teacher/instructor/${type}/groups`);
      const fetchedGroups = res.data.data;
      setGroups(fetchedGroups);
      if (fetchedGroups.length === 1) {
        handleSelectGroup(fetchedGroups[0].id.toString(), fetchedGroups);
      }
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal memuat grup');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = async (id: string, groupList = groups) => {
    setSelectedGroupId(id);
    if (!id) {
      setStudents([]);
      return;
    }
    
    try {
      setLoading(true);
      const group = groupList.find(g => g.id.toString() === id);
      setStudents(group?.members || []);
      
      const initialAtt: any = {};
      group?.members?.forEach((m: any) => {
        initialAtt[m.student_id] = 'hadir'; // Default hadir
      });
      setAttendances(initialAtt);
      
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal memuat siswa');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId: number, status: string) => {
    setAttendances(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const setAllAttendance = (status: string) => {
    const newAtt: any = {};
    students.forEach(s => {
      newAtt[s.student_id] = status;
    });
    setAttendances(newAtt);
  };

  const [saving, setSaving] = useState(false);

  const saveAttendance = async () => {
    if (!date) return alertDialog('Tanggal wajib diisi', 'error', 'Validasi Error');
    
    setSaving(true);
    try {
      if (isOffDay) {
        await api.post(`/teacher/${type}/attendances`, {
          activity_group_id: selectedGroupId,
          date,
          status: 'off',
          topic: 'Libur / Off Day',
          student_id: null
        });
      } else {
        // Send all attendances in a single bulk request
        const attendanceList = students.map(s => ({
          student_id: s.student_id,
          status: attendances[s.student_id] || 'hadir',
        }));
        await api.post(`/teacher/${type}/attendances`, {
          activity_group_id: selectedGroupId,
          date,
          topic,
          attendances: attendanceList,
        });
      }
      alertDialog('Presensi berhasil disimpan', 'success', 'Berhasil');
    } catch (err: any) {
      alertDialog(err.response?.data?.message || err.message, 'error', 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <InstructorLayout type={type} title={`Presensi ${type === 'digiart' ? 'Digiart' : 'Ekstrakurikuler'}`}>
      <div className="bg-layout-bg border border-layout-border rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-layout-text">Pilih Grup / Rombel</label>
            <select 
              value={selectedGroupId} 
              onChange={(e) => handleSelectGroup(e.target.value)}
              className="w-full h-[42px] bg-layout-bg border border-layout-border rounded-lg px-3 text-sm focus:ring-2 focus:ring-[#2d7a50]"
            >
              <option value="">-- Pilih Grup --</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-layout-text">Tanggal Pertemuan</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="w-full h-[42px] bg-layout-bg border border-layout-border rounded-lg px-3 text-sm focus:ring-2 focus:ring-[#2d7a50]"
            />
          </div>
        </div>

        {selectedGroupId && (
          <div className="border border-layout-border rounded-xl overflow-hidden">
            <div className="p-4 bg-layout-bg border-b border-layout-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-2 w-full md:w-1/2">
                <label className="text-sm font-semibold text-layout-text">Materi / Topik Pembelajaran</label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  disabled={isOffDay}
                  placeholder="Misal: Latihan Dasar Menendang"
                  className="w-full h-[38px] bg-layout-bg border border-layout-border rounded-lg px-3 text-sm focus:ring-2 focus:ring-[#2d7a50] disabled:opacity-50"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-red-50 text-red-700 px-3 py-2 rounded-lg border border-red-200">
                  <input type="checkbox" checked={isOffDay} onChange={e => setIsOffDay(e.target.checked)} className="w-4 h-4 text-red-600 rounded" />
                  <span className="text-sm font-bold">Tandai Libur (Off-Day)</span>
                </label>
                <button onClick={saveAttendance} disabled={saving} className="px-4 py-2 bg-[#2d7a50] text-white rounded-lg text-sm font-semibold hover:bg-[#235e3d] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>

            {!isOffDay ? (
              <div className="overflow-x-auto">
                <div className="p-3 bg-layout-hover border-b border-layout-border flex gap-2 justify-end">
                  <span className="text-sm font-semibold text-layout-text mr-4 flex items-center">Set Semua:</span>
                  <button onClick={() => setAllAttendance('hadir')} className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-bold hover:bg-green-200">Hadir</button>
                  <button onClick={() => setAllAttendance('sakit')} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold hover:bg-blue-200">Sakit</button>
                  <button onClick={() => setAllAttendance('izin')} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold hover:bg-yellow-200">Izin</button>
                  <button onClick={() => setAllAttendance('alpha')} className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200">Alpha</button>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-layout-hover text-sm">
                    <tr>
                      <th className="p-4 font-semibold">Nama Siswa</th>
                      <th className="p-4 font-semibold text-center w-[40%]">Status Kehadiran</th>
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
                          <div className="flex gap-2 justify-center">
                            {['hadir', 'sakit', 'izin', 'alpha'].map(status => (
                              <button
                                key={status}
                                onClick={() => handleAttendanceChange(s.student_id, status)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                                  attendances[s.student_id] === status
                                    ? status === 'hadir' ? 'bg-[#2d7a50] text-white' :
                                      status === 'sakit' ? 'bg-blue-600 text-white' :
                                      status === 'izin' ? 'bg-yellow-500 text-white' :
                                      'bg-red-600 text-white'
                                    : 'bg-layout-bg border border-layout-border text-layout-muted hover:bg-layout-hover'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={2} className="p-8 text-center text-layout-muted">Pilih grup terlebih dahulu.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-layout-text mb-2">Grup Diliburkan (Off-Day)</h3>
                <p className="text-sm text-layout-muted max-w-md">
                  Dengan menandai grup ini sebagai libur, maka pertemuan hari ini tidak akan dihitung masuk ke dalam persentase kehadiran siswa.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </InstructorLayout>
  );
}
