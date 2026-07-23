import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, ExternalLink, RefreshCw } from 'lucide-react';
import type { PublicAgent } from '../types';
import CopyButton from '../components/CopyButton';
import { useLang } from '../lang';

type ShellCtx = { studioUrl: string };

export default function AgentDetailPage() {
  const { agentId = '' } = useParams();
  const { studioUrl: shellStudio } = useOutletContext<ShellCtx>();
  const { t } = useLang();
  const [agent, setAgent] = useState<PublicAgent | null>(null);
  const [studioUrl, setStudioUrl] = useState(shellStudio || 'https://solvamos-studio-74094114833.asia-northeast3.run.app');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/solvamos/${encodeURIComponent(agentId)}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok || data.status === 'error') {
          throw new Error(data.message || t('에이전트를 찾지 못했습니다.', 'Agent not found.'));
        }
        if (!cancelled) setAgent(data.agent as PublicAgent);
        const cat = await fetch('/api/catalog', { cache: 'no-store' }).then((r) => r.json());
        if (!cancelled && cat?.studio_url) setStudioUrl(cat.studio_url);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || t('로드 실패', 'Load failed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const paid = !!agent && agent.fee_usdc > 0;
  const callExample = agent
    ? paid
      ? `pay fetch "${agent.invoke_url}?prompt=${encodeURIComponent('안녕하세요')}"`
      : `curl -X POST "${agent.invoke_url}" -H "Content-Type: application/json" -d "{\\"prompt\\":\\"안녕하세요\\"}"`
    : '';

  return (
    <div className="space-y-6 pb-16 pt-10">
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-300"
      >
        <ArrowLeft className="h-4 w-4" /> {t('라이브 서비스', 'Live Services')}
      </Link>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin" /> {t('불러오는 중…', 'Loading…')}
        </div>
      ) : error || !agent ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-300">
          {error || 'Not found'}
        </div>
      ) : (
        <>
          <header className="flex items-start gap-4">
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
              <Bot className="h-8 w-8 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-xs text-slate-500">{agent.fqn}</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">
                {agent.title}
              </h1>
              <p className="mt-2 text-slate-400">
                {agent.role || agent.category} · {agent.fee_usdc} {agent.token} / call ·{' '}
                {agent.network}
              </p>
              <span
                className={`mt-3 inline-block rounded-md px-2 py-1 text-[10px] font-semibold tracking-wider uppercase ${
                  paid
                    ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                    : 'border border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                {agent.payment_protocol}
              </span>
            </div>
          </header>

          <p className="text-base leading-relaxed text-slate-300">
            {agent.description || agent.use_case}
          </p>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
            <h2 className="mb-4 text-sm font-semibold tracking-wider text-slate-500 uppercase">
              Discovery URLs
            </h2>
            <Row label="HTML page" value={agent.page_url} copied={copied === 'page'} onCopy={() => copy(agent.page_url, 'page')} />
            <Row label="JSON API (scrape)" value={agent.api_url} copied={copied === 'api'} onCopy={() => copy(agent.api_url, 'api')} />
            <Row label="Markdown card" value={agent.markdown_url} copied={copied === 'md'} onCopy={() => copy(agent.markdown_url, 'md')} />
            {agent.agent_card_url && (
              <Row
                label="A2A Agent Card"
                value={agent.agent_card_url}
                copied={copied === 'card'}
                onCopy={() => copy(agent.agent_card_url!, 'card')}
              />
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
            <h2 className="mb-4 text-sm font-semibold tracking-wider text-slate-500 uppercase">
              Endpoints ({agent.endpoint_count})
            </h2>
            <div className="space-y-3">
              {agent.endpoints.map((ep) => (
                <div
                  key={`${ep.method}-${ep.path}`}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-3"
                >
                  <p className="font-mono text-sm text-slate-200">
                    <span className="text-emerald-400">{ep.method}</span> {ep.path}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{ep.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {ep.price_usdc} {agent.token} · {ep.payment_protocol}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="mb-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Invoke URL
              </p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-300">
                  {agent.invoke_url}
                </code>
                <CopyButton compact copied={copied === 'invoke'} onClick={() => copy(agent.invoke_url, 'invoke')} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wider text-slate-500 uppercase">
                {t('호출 예제', 'Call example')}
              </h2>
              <CopyButton compact copied={copied === 'curl'} onClick={() => copy(callExample, 'curl')} />
            </div>
            <code className="block overflow-x-auto font-mono text-xs break-all whitespace-pre-wrap text-slate-400">
              {callExample}
            </code>
            {paid && (
              <p className="mt-3 text-xs text-slate-500">
                `pay fetch`가 HTTP 402(x402/MPP) 결제·재시도를 처리합니다.
              </p>
            )}
          </section>

          <div className="flex flex-wrap gap-3">
            <a
              href={agent.api_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300"
            >
              JSON {t('열기', 'Open')} <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href={agent.markdown_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200"
            >
              Markdown {t('열기', 'Open')} <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href={studioUrl}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-cyan-500/20"
            >
              Studio {t('플랫폼', 'Platform')}
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mb-3">
      <p className="mb-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{label}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-300">
          {value}
        </code>
        <CopyButton compact copied={copied} onClick={onCopy} />
      </div>
    </div>
  );
}
