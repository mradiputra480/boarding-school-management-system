import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TuLayout from '@/components/layouts/TuLayout';
import { BookOpen, Files, Award, Building2, LayoutDashboard } from 'lucide-react';
import { useSchoolStore } from '@/stores/schoolStore';
import { useLangStore } from '@/stores/langStore';
import { useAuthStore } from '@/stores/authStore';

export default function TuDashboardPage() {
  const navigate = useNavigate();
  const { profile: school, fetch: fetchSchool } = useSchoolStore();
  const { t } = useLangStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchSchool();
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <TuLayout title="Dashboard TU">
      <div className="flex flex-col gap-6">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-[#2d7a50] to-[#1b5e3a] rounded-2xl p-8 text-white flex justify-between items-center relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 opacity-10 w-64 h-64 bg-layout-card rounded-full -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-1/3 opacity-5 w-40 h-40 bg-layout-card rounded-full translate-y-1/2"></div>
          <div className="z-10 flex items-start gap-5">
            {school?.logoUrl ? (
              <img src={school.logoUrl} className="w-16 h-16 rounded-xl object-contain bg-layout-card/10 p-1.5 shrink-0 hidden sm:block" alt="Logo"/>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-layout-card/10 flex items-center justify-center shrink-0 hidden sm:block">
                <Building2 className="w-8 h-8 text-white/60"/>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold mb-1">{school?.name || 'IIS COMMUNITY CONNECT'}</h1>
              <p className="text-layout-muted text-sm max-w-lg leading-relaxed">
                Selamat datang di Portal Tata Usaha, <strong className="text-white">{user?.name}</strong>.
              </p>
              <p className="text-white/50 text-xs mt-3">{dateStr} • {timeStr} WIB</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div onClick={() => navigate('/tu/assessment-events')} className="bg-layout-card p-6 rounded-2xl border border-layout-border shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#3a8fd4]/10 text-[#3a8fd4] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-layout-muted text-[13px] font-medium">Manajemen Penilaian</p>
                <h3 className="text-xl font-bold text-layout-text">Event Penilaian</h3>
              </div>
            </div>
            <div className="text-xs text-layout-muted mt-2">
              Kelola nilai dan sertifikat kegiatan seperti TKA, ANBK, atau UAM.
            </div>
          </div>

          <div onClick={() => navigate('/tu/documents')} className="bg-layout-card p-6 rounded-2xl border border-layout-border shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#d4a23a]/10 text-[#d4a23a] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Files className="w-6 h-6" />
              </div>
              <div>
                <p className="text-layout-muted text-[13px] font-medium">Manajemen Dokumen</p>
                <h3 className="text-xl font-bold text-layout-text">Distribusi Dokumen</h3>
              </div>
            </div>
            <div className="text-xs text-layout-muted mt-2">
              Kelola dan distribusikan dokumen seperti Surat Keterangan Lulus (SKL) kepada siswa.
            </div>
          </div>
        </div>

      </div>
    </TuLayout>
  );
}
