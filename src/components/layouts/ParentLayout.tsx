import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Menu, Calendar, ClipboardList, Award, FileText, Sun, Moon, GraduationCap, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useSchoolStore } from '@/stores/schoolStore';
import { useLangStore } from '@/stores/langStore';
import { useParentStore } from '@/stores/parentStore';
import { storageUrl } from '@/lib/storage';

interface ParentLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function ParentLayout({ children, title }: ParentLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { profile: schoolProfile, fetch: fetchSchool } = useSchoolStore();
  const { child, hasEvents, hasDocuments, fetch: fetchChild } = useParentStore();
  const { t, lang, setLang } = useLangStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => { fetchSchool(); fetchChild(); }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const handleLogout = () => { logout(); window.location.href = '/login'; };

  const parentMenuAccess = schoolProfile?.parent_menu_access || {
    report_card: false,
    discipline: false,
    achievements: false,
    assessment_events: true,
    documents: true,
    graduation: true
  };

  const navItems = [
    { name: t('parent.dashboard') || 'Dashboard', path: '/parent/dashboard', icon: LayoutDashboard },
  ];

  if (parentMenuAccess.report_card) {
    navItems.push({ name: t('parent.reportCard') || 'Rekap Nilai Akademis', path: '/parent/report-card', icon: FileText });
  }
  if (parentMenuAccess.discipline) {
    navItems.push({ name: 'Kedisiplinan', path: '/parent/discipline', icon: ShieldAlert });
  }
  if (parentMenuAccess.achievements) {
    navItems.push({ name: 'Prestasi & Penghargaan', path: '/parent/achievements', icon: Award });
  }
  if (parentMenuAccess.assessment_events && hasEvents) {
    navItems.push({ name: 'Penilaian Eksternal', path: '/parent/assessment-events', icon: ClipboardList });
  }
  if (parentMenuAccess.documents && hasDocuments) {
    navItems.push({ name: 'Dokumen', path: '/parent/documents', icon: FileText });
  }
  if (parentMenuAccess.graduation && (child?.class?.level === 'IX' || child?.class?.level === '9')) {
    navItems.push({ name: 'Kelulusan', path: '/parent/graduation', icon: GraduationCap });
  }

  return (
    <div className="min-h-screen flex bg-layout-bg font-sans">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-layout-card border-r border-layout-border z-50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-layout-border">
          {schoolProfile?.logoUrl ? (
            <img src={schoolProfile.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 bg-[#d4a23a] rounded-lg flex items-center justify-center text-white font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
          )}
          <div>
            <h1 className="font-extrabold text-layout-text text-[15px] leading-none mb-1">IIS COMMUNITY</h1>
            <p className="font-bold text-[#d4a23a] text-[15px] leading-none">CONNECT</p>
          </div>
        </div>

        {/* Child Info */}
        {child && (
          <div className="px-4 py-3 border-b border-layout-border bg-[#d4a23a]/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#d4a23a]/20 flex items-center justify-center text-[#d4a23a] font-bold overflow-hidden border border-[#d4a23a]/30">
                {child.photo ? (
                  <img src={storageUrl(child.photo)!} alt="" className="w-full h-full object-cover" />
                ) : (
                  child.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-layout-text truncate">{child.name}</p>
                <p className="text-[10px] text-layout-muted">{child.class ? `${child.class.level} ${child.class.name}` : '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2">
            <p className="text-[11px] font-bold text-layout-muted uppercase tracking-wider">{t('common.mainMenu') || 'MAIN MENU'}</p>
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button key={item.path} onClick={() => { navigate(item.path); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-[#d4a23a]/10 text-[#d4a23a] font-bold' : 'text-layout-muted hover:bg-layout-hover hover:text-layout-text'}`}>
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-layout-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#d45a5a] hover:bg-[#d45a5a]/10 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-semibold">{t('common.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen print:h-auto overflow-hidden print:overflow-visible">
        <header className="h-16 bg-layout-card border-b border-layout-border flex items-center justify-between px-4 sm:px-8 shrink-0 print:hidden transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-layout-muted hover:text-layout-text hover:bg-layout-hover rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-layout-text hidden sm:block">{title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="w-8 h-8 rounded-full border border-layout-border flex items-center justify-center text-layout-muted hover:bg-layout-hover transition-colors bg-layout-card" title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}>
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <div className="flex bg-layout-card rounded-full border border-layout-border p-1 shadow-sm">
              <button onClick={() => setLang('id')} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${lang === 'id' ? 'bg-[#d4a23a] text-white' : 'text-layout-muted hover:bg-layout-hover'}`}>ID</button>
              <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${lang === 'en' ? 'bg-[#d4a23a] text-white' : 'text-layout-muted hover:bg-layout-hover'}`}>EN</button>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-layout-border">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-layout-text">{user?.name}</p>
                <p className="text-xs text-layout-muted uppercase font-semibold">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#d4a23a]/20 flex items-center justify-center text-[#d4a23a] font-bold border border-[#d4a23a]/30">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto print:overflow-visible print:p-0 p-4 sm:p-8">
          <div className="max-w-[1400px] mx-auto print:max-w-none print:m-0">
            <div className="sm:hidden mb-6">
              <h1 className="text-2xl font-bold text-layout-text">{title}</h1>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}


