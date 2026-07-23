import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Bot, ExternalLink, RefreshCw } from 'lucide-react';
import type { PublicAgent } from '../types';
import SiteHeader from '../components/SiteHeader';
import CopyButton from '../components/CopyButton';

export default function AgentDetailPage() {
  const { agentId = '' } = useParams();
  const [agent, setAgent] = useState<PublicAgent | null>(null);
  const [studioUrl, setStudioUrl] = useState('http://localhost:3000');
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
          throw new Error(data.message || '에이전트를 찾지 못했습니다.');
        }
        if (!cancelled) {
          setAgent(data.agent as PublicAgent);
        }
        const cat = await fetch('/api/catalog', { cache: 'no-store' }).then((r) => r.json());
        if (!cancelled && cat?.studio_url) setStudioUrl(cat.studio_url);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || '로드 실패');
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
    <div className="mesh min-h-screen text-on-surface">
      <div className="mx-auto max-w-4xl px-5 pb-20 pt-8 md:px-10 md:pt-12">
        <SiteHeader studioUrl={studioUrl} />

        <Link
          to="/marketplace"
          className="mb-6 inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Marketplace
        </Link>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-on-surface-variant">
            <RefreshCw className="h-5 w-5 animate-spin" /> 불러오는 중…
          </div>
        ) : error || !agent ? (
          <div className="rounded-xl border border-error/30 bg-error/10 p-5 text-error">
            {error || 'Not found'}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <header className="mb-8 flex items-start gap-4">
              <div className="rounded-xl bg-primary/10 p-3">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs text-outline">{agent.fqn}</p>
                <h1 className="mt-1 text-3xl font-bold md:text-4xl">{agent.title}</h1>
                <p className="mt-2 text-on-surface-variant">
                  {agent.role || agent.category} · {agent.fee_usdc} {agent.token} / call ·{' '}
                  {agent.network}
                </p>
                <span
                  className={`mt-3 inline-block rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                    paid
                      ? 'bg-solana-green/15 text-solana-green'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {agent.payment_protocol}
                </span>
              </div>
            </header>

            <p className="mb-8 text-base leading-relaxed text-on-surface-variant">
              {agent.description || agent.use_case}
            </p>

            <section className="glass-panel mb-5 rounded-xl p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-outline">
                Discovery URLs · 외부 페이지용
              </h2>
              <Row
                label="HTML page"
                value={agent.page_url}
                copied={copied === 'page'}
                onCopy={() => copy(agent.page_url, 'page')}
              />
              <Row
                label="JSON API (scrape)"
                value={agent.api_url}
                copied={copied === 'api'}
                onCopy={() => copy(agent.api_url, 'api')}
              />
              <Row
                label="Markdown card"
                value={agent.markdown_url}
                copied={copied === 'md'}
                onCopy={() => copy(agent.markdown_url, 'md')}
              />
              {agent.agent_card_url && (
                <Row
                  label="A2A Agent Card"
                  value={agent.agent_card_url}
                  copied={copied === 'card'}
                  onCopy={() => copy(agent.agent_card_url!, 'card')}
                />
              )}
            </section>

            <section className="glass-panel mb-5 rounded-xl p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-outline">
                Endpoints ({agent.endpoint_count})
              </h2>
              <div className="space-y-3">
                {agent.endpoints.map((ep) => (
                  <div
                    key={`${ep.method}-${ep.path}`}
                    className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-3"
                  >
                    <p className="font-mono text-sm">
                      <span className="text-solana-green">{ep.method}</span> {ep.path}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">{ep.description}</p>
                    <p className="mt-1 text-xs text-outline">
                      {ep.price_usdc} {agent.token} · {ep.payment_protocol}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-outline">
                  Invoke URL
                </p>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-lg bg-surface-container-lowest px-3 py-2 font-mono text-xs">
                    {agent.invoke_url}
                  </code>
                  <CopyButton compact copied={copied === 'invoke'} onClick={() => copy(agent.invoke_url, 'invoke')} />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-outline">
                  호출 예제
                </h2>
                <CopyButton
                  compact
                  copied={copied === 'curl'}
                  onClick={() => copy(callExample, 'curl')}
                />
              </div>
              <code className="block overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-on-surface-variant">
                {callExample}
              </code>
              {paid && (
                <p className="mt-3 text-xs text-outline">
                  `pay fetch`가 HTTP 402(x402/MPP) 결제·재시도를 처리합니다.
                </p>
              )}
            </section>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={agent.api_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-google-blue/15 px-4 py-2 text-sm text-google-blue"
              >
                JSON 열기 <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={agent.markdown_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2 text-sm"
              >
                Markdown 열기 <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        )}
      </div>
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
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-outline">{label}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded-lg bg-surface-container-lowest px-3 py-2 font-mono text-xs">
          {value}
        </code>
        <CopyButton compact copied={copied} onClick={onCopy} />
      </div>
    </div>
  );
}
