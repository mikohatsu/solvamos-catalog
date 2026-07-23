import { Check, Copy } from 'lucide-react';

export default function CopyButton({
  copied,
  onClick,
  label,
  compact = false,
}: {
  copied: boolean;
  onClick: () => void;
  label?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 ${
        compact ? 'p-2' : 'px-3 py-2 text-sm'
      }`}
      title="Copy"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {!compact && (copied ? 'Copied' : label || 'Copy')}
    </button>
  );
}
