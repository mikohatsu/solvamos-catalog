import { Link } from 'react-router-dom';
import { Bot, ExternalLink } from 'lucide-react';
import type { PublicAgent } from '../types';
import CopyButton from './CopyButton';
import { useLang } from '../lang';

export default function AgentCard({
  agent,
  copied,
  onCopy,
}: {
  agent: PublicAgent;
  copied: string | null;
  onCopy: (value: string, key: string) => void;
}) {
  const { t } = useLang();
  const paid = agent.fee_usdc > 0;
  const callExample = paid
    ? `pay fetch "${agent.invoke_url}?prompt=${encodeURIComponent('안녕하세요')}"`
    : `curl -X POST "${agent.invoke_url}" -H "Content-Type: application/json" -d "{\\"prompt\\":\\"안녕하세요\\"}"`;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg transition-all hover:border-cyan-500/30">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2.5">
            <Bot className="h-6 w-6 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <Link
              to={`/a/${encodeURIComponent(agent.agent_id)}`}
              className="block truncate text-xl font-semibold text-white hover:text-cyan-300"
            >
              {agent.title}
            </Link>
            <p className="mt-1 font-mono text-[11px] text-slate-500">{agent.fqn}</p>
            <p className="mt-1 text-xs text-slate-400">
              {agent.role || agent.category}
              {' · '}
              {agent.fee_usdc} {agent.token} / call
              {' · '}
              {agent.network}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold tracking-wider uppercase ${
            paid
              ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
              : 'border border-slate-700 bg-slate-800 text-slate-400'
          }`}
        >
          {agent.payment_protocol}
        </span>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-slate-400">{agent.description}</p>

      <EndpointRow
        label={paid ? 'Paid Invoke (x402/MPP)' : 'Invoke (free)'}
        value={agent.invoke_url}
        copied={copied === `invoke-${agent.agent_id}`}
        onCopy={() => onCopy(agent.invoke_url, `invoke-${agent.agent_id}`)}
      />
      <EndpointRow
        label="Public page"
        value={agent.page_url}
        copied={copied === `page-${agent.agent_id}`}
        onCopy={() => onCopy(agent.page_url, `page-${agent.agent_id}`)}
      />
      <EndpointRow
        label="JSON (scrape)"
        value={agent.api_url}
        copied={copied === `api-${agent.agent_id}`}
        onCopy={() => onCopy(agent.api_url, `api-${agent.agent_id}`)}
      />

      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            {t('호출 예제', 'Call example')}
          </span>
          <CopyButton
            compact
            copied={copied === `curl-${agent.agent_id}`}
            onClick={() => onCopy(callExample, `curl-${agent.agent_id}`)}
          />
        </div>
        <code className="block overflow-x-auto font-mono text-xs break-all whitespace-pre-wrap text-slate-400">
          {callExample}
        </code>
      </div>

      <Link
        to={`/a/${encodeURIComponent(agent.agent_id)}`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
      >
        {t('상세 페이지', 'Details')} <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </article>
  );
}

function EndpointRow({
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
