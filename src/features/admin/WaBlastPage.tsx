import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { Send, History, AlertCircle, CheckCircle2, MessageSquare, KeyRound, Eye, EyeOff, Info } from 'lucide-react';

interface ClassData {
  id: number;
  name: string;
}

interface WaLog {
  id: number;
  student_id: number;
  student_name: string;
  message: string;
  status: string;
  sent_at: string;
  created_at: string;
}

export default function WaBlastPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [logs, setLogs] = useState<WaLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  
  const [targetType, setTargetType] = useState<'all' | 'class'>('all');
  const [classId, setClassId] = useState<number | ''>('');
  const [message, setMessage] = useState('');
  
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchClasses();
    fetchLogs();
    fetchToken();
  }, []);

  const fetchToken = async () => {
    try {
      const { data } = await api.get('/admin/wa-blast/token');
      setToken(data.token || '');
    } catch (err) {
      console.error('Failed to fetch token', err);
    }
  };

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingToken(true);
    try {
      await api.post('/admin/wa-blast/token', { token });
      showToast('success', 'Token berhasil disimpan');
    } catch (err) {
      showToast('error', 'Gagal menyimpan token');
    } finally {
      setSavingToken(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/admin/classes');
      setClasses(data.data || []);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  };

  const fetchLogs = async () => {
    setFetchingLogs(true);
    try {
      const { data } = await api.get('/admin/wa-blast/logs');
      setLogs(data.data || []);
    } catch (err) {
      console.error('Failed to fetch WA logs', err);
    } finally {
      setFetchingLogs(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast('error', 'Pesan tidak boleh kosong');
      return;
    }
    if (targetType === 'class' && !classId) {
      showToast('error', 'Pilih kelas tujuan');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/admin/wa-blast', {
        target_type: targetType,
        class_id: classId || null,
        message: message,
      });
      
      showToast('success', data.message);
      setMessage('');
      fetchLogs(); // refresh logs
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Gagal mengirim WA Blast');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, message: msg });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <AdminLayout title="WA Blast">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-6 p-4 rounded-lg shadow-lg flex items-center gap-3 z-50 text-white animate-in slide-in-from-right-4 ${
          toast.type === 'success' ? 'bg-[#2d7a50]' : 'bg-red-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form & Token */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Token Settings Section */}
          <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-layout-border bg-layout-hover/50">
              <h2 className="font-semibold flex items-center gap-2 text-layout-text">
                <KeyRound className="w-5 h-5 text-amber-500" />
                Konfigurasi Token Fonnte
              </h2>
            </div>
            <form onSubmit={handleSaveToken} className="p-5 space-y-4">
              
              <div className="text-xs text-layout-muted bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800">
                <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5"><Info className="w-3.5 h-3.5"/> Cara Mendapatkan Token:</p>
                <ol className="list-decimal list-inside space-y-0.5 ml-1">
                  <li>Login ke <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-amber-600 font-medium hover:underline">Fonnte</a></li>
                  <li>Buka menu <b>Devices</b> &gt; <b>Add Device</b></li>
                  <li>Scan QR WhatsApp Anda</li>
                  <li>Copy Token perangkat dan paste di bawah ini</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-layout-text mb-1.5">API Token Perangkat</label>
                <div className="relative">
                  <input 
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Contoh: A1b2C3d4E5f6G7h8I9j0"
                    className="w-full rounded-lg border border-layout-border bg-layout-bg px-3 py-2 pr-10 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-layout-muted hover:text-layout-text p-1"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button 
                type="submit"
                disabled={savingToken}
                className="w-full flex justify-center items-center gap-2 bg-amber-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-70"
              >
                {savingToken ? 'Menyimpan...' : 'Simpan Token'}
              </button>
            </form>
          </div>

          {/* Form Section */}
          <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-layout-border bg-layout-hover/50">
              <h2 className="font-semibold flex items-center gap-2 text-layout-text">
                <Send className="w-5 h-5 text-[#2d7a50]" />
                Kirim Pesan Massal
              </h2>
            </div>
            
            <form onSubmit={handleSend} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-layout-text mb-1.5">Tujuan</label>
                <select 
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as 'all' | 'class')}
                  className="w-full rounded-lg border border-layout-border bg-layout-bg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50] focus:ring-1 focus:ring-[#2d7a50]"
                >
                  <option value="all">Semua Orang Tua</option>
                  <option value="class">Orang Tua per Kelas</option>
                </select>
              </div>

              {targetType === 'class' && (
                <div>
                  <label className="block text-sm font-medium text-layout-text mb-1.5">Pilih Kelas</label>
                  <select 
                    value={classId}
                    onChange={(e) => setClassId(Number(e.target.value))}
                    className="w-full rounded-lg border border-layout-border bg-layout-bg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50] focus:ring-1 focus:ring-[#2d7a50]"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-layout-text mb-1.5 flex justify-between">
                  <span>Isi Pesan</span>
                </label>
                <div className="mb-2 text-xs text-layout-muted bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800">
                  <span className="font-semibold text-blue-700 dark:text-blue-400">Variabel yang tersedia:</span><br/>
                  <code className="text-[#2d7a50]">{'{nama_siswa}'}</code>, <code className="text-[#2d7a50]">{'{nisn}'}</code>, <code className="text-[#2d7a50]">{'{username}'}</code> (NISN), <code className="text-[#2d7a50]">{'{password}'}</code> (parents123)
                </div>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Ketik pesan WhatsApp di sini..."
                  className="w-full rounded-lg border border-layout-border bg-layout-bg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50] focus:ring-1 focus:ring-[#2d7a50] resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 bg-[#2d7a50] text-white py-2.5 px-4 rounded-lg font-medium hover:bg-[#3d9968] transition-colors disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5" />
                    Kirim WA Blast
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Logs Section */}
        <div className="lg:col-span-2">
          <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-layout-border bg-layout-hover/50 flex justify-between items-center">
              <h2 className="font-semibold flex items-center gap-2 text-layout-text">
                <History className="w-5 h-5 text-layout-muted" />
                Riwayat Pengiriman (WA Logs)
              </h2>
              <button 
                onClick={fetchLogs}
                disabled={fetchingLogs}
                className="text-xs text-[#2d7a50] hover:underline font-medium"
              >
                {fetchingLogs ? 'Memuat...' : 'Refresh'}
              </button>
            </div>
            
            <div className="flex-1 p-0 overflow-auto min-h-[400px]">
              {fetchingLogs && logs.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-layout-muted text-sm">
                  Memuat riwayat...
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-layout-muted">
                  <History className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Belum ada riwayat pengiriman.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-layout-hover/50 text-layout-muted sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-medium">Waktu</th>
                      <th className="px-4 py-3 font-medium">Siswa</th>
                      <th className="px-4 py-3 font-medium">Pesan</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-layout-border">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-layout-hover/30 transition-colors">
                        <td className="px-4 py-3 text-layout-muted text-xs">
                          {new Date(log.created_at).toLocaleString('id-ID', {
                            dateStyle: 'short', timeStyle: 'short'
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium text-layout-text">
                          {log.student_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-layout-muted text-xs max-w-xs truncate" title={log.message}>
                          {log.message}
                        </td>
                        <td className="px-4 py-3">
                          {log.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Sukses
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium">
                              <AlertCircle className="w-3 h-3" /> Gagal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
