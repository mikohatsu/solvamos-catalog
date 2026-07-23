import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Bot, ExternalLink } from 'lucide-react';
import type { PublicAgent } from '../types';
import CopyButton from './CopyButton';

export default function AgentCard({
  agent,
  copied,
  onCopy,
}: {
  agent: PublicAgent;
  copied: string | null;
  onCopy: (value: string, key: string) => void;
}) {
  const paid = agent.fee_usdc > 0;
  const callExample = paid
    ? `pay fetch "${agent.invoke_url}?prompt=${encodeURIComponent('안녕하세요')}"`
    : `curl -X POST "${agent.invoke_url}" -H "Content-Type: application/json" -d "{\\"prompt\\":\\"안녕하세요\\"}"`;

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0 },
      }}
      className="glass-panel rounded-xl p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <Link
              to={`/a/${encodeURIComponent(agent.agent_id)}`}
              className="block truncate text-xl font-semibold hover:text-primary"
            >
              {agent.title}
            </Link>
            <p className="mt-1 font-mono text-[11px] text-outline">{agent.fqn}</p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {agent.role || agent.category}
              {' · '}
              {agent.fee_usdc} {agent.token} / call
              {' · '}
              {agent.network}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            paid
              ? 'bg-solana-green/15 text-solana-green'
              : 'bg-surface-container-high text-on-surface-variant'
          }`}
        >
          {agent.payment_protocol}
        </span>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-on-surface-variant">{agent.description}</p>

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

      <div className="mt-4 rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">
            호출 예제
          </span>
          <CopyButton
            compact
            copied={copied === `curl-${agent.agent_id}`}
            onClick={() => onCopy(callExample, `curl-${agent.agent_id}`)}
          />
        </div>
        <code className="block overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-on-surface-variant">
          {callExample}
        </code>
      </div>

      <Link
        to={`/a/${encodeURIComponent(agent.agent_id)}`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-google-blue hover:underline"
      >
        상세 페이지 <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </motion.article>
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
