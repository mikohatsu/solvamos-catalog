import fs from 'fs';
import path from 'path';

const SEED_FILE = path.join(process.cwd(), '.data', 'seed-catalog.json');

export type CatalogConfig = {
  port: number;
  publicBaseUrl: string;
  studioUrl: string;
  sources: string[];
  cacheTtlSec: number;
};

export type AgentEndpoint = {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  price_usdc: number;
  payment_protocol: string;
};

export type PublicAgent = {
  fqn: string;
  catalog_id: string;
  agent_id: string;
  title: string;
  description: string;
  use_case: string;
  category: string;
  role?: string;
  invoke_url: string;
  origin_invoke_url?: string;
  agent_card_url?: string;
  /** Public HTML page on this catalog site */
  page_url: string;
  /** Machine JSON for this agent (external sites scrape this) */
  api_url: string;
  /** Markdown skill card (pay.sh-style) */
  markdown_url: string;
  fee_usdc: number;
  token: string;
  network: string;
  payment_protocol: string;
  recipient_wallet?: string;
  tags: string[];
  source: string;
  listed_at?: string;
  endpoint_count: number;
  endpoints: AgentEndpoint[];
  has_metering: boolean;
  has_free_tier: boolean;
  min_price_usd: number;
  max_price_usd: number;
};

export type PublicCatalog = {
  version: number;
  status: 'success';
  catalog: 'solvamos';
  protocol: string;
  generated_at: string;
  base_url: string;
  studio_url: string;
  marketplace_url: string;
  agent_count: number;
  paid_count: number;
  free_count: number;
  payment_hint: string;
  sources: string[];
  agents: PublicAgent[];
  /** Studio-compatible mirror for existing clients */
  data: Array<Record<string, unknown>>;
};

type Cache = { at: number; value: PublicCatalog };
let cache: Cache | null = null;

function readSeed(baseUrl: string): PublicAgent[] {
  try {
    if (!fs.existsSync(SEED_FILE)) return [];
    const raw = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
    const rows = Array.isArray(raw.agents) ? raw.agents : [];
    return rows.map((a: any) => finalizeAgent(a, baseUrl)).filter(Boolean) as PublicAgent[];
  } catch {
    return [];
  }
}

function buildEndpoints(invokeUrl: string, fee: number, protocol: string): AgentEndpoint[] {
  const pathPart = (() => {
    try {
      return new URL(invokeUrl).pathname;
    } catch {
      return '/v1/agents/{agentId}/invoke';
    }
  })();
  return [
    {
      method: 'GET',
      path: pathPart,
      description: 'Invoke with ?prompt=… query parameter.',
      price_usdc: fee,
      payment_protocol: protocol,
    },
    {
      method: 'POST',
      path: pathPart,
      description: 'Invoke with JSON body { "prompt": "…" }.',
      price_usdc: fee,
      payment_protocol: protocol,
    },
  ];
}

function finalizeAgent(partial: Partial<PublicAgent> & { agent_id: string }, baseUrl: string): PublicAgent {
  const agentId = partial.agent_id;
  const fee = Number(partial.fee_usdc ?? 0) || 0;
  const protocol = fee > 0 ? String(partial.payment_protocol || 'x402 / MPP') : 'free';
  const invoke = String(partial.invoke_url || '');
  const endpoints =
    Array.isArray(partial.endpoints) && partial.endpoints.length > 0
      ? partial.endpoints
      : buildEndpoints(invoke, fee, protocol);
  const fqn = partial.fqn || `solvamos/${agentId}`;
  return {
    fqn,
    catalog_id: partial.catalog_id || `solvamos_${agentId}`,
    agent_id: agentId,
    title: String(partial.title || agentId),
    description: String(partial.description || ''),
    use_case:
      partial.use_case ||
      `Call this SolVamos RAG agent with ${protocol === 'free' ? 'plain HTTP' : 'pay fetch (x402/MPP)'}.`,
    category: partial.category || 'ai_ml',
    role: partial.role,
    invoke_url: invoke,
    origin_invoke_url: partial.origin_invoke_url,
    agent_card_url: partial.agent_card_url,
    page_url: `${baseUrl}/a/${encodeURIComponent(agentId)}`,
    api_url: `${baseUrl}/api/solvamos/${encodeURIComponent(agentId)}`,
    markdown_url: `${baseUrl}/api/solvamos/${encodeURIComponent(agentId)}/index.md`,
    fee_usdc: fee,
    token: String(partial.token || 'USDC'),
    network: String(partial.network || 'devnet'),
    payment_protocol: protocol,
    recipient_wallet: partial.recipient_wallet,
    tags: Array.isArray(partial.tags) ? partial.tags.map(String) : ['solvamos', 'a2a', 'x402'],
    source: String(partial.source || 'seed'),
    listed_at: partial.listed_at,
    endpoint_count: endpoints.length,
    endpoints,
    has_metering: fee > 0,
    has_free_tier: fee === 0,
    min_price_usd: fee,
    max_price_usd: fee,
  };
}

function normalizeStudioEntry(
  entry: any,
  sourceBase: string,
  catalogBase: string
): PublicAgent | null {
  const agentId = String(entry.agentId || entry.agent_id || '');
  if (!agentId) return null;
  const fee = Number(entry.feeUsdc ?? entry.fee_usdc ?? 0) || 0;
  const invoke =
    entry.publicInvokeUrl ||
    entry.invokeUrl ||
    entry.invoke_url ||
    `${sourceBase}/api/agents/${encodeURIComponent(agentId)}/invoke`;
  return finalizeAgent(
    {
      fqn: `solvamos/${agentId}`,
      catalog_id: String(entry.catalogId || entry.catalog_id || `solvamos_${agentId}`),
      agent_id: agentId,
      title: String(entry.name || entry.title || agentId),
      description: String(entry.description || ''),
      role: entry.role ? String(entry.role) : undefined,
      invoke_url: invoke,
      origin_invoke_url: entry.originInvokeUrl || entry.origin_invoke_url,
      agent_card_url:
        entry.agentCardUrl ||
        entry.agent_card_url ||
        `${sourceBase}/api/agents/${encodeURIComponent(agentId)}/agent-card`,
      fee_usdc: fee,
      token: String(entry.token || 'USDC'),
      network: String(entry.network || entry.paymentNetwork || 'devnet'),
      payment_protocol: fee > 0 ? String(entry.paymentProtocol || 'x402 / MPP') : 'free',
      recipient_wallet: entry.recipientWallet || entry.recipient_wallet,
      tags: Array.isArray(entry.tags) ? entry.tags.map(String) : ['solvamos', 'a2a', 'x402'],
      source: `${sourceBase}/api/catalog`,
      listed_at: entry.listedAt || entry.listed_at,
    },
    catalogBase
  );
}

async function fetchStudioCatalog(sourceBase: string, catalogBase: string): Promise<PublicAgent[]> {
  const url = `${sourceBase}/api/catalog`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    throw new Error(`${url} → HTTP ${res.status}`);
  }
  const json = (await res.json()) as any;
  const rows = Array.isArray(json.data)
    ? json.data
    : Array.isArray(json.agents)
      ? json.agents
      : [];
  return rows
    .map((row: any) => normalizeStudioEntry(row, sourceBase, catalogBase))
    .filter(Boolean) as PublicAgent[];
}

function toStudioMirror(agent: PublicAgent): Record<string, unknown> {
  return {
    catalogId: agent.catalog_id,
    agentId: agent.agent_id,
    name: agent.title,
    description: agent.description,
    role: agent.role,
    invokeUrl: agent.invoke_url,
    publicInvokeUrl: agent.invoke_url,
    originInvokeUrl: agent.origin_invoke_url,
    agentCardUrl: agent.agent_card_url,
    pageUrl: agent.page_url,
    apiUrl: agent.api_url,
    markdownUrl: agent.markdown_url,
    recipientWallet: agent.recipient_wallet,
    feeUsdc: agent.fee_usdc,
    token: agent.token,
    network: agent.network,
    paymentProtocol: agent.payment_protocol,
    tags: agent.tags,
    endpoints: agent.endpoints,
    status: 'listed',
    listedAt: agent.listed_at,
  };
}

export function agentToMarkdown(agent: PublicAgent): string {
  const price =
    agent.fee_usdc > 0 ? `${agent.fee_usdc} ${agent.token} / call (${agent.payment_protocol})` : 'free';
  const endpointLines = agent.endpoints
    .map(
      (e) =>
        `- \`${e.method} ${e.path}\` — ${e.description} · ${e.price_usdc} ${agent.token} (${e.payment_protocol})`
    )
    .join('\n');
  const paidExample = `pay fetch "${agent.invoke_url}?prompt=hello"`;
  const freeExample = `curl -X POST "${agent.invoke_url}" -H "Content-Type: application/json" -d '{"prompt":"hello"}'`;
  return `# ${agent.title}

> ${agent.description || agent.use_case}

- **FQN:** \`${agent.fqn}\`
- **Category:** ${agent.category}
- **Network:** ${agent.network}
- **Price:** ${price}
- **Page:** ${agent.page_url}
- **JSON:** ${agent.api_url}
- **Invoke:** ${agent.invoke_url}
${agent.agent_card_url ? `- **Agent Card:** ${agent.agent_card_url}` : ''}

## Use case

${agent.use_case}

## Endpoints

${endpointLines || '- (none)'}

## Call example

\`\`\`sh
${agent.fee_usdc > 0 ? paidExample : freeExample}
\`\`\`

## Tags

${agent.tags.map((t) => `\`${t}\``).join(' ')}
`;
}

export async function buildPublicCatalog(
  config: CatalogConfig,
  opts?: { force?: boolean }
): Promise<PublicCatalog> {
  const agents: PublicAgent[] = [];
  const errors: string[] = [];

  for (const source of config.sources) {
    try {
      const rows = await fetchStudioCatalog(source, config.publicBaseUrl);
      agents.push(...rows);
    } catch (err: any) {
      errors.push(`${source}: ${err?.message || err}`);
    }
  }

  if (agents.length === 0) {
    agents.push(...readSeed(config.publicBaseUrl));
  }

  const seen = new Set<string>();
  const unique = agents
    .map((a) => finalizeAgent(a, config.publicBaseUrl))
    .filter((a) => {
      if (seen.has(a.agent_id)) return false;
      seen.add(a.agent_id);
      return true;
    });

  unique.sort((a, b) => a.title.localeCompare(b.title));

  const paid_count = unique.filter((a) => a.fee_usdc > 0).length;
  const catalog: PublicCatalog = {
    version: 1,
    status: 'success',
    catalog: 'solvamos',
    protocol: 'x402 / MPP',
    generated_at: new Date().toISOString(),
    base_url: config.publicBaseUrl,
    studio_url: config.studioUrl,
    marketplace_url: `${config.publicBaseUrl}/marketplace`,
    agent_count: unique.length,
    paid_count,
    free_count: unique.length - paid_count,
    payment_hint:
      'Paid agents: pay fetch "<invoke_url>?prompt=hello" (x402/MPP). Free agents: plain HTTP POST. Scrape /api/catalog or /api/solvamos/:agentId for external pages.',
    sources: config.sources,
    agents: unique,
    data: unique.map(toStudioMirror),
  };

  if (errors.length && unique.length === 0) {
    console.warn('[catalog] all sources failed', errors);
  } else if (errors.length) {
    console.warn('[catalog] partial source failures', errors);
  }

  cache = { at: Date.now(), value: catalog };
  if (opts?.force) {
    console.log(`[catalog] refreshed agent_count=${catalog.agent_count}`);
  }
  return catalog;
}

export async function getCachedCatalog(config: CatalogConfig): Promise<PublicCatalog> {
  const ttl = Math.max(5, config.cacheTtlSec) * 1000;
  if (cache && Date.now() - cache.at < ttl) return cache.value;
  return buildPublicCatalog(config);
}

export function findAgent(catalog: PublicCatalog, idOrFqn: string): PublicAgent | null {
  const key = decodeURIComponent(idOrFqn).replace(/^solvamos\//, '');
  return (
    catalog.agents.find(
      (a) =>
        a.agent_id === key ||
        a.catalog_id === key ||
        a.fqn === key ||
        a.fqn === `solvamos/${key}` ||
        a.fqn === idOrFqn
    ) || null
  );
}
