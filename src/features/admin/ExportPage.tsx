import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { Download, FileSpreadsheet, FileJson, CheckCircle, Monitor } from 'lucide-react';

interface SemesterOption {
  id: number;
  name: string;
  year: string;
  status: string;
}

export default function ExportPage() {
  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | ''>('');
  const [exporting, setExporting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/academic/export-semesters').then(r => {
      setSemesters(r.data.data || []);
      const active = r.data.data?.find((s: SemesterOption) => s.status === 'active');
      if (active) setSelectedSemester(active.id);
    });
  }, []);

  const exportCSV = async () => {
    if (!selectedSemester) return;
    setExporting('csv'); setMessage(null);
    try {
      const r = await api.get(`/admin/academic/export-csv?semester_id=${selectedSemester}`, { responseType: 'blob' });
      const sem = semesters.find(s => s.id === selectedSemester);
      const filename = `IIS_Export_${sem?.name}_${sem?.year}_${new Date().toISOString().slice(0,10)}.csv`;
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      window.URL.revokeObjectURL(url);
      setMessage(`✅ CSV berhasil didownload: ${filename}`);
    } catch { setMessage('❌ Gagal export CSV'); }
    finally { setExporting(null); }
  };

  const exportJSON = async () => {
    if (!selectedSemester) return;
    setExporting('json'); setMessage(null);
    try {
      const r = await api.get(`/admin/academic/export?semester_id=${selectedSemester}`);
      const sem = semesters.find(s => s.id === selectedSemester);
      const filename = `IIS_Export_${sem?.name}_${sem?.year}_${new Date().toISOString().slice(0,10)}.json`;
      const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      window.URL.revokeObjectURL(url);
      setMessage(`✅ JSON berhasil didownload: ${filename}`);
    } catch { setMessage('❌ Gagal export JSON'); }
    finally { setExporting(null); }
  };

  const selectedSem = semesters.find(s => s.id === selectedSemester);

  return (
    <AdminLayout title="Export Data Akademik">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Semester Selector */}
        <div className="bg-layout-card rounded-2xl border border-layout-border p-6">
          <h3 className="font-bold text-layout-text mb-4">Pilih Semester</h3>
          <select
            value={selectedSemester}
            onChange={e => setSelectedSemester(Number(e.target.value))}
            className="w-full bg-layout-card border border-layout-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d7a50]/30"
          >
            <option value="">-- Pilih Semester --</option>
            {semesters.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} {s.year} {s.status === 'active' ? '(Aktif)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CSV Export */}
          <div className="bg-layout-card rounded-2xl border border-layout-border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-layout-text">Export CSV (Excel)</h3>
                <p className="text-xs text-layout-muted">Bisa dibuka di Excel/Google Sheets</p>
              </div>
            </div>
            <p className="text-sm text-layout-muted mb-4">
              Format tabel: Kelas, NISN, Nama, Nilai NA1-NA10, UAS, Project, Mapel, Attendance, Disiplin.
              Cocok untuk <strong>arsip cetak</strong> dan <strong>analisis data</strong>.
            </p>
            <button
              onClick={exportCSV}
              disabled={!selectedSemester || exporting === 'csv'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              {exporting === 'csv' ? 'Mengexport...' : 'Download CSV'}
            </button>
          </div>

          {/* JSON Export */}
          <div className="bg-layout-card rounded-2xl border border-layout-border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileJson className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-layout-text">Export JSON (Full Backup)</h3>
                <p className="text-xs text-layout-muted">Data lengkap terstruktur</p>
              </div>
            </div>
            <p className="text-sm text-layout-muted mb-4">
              Seluruh data akademik per siswa: nilai, attendance, disiplin, per kelas.
              Cocok untuk <strong>import ke sistem baru</strong> atau <strong>viewer offline</strong>.
            </p>
            <button
              onClick={exportJSON}
              disabled={!selectedSemester || exporting === 'json'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              {exporting === 'json' ? 'Mengexport...' : 'Download JSON'}
            </button>
          </div>
        </div>

        {/* Offline Viewer Download */}
        <div className="bg-layout-card rounded-2xl border border-layout-border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-layout-text">📥 Offline Viewer</h3>
              <p className="text-xs text-layout-muted">Buka data JSON tanpa server</p>
            </div>
          </div>
          <p className="text-sm text-layout-muted mb-4">
            File HTML standalone untuk melihat data export JSON <strong>tanpa perlu server</strong>.
            Cukup buka di browser, pilih file JSON, dan lihat seluruh data akademik lengkap.
          </p>
          <a
            href="/offline-viewer.html"
            download="IIS_Offline_Viewer.html"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-semibold text-sm hover:bg-purple-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Offline Viewer
          </a>
        </div>

        {message && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 text-sm">
            <CheckCircle className="w-4 h-4" />
            {message}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-200">
          <p className="font-semibold mb-1">📋 Kapan Harus Export?</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>Setiap akhir semester</strong> — arsip permanen sebelum pindah semester</li>
            <li><strong>Sebelum kenaikan kelas</strong> — backup data sebelum siswa dipromosikan</li>
            <li><strong>Sebelum update sistem</strong> — jaga-jaga jika ada masalah</li>
            <li>File JSON bisa dibuka offline dengan viewer tanpa perlu server</li>
          </ul>
        </div>

        {/* Data Retention Warning */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-200">
          <p className="font-semibold mb-1">⚠️ Kebijakan Retensi Data (3 Tahun)</p>
          <p className="text-xs mb-2">
            Untuk menjaga performa sistem, data akademik yang lebih lama dari <strong>3 tahun</strong> dapat
            di-purge secara manual oleh admin melalui terminal. Data yang di-purge meliputi: nilai (grades),
            presensi, kedisiplinan, dan rapor — <strong>data master siswa/guru tetap aman</strong>.
          </p>
          <div className="bg-amber-100/50 dark:bg-amber-800/30 rounded-lg p-3 text-xs font-mono">
            <p className="font-semibold mb-1 font-sans">💡 Sebelum purge, pastikan data sudah di-export!</p>
            <code>php artisan siakad:purge-old-data</code> — preview data lama<br/>
            <code>php artisan siakad:purge-old-data --force</code> — hapus permanen
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
