import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Boxes, LayoutDashboard, Rocket, Wallet } from 'lucide-react';
import { useLang } from '../lang';

export default function SiteHeader({
  studioUrl,
  agentCount = 0,
}: {
  studioUrl?: string;
  agentCount?: number;
}) {
  const studio = studioUrl || 'https://solvamos.ai.studio';
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
            <span className="truncate text-sm font-bold tracking-tight text-white sm:text-base">
              SolVamos
            </span>
          </Link>

          <div className="hidden items-center rounded-xl border border-slate-800/90 bg-slate-900/90 p-1 md:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'border border-cyan-500/40 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>{t('플랫폼 개요', 'Product Overview')}</span>
            </NavLink>
            <NavLink
              to="/marketplace"
              className={({ isActive }) =>
                `flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'border border-cyan-500/40 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`
              }
            >
              <Boxes className="h-4 w-4" />
              <span>{t('라이브 에이전트 카탈로그', 'Live Services')}</span>
              <span className="ml-1 rounded-full bg-cyan-500/20 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
                {agentCount || '—'}
              </span>
            </NavLink>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5">
            <button
              type="button"
              onClick={() => setLang('kr')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                lang === 'kr'
                  ? 'border border-cyan-500/30 bg-slate-800 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              KR
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                lang === 'en'
                  ? 'border border-cyan-500/30 bg-slate-800 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>

          <a
            href={studio}
            className="hidden items-center space-x-1.5 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-all hover:border-cyan-500/60 hover:bg-cyan-500/20 lg:inline-flex"
          >
            <Rocket className="h-3.5 w-3.5 text-cyan-400" />
            <span>{t('에이전트 생성', 'Create Agent')}</span>
          </a>

          <a
            href={studio}
            className="inline-flex items-center space-x-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 transition-all hover:opacity-95"
          >
            <Wallet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('Studio 플랫폼', 'Studio Platform')}</span>
            <span className="sm:hidden">Studio</span>
          </a>

          <button
            type="button"
            onClick={() => navigate('/marketplace')}
            className="inline-flex rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 md:hidden"
          >
            {t('카탈로그', 'Catalog')}
          </button>
        </div>
      </div>
    </header>
  );
}
