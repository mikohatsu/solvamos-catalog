import { Link, NavLink } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function SiteHeader({ studioUrl }: { studioUrl?: string }) {
  const studio = studioUrl || 'https://solvamos.ai.studio';
  return (
    <nav className="mb-8 flex items-center justify-between gap-4 border-b border-white/10 pb-5">
      <Link to="/" className="flex items-center gap-3 min-w-0">
        <img src="/logo.png" alt="" className="h-10 w-10 object-contain shrink-0" />
        <div className="min-w-0">
          <span className="block text-sm font-bold tracking-tight text-primary">SolVamos</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
            Catalog
          </span>
        </div>
      </Link>
      <div className="flex items-center gap-1 sm:gap-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `hidden rounded-lg px-3 py-2 text-xs font-semibold sm:inline ${
              isActive
                ? 'bg-google-blue/20 text-google-blue'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/marketplace"
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm ${
              isActive
                ? 'bg-google-blue/20 text-google-blue'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`
          }
        >
          라이브 에이전트
        </NavLink>
        <a
          href="/api/catalog"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-lg px-3 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high md:inline"
        >
          API
        </a>
        <a
          href={studio}
          className="inline-flex items-center gap-1.5 rounded-lg bg-google-blue px-3.5 py-2 text-xs font-semibold text-white hover:opacity-95 sm:px-4 sm:text-sm"
        >
          Studio 플랫폼
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </nav>
  );
}
