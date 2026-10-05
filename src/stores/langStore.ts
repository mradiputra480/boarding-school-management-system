import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { id } from '@/locales/id';
import { en } from '@/locales/en';
// Cache bust: 2

type Language = 'id' | 'en';
type Dictionary = typeof id;

interface LangState {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const dictionaries: Record<Language, Dictionary> = { id, en };

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'id',
      setLang: (lang) => set({ lang }),
      t: (path: string) => {
        const { lang } = get();
        const keys = path.split('.');
        let current: any = dictionaries[lang];
        
        for (const key of keys) {
          if (current[key] === undefined) {
            console.warn(`Translation key missing: ${path}`);
            return path;
          }
          current = current[key];
        }
        return current;
      },
    }),
    {
      name: 'siakad-lang',
    }
  )
);
