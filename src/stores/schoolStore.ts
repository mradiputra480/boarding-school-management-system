import { create } from 'zustand';
import api from '@/lib/axios';
import { storageUrl } from '@/lib/storage';

interface SchoolProfile {
  name: string;
  logo: string | null;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  principal_name: string | null;
  npsn: string | null;
  accreditation: string | null;
  parent_menu_access?: {
    academic: boolean;
    discipline: boolean;
    achievements: boolean;
    discipline_show_detail: boolean;
  };
  allow_below_kkm?: boolean;
}

interface SchoolStore {
  profile: SchoolProfile | null;
  loaded: boolean;
  loading: boolean;
  fetch: () => Promise<void>;
  setProfile: (p: SchoolProfile) => void;
}

export const useSchoolStore = create<SchoolStore>((set, get) => ({
  profile: null,
  loaded: false,
  loading: false,
  fetch: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const r = await api.get('/public/school-profile').catch(() => api.get('/admin/school-profile'));
      const d = r.data.data;
      const v = d.updated_at ? new Date(d.updated_at).getTime() : Date.now();
      const logoUrl = storageUrl(d.logo, v);
      
      // Update DOM
      if (logoUrl) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = logoUrl;
      }
      if (d.name) {
        document.title = d.name;
      }

      set({
        profile: {
          ...d,
          logoUrl,
        },
        loaded: true,
      });
    } catch {} finally {
      set({ loading: false });
    }
  },
  setProfile: (p) => {
    const v = p.updated_at ? new Date(p.updated_at).getTime() : Date.now();
    const logoUrl = storageUrl(p.logo, v);
    if (logoUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) link.href = logoUrl;
    }
    if (p.name) document.title = p.name;
    
    set({ profile: { ...p, logoUrl } });
  },
}));
