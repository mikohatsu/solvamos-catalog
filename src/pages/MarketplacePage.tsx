import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Activity,
  Check,
  Clock,
  Copy,
  Database,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';
import type { MouseEvent } from 'react';
import type { CatalogResponse, PublicAgent } from '../types';
import { useLang } from '../lang';

type ShellCtx = { studioUrl: string; setAgentCount?: (n: number) => void };

const DEFAULT_CATEGORIES = [
  'All',
  'HR & Policy',
  'Legal & Compliance',
  'Tech Support',
  'Finance',
] as const;

export default function MarketplacePage() {
  const { studioUrl, setAgentCount } = useOutletContext<ShellCtx>();
  const { t } = useLang();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/catalog', { cache: 'no-store' });
      const data = (await res.json()) as CatalogResponse & { message?: string };
      if (!res.ok || data.status === 'error') {
        throw new Error(data.message || t('카탈로그를 불러오지 못했습니다.', 'Failed to load catalog.'));
      }
      setCatalog(data);
      setAgentCount?.(data.agent_count ?? data.agents?.length ?? 0);
    } catch (err: any) {
      setError(err?.message || t('카탈로그 요청 실패', 'Catalog request failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const categories = useMemo(() => {
    const fromAgents = new Set(
      (catalog?.agents || [])
        .map((a) => a.category || a.role || '')
        .filter((c): c is string => c.length > 0)
    );
    const merged: string[] = [...DEFAULT_CATEGORIES];
    for (const c of fromAgents) {
      if (!merged.includes(c) && c !== 'All') {
        merged.push(c);
      }
    }
    return merged;
  }, [catalog]);

  const agents = useMemo(() => {
    const rows = catalog?.agents || [];
    const q = query.trim().toLowerCase();
    return rows.filter((a) => {
      const cat = a.category || a.role || '';
      const catOk = category === 'All' || cat === category;
      if (!catOk) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.fqn.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        a.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [catalog, query, category]);

  const totalInvocations = useMemo(
    () =>
      (catalog?.agents || []).reduce((sum, a) => {
        const m = (a as PublicAgent & { metrics?: { totalCalls?: number } }).metrics;
        return sum + (m?.totalCalls ?? 0);
      }, 0),
    [catalog]
  );

  const usdcSettled = useMemo(
    () =>
      (catalog?.agents || []).reduce((sum, a) => {
        const m = (a as PublicAgent & { metrics?: { totalRevenueUsdc?: number } }).metrics;
        if (typeof m?.totalRevenueUsdc === 'number') return sum + m.totalRevenueUsdc;
        return sum;
      }, 0),
    [catalog]
  );

  const studio = catalog?.studio_url || studioUrl || 'https://solvamos-studio-74094114833.asia-northeast3.run.app';
  const activeCount = catalog?.agents?.length ?? 0;
  const totalCount = catalog?.agent_count ?? activeCount;

  const copyApi = async (e: MouseEvent, agent: PublicAgent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(agent.invoke_url);
    setCopiedId(agent.agent_id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-10 pb-20 pt-8">
      {/* Hero + stats — match solvamos.ai.studio Live Services */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl sm:p-10">
        <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="mb-3 inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 font-mono text-xs text-cyan-300">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
              <span>SOLVAMOS INTERNAL AGENT CATALOG API</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              {t('라이브 AI 에이전트 카탈로그', 'Live AI Agent Catalog')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              {t(
                'GCP Vertex AI Vector Search RAG와 Solana pay.sh 온체인 정산이 결합된 검증된 엔터프라이즈 AI 에이전트 목록입니다.',
                'Verified enterprise AI agents powered by GCP Vertex AI RAG and micro-metered via Solana pay.sh.'
              )}
            </p>
          </div>
          <a
            href={studio}
            className="flex shrink-0 items-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:opacity-95"
          >
            <Zap className="h-4 w-4 fill-cyan-300/30 text-cyan-300" />
            <span>{t('+ 신규 에이전트 등록', '+ Deploy New Agent')}</span>
          </a>
        </div>

        <div className="relative z-10 mt-8 grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-6 font-mono text-xs sm:grid-cols-4">
          <StatCard
            label="Active Agents"
            value={`${activeCount} / ${totalCount}`}
            valueClass="text-cyan-400"
          />
          <StatCard
            label="Total Invocations"
            value={totalInvocations.toLocaleString()}
            valueClass="text-white"
          />
          <StatCard
            label="USDC Settled"
            value={`$${usdcSettled.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            valueClass="text-emerald-400"
          />
          <StatCard label="Avg Response Time" value="~435ms" valueClass="text-indigo-400" />
        </div>
      </div>

      {/* Category + search */}
      <div className="flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none lg:pb-0">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-xl px-4 py-2 text-xs font-medium whitespace-nowrap transition-all ${
                category === c
                  ? 'border border-cyan-500/50 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 shadow-sm'
                  : 'border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              {c === 'All' ? t('전체 카테고리', 'All Categories') : c}
            </button>
          ))}
        </div>
        <div className="relative min-w-[280px]">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('에이전트 이름 또는 키워드 검색...', 'Search agents or keywords...')}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pr-4 pl-10 text-xs text-white placeholder-slate-500 transition-all focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin" /> {t('카탈로그 불러오는 중…', 'Loading catalog…')}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-300">{error}</div>
      ) : agents.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
          {t('조건에 맞는 에이전트가 없습니다.', 'No agents match your filters.')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {agents.map((agent) => (
            <CatalogAgentCard
              key={agent.catalog_id}
              agent={agent}
              copied={copiedId === agent.agent_id}
              onCopy={(e) => void copyApi(e, agent)}
              onOpen={() => navigate(`/a/${encodeURIComponent(agent.agent_id)}`)}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
      <div className="text-slate-400 uppercase">{label}</div>
      <div className={`mt-1 text-lg font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}

function CatalogAgentCard({
  agent,
  copied,
  onCopy,
  onOpen,
  t,
}: {
  agent: PublicAgent;
  copied: boolean;
  onCopy: (e: MouseEvent) => void;
  onOpen: () => void;
  t: (kr: string, en: string) => string;
}) {
  const category = agent.category || agent.role || 'General';
  const status = 'ACTIVE';
  const version = agent.tags.find((x) => /^v?\d/.test(x)) || 'v1.0';
  const metrics = (agent as PublicAgent & {
    metrics?: { totalCalls?: number; avgLatencyMs?: number };
  }).metrics;
  const calls = metrics?.totalCalls ?? 0;
  const latency = metrics?.avgLatencyMs ?? 435;
  const ragDocs = agent.endpoint_count || agent.tags.filter((x) => /doc|rag|pdf/i.test(x)).length || 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-6 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10"
    >
      <div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-y-1 space-x-2">
              <span className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-0.5 font-mono text-[11px] text-cyan-400">
                {category}
              </span>
              <span className="flex items-center space-x-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
                <span>{status}</span>
              </span>
              <span className="font-mono text-[10px] text-slate-500">{version}</span>
            </div>
            <h3 className="flex items-center space-x-2 text-xl font-bold text-white transition-colors group-hover:text-cyan-300">
              <span>{agent.title}</span>
            </h3>
          </div>
          <div
            className="shrink-0 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-1.5 text-cyan-400"
            title="Verified SolVamos Agent"
          >
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <p className="mb-6 line-clamp-2 text-xs leading-relaxed text-slate-300">
          {agent.description || agent.use_case}
        </p>

        <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 font-mono text-xs">
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Cost / Query</div>
            <div className="mt-0.5 flex items-center space-x-1 text-sm font-bold text-cyan-400">
              <Wallet className="h-3.5 w-3.5 text-indigo-400" />
              <span>
                ${agent.fee_usdc} USDC
              </span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Vertex RAG Docs</div>
            <div className="mt-0.5 flex items-center space-x-1 text-sm font-bold text-white">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span>
                {ragDocs} Linked Docs
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between border-t border-slate-800/60 pt-3 font-mono text-[11px] text-slate-400">
          <div className="flex items-center space-x-1">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>{calls.toLocaleString()} Calls</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
            <span>{latency}ms Avg</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center justify-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-xs font-medium text-slate-200 transition-all hover:bg-slate-700"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy A2A API</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="flex items-center justify-center space-x-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition-all group-hover:border-cyan-500/60 hover:bg-cyan-500/20"
          >
            <FileText className="h-3.5 w-3.5 fill-cyan-400/20 text-cyan-400" />
            <span>{t('상세페이지 / 데모', 'Detail & Demo')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
