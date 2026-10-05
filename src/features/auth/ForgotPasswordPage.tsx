import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '@/lib/axios';

export default function ForgotPasswordPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call for forgot password
      await api.post('/auth/forgot-password', { identifier: emailOrUsername });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memproses permintaan. Pastikan akun terdaftar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f6] flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#2d7a50 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      ></div>

      {/* Card */}
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-[#e2e8e5] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-10 z-10 mx-4">
        
        {!isSuccess ? (
          <>
            <Link to="/login" className="inline-flex items-center text-[13px] text-[#3a8fd4] hover:underline mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Kembali ke Login
            </Link>

            <div className="flex flex-col items-center mt-2">
              <div className="w-12 h-12 rounded-full bg-[#edf7f1] flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-[#2d7a50]" />
              </div>
              <h1 className="font-bold text-[22px] text-[#1a2e24] text-center">Lupa Password?</h1>
              <p className="text-[#6b8a7d] text-[14px] text-center leading-relaxed mt-2">
                Masukkan email atau username yang terdaftar. Kami akan mengirimkan instruksi untuk mengatur ulang password Anda.
              </p>
            </div>

            {error && (
              <div className="bg-[#fef2f2] text-[#d45a5a] p-3 rounded-lg text-sm mt-6 border border-[#fecaca] text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-7">
              <div>
                <label className="block text-[13px] font-medium text-[#6b8a7d] mb-1.5">Email / Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-[#6b8a7d]" />
                  </div>
                  <input
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    required
                    className="w-full h-[46px] bg-[#f5f7f6] border border-[#e2e8e5] rounded-lg pl-11 pr-4 text-[14px] text-[#1a2e24] placeholder-[#a3b5ad] focus:outline-none focus:border-[#2d7a50] focus:ring-4 focus:ring-[#2d7a50]/10 transition-all"
                    placeholder="masukkan email / username terdaftar"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[48px] bg-[#2d7a50] text-white font-semibold text-[15px] tracking-wide uppercase rounded-lg hover:bg-[#3d9968] active:bg-[#1e5c38] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'MEMPROSES...' : 'KIRIM LINK RESET'}
              </button>
            </form>

            <p className="text-center text-[13px] text-[#6b8a7d] mt-4">
              Ingat password? <Link to="/login" className="text-[#3a8fd4] hover:underline">Masuk</Link>
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center mt-2">
              <div className="w-12 h-12 rounded-full bg-[#edf7f1] flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-[#2d7a50]" />
              </div>
              <h1 className="font-bold text-[22px] text-[#1a2e24] text-center">Instruksi Terkirim!</h1>
              <p className="text-[#6b8a7d] text-[14px] text-center leading-relaxed mt-2">
                Jika akun <strong>{emailOrUsername}</strong> terdaftar, kami telah mengirimkan instruksi ke kontak yang terkait. Silakan periksa pesan Anda.
              </p>
              <p className="text-[#d4953a] text-[13px] text-center mt-2">
                Link akan kadaluarsa dalam 60 menit.
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-7">
              <button
                onClick={() => setIsSuccess(false)}
                className="w-full h-[44px] bg-transparent border border-[#e2e8e5] text-[#6b8a7d] font-medium text-[14px] rounded-lg hover:bg-[#f5f7f6] transition-all flex items-center justify-center"
              >
                KIRIM ULANG
              </button>
              
              <Link
                to="/login"
                className="w-full h-[48px] bg-[#2d7a50] text-white font-semibold text-[15px] uppercase rounded-lg hover:bg-[#3d9968] active:bg-[#1e5c38] transition-all flex items-center justify-center"
              >
                KEMBALI KE LOGIN
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
