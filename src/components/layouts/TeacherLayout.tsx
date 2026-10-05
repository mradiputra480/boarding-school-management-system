import { ReactNode, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Menu, X, BookOpen, Sun, Moon, Award, ShieldAlert, Trophy, Calendar, Palette, Activity, FileSearch, LineChart } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useSchoolStore } from '@/stores/schoolStore';
import { useLangStore } from '@/stores/langStore';
import { useTeacherStore } from '@/stores/teacherStore';
import api from '@/lib/axios';
import { storageUrl } from '@/lib/storage';
import { alertDialog } from '@/lib/swal';

interface TeacherLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function TeacherLayout({ children, title }: TeacherLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { profile: schoolProfile, fetch: fetchSchool } = useSchoolStore();
  const { profile: teacherProfile, fetch: fetchTeacher } = useTeacherStore();
  const { t, lang, setLang } = useLangStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => { 
    fetchSchool(); 
    fetchTeacher();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Profile modal state
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({name:'',username:'',password:''});
  const [profilePhoto, setProfilePhoto] = useState<File|null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string|null>(null);
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const [profileSignature, setProfileSignature] = useState<File|null>(null);
  const [profileSignaturePreview, setProfileSignaturePreview] = useState<string|null>(null);
  const profileSignatureRef = useRef<HTMLInputElement>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [photoVersion, setPhotoVersion] = useState(Date.now());

  useEffect(() => {
    if(showProfile && user) {
      setProfileForm({name:user.name||'',username:user.username||'',password:''});
      setProfilePhoto(null); setProfilePhotoPreview(null); 
      setProfileSignature(null); setProfileSignaturePreview(null);
      setProfileError('');
    }
  }, [showProfile, user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault(); setProfileSaving(true); setProfileError('');
    try {
      const fd = new FormData();
      fd.append('name', profileForm.name);
      fd.append('username', profileForm.username);
      if(profileForm.password) fd.append('password', profileForm.password);
      if(profilePhoto) fd.append('photo', profilePhoto);
      if(profileSignature) fd.append('signature', profileSignature);
      const r = await api.post('/auth/update-profile', fd, {headers:{'Content-Type':'multipart/form-data'}});
      useAuthStore.getState().setUser(r.data.user);
      fetchTeacher(); // Refresh teacher profile for signature/photo
      setShowProfile(false);
      setPhotoVersion(Date.now());
      alertDialog('✅ Profil berhasil diperbarui!');
    } catch(err:any) { setProfileError(err.response?.data?.message||'Gagal menyimpan profil'); }
    finally { setProfileSaving(false); }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    finally { logout(); window.location.href = '/login'; }
  };

  const navItems = [
    { name: t('sidebar.dashboard') || 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'Jadwal Mengajar', path: '/teacher/schedule', icon: Calendar },
    { name: 'Kesiswaan & Kedisiplinan', path: '/teacher/discipline', icon: ShieldAlert }
  ];

  if (teacherProfile?.homeroom_class) {
    navItems.push({
      name: t('teacher.homeroom') || 'Homeroom',
      path: '/teacher/homeroom',
      icon: BookOpen
    });
  }

  if (teacherProfile?.is_coa) {
    navItems.push({
      name: t('sidebar.academic') || 'Akademik',
      path: '/teacher/academic',
      icon: Award
    });
  }

  if (teacherProfile?.is_icc) {
    navItems.push({
      name: 'Prestasi (ICC)',
      path: '/teacher/icc',
      icon: Trophy
    });
  }

  if (teacherProfile?.is_student_report) {
    navItems.push({
      name: 'Student Report',
      path: '/teacher/student-report',
      icon: FileSearch
    });
  }

  if (teacherProfile?.is_curriculum_analytics) {
    navItems.push({
      name: 'Analisis Kurikulum',
      path: '/teacher/curriculum-analytics',
      icon: LineChart
    });
  }

  if (teacherProfile?.is_humas) {
    navItems.push({
      name: 'Agenda Kegiatan',
      path: '/teacher/humas',
      icon: Calendar
    });
  }

  if (teacherProfile?.is_tu) {
    navItems.push({
      name: 'Admin TU',
      path: '/teacher/documents',
      icon: BookOpen
    });
  }

  if (teacherProfile?.is_admin_digiart) {
    navItems.push({
      name: 'Admin Digiart',
      path: '/teacher/digiart/groups',
      icon: Palette
    });
  }

  if (teacherProfile?.is_admin_ekstra) {
    navItems.push({
      name: 'Admin Ekstra',
      path: '/teacher/ekstra/groups',
      icon: Activity
    });
  }

  if (teacherProfile?.is_instructor_digiart) {
    navItems.push({
      name: 'Pembimbing Digiart',
      path: '/teacher/instructor/digiart/attendance',
      icon: Palette
    });
  }

  if (teacherProfile?.is_instructor_ekstra) {
    navItems.push({
      name: 'Pelatih Ekstra',
      path: '/teacher/instructor/ekstra/attendance',
      icon: Activity
    });
  }




  return (
    <div className="min-h-screen flex bg-layout-bg font-sans">
      {/* Mobile Sidebar Overlay */}
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
            <div className="w-8 h-8 bg-[#2d7a50] rounded-lg flex items-center justify-center text-white font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
          )}
          <div>
            <h1 className="font-extrabold text-layout-text text-[15px] leading-none mb-1">IIS COMMUNITY</h1>
            <p className="font-bold text-[#d4a23a] text-[15px] leading-none">CONNECT</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2">
            <p className="text-[11px] font-bold text-layout-muted uppercase tracking-wider">{t('common.mainMenu') || 'MAIN MENU'}</p>
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button key={item.path} onClick={() => { navigate(item.path); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-[#2d7a50]/10 text-[#2d7a50] font-bold' : 'text-layout-muted hover:bg-layout-hover hover:text-layout-text'}`}>
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-layout-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#d45a5a] hover:bg-[#d45a5a]/10 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-semibold">{t('common.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen print:h-auto overflow-hidden print:overflow-visible">
        {/* Top Header */}
        <header className="h-16 bg-layout-card dark:bg-[#1e293b] border-b border-layout-border dark:border-[#334155] flex items-center justify-between px-4 sm:px-8 shrink-0 print:hidden transition-colors duration-300 relative">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-layout-muted dark:text-[#94a3b8] hover:text-layout-text dark:hover:text-white hover:bg-layout-hover dark:hover:bg-[#334155] rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-layout-text hidden sm:block">{title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full border border-layout-border dark:border-[#334155] flex items-center justify-center text-layout-muted dark:text-[#94a3b8] hover:bg-layout-hover dark:hover:bg-[#334155] transition-colors bg-layout-card dark:bg-[#1e293b]"
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Language Toggle */}
            <div className="flex bg-layout-card dark:bg-[#1e293b] rounded-full border border-layout-border dark:border-[#334155] p-1 shadow-sm">
              <button 
                onClick={() => setLang('id')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${lang === 'id' ? 'bg-[#2d7a50] text-white' : 'text-layout-muted dark:text-[#94a3b8] hover:bg-layout-hover dark:hover:bg-[#334155]'}`}
              >
                ID
              </button>
              <button 
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${lang === 'en' ? 'bg-[#2d7a50] text-white' : 'text-layout-muted dark:text-[#94a3b8] hover:bg-layout-hover dark:hover:bg-[#334155]'}`}
              >
                EN
              </button>
            </div>

            {/* Profile Dropdown Trigger */}
            <div className="flex items-center gap-3 pl-4 border-l border-layout-border dark:border-[#334155] cursor-pointer" onClick={() => setShowProfile(true)} title="Edit Profil">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-layout-text dark:text-white hover:underline">{user?.name}</p>
                <p className="text-xs text-layout-muted uppercase font-semibold">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#2d7a50]/20 flex items-center justify-center text-[#2d7a50] font-bold overflow-hidden border border-[#2d7a50]/30 hover:ring-2 hover:ring-[#2d7a50] transition-all">
                {teacherProfile?.photo_url ? (
                  <img src={`${teacherProfile.photo_url}?v=${photoVersion}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto print:overflow-visible print:p-0 p-4 sm:p-8">
          <div className="max-w-[1400px] mx-auto print:max-w-none print:m-0">
            <div className="sm:hidden mb-6">
              <h1 className="text-2xl font-bold text-layout-text">{title}</h1>
            </div>
            {children}
          </div>
        </div>
      </main>

      {/* PROFILE MODAL */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4" onClick={()=>setShowProfile(false)}>
          <div className="bg-layout-card w-full max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl border border-layout-border" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border sticky top-0 bg-layout-card z-10">
              <h2 className="text-lg font-bold text-layout-text">👤 Profil Saya</h2>
              <button onClick={()=>setShowProfile(false)} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-layout-bg transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleProfileSave} className="p-6 space-y-5">
              {profileError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{profileError}</div>}
              
              <div className="flex flex-col sm:flex-row gap-6 items-start justify-center">
                {/* Photo Upload */}
                <div className="flex flex-col items-center gap-3 w-full sm:w-1/2">
                  <label className="block text-[12px] font-semibold text-layout-text uppercase">Foto Profil</label>
                  <input type="file" ref={profilePhotoRef} accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f){setProfilePhoto(f);setProfilePhotoPreview(URL.createObjectURL(f));}}}/>
                  <div 
                    onClick={()=>profilePhotoRef.current?.click()} 
                    className="w-24 h-24 rounded-full bg-layout-bg border-2 border-dashed border-layout-border hover:border-[#2d7a50] flex items-center justify-center cursor-pointer overflow-hidden transition-all group relative"
                  >
                    {profilePhotoPreview 
                      ? <img src={profilePhotoPreview} className="w-full h-full object-cover"/>
                      : teacherProfile?.photo_url
                        ? <img src={`${teacherProfile.photo_url}?v=${photoVersion}`} className="w-full h-full object-cover"/>
                        : <span className="text-layout-muted text-3xl font-bold">{user?.name?.charAt(0).toUpperCase()}</span>}
                    <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-xs font-semibold">Ubah</div>
                  </div>
                </div>

                {/* Signature Upload */}
                <div className="flex flex-col items-center gap-3 w-full sm:w-1/2">
                  <label className="block text-[12px] font-semibold text-layout-text uppercase">Tanda Tangan</label>
                  <input type="file" ref={profileSignatureRef} accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f){setProfileSignature(f);setProfileSignaturePreview(URL.createObjectURL(f));}}}/>
                  <div 
                    onClick={()=>profileSignatureRef.current?.click()} 
                    className="w-full h-24 rounded-xl bg-layout-bg border-2 border-dashed border-layout-border hover:border-[#2d7a50] flex items-center justify-center cursor-pointer overflow-hidden transition-all group relative"
                  >
                    {profileSignaturePreview 
                      ? <img src={profileSignaturePreview} className="w-full h-full object-contain p-2"/>
                      : teacherProfile?.signature
                        ? <img src={`${storageUrl(teacherProfile.signature)}?v=${photoVersion}`} className="w-full h-full object-contain p-2"/>
                        : <span className="text-layout-muted text-[10px] uppercase font-bold px-4 text-center">Upload TTD</span>}
                    <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-xs font-semibold">Ubah TTD</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-layout-text mb-1 uppercase">Nama Lengkap</label>
                <input value={profileForm.name} onChange={e=>setProfileForm({...profileForm,name:e.target.value})} className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2.5 text-[14px] focus:outline-none focus:border-[#2d7a50] focus:ring-1 focus:ring-[#2d7a50] text-layout-text"/>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-layout-text mb-1 uppercase">Username</label>
                <input value={profileForm.username} onChange={e=>setProfileForm({...profileForm,username:e.target.value.toLowerCase().replace(/\s/g,'')})} className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2.5 text-[14px] focus:outline-none focus:border-[#2d7a50] focus:ring-1 focus:ring-[#2d7a50] font-mono text-layout-text"/>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-layout-text mb-1 uppercase">Password Baru <span className="normal-case text-layout-muted font-normal">(opsional)</span></label>
                <input type="password" value={profileForm.password} onChange={e=>setProfileForm({...profileForm,password:e.target.value})} placeholder="Biarkan kosong jika tidak diubah" minLength={6} className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2.5 text-[14px] focus:outline-none focus:border-[#2d7a50] focus:ring-1 focus:ring-[#2d7a50] text-layout-text"/>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-layout-border mt-2">
                <button type="button" onClick={()=>setShowProfile(false)} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-layout-bg transition-colors">Batal</button>
                <button type="submit" disabled={profileSaving} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#1b6b43] transition-colors disabled:opacity-70 flex items-center gap-2">
                  {profileSaving?'Menyimpan...':'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


