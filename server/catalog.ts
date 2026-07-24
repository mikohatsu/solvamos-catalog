import fs from 'fs';
import path from 'path';
import {
  finalizeAgent,
  type AgentEndpoint,
  type AgentStatus,
  type CatalogConfig,
  type PublicAgent,
  type PublicCatalog,
} from './catalog-model.js';
import { hasDatabaseUrl } from './db.js';
import * as dbStore from './catalog-db-store.js';

export type {
  CatalogConfig,
  AgentEndpoint,
  AgentStatus,
  PublicAgent,
  PublicCatalog,
} from './catalog-model.js';
export { finalizeAgent } from './catalog-model.js';

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
let useDb = false;

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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
  // Seed/mock agents must never appear on the public marketplace.
  // DB (CatalogAgent + ownerUserId) is the only production source of truth.
  return;
}

export async function initCatalogStore(config: CatalogConfig) {
  baseUrl = config.publicBaseUrl;
  studioUrl = config.studioUrl;
  storePath = config.storePath;
  useDb = hasDatabaseUrl();

  if (useDb) {
    try {
      const { prisma } = await import('./db.js');
      const count = await prisma.catalogAgent.count();
      console.log(`[catalog-store] DATABASE_URL set — CatalogAgent rows=${count} (source of truth)`);
      const { repairLocalhostListings } = await import('./catalog-db-store.js');
      await repairLocalhostListings(studioUrl);
      return;
    } catch (err: any) {
      console.error('[catalog-store] DB init failed, falling back to file', err?.message || err);
      useDb = false;
    }
  }

  try {
    if (fs.existsSync(storePath)) {
      const raw = JSON.parse(fs.readFileSync(storePath, 'utf8')) as StoreFile;
      store = {
        version: raw.version || 1,
        updated_at: raw.updated_at || new Date().toISOString(),
        agents: raw.agents || {},
      };
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
    `[catalog-store] path=${storePath} agents=${Object.keys(store.agents).length} (file fallback)`
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
  const SEED_IDS = new Set(['support-copilot-001', 'academic-research-001', 'demo-rag']);
  return Object.values(store.agents)
    .filter((a) => a.status === 'listed')
    .filter((a) => !SEED_IDS.has(a.agent_id))
    .filter((a) => a.source !== 'seed')
    .filter((a) => (filter?.tenantId ? a.tenant_id === filter.tenantId : true))
    .filter((a) => (filter?.studioOrigin ? a.studio_origin === filter.studioOrigin : true))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function buildPublicCatalog(filter?: {
  tenantId?: string;
  studioOrigin?: string;
}): Promise<PublicCatalog> {
  if (useDb) {
    return dbStore.dbListListed({
      catalogBase: baseUrl,
      studioUrl,
      tenantId: filter?.tenantId,
      studioOrigin: filter?.studioOrigin,
    });
  }
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
      'Paid agents: pay fetch "<invoke_url>?prompt=hello" (x402/MPP). Free agents: plain HTTP POST. CatalogAgent DB is source of truth when DATABASE_URL is set.',
    store: 'solvamos-catalog',
    agents,
    data: agents.map(toStudioMirror),
  };
}

export async function getCachedCatalog(): Promise<PublicCatalog> {
  return buildPublicCatalog();
}

export async function findAgent(idOrFqn: string): Promise<PublicAgent | null> {
  if (useDb) return dbStore.dbFindAgent(idOrFqn, baseUrl, studioUrl);
  const key = decodeURIComponent(idOrFqn).replace(/^solvamos\//, '');
  const agent =
    store.agents[key] ||
    Object.values(store.agents).find(
      (a) => a.catalog_id === key || a.fqn === key || a.fqn === `solvamos/${key}` || a.fqn === idOrFqn
    );
  if (!agent || agent.status !== 'listed') return null;
  return finalizeAgent(agent, baseUrl);
}

export async function upsertAgent(input: Record<string, unknown>): Promise<PublicAgent> {
  const agentId = String(input.agent_id || input.agentId || '');
  if (!agentId) throw new Error('agent_id required');
  const existing = useDb ? null : store.agents[agentId];
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

  if (useDb) {
    return dbStore.dbUpsertAgent(agent, {
      ownerUserId: input.owner_user_id || input.ownerUserId ? String(input.owner_user_id || input.ownerUserId) : undefined,
      ownerEmail: input.owner_email || input.ownerEmail ? String(input.owner_email || input.ownerEmail) : undefined,
    });
  }

  store.agents[agentId] = agent;
  saveStore();
  return agent;
}

export async function unlistAgent(agentId: string): Promise<PublicAgent | null> {
  if (useDb) return dbStore.dbUnlistAgent(agentId, baseUrl);
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
    owner_user_id: entry.ownerUserId || entry.owner_user_id,
    owner_email: entry.ownerEmail || entry.owner_email,
    status: entry.status || 'listed',
    source: studioOrigin || 'studio',
  };
}
