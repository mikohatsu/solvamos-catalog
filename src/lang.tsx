import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'kr' | 'en';

type LangCtx = { lang: Lang; setLang: (l: Lang) => void; t: (kr: string, en: string) => string };

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('kr');
  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (kr: string, en: string) => (lang === 'kr' ? kr : en),
    }),
    [lang]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLang outside provider');
  return ctx;
}
