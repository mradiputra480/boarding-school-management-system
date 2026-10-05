import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { RefreshCw, GraduationCap, ArrowRight, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface PromotionItem {
  from_class_id: number;
  from_class_name: string;
  from_level: string;
  students_count: number;
  action: string;
  suggested_to_class_id: number | null;
  suggested_to_class_name: string | null;
  available_targets: { id: number; name: string }[];
}

export default function PromotionPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [promotionMap, setPromotionMap] = useState<PromotionItem[]>([]);
  const [targetMapping, setTargetMapping] = useState<Record<number, number | null>>({});
  const [newYear, setNewYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Step 1: Load promotion map
  const loadMap = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/academic/promotion-map');
      const map = r.data.data || [];
      setPromotionMap(map);
      // Pre-fill with suggestions
      const defaults: Record<number, number | null> = {};
      map.forEach((m: PromotionItem) => {
        defaults[m.from_class_id] = m.action === 'graduate' ? null : m.suggested_to_class_id;
      });
      setTargetMapping(defaults);
    } catch { setMessage({ type: 'error', text: 'Gagal memuat data kelas' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadMap(); }, []);

  // Step 2: Create new academic year
  const createNewYear = async () => {
    if (!newYear || !startDate) { setMessage({ type: 'error', text: 'Isi tahun ajaran dan tanggal mulai' }); return; }
    setLoading(true); setMessage(null);
    try {
      const r = await api.post('/admin/academic/new-year', { year: newYear, start_date: startDate });
      setMessage({ type: 'success', text: r.data.message });
      setStep(3);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Gagal membuat tahun ajaran' });
    }
    finally { setLoading(false); }
  };

  // Step 3: Promote students
  const promoteStudents = async () => {
    const target_classes = promotionMap.map(m => ({
      from_class_id: m.from_class_id,
      to_class_id: targetMapping[m.from_class_id] ?? null,
    }));

    if (!(await confirmDialog('⚠️ KENAIKAN KELAS\n\nProses ini akan:\n- Memindahkan siswa ke kelas berikutnya\n- Meluluskan siswa kelas IX\n- Menonaktifkan akun orang tua siswa lulus\n\nPastikan Anda sudah EXPORT DATA dan BACKUP sebelum melanjutkan.\n\nLanjutkan?', 'Konfirmasi', false))) return;

    setLoading(true); setMessage(null);
    try {
      const r = await api.post('/admin/academic/promote-students', { target_classes });
      setResult(r.data);
      setMessage({ type: 'success', text: `✅ ${r.data.message}` });
    } catch (e: any) { setMessage({ type: 'error', text: e.response?.data?.message || 'Gagal memproses kenaikan kelas' }); }
    finally { setLoading(false); }
  };

  const totalPromote = promotionMap.filter(m => m.action === 'promote').reduce((s, m) => s + m.students_count, 0);
  const totalGraduate = promotionMap.filter(m => m.action === 'graduate').reduce((s, m) => s + m.students_count, 0);

  return (
    <AdminLayout title="Kenaikan Kelas & Tahun Ajaran Baru">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 bg-layout-card rounded-2xl border border-layout-border p-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-[#2d7a50] text-white' : 'bg-layout-hover text-layout-muted'}`}>
                {s}
              </div>
              <span className={`text-sm font-medium ${step >= s ? 'text-layout-text' : 'text-layout-muted'}`}>
                {s === 1 ? 'Mapping Kelas' : s === 2 ? 'Tahun Ajaran Baru' : 'Eksekusi'}
              </span>
              {s < 3 && <ArrowRight className="w-4 h-4 text-layout-muted ml-auto" />}
            </div>
          ))}
        </div>

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {/* Step 1: Mapping */}
        {step === 1 && (
          <div className="bg-layout-card rounded-2xl border border-layout-border overflow-hidden">
            <div className="px-6 py-4 border-b border-layout-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-layout-text">Mapping Kenaikan Kelas</h3>
                <p className="text-sm text-layout-muted">
                  <span className="text-[#2d7a50] font-semibold">{totalPromote} siswa</span> naik kelas •
                  <span className="text-amber-600 font-semibold ml-1">{totalGraduate} siswa</span> lulus
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-layout-muted">Memuat...</div>
            ) : (
              <div className="divide-y divide-layout-border">
                {promotionMap.map(item => (
                  <div key={item.from_class_id} className="px-6 py-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-layout-text">{item.from_class_name}</span>
                        <span className="text-xs text-layout-muted bg-layout-hover px-2 py-0.5 rounded-full">{item.students_count} siswa</span>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-layout-muted shrink-0" />

                    <div className="flex-1">
                      {item.action === 'graduate' ? (
                        <div className="flex items-center gap-2 text-amber-600">
                          <GraduationCap className="w-4 h-4" />
                          <span className="font-semibold text-sm">LULUS</span>
                        </div>
                      ) : (
                        <select
                          value={targetMapping[item.from_class_id] ?? ''}
                          onChange={e => setTargetMapping(prev => ({ ...prev, [item.from_class_id]: Number(e.target.value) || null }))}
                          className="w-full bg-layout-card border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d7a50]/30"
                        >
                          <option value="">-- Pilih Kelas Tujuan --</option>
                          {item.available_targets.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="px-6 py-4 border-t border-layout-border flex justify-end">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 px-5 py-2.5 bg-[#2d7a50] text-white rounded-lg font-semibold text-sm hover:bg-[#3d9968] transition-colors">
                Lanjut: Buat Tahun Ajaran <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: New Year */}
        {step === 2 && (
          <div className="bg-layout-card rounded-2xl border border-layout-border p-6">
            <h3 className="font-bold text-layout-text mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#2d7a50]" />
              Buat Tahun Ajaran Baru
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-layout-text mb-1 uppercase">Tahun Ajaran</label>
                <input
                  value={newYear}
                  onChange={e => setNewYear(e.target.value)}
                  placeholder="Contoh: 2026/2027"
                  className="w-full bg-layout-card border border-layout-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d7a50]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-layout-text mb-1 uppercase">Tanggal Mulai Semester Ganjil</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-layout-card border border-layout-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d7a50]/30"
                />
              </div>
            </div>
            <p className="text-sm text-layout-muted mb-4">
              Sistem akan membuat 2 semester: <strong>Ganjil</strong> (aktif) dan <strong>Genap</strong> (belum aktif).
              Semester lama otomatis dinonaktifkan.
            </p>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 text-layout-muted hover:bg-layout-hover rounded-lg font-semibold text-sm transition-colors">
                ← Kembali
              </button>
              <button onClick={createNewYear} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#2d7a50] text-white rounded-lg font-semibold text-sm hover:bg-[#3d9968] disabled:opacity-60 transition-colors">
                {loading ? 'Membuat...' : 'Buat Tahun Ajaran'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Execute Promotion */}
        {step === 3 && (
          <div className="bg-layout-card rounded-2xl border border-layout-border p-6">
            <h3 className="font-bold text-layout-text mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[#2d7a50]" />
              Eksekusi Kenaikan Kelas
            </h3>

            {result ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{result.promoted}</p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">Siswa Naik Kelas</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{result.graduated}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Siswa Lulus</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{result.deactivated_parents}</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Akun Ortu Nonaktif</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-semibold mb-1">Pastikan sebelum eksekusi:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>✅ Sudah export data akademik semester ini</li>
                        <li>✅ Sudah backup database</li>
                        <li>✅ Mapping kelas sudah benar</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-layout-muted mb-4">
                  <strong>{totalPromote}</strong> siswa akan naik kelas •
                  <strong className="ml-1">{totalGraduate}</strong> siswa akan lulus •
                  Akun orang tua siswa lulus otomatis nonaktif
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep(2)} className="px-5 py-2.5 text-layout-muted hover:bg-layout-hover rounded-lg font-semibold text-sm transition-colors">
                    ← Kembali
                  </button>
                  <button onClick={promoteStudents} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 disabled:opacity-60 transition-colors">
                    {loading ? 'Memproses...' : '🎓 Eksekusi Kenaikan Kelas'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
