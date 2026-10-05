import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Loader2, Download, Filter } from 'lucide-react';
import api from '@/lib/axios';
import { alertDialog } from '@/lib/swal';
import ActivityAdminLayout from './ActivityAdminLayout';
import * as XLSX from 'xlsx';

export default function ActivityAdminRecapPage() {
  const location = useLocation();
  const type = location.pathname.includes('/digiart') ? 'digiart' : 'ekstra';
  
  const [loading, setLoading] = useState(false);
  const [filterBy, setFilterBy] = useState<'group' | 'class'>('group');
  const [selectedId, setSelectedId] = useState('');
  
  const [groups, setGroups] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchOptions();
  }, [type]);

  const fetchOptions = async () => {
    try {
      const [gRes, cRes] = await Promise.all([
        api.get(`/teacher/${type}/groups`),
        api.get(`/teacher/activity/classes`)
      ]);
      setGroups(gRes.data.data || []);
      setClasses(cRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedId) {
      fetchRecap();
    } else {
      setData([]);
    }
  }, [filterBy, selectedId, type]);

  const fetchRecap = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/teacher/${type}/recap`, { params: { filter_by: filterBy, id: selectedId } });
      setData(res.data.data || []);
    } catch (err) {
      alertDialog('Gagal mengambil rekapitulasi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) return;
    
    const excelData = data.map((row, idx) => ({
      'No': idx + 1,
      'NIM': row.student.nip || row.student.nisn || '-',
      'Nama Siswa': row.student.name,
      'Kelas': row.student.school_class?.name || '-',
      'Grup': row.group,
      'Persentase Kehadiran (%)': row.attendance_percentage,
      'Nilai (Predikat)': row.grade?.grade || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap");
    XLSX.writeFile(workbook, `Rekap_${type}_${filterBy}_${selectedId}.xlsx`);
  };

  return (
    <ActivityAdminLayout type={type} title={`Rekapitulasi ${type === 'digiart' ? 'Digiart' : 'Ekstrakurikuler'}`}>
      <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-layout-border bg-layout-bg flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="flex bg-layout-card rounded-lg border border-layout-border p-1 overflow-hidden">
              <button 
                onClick={() => { setFilterBy('group'); setSelectedId(''); }} 
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${filterBy === 'group' ? 'bg-[#2d7a50] text-white' : 'text-layout-muted hover:bg-layout-hover'}`}
              >
                Per Grup
              </button>
              <button 
                onClick={() => { setFilterBy('class'); setSelectedId(''); }} 
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${filterBy === 'class' ? 'bg-[#2d7a50] text-white' : 'text-layout-muted hover:bg-layout-hover'}`}
              >
                Per Kelas
              </button>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-layout-muted" />
              <select 
                value={selectedId} 
                onChange={e => setSelectedId(e.target.value)}
                className="pl-9 pr-8 py-2 bg-layout-card border border-layout-border rounded-lg text-sm w-full sm:w-64 focus:border-[#2d7a50] focus:ring-1 focus:ring-[#2d7a50]"
              >
                <option value="">-- Pilih {filterBy === 'group' ? 'Grup' : 'Kelas'} --</option>
                {filterBy === 'group' ? (
                  groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)
                ) : (
                  classes.map(c => <option key={c.id} value={c.id}>{c.level} {c.name}</option>)
                )}
              </select>
            </div>
          </div>

          <button onClick={handleExport} disabled={data.length === 0} className="flex items-center gap-2 px-4 py-2 bg-[#d4a23a] text-white rounded-lg text-sm font-semibold hover:bg-[#b0852e] transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#2d7a50]" />
            </div>
          ) : !selectedId ? (
            <div className="text-center p-12 text-layout-muted">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Pilih {filterBy === 'group' ? 'Grup' : 'Kelas'} terlebih dahulu untuk melihat rekapitulasi.</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center p-12 text-layout-muted">
              <p>Tidak ada data siswa ditemukan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-layout-bg border-y border-layout-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-layout-text">No</th>
                    <th className="px-4 py-3 font-semibold text-layout-text">Nama Siswa</th>
                    <th className="px-4 py-3 font-semibold text-layout-text">Grup</th>
                    <th className="px-4 py-3 font-semibold text-layout-text text-center">Kehadiran</th>
                    <th className="px-4 py-3 font-semibold text-layout-text text-center">Nilai (Predikat)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-layout-border">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-layout-bg/50">
                      <td className="px-4 py-3 text-layout-muted">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-layout-text">{row.student.name}</td>
                      <td className="px-4 py-3 text-layout-text">{row.group}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.attendance_percentage < 80 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {row.attendance_percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-layout-text">{row.grade?.grade || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ActivityAdminLayout>
  );
}
