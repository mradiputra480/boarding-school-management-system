import { create } from 'zustand';
import api from '@/lib/axios';

interface ChildProfile {
  id: number;
  name: string;
  nisn: string;
  nis: string;
  gender: string;
  photo: string | null;
  class: { id: number; name: string; level: string } | null;
}

interface ParentStore {
  child: ChildProfile | null;
  hasEvents: boolean;
  hasDocuments: boolean;
  loaded: boolean;
  loading: boolean;
  fetch: () => Promise<void>;
}

export const useParentStore = create<ParentStore>((set, get) => ({
  child: null,
  hasEvents: false,
  hasDocuments: false,
  loaded: false,
  loading: false,
  fetch: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const [childRes, eventsRes, docsRes] = await Promise.all([
        api.get('/parent/child'),
        api.get('/parent/assessment-events').catch(() => ({ data: { data: [] } })),
        api.get('/parent/documents').catch(() => ({ data: { data: [] } }))
      ]);
      
      set({ 
        child: childRes.data.data, 
        hasEvents: eventsRes.data?.data?.length > 0,
        hasDocuments: docsRes.data?.data?.length > 0,
        loaded: true, 
        loading: false 
      });
    } catch (err) {
      console.error('Failed to fetch child profile', err);
      set({ loading: false });
    }
  }
}));
