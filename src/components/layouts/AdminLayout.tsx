import { ReactNode, useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, LogOut, Settings, UserSquare2, User, KeyRound, ChevronDown, ChevronRight, Database, GraduationCap, Heart, Sun, Moon, MessageSquare, HardDrive, Download, RefreshCw, Upload, Wrench, Calendar, Award, Files, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useSchoolStore } from '@/stores/schoolStore';
import { useLangStore } from '@/stores/langStore';
import api from '@/lib/axios';
import { storageUrl } from '@/lib/storage';
import { alertDialog } from '@/lib/swal';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

interface MenuItem {
  name: string;
  path: string;
  icon: any;
}

interface MenuGroup {
  label: string;
  icon: any;
  children: MenuItem[];
}

type SidebarItem = MenuItem | MenuGroup;

function isGroup(item: SidebarItem): item is MenuGroup {
  return 'children' in item;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { lang, setLang, t } = useLangStore();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Use cached school profile from global store
  const { profile: schoolProfile, fetch: fetchSchool } = useSchoolStore();
  useEffect(() => { fetchSchool(); }, []);
  const schoolLogo = schoolProfile?.logoUrl || null;
  const schoolName = schoolProfile?.name || 'IIS COMMUNITY CONNECT';

  // Profile modal state
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({name:'',username:'',password:''});
  const [profilePhoto, setProfilePhoto] = useState<File|null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string|null>(null);
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [photoVersion, setPhotoVersion] = useState(Date.now());

  useEffect(() => {
    if(showProfile && user) {
      setProfileForm({name:user.name||'',username:user.username||'',password:''});
      setProfilePhoto(null); setProfilePhotoPreview(null); setProfileError('');
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
      const r = await api.post('/auth/update-profile', fd, {headers:{'Content-Type':'multipart/form-data'}});
      useAuthStore.getState().setUser(r.data.user);
      setShowProfile(false);
      setPhotoVersion(Date.now());
      alertDialog('✅ Profil berhasil diperbarui!');
    } catch(err:any) { setProfileError(err.response?.data?.message||'Gagal menyimpan profil'); }
    finally { setProfileSaving(false); }
  };

  // Sidebar menu structure
  const sidebarItems: SidebarItem[] = [
    { name: t('sidebar.dashboard'), path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Leaderboard', path: '/admin/leaderboard', icon: Award },
    {
      label: t('sidebar.masterData'),
      icon: Database,
      children: [
        { name: t('sidebar.teachers'), path: '/admin/teachers', icon: UserSquare2 },
        { name: t('sidebar.students'), path: '/admin/students', icon: GraduationCap },
        { name: t('sidebar.parents'), path: '/admin/parents', icon: Heart },
        { name: 'Data Jabatan', path: '/admin/positions', icon: Users },
      ],
    },
    {
      label: t('sidebar.academic'),
      icon: BookOpen,
      children: [
        { name: t('sidebar.classes'), path: '/admin/classes', icon: Users },
        { name: 'Analisis Kurikulum', path: '/admin/curriculum-analytics', icon: TrendingUp },
        { name: 'Master Ekstra & Digiart', path: '/admin/master-activities', icon: Users },
        { name: 'Daftar Mapel', path: '/admin/subjects', icon: BookOpen },
        { name: t('sidebar.schedule'), path: '/admin/schedules', icon: LayoutDashboard },
        { name: 'Event Penilaian', path: '/admin/assessment-events', icon: Award },
        { name: 'Distribusi Dokumen', path: '/admin/documents', icon: Files },
      ],
    },
    { name: t('sidebar.accountMgmt'), path: '/admin/accounts', icon: KeyRound },
    { name: t('sidebar.semester'), path: '/admin/semesters', icon: BookOpen },
    { name: 'Agenda Kegiatan', path: '/admin/events', icon: Calendar },
    { name: 'WA Blast', path: '/admin/wa-blast', icon: MessageSquare },
    {
      label: 'Sistem',
      icon: HardDrive,
      children: [
        { name: 'Backup & Restore', path: '/admin/system/backup', icon: HardDrive },
        { name: 'Export Data Akademik', path: '/admin/system/export', icon: Download },
        { name: 'Kenaikan Kelas', path: '/admin/system/promotion', icon: RefreshCw },
        { name: 'System Update', path: '/admin/system/update', icon: Upload },
        { name: 'System Maintenance', path: '/admin/system/maintenance', icon: Wrench },
      ],
    },
    { name: t('sidebar.settings'), path: '/admin/settings', icon: Settings },
  ];

  // Auto-expand group if one of its children is active
  const isGroupActive = (group: MenuGroup) =>
    group.children.some(c => location.pathname.startsWith(c.path));

  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    const initial: string[] = [];
    sidebarItems.forEach(item => {
      if (isGroup(item) && isGroupActive(item)) initial.push(item.label);
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev =>
      prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    finally { logout(); window.location.href = '/login'; }
  };

  const renderMenuItem = (item: MenuItem, indent = false) => {
    const Icon = item.icon;
    const isActive = location.pathname.startsWith(item.path);
    return (
      <li key={item.path}>
        <Link
          to={item.path}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            indent ? 'ml-4 pl-5' : ''
          } ${
            isActive
              ? 'bg-[#2d7a50]/10 text-[#2d7a50]'
              : 'text-layout-muted hover:bg-layout-hover hover:text-layout-text'
          }`}
        >
          <Icon className={`w-[18px] h-[18px] ${isActive ? '' : 'opacity-70'}`} />
          {item.name}
        </Link>
      </li>
    );
  };

  const renderGroup = (group: MenuGroup) => {
    const isExpanded = expandedGroups.includes(group.label);
    const isAnyChildActive = isGroupActive(group);
    const Icon = group.icon;

    return (
      <li key={group.label}>
        <button
          onClick={() => toggleGroup(group.label)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            isAnyChildActive
              ? 'bg-[#2d7a50]/5 text-[#2d7a50]'
              : 'text-layout-muted hover:bg-layout-hover hover:text-layout-text'
          }`}
        >
          <span className="flex items-center gap-3">
            <Icon className={`w-[18px] h-[18px] ${isAnyChildActive ? '' : 'opacity-70'}`} />
            {group.label}
          </span>
          <ChevronRight
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
          />
        </button>
        {/* Submenu with smooth animation */}
        <div
          className={`overflow-hidden transition-all duration-200 ease-in-out ${
            isExpanded ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'
          }`}
        >
          <ul className="space-y-0.5 border-l-2 border-layout-border ml-5">
            {group.children.map(child => {
              const ChildIcon = child.icon;
              const isActive = location.pathname.startsWith(child.path);
              return (
                <li key={child.path}>
                  <Link
                    to={child.path}
                    className={`flex items-center gap-2.5 pl-4 pr-3 py-2 rounded-r-lg text-[13px] font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[#2d7a50]/10 text-[#2d7a50] border-l-2 border-[#2d7a50] -ml-[2px]'
                        : 'text-layout-muted hover:bg-layout-hover hover:text-layout-text'
                    }`}
                  >
                    <ChildIcon className={`w-4 h-4 ${isActive ? '' : 'opacity-60'}`} />
                    {child.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </li>
    );
  };

  return (
    <div className="min-h-screen flex bg-layout-bg font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-layout-card border-r border-layout-border flex flex-col fixed h-full z-50 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-5 border-b border-layout-border gap-3">
          {schoolLogo ? (
            <img src={schoolLogo} className="w-8 h-8 rounded-lg object-contain shrink-0" alt="Logo"/>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#2d7a50]/10 flex items-center justify-center shrink-0">
              <span className="text-[#2d7a50] font-bold text-sm">S</span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-[#2d7a50] font-bold text-[15px] tracking-tight leading-none mb-0.5">IIS COMMUNITY</h1><h1 className="text-[#d4a23a] font-bold text-[15px] tracking-tight leading-none mb-1">CONNECT</h1>
            <p className="text-[10px] text-layout-muted truncate leading-tight">{schoolName}</p>
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-[11px] font-semibold text-layout-muted uppercase tracking-wider mb-3 px-2">{t('common.mainMenu')}</p>
          <ul className="space-y-1">
            {sidebarItems.map(item =>
              isGroup(item) ? renderGroup(item) : renderMenuItem(item)
            )}
          </ul>
        </div>

        <div className="p-4 border-t border-layout-border">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#d45a5a] hover:bg-[#fef2f2] transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t('common.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-layout-card dark:bg-[#1e293b] border-b border-layout-border dark:border-[#334155] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-colors duration-300">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-layout-muted hover:text-layout-text rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h2 className="text-layout-text dark:text-white font-semibold text-lg truncate">{title}</h2>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
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

            {/* Profile Dropdown */}
            <div className="relative ml-2" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 hover:bg-layout-hover dark:hover:bg-[#334155] px-3 py-1.5 rounded-xl transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-layout-text dark:text-white text-sm font-medium">{user?.name}</p>
                  <p className="text-layout-muted dark:text-[#94a3b8] text-[11px] uppercase tracking-wider">{user?.role}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#2d7a50]/10 border border-[#2d7a50]/20 flex items-center justify-center text-[#2d7a50] font-bold overflow-hidden">
                  {(user as any)?.photo
                    ? <img src={`${storageUrl((user as any).photo)}?v=${photoVersion}`} className="w-full h-full object-cover"/>
                    : user?.name?.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className={`w-4 h-4 text-layout-muted transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-layout-card dark:bg-[#1e293b] rounded-xl shadow-lg border border-layout-border dark:border-[#334155] py-1.5 z-50">
                  <div className="px-4 py-3 border-b border-layout-border dark:border-[#334155]">
                    <p className="text-sm font-semibold text-layout-text dark:text-white">{user?.name}</p>
                    <p className="text-xs text-layout-muted dark:text-[#94a3b8] mt-0.5 truncate">{user?.username}</p>
                  </div>
                  <div className="py-1.5">
                    <button onClick={() => { setShowDropdown(false); setShowProfile(true); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-layout-text dark:text-[#94a3b8] hover:bg-layout-hover dark:hover:bg-[#334155] hover:text-layout-text dark:hover:text-white transition-colors">
                      <User className="w-4 h-4" /> Profil Saya
                    </button>
                  </div>
                  <div className="py-1.5 border-t border-layout-border dark:border-[#334155]">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#d45a5a] hover:bg-[#fef2f2] dark:hover:bg-red-900/20 transition-colors">
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 flex-1 overflow-auto">
          {children}
        </div>
      </main>

      {/* PROFILE MODAL */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4" onClick={()=>setShowProfile(false)}>
          <div className="bg-layout-card w-full max-w-[440px] rounded-2xl shadow-xl overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-border">
              <h2 className="text-lg font-bold text-layout-text">👤 Profil Saya</h2>
              <button onClick={()=>setShowProfile(false)} className="text-layout-muted hover:text-layout-text p-2 rounded-full hover:bg-gray-100">✕</button>
            </div>
            <form onSubmit={handleProfileSave} className="p-6 space-y-4">
              {profileError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{profileError}</div>}
              
              {/* Photo */}
              <div className="flex flex-col items-center gap-3">
                <input type="file" ref={profilePhotoRef} accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f){setProfilePhoto(f);setProfilePhotoPreview(URL.createObjectURL(f));}}}/>
                <div 
                  onClick={()=>profilePhotoRef.current?.click()} 
                  className="w-20 h-20 rounded-full bg-[#edf7f1] border-2 border-dashed border-[#2d7a50]/30 hover:border-[#2d7a50] flex items-center justify-center cursor-pointer overflow-hidden transition-all"
                >
                  {profilePhotoPreview 
                    ? <img src={profilePhotoPreview} className="w-full h-full object-cover"/>
                    : (user as any)?.photo
                      ? <img src={`${storageUrl((user as any).photo)}?v=${photoVersion}`} className="w-full h-full object-cover"/>
                      : <span className="text-[#2d7a50] text-2xl font-bold">{user?.name?.charAt(0).toUpperCase()}</span>}
                </div>
                <button type="button" onClick={()=>profilePhotoRef.current?.click()} className="text-[#2d7a50] text-sm font-semibold hover:underline">Ubah Foto</button>
              </div>

              {/* Name (read-only for context) */}
              <div>
                <label className="block text-[12px] font-semibold text-layout-text mb-1 uppercase">Nama</label>
                <input value={profileForm.name} onChange={e=>setProfileForm({...profileForm,name:e.target.value})} className="w-full bg-layout-card border border-[#bfc9bf] rounded-lg px-3 py-2.5 text-[14px] focus:outline-none focus:border-[#096139] focus:ring-1 focus:ring-[#096139]"/>
              </div>

              {/* Username */}
              <div>
                <label className="block text-[12px] font-semibold text-layout-text mb-1 uppercase">Username</label>
                <input value={profileForm.username} onChange={e=>setProfileForm({...profileForm,username:e.target.value.toLowerCase().replace(/\s/g,'')})} className="w-full bg-layout-card border border-[#bfc9bf] rounded-lg px-3 py-2.5 text-[14px] focus:outline-none focus:border-[#096139] focus:ring-1 focus:ring-[#096139] font-mono"/>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[12px] font-semibold text-layout-text mb-1 uppercase">Password Baru <span className="normal-case text-layout-muted font-normal">(kosongkan jika tidak diubah)</span></label>
                <input type="password" value={profileForm.password} onChange={e=>setProfileForm({...profileForm,password:e.target.value})} placeholder="••••••" className="w-full bg-layout-card border border-[#bfc9bf] rounded-lg px-3 py-2.5 text-[14px] focus:outline-none focus:border-[#096139] focus:ring-1 focus:ring-[#096139]"/>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>setShowProfile(false)} className="px-5 py-2.5 rounded-lg font-semibold text-sm text-layout-muted hover:bg-gray-100">Batal</button>
                <button type="submit" disabled={profileSaving} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-[#2d7a50] text-white hover:bg-[#3d9968] disabled:opacity-70">{profileSaving?'Menyimpan...':'Simpan Profil'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



