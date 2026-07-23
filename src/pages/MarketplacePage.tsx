import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Bot, Filter, RefreshCw, Search, Wallet } from 'lucide-react';
import type { CatalogResponse } from '../types';
import SiteHeader from '../components/SiteHeader';
import CopyButton from '../components/CopyButton';
import AgentCard from '../components/AgentCard';

type FilterMode = 'all' | 'paid' | 'free';

export default function MarketplacePage() {
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
        <SiteHeader studioUrl={studioUrl} />

        <header className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Public marketplace
          </p>
          <h1 className="text-3xl font-bold md:text-4xl">Agent directory</h1>
          <p className="mt-2 max-w-2xl text-on-surface-variant">
            Studio에 게시된 에이전트입니다. 각 카드는 전용 웹페이지·JSON·invoke 엔드포인트를
            가집니다. 외부 사이트는 아래 카탈로그 API를 긁어 표시하면 됩니다.
          </p>
        </header>

        <section className="glass-panel mb-8 rounded-xl p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-solana-green">
                Scrape /api/catalog · pay.sh 스타일
              </p>
              <p className="mt-1 break-all font-mono text-sm text-on-surface">{apiUrl}</p>
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
              <Stat label="Paid" value={String(catalog.paid_count)} />
              <Stat label="Free" value={String(catalog.free_count)} />
              <Stat label="Protocol" value={catalog.protocol} />
            </div>
          )}
        </section>

        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Listed agents</h2>
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
              <AgentCard key={agent.catalog_id} agent={agent} copied={copied} onCopy={copy} />
            ))}
          </motion.div>
        )}

        <footer className="mt-16 border-t border-outline-variant/20 pt-8 text-sm text-outline">
          <p className="inline-flex items-center gap-2">
            <Wallet className="h-4 w-4 text-solana-green" />
            Payments settle with Solana USDC via x402 / MPP.
          </p>
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
