import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, FileSignature, CalendarCheck, Award } from 'lucide-react';
import TeacherLayout from '@/components/layouts/TeacherLayout';

interface ActivityAdminLayoutProps {
  children: ReactNode;
  type: 'digiart' | 'ekstra';
  title: string;
}

export default function ActivityAdminLayout({ children, type, title }: ActivityAdminLayoutProps) {
  const location = useLocation();

  const tabs = [
    { name: 'Kelola Grup', path: `/teacher/${type}/groups`, icon: Users },
    { name: 'Event Penilaian', path: `/teacher/${type}/assessments`, icon: FileSignature },
    { name: 'Rekapitulasi', path: `/teacher/${type}/recap`, icon: CalendarCheck },
  ];

  return (
    <TeacherLayout title={title}>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header & Tabs */}
        <div className="bg-layout-bg border border-layout-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-layout-text">Admin {type === 'digiart' ? 'Digiart' : 'Ekstrakurikuler'}</h1>
            <p className="text-sm text-layout-muted mt-1">Kelola grup, jadwal, dan penilaian siswa</p>
          </div>
          <div className="flex bg-layout-bg/50 p-1 rounded-lg border border-layout-border gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = location.pathname.startsWith(tab.path);
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={() =>
                    `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-[#2d7a50] text-white shadow-sm'
                        : 'text-layout-muted hover:bg-layout-hover hover:text-layout-text'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {children}

      </div>
    </TeacherLayout>
  );
}
