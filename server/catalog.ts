import fs from 'fs';
import path from 'path';

export type CatalogConfig = {
  port: number;
  publicBaseUrl: string;
  studioUrl: string;
  adminSecret: string;
  storePath: string;
  /** Optional one-shot import origins (legacy). Not used as live source of truth. */
  importSources: string[];
};

export type AgentEndpoint = {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  price_usdc: number;
  payment_protocol: string;
};

export type AgentStatus = 'listed' | 'unlisted' | 'paused';

export type PublicAgent = {
  fqn: string;
  catalog_id: string;
  agent_id: string;
  title: string;
  description: string;
  use_case: string;
  category: string;
  role?: string;
  tone?: string;
  invoke_url: string;
  origin_invoke_url?: string;
  agent_card_url?: string;
  page_url: string;
  api_url: string;
  markdown_url: string;
  fee_usdc: number;
  token: string;
  network: string;
  usdc_mint?: string;
  payment_protocol: string;
  recipient_wallet?: string;
  tags: string[];
  source: string;
  studio_origin?: string;
  tenant_id?: string;
  status: AgentStatus;
  listed_at?: string;
  updated_at?: string;
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
  store: 'solvamos-catalog';
  agents: PublicAgent[];
  data: Array<Record<string, unknown>>;
};

type StoreFile = {
  version: number;
  updated_at: string;
  agents: Record<string, PublicAgent>;
};

const SEED_FILE = path.join(process.cwd(), '.data', 'seed-catalog.json');

let store: StoreFile = { version: 1, updated_at: new Date().toISOString(), agents: {} };
let baseUrl = 'http://127.0.0.1:4173';
let studioUrl = 'http://localhost:3000';
let storePath = path.join(process.cwd(), '.data', 'catalog-store.json');

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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

export function finalizeAgent(
  partial: Partial<PublicAgent> & { agent_id: string },
  catalogBase: string
): PublicAgent {
  const agentId = partial.agent_id;
  const fee = Number(partial.fee_usdc ?? 0) || 0;
  const protocol = fee > 0 ? String(partial.payment_protocol || 'x402 / MPP') : 'free';
  const invoke = String(partial.invoke_url || '');
  const status = (partial.status || 'listed') as AgentStatus;
  const endpoints =
    Array.isArray(partial.endpoints) && partial.endpoints.length > 0
      ? partial.endpoints
      : buildEndpoints(invoke, fee, protocol);
  const now = new Date().toISOString();
  return {
    fqn: partial.fqn || `solvamos/${agentId}`,
    catalog_id: partial.catalog_id || `solvamos_${agentId}`,
    agent_id: agentId,
    title: String(partial.title || agentId),
    description: String(partial.description || ''),
    use_case:
      partial.use_case ||
      `Call this SolVamos RAG agent with ${protocol === 'free' ? 'plain HTTP' : 'pay fetch (x402/MPP)'}.`,
    category: partial.category || 'ai_ml',
    role: partial.role,
    tone: partial.tone,
    invoke_url: invoke,
    origin_invoke_url: partial.origin_invoke_url,
    agent_card_url: partial.agent_card_url,
    page_url: `${catalogBase}/a/${encodeURIComponent(agentId)}`,
    api_url: `${catalogBase}/api/solvamos/${encodeURIComponent(agentId)}`,
    markdown_url: `${catalogBase}/api/solvamos/${encodeURIComponent(agentId)}/index.md`,
    fee_usdc: fee,
    token: String(partial.token || 'USDC'),
    network: String(partial.network || 'devnet'),
    usdc_mint: partial.usdc_mint,
    payment_protocol: protocol,
    recipient_wallet: partial.recipient_wallet,
    tags: Array.isArray(partial.tags) ? partial.tags.map(String) : ['solvamos', 'a2a', 'x402'],
    source: String(partial.source || partial.studio_origin || 'studio'),
    studio_origin: partial.studio_origin,
    tenant_id: partial.tenant_id,
    status,
    listed_at: partial.listed_at || now,
    updated_at: now,
    endpoint_count: endpoints.length,
    endpoints,
    has_metering: fee > 0,
    has_free_tier: fee === 0,
    min_price_usd: fee,
    max_price_usd: fee,
  };
}

function saveStore() {
  try {
    ensureDir(storePath);
    store.updated_at = new Date().toISOString();
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('[catalog-store] save failed', err);
  }
}

function loadSeedIfEmpty() {
  if (Object.keys(store.agents).length > 0) return;
  try {
    if (!fs.existsSync(SEED_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
    const rows = Array.isArray(raw.agents) ? raw.agents : [];
    for (const row of rows) {
      const agent = finalizeAgent({ ...row, agent_id: String(row.agent_id), status: 'listed' }, baseUrl);
      store.agents[agent.agent_id] = agent;
    }
    if (rows.length) {
      saveStore();
      console.log(`[catalog-store] seeded ${rows.length} agents`);
    }
  } catch (err) {
    console.error('[catalog-store] seed failed', err);
  }
}

export function initCatalogStore(config: CatalogConfig) {
  baseUrl = config.publicBaseUrl;
  studioUrl = config.studioUrl;
  storePath = config.storePath;
  try {
    if (fs.existsSync(storePath)) {
      const raw = JSON.parse(fs.readFileSync(storePath, 'utf8')) as StoreFile;
      store = {
        version: raw.version || 1,
        updated_at: raw.updated_at || new Date().toISOString(),
        agents: raw.agents || {},
      };
      // Re-finalize page URLs for current PUBLIC_BASE_URL
      for (const [id, agent] of Object.entries(store.agents)) {
        store.agents[id] = finalizeAgent(agent, baseUrl);
      }
    }
  } catch (err) {
    console.error('[catalog-store] load failed', err);
    store = { version: 1, updated_at: new Date().toISOString(), agents: {} };
  }
  loadSeedIfEmpty();
  console.log(
    `[catalog-store] path=${storePath} agents=${Object.keys(store.agents).length} (source of truth)`
  );
}

export function toStudioMirror(agent: PublicAgent): Record<string, unknown> {
  return {
    catalogId: agent.catalog_id,
    agentId: agent.agent_id,
    name: agent.title,
    description: agent.description,
    role: agent.role,
    tone: agent.tone,
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
    usdcMint: agent.usdc_mint,
    paymentProtocol: agent.payment_protocol,
    tags: agent.tags,
    endpoints: agent.endpoints,
    tenantId: agent.tenant_id,
    studioOrigin: agent.studio_origin,
    status: agent.status,
    listedAt: agent.listed_at,
    updatedAt: agent.updated_at,
  };
}

function listedAgents(filter?: { tenantId?: string; studioOrigin?: string }): PublicAgent[] {
  return Object.values(store.agents)
    .filter((a) => a.status === 'listed')
    .filter((a) => (filter?.tenantId ? a.tenant_id === filter.tenantId : true))
    .filter((a) => (filter?.studioOrigin ? a.studio_origin === filter.studioOrigin : true))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function buildPublicCatalog(filter?: {
  tenantId?: string;
  studioOrigin?: string;
}): PublicCatalog {
  const agents = listedAgents(filter);
  const paid_count = agents.filter((a) => a.fee_usdc > 0).length;
  return {
    version: 1,
    status: 'success',
    catalog: 'solvamos',
    protocol: 'x402 / MPP',
    generated_at: new Date().toISOString(),
    base_url: baseUrl,
    studio_url: studioUrl,
    marketplace_url: `${baseUrl}/marketplace`,
    agent_count: agents.length,
    paid_count,
    free_count: agents.length - paid_count,
    payment_hint:
      'Paid agents: pay fetch "<invoke_url>?prompt=hello" (x402/MPP). Free agents: plain HTTP POST. Catalog store is solvamos-catalog (source of truth).',
    store: 'solvamos-catalog',
    agents,
    data: agents.map(toStudioMirror),
  };
}

export function getCachedCatalog(): PublicCatalog {
  return buildPublicCatalog();
}

export function findAgent(idOrFqn: string): PublicAgent | null {
  const key = decodeURIComponent(idOrFqn).replace(/^solvamos\//, '');
  const agent =
    store.agents[key] ||
    Object.values(store.agents).find(
      (a) => a.catalog_id === key || a.fqn === key || a.fqn === `solvamos/${key}` || a.fqn === idOrFqn
    );
  if (!agent || agent.status !== 'listed') return null;
  return finalizeAgent(agent, baseUrl);
}

export function upsertAgent(input: Record<string, unknown>): PublicAgent {
  const agentId = String(input.agent_id || input.agentId || '');
  if (!agentId) throw new Error('agent_id required');
  const existing = store.agents[agentId];
  const agent = finalizeAgent(
    {
      ...(existing || {}),
      agent_id: agentId,
      catalog_id: String(input.catalog_id || input.catalogId || existing?.catalog_id || `solvamos_${agentId}`),
      fqn: String(input.fqn || existing?.fqn || `solvamos/${agentId}`),
      title: String(input.title || input.name || existing?.title || agentId),
      description: String(input.description ?? existing?.description ?? ''),
      use_case: input.use_case ? String(input.use_case) : existing?.use_case,
      category: input.category ? String(input.category) : existing?.category,
      role: input.role != null ? String(input.role) : existing?.role,
      tone: input.tone != null ? String(input.tone) : existing?.tone,
      invoke_url: String(input.invoke_url || input.invokeUrl || existing?.invoke_url || ''),
      origin_invoke_url:
        input.origin_invoke_url || input.originInvokeUrl
          ? String(input.origin_invoke_url || input.originInvokeUrl)
          : existing?.origin_invoke_url,
      agent_card_url:
        input.agent_card_url || input.agentCardUrl
          ? String(input.agent_card_url || input.agentCardUrl)
          : existing?.agent_card_url,
      fee_usdc: Number(input.fee_usdc ?? input.feeUsdc ?? existing?.fee_usdc ?? 0) || 0,
      token: String(input.token || existing?.token || 'USDC'),
      network: String(input.network || existing?.network || 'devnet'),
      usdc_mint: input.usdc_mint || input.usdcMint ? String(input.usdc_mint || input.usdcMint) : existing?.usdc_mint,
      payment_protocol: input.payment_protocol || input.paymentProtocol
        ? String(input.payment_protocol || input.paymentProtocol)
        : existing?.payment_protocol,
      recipient_wallet:
        input.recipient_wallet || input.recipientWallet
          ? String(input.recipient_wallet || input.recipientWallet)
          : existing?.recipient_wallet,
      tags: Array.isArray(input.tags) ? input.tags.map(String) : existing?.tags,
      source: String(input.source || input.studio_origin || input.studioOrigin || existing?.source || 'studio'),
      studio_origin:
        input.studio_origin || input.studioOrigin
          ? String(input.studio_origin || input.studioOrigin)
          : existing?.studio_origin,
      tenant_id:
        input.tenant_id || input.tenantId ? String(input.tenant_id || input.tenantId) : existing?.tenant_id,
      status: (input.status as AgentStatus) || existing?.status || 'listed',
      listed_at: existing?.listed_at,
      endpoints: Array.isArray(input.endpoints) ? (input.endpoints as AgentEndpoint[]) : existing?.endpoints,
    },
    baseUrl
  );
  if (!agent.invoke_url) throw new Error('invoke_url required');
  store.agents[agentId] = agent;
  saveStore();
  return agent;
}

export function unlistAgent(agentId: string): PublicAgent | null {
  const existing = store.agents[agentId];
  if (!existing) return null;
  const agent = finalizeAgent({ ...existing, status: 'unlisted' }, baseUrl);
  store.agents[agentId] = agent;
  saveStore();
  return agent;
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

/** Normalize a Studio-shaped payload into upsert input. */
export function normalizeStudioPayload(entry: Record<string, unknown>, studioOrigin?: string) {
  return {
    agent_id: entry.agentId || entry.agent_id,
    catalog_id: entry.catalogId || entry.catalog_id,
    title: entry.name || entry.title,
    description: entry.description,
    role: entry.role,
    tone: entry.tone,
    invoke_url: entry.invokeUrl || entry.invoke_url || entry.publicInvokeUrl,
    origin_invoke_url: entry.originInvokeUrl || entry.origin_invoke_url,
    agent_card_url: entry.agentCardUrl || entry.agent_card_url,
    fee_usdc: entry.feeUsdc ?? entry.fee_usdc,
    token: entry.token,
    network: entry.network,
    usdc_mint: entry.usdcMint || entry.usdc_mint,
    payment_protocol: entry.paymentProtocol || entry.payment_protocol,
    recipient_wallet: entry.recipientWallet || entry.recipient_wallet,
    tags: entry.tags,
    tenant_id: entry.tenantId || entry.tenant_id,
    studio_origin: studioOrigin || entry.studioOrigin || entry.studio_origin,
    status: entry.status || 'listed',
    source: studioOrigin || 'studio',
  };
}
