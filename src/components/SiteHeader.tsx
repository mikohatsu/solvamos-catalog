import { Link, NavLink } from 'react-router-dom';

export default function SiteHeader({ studioUrl }: { studioUrl?: string }) {
  const studio = studioUrl || 'http://localhost:3000';
  return (
    <nav className="mb-10 flex items-center justify-between gap-4">
      <Link to="/" className="flex items-center gap-3">
        <img src="/logo.png" alt="" className="h-10 w-10 object-contain" />
        <span className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
          SolVamos
        </span>
      </Link>
      <div className="flex items-center gap-1 sm:gap-2">
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
          Marketplace
        </NavLink>
        <a
          href="/api/catalog"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-lg px-3 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high sm:inline"
        >
          API
        </a>
        <a
          href={studio}
          className="inline-flex items-center gap-2 rounded-lg bg-google-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          Studio
        </a>
      </div>
    </nav>
  );
}
