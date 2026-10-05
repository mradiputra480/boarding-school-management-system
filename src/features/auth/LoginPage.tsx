import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Globe, Sun, Moon } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { useSchoolStore } from '@/stores/schoolStore';
import { useEffect } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const { profile: school, fetch: fetchSchool } = useSchoolStore();

  useEffect(() => {
    fetchSchool();
  }, [fetchSchool]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { username, password });
      login(response.data.user, response.data.access_token);
      
      if (response.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (response.data.user.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (response.data.user.role === 'parent') {
        navigate('/parent/dashboard');
      } else if (response.data.user.role === 'tu') {
        navigate('/tu/dashboard');
      } else {
        navigate('/'); // Fallback
      }
    } catch (err: any) {
      if (err.response?.data?.errors?.username) {
        setError(err.response.data.errors.username[0]);
      } else {
        setError(lang === 'id' ? 'Login gagal. Silakan periksa kembali kredensial Anda.' : 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const t = {
    title: lang === 'id' ? 'Sistem Informasi Akademik' : 'Academic Information System',
    emailOrUsername: lang === 'id' ? 'Email atau Username' : 'Email or Username',
    placeholder: lang === 'id' ? 'masukkan email atau username' : 'enter email or username',
    password: lang === 'id' ? 'Password' : 'Password',
    rememberMe: lang === 'id' ? 'Ingat saya' : 'Remember me',
    forgotPassword: lang === 'id' ? 'Lupa password?' : 'Forgot password?',
    loginBtn: lang === 'id' ? 'MASUK' : 'LOGIN',
    loadingBtn: lang === 'id' ? 'MEMPROSES...' : 'PROCESSING...'
  };

  return (
    <div className="min-h-screen bg-[#f5f7f6] dark:bg-[#0f172a] transition-colors duration-300 flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#2d7a50 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      ></div>

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="bg-white dark:bg-[#1e293b] rounded-full border border-[#e2e8e5] dark:border-[#334155] p-2 shadow-sm text-[#6b8a7d] dark:text-[#94a3b8] hover:bg-gray-50 dark:hover:bg-[#334155] transition-colors"
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
        >
          {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Language Toggle */}
        <div className="flex bg-white dark:bg-[#1e293b] rounded-full border border-[#e2e8e5] dark:border-[#334155] p-1 shadow-sm">
          <button 
            onClick={() => setLang('id')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${lang === 'id' ? 'bg-[#2d7a50] text-white' : 'text-[#6b8a7d] dark:text-[#94a3b8] hover:bg-gray-50 dark:hover:bg-[#334155]'}`}
          >
            ID
          </button>
          <button 
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${lang === 'en' ? 'bg-[#2d7a50] text-white' : 'text-[#6b8a7d] dark:text-[#94a3b8] hover:bg-gray-50 dark:hover:bg-[#334155]'}`}
          >
            EN
          </button>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[440px] bg-white dark:bg-[#1e293b] rounded-2xl border border-[#e2e8e5] dark:border-[#334155] shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-none p-10 z-10 mx-4 transition-colors duration-300">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border-2 border-[#e2e8e5] dark:border-[#334155] flex items-center justify-center bg-white dark:bg-[#0f172a] mb-4 shadow-sm overflow-hidden">
             {school?.logoUrl ? (
               <img src={school.logoUrl} className="w-full h-full object-contain p-2" alt="Logo" />
             ) : (
               <Globe className="w-10 h-10 text-[#3a8fd4]" />
             )}
          </div>
          <h1 className="font-bold text-[18px] text-[#1a2e24] dark:text-white text-center tracking-tight">{school?.name || 'Sekolah Progresif'}</h1>
          <h2 className="font-bold text-[16px] text-[#d4a23a] text-center mt-1">IIS COMMUNITY CONNECT</h2>
        </div>

        <hr className="border-[#e2e8e5] dark:border-[#334155] w-full mt-6 mb-8" />

        {error && (
          <div className="bg-[#fef2f2] text-[#d45a5a] p-3 rounded-lg text-sm mb-6 border border-[#fecaca] text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-medium text-[#6b8a7d] dark:text-[#94a3b8] mb-1.5">{t.emailOrUsername}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#6b8a7d] dark:text-[#94a3b8]" />
              </div>
              <input
                type="text"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                className="w-full h-[46px] bg-[#f5f7f6] dark:bg-[#0f172a] border border-[#e2e8e5] dark:border-[#334155] rounded-lg pl-11 pr-4 text-[14px] text-[#1a2e24] dark:text-white placeholder-[#a3b5ad] dark:placeholder-[#64748b] focus:outline-none focus:border-[#2d7a50] dark:focus:border-[#2d7a50] focus:ring-4 focus:ring-[#2d7a50]/10 transition-all"
                placeholder={t.placeholder}
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#6b8a7d] dark:text-[#94a3b8] mb-1.5">{t.password}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#6b8a7d] dark:text-[#94a3b8]" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                className="w-full h-[46px] bg-[#f5f7f6] dark:bg-[#0f172a] border border-[#e2e8e5] dark:border-[#334155] rounded-lg pl-11 pr-11 text-[14px] text-[#1a2e24] dark:text-white placeholder-[#a3b5ad] dark:placeholder-[#64748b] focus:outline-none focus:border-[#2d7a50] focus:ring-4 focus:ring-[#2d7a50]/10 transition-all"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-[#6b8a7d] dark:text-[#94a3b8] hover:text-[#2d7a50] dark:hover:text-[#2d7a50]" /> : <Eye className="h-5 w-5 text-[#6b8a7d] dark:text-[#94a3b8] hover:text-[#2d7a50] dark:hover:text-[#2d7a50]" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-1 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-[#e2e8e5] dark:border-[#334155] text-[#2d7a50] focus:ring-[#2d7a50]/30" />
              <span className="text-[13px] text-[#6b8a7d] dark:text-[#94a3b8]">{t.rememberMe}</span>
            </label>
            <Link to="/forgot-password" className="text-[13px] text-[#3a8fd4] hover:underline">
              {t.forgotPassword}
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[48px] bg-[#2d7a50] text-white font-semibold text-[15px] tracking-wide uppercase rounded-lg hover:bg-[#3d9968] active:bg-[#1e5c38] shadow-[0_4px_16px_rgba(45,122,80,0.25)] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? t.loadingBtn : t.loginBtn}
          </button>
        </form>

        <p className="text-center text-[11px] text-[#6b8a7d] dark:text-[#64748b] mt-8">
          © {new Date().getFullYear()} {school?.name || 'IIS COMMUNITY CONNECT'} • Developed by Mr Adi
        </p>
      </div>

      {/* Demo Credentials Card */}
      <div className="fixed bottom-4 right-4 z-50 max-w-[320px] bg-white dark:bg-[#1e293b] rounded-xl border border-[#d4a23a]/30 shadow-lg p-4 transition-colors">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📌</span>
          <h3 className="font-bold text-[13px] text-[#1a2e24] dark:text-white">Live Demo — Try These Credentials</h3>
        </div>
        <div className="space-y-1.5">
          {[
            { role: 'Admin', user: 'admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
            { role: 'Teacher', user: 'teacher1', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
            { role: 'Discipline', user: 'discipline1', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
            { role: 'Parent', user: 'parent1', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
            { role: 'TU Staff', user: 'tu1', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
          ].map((cred) => (
            <button
              key={cred.user}
              type="button"
              onClick={() => { setUsername(cred.user); setPassword('demo1234'); }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#334155] transition-colors text-left"
            >
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cred.color}`}>{cred.role}</span>
              <span className="text-[12px] text-[#6b8a7d] dark:text-[#94a3b8] font-mono">{cred.user} / demo1234</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-[#a3b5ad] dark:text-[#64748b] mt-2 text-center">Click any role to auto-fill credentials</p>
      </div>
    </div>
  );
}
