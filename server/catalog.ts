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

export type PublicAgent = {
  fqn: string;
  catalog_id: string;
  agent_id: string;
  title: string;
  description: string;
  category: string;
  role?: string;
  invoke_url: string;
  origin_invoke_url?: string;
  agent_card_url?: string;
  fee_usdc: number;
  token: string;
  network: string;
  payment_protocol: string;
  recipient_wallet?: string;
  tags: string[];
  source: string;
  listed_at?: string;
};

export type PublicCatalog = {
  version: number;
  status: 'success';
  catalog: 'solvamos';
  protocol: string;
  generated_at: string;
  base_url: string;
  studio_url: string;
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

function readSeed(): PublicAgent[] {
  try {
    if (!fs.existsSync(SEED_FILE)) return [];
    const raw = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
    return Array.isArray(raw.agents) ? raw.agents : [];
  } catch {
    return [];
  }
}

function normalizeStudioEntry(entry: any, sourceBase: string): PublicAgent | null {
  const agentId = String(entry.agentId || entry.agent_id || '');
  if (!agentId) return null;
  const fee = Number(entry.feeUsdc ?? entry.fee_usdc ?? 0) || 0;
  const invoke =
    entry.publicInvokeUrl ||
    entry.invokeUrl ||
    entry.invoke_url ||
    `${sourceBase}/api/agents/${encodeURIComponent(agentId)}/invoke`;
  const title = String(entry.name || entry.title || agentId);
  const catalogId = String(entry.catalogId || entry.catalog_id || `solvamos_${agentId}`);
  return {
    fqn: `solvamos/${agentId}`,
    catalog_id: catalogId,
    agent_id: agentId,
    title,
    description: String(entry.description || ''),
    category: 'ai_ml',
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
  };
}

async function fetchStudioCatalog(sourceBase: string): Promise<PublicAgent[]> {
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
    .map((row: any) => normalizeStudioEntry(row, sourceBase))
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
    recipientWallet: agent.recipient_wallet,
    feeUsdc: agent.fee_usdc,
    token: agent.token,
    network: agent.network,
    paymentProtocol: agent.payment_protocol,
    tags: agent.tags,
    status: 'listed',
    listedAt: agent.listed_at,
  };
}

export async function buildPublicCatalog(
  config: CatalogConfig,
  opts?: { force?: boolean }
): Promise<PublicCatalog> {
  const agents: PublicAgent[] = [];
  const errors: string[] = [];

  for (const source of config.sources) {
    try {
      const rows = await fetchStudioCatalog(source);
      agents.push(...rows);
    } catch (err: any) {
      errors.push(`${source}: ${err?.message || err}`);
    }
  }

  if (agents.length === 0) {
    agents.push(...readSeed());
  }

  // Dedupe by agent_id (first source wins)
  const seen = new Set<string>();
  const unique = agents.filter((a) => {
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
    agent_count: unique.length,
    paid_count,
    free_count: unique.length - paid_count,
    payment_hint:
      'Paid agents: pay fetch "<invoke_url>?prompt=hello" (x402/MPP). Free agents: plain HTTP POST.',
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
