import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bot,
  Check,
  Copy,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  Sparkles,
  Wallet,
} from 'lucide-react';
import type { CatalogResponse } from '../types';
import CopyButton from '../components/CopyButton';
import AgentCard from '../components/AgentCard';

type FilterMode = 'all' | 'paid' | 'free';

export default function CatalogHome() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [copied, setCopied] = useState<string | null>(null);

  const apiUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/api/catalog` : '/api/catalog';

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/catalog', { cache: 'no-store' });
      const data = (await res.json()) as CatalogResponse & { message?: string };
      if (!res.ok || data.status === 'error') {
        throw new Error(data.message || '카탈로그를 불러오지 못했습니다.');
      }
      setCatalog(data);
    } catch (err: any) {
      setError(err?.message || '카탈로그 요청 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const agents = useMemo(() => {
    const rows = catalog?.agents || [];
    const q = query.trim().toLowerCase();
    return rows.filter((a) => {
      if (filter === 'paid' && !(a.fee_usdc > 0)) return false;
      if (filter === 'free' && a.fee_usdc > 0) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.fqn.toLowerCase().includes(q) ||
        (a.role || '').toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [catalog, query, filter]);

  const studioUrl = catalog?.studio_url || 'http://localhost:3000';

  return (
    <div className="mesh min-h-screen text-on-surface">
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-8 md:px-10 md:pt-12">
        <nav className="mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="h-10 w-10 object-contain" />
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Catalog
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/catalog"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-lg border border-outline-variant/40 px-3 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high sm:inline-flex sm:items-center sm:gap-1.5"
            >
              JSON API <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href={studioUrl}
              className="inline-flex items-center gap-2 rounded-lg bg-google-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Studio 열기
            </a>
          </div>
        </nav>

        {/* Hero — brand first, one composition */}
        <header className="relative mb-14 overflow-hidden rounded-2xl border border-white/10 px-6 py-12 md:px-12 md:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(66,133,244,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(20,241,149,0.14),transparent_50%)]" />
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative"
          >
            <div className="mb-6 flex items-center gap-4">
              <img src="/logo.png" alt="SolVamos" className="h-16 w-16 object-contain md:h-20 md:w-20" />
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary md:text-6xl">
                  SolVamos
                </h1>
                <p className="mt-1 text-sm font-medium uppercase tracking-[0.32em] text-on-surface md:text-base">
                  Public Agent Catalog
                </p>
              </div>
            </div>
            <p className="max-w-xl text-base leading-relaxed text-on-surface-variant md:text-lg">
              A2A 디스커버리와 x402/MPP 결제를 한곳에서. 에이전트를 찾고, API를 복사하고,{' '}
              <code className="font-mono text-solana-green">pay fetch</code>로 바로 호출하세요.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#agents"
                className="inline-flex items-center gap-2 rounded-lg bg-google-blue px-5 py-2.5 text-sm font-semibold text-white"
              >
                <Sparkles className="h-4 w-4" /> 에이전트 둘러보기
              </a>
              <button
                type="button"
                onClick={() => copy(apiUrl, 'api')}
                className="inline-flex items-center gap-2 rounded-lg border border-solana-green/40 bg-solana-green/10 px-5 py-2.5 text-sm font-semibold text-solana-green"
              >
                {copied === 'api' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                /api/catalog 복사
              </button>
            </div>
          </motion.div>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="glass-panel mb-8 rounded-xl p-5"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-solana-green">
                Machine-readable API · pay.sh/api 스타일
              </p>
              <p className="mt-1 break-all font-mono text-sm text-on-surface">{apiUrl}</p>
              <p className="mt-2 text-xs text-outline">
                {catalog?.payment_hint ||
                  'Paid: x402/MPP via pay CLI · Free: plain HTTP POST'}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <CopyButton
                copied={copied === 'catalog-api'}
                onClick={() => copy(apiUrl, 'catalog-api')}
                label="복사"
              />
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-3 py-2 text-sm hover:bg-surface-container-highest"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>
          </div>
          {catalog && (
            <div className="mt-4 flex flex-wrap gap-4 border-t border-outline-variant/20 pt-4 text-xs text-on-surface-variant">
              <Stat label="Agents" value={String(catalog.agent_count)} />
              <Stat label="Paid (x402)" value={String(catalog.paid_count)} />
              <Stat label="Free" value={String(catalog.free_count)} />
              <Stat label="Protocol" value={catalog.protocol} />
            </div>
          )}
        </motion.section>

        <section id="agents" className="scroll-mt-8">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold md:text-3xl">Listed agents</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Studio에 게시된 공개 에이전트입니다. 유료 호출은 게이트웨이에서 정산됩니다.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-[220px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="검색: 이름, 태그, fqn…"
                  className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest py-2 pl-9 pr-3 text-sm outline-none focus:border-google-blue"
                />
              </label>
              <div className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-1">
                <Filter className="ml-2 h-3.5 w-3.5 text-outline" />
                {(['all', 'paid', 'free'] as FilterMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFilter(mode)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${
                      filter === mode
                        ? 'bg-google-blue/20 text-google-blue'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-24 text-on-surface-variant">
              <RefreshCw className="h-5 w-5 animate-spin" /> 카탈로그 불러오는 중…
            </div>
          ) : error ? (
            <div className="rounded-xl border border-error/30 bg-error/10 p-5 text-error">{error}</div>
          ) : agents.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center text-on-surface-variant">
              <Bot className="mx-auto mb-3 h-10 w-10 text-outline" />
              조건에 맞는 에이전트가 없습니다.
              <p className="mt-2 text-xs">
                Studio에서 에이전트를 게시하거나 <code className="font-mono">CATALOG_SOURCES</code>를
                확인하세요.
              </p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06 } },
              }}
              className="grid gap-5 lg:grid-cols-2"
            >
              {agents.map((agent) => (
                <AgentCard
                  key={agent.catalog_id}
                  agent={agent}
                  copied={copied}
                  onCopy={copy}
                />
              ))}
            </motion.div>
          )}
        </section>

        <footer className="mt-16 border-t border-outline-variant/20 pt-8 text-sm text-outline">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="inline-flex items-center gap-2">
              <Wallet className="h-4 w-4 text-solana-green" />
              Payments settle with Solana USDC via x402 / MPP (pay.sh-compatible gateway).
            </p>
            <p className="font-mono text-xs">
              generated {catalog?.generated_at ? new Date(catalog.generated_at).toLocaleString() : '—'}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-outline">{label}</span>
      <span className="ml-2 font-mono text-on-surface">{value}</span>
    </div>
  );
}
