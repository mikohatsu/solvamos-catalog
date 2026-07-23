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
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-google-blue/15 text-google-blue hover:bg-google-blue/25 ${
        compact ? 'p-2' : 'px-3 py-2 text-sm'
      }`}
      title="복사"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {!compact && (copied ? '복사됨' : label || '복사')}
    </button>
  );
}
