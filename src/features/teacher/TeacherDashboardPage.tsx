import { useState, useEffect } from 'react';
import TeacherLayout from '@/components/layouts/TeacherLayout';
import api from '@/lib/axios';
import { BookOpen, Users, Briefcase, CalendarDays, Loader2 } from 'lucide-react';



import { useLangStore } from '@/stores/langStore';

import { useTeacherStore } from '@/stores/teacherStore';
import TeacherScheduleTable from './TeacherScheduleTable';

export default function TeacherDashboardPage() {
  const { t } = useLangStore();
  const { profile, loading, fetch } = useTeacherStore();

  useEffect(() => {
    fetch();
  }, []);

  // Extract unique subjects taught from schedules
  const subjectsTaught = Array.from(new Set(profile?.schedules?.map(s => s.subject?.name).filter(Boolean)));

  if (loading) {
    return (
      <TeacherLayout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#2d7a50]" />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Dashboard">
      <div className="space-y-6">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-[#2d7a50] to-[#1a4a30] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden print:hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30 shrink-0 overflow-hidden">
               {profile?.photo_url ? (
                 <img src={`${profile.photo_url}?v=${Date.now()}`} alt={profile.name} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-4xl font-bold">{profile?.name?.charAt(0)}</span>
               )}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('teacher.welcome') || 'Selamat Datang'}, {profile?.name}</h1>
              <p className="text-white/80 font-medium text-sm sm:text-base mb-4">
                NIP/NIK: {profile?.nip || profile?.nik || '-'}
              </p>
              
              {/* Role Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {subjectsTaught.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 px-3 py-1.5 rounded-full text-blue-100 text-xs font-bold">
                    <BookOpen className="w-3.5 h-3.5" />
                    Guru Mapel ({subjectsTaught.length})
                  </div>
                )}
                {profile?.homeroom_class && (
                  <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/30 px-3 py-1.5 rounded-full text-amber-100 text-xs font-bold">
                    <Users className="w-3.5 h-3.5" />
                    {t('teacher.homeroom') || 'Homeroom'}: {profile.homeroom_class.level} - {profile.homeroom_class.name}
                  </div>
                )}
                {Boolean(profile?.is_coa) && (
                  <div className="flex items-center gap-1.5 bg-purple-500/20 border border-purple-400/30 px-3 py-1.5 rounded-full text-purple-100 text-xs font-bold">
                    <Briefcase className="w-3.5 h-3.5" />
                    {t('teacher.coaBadge') || 'Admin Nilai'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
          
          {/* Subjects Taught */}
          <div className="bg-layout-card border border-layout-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4 border-b border-layout-border pb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-layout-text">{t('teacher.subjectsTaught') || 'Mata Pelajaran Diampu'}</h3>
                <p className="text-xs text-layout-muted">{t('teacher.basedOnSchedule') || 'Berdasarkan jadwal kelas'}</p>
              </div>
            </div>
            {subjectsTaught.length > 0 ? (
              <ul className="space-y-2">
                {subjectsTaught.map((subject, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-layout-text">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    {subject as string}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 text-layout-muted text-sm bg-layout-bg rounded-lg border border-dashed border-layout-border">
                {t('teacher.noSchedule') || 'Belum ada jadwal mengajar'}
              </div>
            )}
          </div>

          {/* Coordinated Subjects (COA) - Only visible if is_coa */}
          {Boolean(profile?.is_coa) && (
            <div className="bg-layout-card border border-layout-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4 border-b border-layout-border pb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-layout-text">{t('teacher.coaAccess') || 'Hak Akses Admin Nilai'}</h3>
                  <p className="text-xs text-layout-muted">{t('teacher.coaStatus') || 'Status input nilai pusat'}</p>
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4 text-purple-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-purple-900">{t('teacher.coaActive') || 'Akses Admin Nilai Aktif'}</p>
                  <p className="text-xs text-purple-700 mt-1">{t('teacher.coaDesc') || 'Anda memiliki wewenang penuh untuk memasukkan nilai seluruh mata pelajaran tingkat sekolah (MGMP).'}</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Schedule Table */}
        {profile?.name && (
          <TeacherScheduleTable schedules={profile.schedules} teacherName={profile.name} />
        )}

      </div>
    </TeacherLayout>
  );
}
