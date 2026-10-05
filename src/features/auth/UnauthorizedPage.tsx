import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleGoBack = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Redirect based on role
    switch(user.role) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'teacher':
        navigate('/teacher/dashboard');
        break;
      case 'parent':
        navigate('/parent/dashboard');
        break;
      case 'tu':
        navigate('/tu/dashboard');
        break;
      default:
        navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f6] dark:bg-[#0f172a] flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-8 max-w-md w-full shadow-lg border border-[#e2e8e5] dark:border-[#334155] text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-[#1a2e24] dark:text-white mb-2">Akses Ditolak</h1>
        <p className="text-[#6b8a7d] dark:text-[#94a3b8] mb-8">
          Maaf, Anda tidak memiliki izin (hak akses) untuk melihat halaman ini. 
          Pastikan Anda login dengan akun yang sesuai.
        </p>
        
        <button
          onClick={handleGoBack}
          className="w-full flex items-center justify-center gap-2 bg-[#2d7a50] text-white py-3 rounded-lg font-semibold hover:bg-[#3d9968] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}
