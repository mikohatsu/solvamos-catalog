import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import SiteHeader from './components/SiteHeader';
import { LangProvider } from './lang';

export default function AppShell() {
  const [studioUrl, setStudioUrl] = useState('https://solvamos-studio-74094114833.asia-northeast3.run.app');
  const [agentCount, setAgentCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/catalog', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.studio_url) setStudioUrl(data.studio_url);
        if (typeof data?.agent_count === 'number') setAgentCount(data.agent_count);
        else if (Array.isArray(data?.agents)) setAgentCount(data.agents.length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <LangProvider>
      <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100 selection:bg-cyan-500/30">
        <SiteHeader studioUrl={studioUrl} agentCount={agentCount} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
          <Outlet context={{ studioUrl, agentCount, setAgentCount }} />
        </main>
        <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
          SolVamos Catalog · Discovery layer for Studio agents · pay.sh x402 / MPP
        </footer>
      </div>
    </LangProvider>
  );
}
