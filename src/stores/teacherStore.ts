import { create } from 'zustand';
import api from '@/lib/axios';

interface TeacherProfile {
  id: number;
  name: string;
  nip: string | null;
  nik: string | null;
  photo: string | null;
  homeroom_class: { id: number; name: string; level: string } | null;
  is_coa: boolean;
  is_kedisiplinan: boolean;
  is_icc: boolean;
  is_humas: boolean;
  is_tu: boolean;
  is_admin_digiart: boolean;
  is_admin_ekstra: boolean;
  is_student_report: boolean;
  schedules: any[];
  photo_url?: string;
  signature?: string;

}

interface TeacherStore {
  profile: TeacherProfile | null;
  loaded: boolean;
  loading: boolean;
  fetch: () => Promise<void>;
}

export const useTeacherStore = create<TeacherStore>((set, get) => ({
  profile: null,
  loaded: false,
  loading: false,
  fetch: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const res = await api.get('/teacher/profile');
      set({ profile: res.data.data, loaded: true, loading: false });
    } catch (err) {
      console.error('Failed to fetch teacher profile', err);
      set({ loading: false });
    }
  }
}));
