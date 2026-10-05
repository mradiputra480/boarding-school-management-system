import { useState, useRef } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { Upload, Shield, AlertTriangle, CheckCircle, FileArchive, X, HardDrive, RefreshCw } from 'lucide-react';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

interface UpdateResult {
  backup_filename: string | null;
  files_updated: number;
  files_skipped: string[];
  migration_output: string;
  cache_cleared: boolean;
  errors: string[];
}

export default function UpdatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<string>('');
  const [result, setResult] = useState<{ success: boolean; message: string; results: UpdateResult } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.name.endsWith('.zip')) {
        alertDialog('⚠️ Hanya file ZIP yang diterima.');
        return;
      }
      setFile(f);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.zip')) {
      setFile(f);
      setResult(null);
    } else {
      alertDialog('⚠️ Hanya file ZIP yang diterima.');
    }
  };

  const startUpdate = () => {
    if (!file) return;
    setShowConfirm(true);
  };

  const confirmUpdate = async () => {
    if (!file) return;
    setShowConfirm(false);
    setUploading(true);
    setProgress(0);
    setStep('Mengunggah file ZIP...');
    setResult(null);

    const fd = new FormData();
    fd.append('file', file);

    try {
      setProgress(10);
      setStep('Mengunggah file ZIP...');

      const r = await api.post('/admin/system/upload-update', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 min timeout for large updates
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded * 50) / e.total);
            setProgress(10 + pct);
            if (pct >= 50) setStep('Memproses update di server...');
          }
        },
      });

      setProgress(100);
      setStep('Selesai!');
      setResult({
        success: r.data.success,
        message: r.data.message,
        results: r.data.results,
      });
    } catch (err: any) {
      setProgress(100);
      setStep('Gagal!');
      setResult({
        success: false,
        message: err.response?.data?.message || 'Upload update gagal. Cek koneksi dan coba lagi.',
        results: err.response?.data?.results || {
          backup_filename: null,
          files_updated: 0,
          files_skipped: [],
          migration_output: '',
          cache_cleared: false,
          errors: [err.message],
        },
      });
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  };

  return (
    <AdminLayout title="System Update">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Warning Banner */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800 dark:text-amber-200">⚠️ Perhatian Sebelum Update</h3>
            <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
              <li>Database akan di-<strong>backup otomatis</strong> sebelum update diterapkan</li>
              <li>File <code className="bg-amber-100 dark:bg-amber-800/50 px-1 rounded">.env</code>, <code className="bg-amber-100 dark:bg-amber-800/50 px-1 rounded">storage/</code>, dan <code className="bg-amber-100 dark:bg-amber-800/50 px-1 rounded">database.sqlite</code> <strong>tidak akan ditimpa</strong></li>
              <li>Pastikan file ZIP berisi folder <code className="bg-amber-100 dark:bg-amber-800/50 px-1 rounded">backend/</code> dan/atau <code className="bg-amber-100 dark:bg-amber-800/50 px-1 rounded">frontend/dist/</code></li>
              <li>Migrasi database akan dijalankan otomatis setelah update</li>
            </ul>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="bg-layout-card rounded-2xl border border-layout-border overflow-hidden">
          <div className="p-5 border-b border-layout-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2d7a50]/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-[#2d7a50]" />
            </div>
            <div>
              <h3 className="font-bold text-layout-text">Upload File Update</h3>
              <p className="text-sm text-layout-muted">Pilih file ZIP yang berisi update sistem</p>
            </div>
          </div>

          <div className="p-6">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                ${file ? 'border-[#2d7a50] bg-[#2d7a50]/5' : 'border-layout-border hover:border-[#2d7a50] hover:bg-[#2d7a50]/5'}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input type="file" ref={fileRef} accept=".zip" className="hidden" onChange={handleFileChange} />
              {file ? (
                <div className="flex items-center justify-center gap-4">
                  <FileArchive className="w-10 h-10 text-[#2d7a50]" />
                  <div className="text-left">
                    <p className="font-bold text-layout-text">{file.name}</p>
                    <p className="text-sm text-layout-muted">{formatSize(file.size)}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}
                    className="ml-4 p-2 rounded-full hover:bg-layout-bg text-layout-muted"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-4xl mb-3">📦</div>
                  <p className="font-semibold text-[#2d7a50]">Klik atau Drag & Drop file ZIP disini</p>
                  <p className="text-xs text-layout-muted mt-1">Maksimal 200MB • Format: .zip</p>
                </>
              )}
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-layout-text flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#2d7a50]" />
                    {step}
                  </span>
                  <span className="text-sm font-bold text-[#2d7a50]">{progress}%</span>
                </div>
                <div className="w-full bg-layout-bg rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#2d7a50] to-[#3d9968] h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Button */}
            {file && !uploading && !result && (
              <button
                onClick={startUpdate}
                className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2d7a50] text-white rounded-xl font-bold text-sm hover:bg-[#1b6b43] transition-colors"
              >
                <Shield className="w-5 h-5" />
                Terapkan Update
              </button>
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-2xl border overflow-hidden ${
            result.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="p-5 border-b border-inherit flex items-center gap-3">
              {result.success
                ? <CheckCircle className="w-6 h-6 text-green-600" />
                : <AlertTriangle className="w-6 h-6 text-red-600" />}
              <div>
                <h3 className={`font-bold ${result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                  {result.message}
                </h3>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/60 dark:bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-[#2d7a50]">{result.results.files_updated}</p>
                  <p className="text-xs text-layout-muted">File Diperbarui</p>
                </div>
                <div className="bg-white/60 dark:bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{result.results.files_skipped.length}</p>
                  <p className="text-xs text-layout-muted">File Dilindungi</p>
                </div>
                <div className="bg-white/60 dark:bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{result.results.cache_cleared ? '✓' : '✗'}</p>
                  <p className="text-xs text-layout-muted">Cache Rebuilt</p>
                </div>
                <div className="bg-white/60 dark:bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-500">{result.results.errors.length}</p>
                  <p className="text-xs text-layout-muted">Error</p>
                </div>
              </div>

              {/* Backup Info */}
              {result.results.backup_filename && (
                <div className="flex items-center gap-2 p-3 bg-white/60 dark:bg-white/5 rounded-xl">
                  <HardDrive className="w-4 h-4 text-[#2d7a50]" />
                  <span className="text-sm">
                    Safety Backup: <code className="bg-green-100 dark:bg-green-800/50 px-2 py-0.5 rounded text-xs font-mono">{result.results.backup_filename}</code>
                  </span>
                </div>
              )}

              {/* Migration Output */}
              {result.results.migration_output && (
                <div>
                  <p className="text-xs font-semibold text-layout-muted mb-1 uppercase">Migration Output</p>
                  <pre className="bg-white/60 dark:bg-white/5 rounded-xl p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap text-layout-text">
                    {result.results.migration_output}
                  </pre>
                </div>
              )}

              {/* Errors */}
              {result.results.errors.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-1 uppercase">Errors</p>
                  <ul className="space-y-1">
                    {result.results.errors.map((err, i) => (
                      <li key={i} className="text-sm text-red-700 dark:text-red-300 bg-red-100/50 dark:bg-red-800/20 rounded p-2">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Upload another */}
              <button
                onClick={() => { setFile(null); setResult(null); if(fileRef.current) fileRef.current.value = ''; }}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-layout-card border border-layout-border text-layout-text rounded-xl font-semibold text-sm hover:bg-layout-hover transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Update Lain
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-200">
          <p className="font-semibold mb-1">📋 Cara Membuat File Update</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Develop dan test perubahan di komputer lokal</li>
            <li>Buat folder: <code className="bg-blue-100 dark:bg-blue-800/50 px-1 rounded">backend/</code> (kode Laravel) dan/atau <code className="bg-blue-100 dark:bg-blue-800/50 px-1 rounded">frontend/dist/</code> (build React)</li>
            <li>Kompres kedua folder menjadi file <strong>.zip</strong></li>
            <li>Upload file ZIP di halaman ini</li>
            <li>Sistem otomatis backup database → extract file → jalankan migrasi → rebuild cache</li>
          </ol>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-layout-card w-full max-w-[440px] rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-layout-border flex items-center gap-3">
              <Shield className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-layout-text">Konfirmasi Update Sistem</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-2">⚠️ Anda akan menerapkan update sistem:</p>
                <p className="text-xs">File: <strong>{file?.name}</strong> ({file ? formatSize(file.size) : ''})</p>
                <ul className="mt-2 text-xs space-y-1 list-disc list-inside">
                  <li>Database akan di-backup otomatis</li>
                  <li>File kode akan ditimpa (kecuali .env & storage)</li>
                  <li>Migrasi database akan dijalankan</li>
                  <li>Cache akan di-rebuild</li>
                </ul>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg"
                >
                  Batal
                </button>
                <button
                  onClick={confirmUpdate}
                  className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#1b6b43]"
                >
                  Ya, Terapkan Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
