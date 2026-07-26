/**
 * Visually hidden block for AI/HTML scrapers. Humans don't see it;
 * crawlers and accessibility trees still get the structured text.
 */
export default function MachineReadableBlock({
  title,
  lines,
  json,
}: {
  title: string;
  lines: string[];
  json?: unknown;
}) {
  return (
    <section
      data-solvamos-machine="1"
      aria-label={title}
      className="absolute h-px w-px overflow-hidden whitespace-nowrap"
      style={{ clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)', margin: '-1px', border: 0, padding: 0 }}
    >
      <h2>{title}</h2>
      <pre>{lines.join('\n')}</pre>
      {json != null ? (
        <pre data-solvamos-machine-json="1">{JSON.stringify(json, null, 2)}</pre>
      ) : null}
    </section>
  );
}
