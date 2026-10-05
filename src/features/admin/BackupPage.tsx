import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { HardDrive, Download, Upload, RotateCcw, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface BackupItem {
  filename: string;
  size_human: string;
  created_at: string;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newBackup, setNewBackup] = useState<string | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/backups');
      setBackups(r.data.data || []);
    } catch { setMessage({ type: 'error', text: 'Gagal memuat daftar backup' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBackups(); }, []);

  const createBackup = async () => {
    setCreating(true); setMessage(null); setNewBackup(null);
    try {
      const r = await api.post('/admin/backups/create');
      setNewBackup(r.data.backup?.filename || r.data.filename);
      setMessage({ type: 'success', text: `✅ ${r.data.message} (${r.data.backup?.size || ''})` });
      fetchBackups();
    } catch (e: any) { setMessage({ type: 'error', text: e.response?.data?.message || 'Gagal membuat backup' }); }
    finally { setCreating(false); }
  };

  const downloadBackup = async (filename: string) => {
    try {
      const r = await api.post('/admin/backups/download', { filename }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      window.URL.revokeObjectURL(url);
    } catch { setMessage({ type: 'error', text: 'Gagal mengunduh backup' }); }
  };

  const restoreBackup = async (filename: string) => {
    if (!(await confirmDialog(`⚠️ RESTORE DATABASE\n\nFile: ${filename}\n\nSemua data saat ini akan diganti dengan data dari backup ini.\nBackup otomatis akan dibuat sebelum restore.\n\nLanjutkan?`, 'Konfirmasi', false))) return;
    setRestoring(filename); setMessage(null);
    try {
      const r = await api.post('/admin/backups/restore', { filename });
      setMessage({ type: 'success', text: `✅ ${r.data.message}. Safety backup: ${r.data.safety_backup}` });
      fetchBackups();
    } catch (e: any) { setMessage({ type: 'error', text: e.response?.data?.message || 'Restore gagal' }); }
    finally { setRestoring(null); }
  };

  const deleteBackup = async (filename: string) => {
    if (!(await confirmDialog(`Hapus backup: ${filename}?`, 'Konfirmasi', true))) return;
    try {
      await api.post('/admin/backups/delete', { filename });
      fetchBackups();
    } catch { setMessage({ type: 'error', text: 'Gagal menghapus' }); }
  };

  const uploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const r = await api.post('/admin/backups/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage({ type: 'success', text: `✅ ${r.data.message}` });
      fetchBackups();
    } catch (e: any) { setMessage({ type: 'error', text: e.response?.data?.message || 'Upload gagal' }); }
    e.target.value = '';
  };

  return (
    <AdminLayout title="Backup & Restore">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-layout-card rounded-2xl border border-layout-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#2d7a50]/10 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-[#2d7a50]" />
            </div>
            <div>
              <h3 className="font-bold text-layout-text">Database Backup & Restore</h3>
              <p className="text-sm text-layout-muted">Backup database sebelum update sistem atau kenaikan kelas</p>
            </div>
          </div>

          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button onClick={createBackup} disabled={creating} className="flex items-center gap-2 px-4 py-2.5 bg-[#2d7a50] text-white rounded-lg font-semibold text-sm hover:bg-[#3d9968] disabled:opacity-60 transition-colors">
              <HardDrive className="w-4 h-4" />
              {creating ? 'Membuat Backup...' : 'Buat Backup Sekarang'}
            </button>
            <label className="flex items-center gap-2 px-4 py-2.5 bg-layout-card text-layout-text border border-layout-border rounded-lg font-semibold text-sm hover:bg-layout-hover cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              Upload File Backup
              <input type="file" accept=".sql" className="hidden" onChange={uploadBackup} />
            </label>
          </div>
        </div>

        {/* Backup List */}
        <div className="bg-layout-card rounded-2xl border border-layout-border overflow-hidden">
          <div className="px-6 py-4 border-b border-layout-border">
            <h3 className="font-bold text-layout-text">Daftar Backup ({backups.length})</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-layout-muted">Memuat...</div>
          ) : backups.length === 0 ? (
            <div className="p-8 text-center text-layout-muted">Belum ada backup. Klik "Buat Backup Sekarang" untuk mulai.</div>
          ) : (
            <div className="divide-y divide-layout-border">
              {backups.map(b => (
                <div key={b.filename} className="px-6 py-4 flex items-center justify-between hover:bg-layout-hover/50 transition-colors">
                  <div>
                    <p className="font-medium text-layout-text text-sm">{b.filename}</p>
                    <p className="text-xs text-layout-muted mt-0.5">{b.size_human} • {b.created_at}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => downloadBackup(b.filename)} className="p-2 rounded-lg text-layout-muted hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => restoreBackup(b.filename)} disabled={restoring === b.filename} className="p-2 rounded-lg text-layout-muted hover:bg-amber-50 hover:text-amber-600 transition-colors disabled:opacity-50" title="Restore">
                      <RotateCcw className={`w-4 h-4 ${restoring === b.filename ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => deleteBackup(b.filename)} className="p-2 rounded-lg text-layout-muted hover:bg-red-50 hover:text-red-600 transition-colors" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-200">
          <p className="font-semibold mb-1">💡 Tips Backup</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Lakukan backup <strong>sebelum update sistem</strong> dan <strong>sebelum kenaikan kelas</strong></li>
            <li>Restore otomatis membuat safety backup sebelum mengganti data</li>
            <li>File backup disimpan di server: <code>storage/app/backups/</code></li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
