import { useState, useEffect } from 'react';
import ParentLayout from '@/components/layouts/ParentLayout';
import api from '@/lib/axios';
import { GraduationCap, AlertCircle, PartyPopper, CheckCircle2, Mail, Lock, Award } from 'lucide-react';
import { useParentStore } from '@/stores/parentStore';
import { useSchoolStore } from '@/stores/schoolStore';

export default function ParentGraduation() {
  const { child } = useParentStore();
  const { profile: schoolProfile } = useSchoolStore();
  const [data, setData] = useState<{ graduation_announced: boolean; graduation_status: string; graduation_message: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    (async () => {
      try { 
        const res = await api.get('/parent/graduation'); 
        setData(res.data); 
      }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleReveal = () => {
    setIsAnimating(true);
    // Add a slight suspense delay
    setTimeout(() => {
      setIsRevealed(true);
      setIsAnimating(false);
    }, 1500);
  };

  if (loading) return <ParentLayout title="Kelulusan"><div className="flex items-center justify-center h-64 text-layout-muted">Memuat...</div></ParentLayout>;

  return (
    <ParentLayout title="Kelulusan">
      <div className="max-w-4xl mx-auto mt-8">
        {!data?.graduation_announced ? (
          <div className="bg-layout-card border border-layout-border rounded-xl p-12 shadow-sm text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-layout-bg rounded-full flex items-center justify-center mb-6 border border-layout-border">
              <AlertCircle className="w-10 h-10 text-layout-muted" />
            </div>
            <h2 className="text-xl font-bold text-layout-text mb-2">Pengumuman Belum Tersedia</h2>
            <p className="text-layout-muted max-w-md">
              Pengumuman kelulusan untuk {child?.name} belum dipublikasikan oleh pihak sekolah. Silakan kembali lagi nanti.
            </p>
          </div>
        ) : !isRevealed ? (
          // Suspense Reveal State
          <div className="relative overflow-hidden bg-layout-card border border-[#d4a23a]/50 rounded-2xl p-12 sm:p-20 shadow-2xl text-center flex flex-col items-center group cursor-pointer transition-transform hover:scale-[1.02]" onClick={handleReveal}>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#1a1a1a] to-black opacity-90 rounded-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay pointer-events-none" />
            
            <div className={`relative z-10 w-32 h-32 mb-8 rounded-full flex items-center justify-center transition-all duration-1000 ${isAnimating ? 'animate-ping bg-[#d4a23a]/50' : 'bg-gradient-to-br from-[#d4a23a] to-yellow-600 shadow-[0_0_40px_rgba(212,162,58,0.5)]'}`}>
              {isAnimating ? <Lock className="w-12 h-12 text-white animate-pulse" /> : <Mail className="w-16 h-16 text-white group-hover:scale-110 transition-transform duration-300" />}
            </div>

            <div className="relative z-10 text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#d4a23a] via-yellow-300 to-[#d4a23a] mb-4 uppercase tracking-widest drop-shadow-lg">
                Dokumen Rahasia
              </h2>
              <p className="text-lg text-white/90 font-medium mb-8">
                Hasil Kelulusan {child?.name}
              </p>
              
              <button 
                className={`px-8 py-4 rounded-full font-bold text-lg uppercase tracking-wider transition-all duration-300 ${
                  isAnimating 
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed scale-95' 
                    : 'bg-gradient-to-r from-[#d4a23a] to-yellow-600 text-white shadow-lg shadow-[#d4a23a]/30 hover:shadow-[#d4a23a]/50 hover:scale-105'
                }`}
                disabled={isAnimating}
              >
                {isAnimating ? 'MEMBUKA SEGEL...' : 'KETUK UNTUK MEMBUKA'}
              </button>
            </div>
          </div>
        ) : (
          // Revealed Certificate-like State
          <div className="w-full overflow-x-auto pb-6 custom-scrollbar animate-fade-in-up">
            <div className="relative min-w-[700px] bg-[#fdfbf7] border-[12px] border-double border-[#d4a23a]/80 shadow-2xl rounded-sm p-4 sm:p-8 mx-auto">
              
              {/* Background Texture Layer (Separated to prevent mix-blend issues with children) */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/rice-paper.png')] opacity-60 mix-blend-multiply pointer-events-none" />

              {/* Inner Content Container */}
              <div className="relative z-10 border border-[#d4a23a]/40 p-8 sm:p-12 text-center flex flex-col items-center h-full bg-white/40">
                
                {/* Logo Top */}
                <div className="mb-8 relative z-20">
                  {schoolProfile?.logoUrl ? (
                    <img src={schoolProfile.logoUrl} alt="Logo Sekolah" className="w-24 h-24 mx-auto object-contain drop-shadow-sm" />
                  ) : (
                    <Award className="w-24 h-24 mx-auto text-[#d4a23a] drop-shadow-sm" />
                  )}
                </div>

                <p className="text-sm sm:text-base font-semibold text-[#8b6b22] uppercase tracking-[0.3em] mb-4">
                  Pengumuman Kelulusan
                </p>

                <h1 className={`text-4xl sm:text-6xl font-black text-transparent bg-clip-text drop-shadow-sm mb-10 font-serif uppercase ${
                  data.graduation_status === 'lulus' 
                    ? 'bg-gradient-to-r from-[#b38728] via-[#d4a23a] to-[#b38728]' 
                    : data.graduation_status === 'ditahan'
                    ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600'
                    : 'bg-gradient-to-r from-red-700 via-red-600 to-red-700'
                }`}>
                  {data.graduation_status === 'lulus' ? 'Selamat Lulus!' : data.graduation_status === 'ditahan' ? 'Status Ditahan' : 'Tidak Lulus'}
                </h1>

                <p className="text-gray-600 text-sm sm:text-base mb-3 italic font-serif">Diberikan kepada:</p>
                
                {/* Solid Name Box */}
                <div className="relative z-20 bg-white px-12 py-4 rounded-lg shadow-md border border-[#d4a23a]/30 mb-10 inline-block">
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 font-serif">
                    {child?.name}
                  </h2>
                </div>

                <div className="space-y-6 flex flex-col items-center w-full max-w-2xl relative z-20">
                  {/* Solid Status Box */}
                  {data.graduation_status === 'lulus' ? (
                    <div className="inline-flex items-center gap-3 px-8 py-4 bg-green-600 text-white rounded-full font-bold shadow-lg border border-green-500">
                      <CheckCircle2 className="w-7 h-7" />
                      <span className="text-lg tracking-wide uppercase">Telah Memenuhi Syarat Kelulusan</span>
                    </div>
                  ) : data.graduation_status === 'ditahan' ? (
                    <div className="inline-flex items-center gap-3 px-8 py-4 bg-amber-500 text-white rounded-full font-bold shadow-lg border border-amber-400">
                      <AlertCircle className="w-7 h-7" />
                      <span className="text-lg tracking-wide uppercase">Kelulusan Ditunda Sementara</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-3 px-8 py-4 bg-red-600 text-white rounded-full font-bold shadow-lg border border-red-500">
                      <AlertCircle className="w-7 h-7" />
                      <span className="text-lg tracking-wide uppercase">Belum Memenuhi Syarat Kelulusan</span>
                    </div>
                  )}

                  {data.graduation_message && (
                    <div className={`mt-8 p-6 bg-white border rounded-xl text-gray-800 shadow-md w-full relative ${
                      data.graduation_status === 'lulus' ? 'border-[#d4a23a]/30' : data.graduation_status === 'ditahan' ? 'border-amber-400/30' : 'border-red-500/30'
                    }`}>
                      {data.graduation_status === 'lulus' ? (
                        <PartyPopper className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 text-[#d4a23a] bg-white px-1" />
                      ) : (
                        <AlertCircle className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white px-1 ${
                          data.graduation_status === 'ditahan' ? 'text-amber-500' : 'text-red-600'
                        }`} />
                      )}
                      <p className="text-lg font-medium leading-relaxed italic mt-2">"{data.graduation_message}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ParentLayout>
  );
}
