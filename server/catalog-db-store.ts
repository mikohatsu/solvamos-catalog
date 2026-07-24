/**
 * CatalogAgent table access (shared Cloud SQL with Studio).
 * agentId links to Agent / AgentOwnership in Studio schema.
 */

import { prisma } from './db.js';
import type { AgentEndpoint, AgentStatus, PublicAgent, PublicCatalog } from './catalog-model.js';
import { finalizeAgent } from './catalog-model.js';

const LOCAL_HOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i;

function asEndpoints(value: unknown): AgentEndpoint[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value as AgentEndpoint[];
}

/** Rewrite stale local Lab URLs to the live Studio / gateway origin. */
export function rewriteServiceUrl(
  url: string | null | undefined,
  studioUrl: string,
  opts?: { gatewayUrl?: string; feeUsdc?: number; agentId?: string }
): string {
  const raw = String(url || '').trim();
  const studio = studioUrl.replace(/\/$/, '');
  const gateway = (opts?.gatewayUrl || process.env.PAY_GATEWAY_URL || '').replace(/\/$/, '');
  const fee = opts?.feeUsdc ?? 0;
  const agentId = opts?.agentId || '';

  let out = raw;
  if (!out || LOCAL_HOST_RE.test(out) || out.startsWith('pending://')) {
    if (fee > 0 && gateway && !LOCAL_HOST_RE.test(gateway)) {
      out = `${gateway}/v1/agents/${encodeURIComponent(agentId)}/invoke`;
    } else if (studio) {
      out = `${studio}/api/agents/${encodeURIComponent(agentId)}/invoke`;
    }
  } else if (LOCAL_HOST_RE.test(out) && studio) {
    out = out.replace(LOCAL_HOST_RE, studio);
  }
  return out;
}

function rewriteOriginFields(
  row: {
    agentId: string;
    invokeUrl: string;
    originInvokeUrl: string | null;
    agentCardUrl: string | null;
    studioOrigin: string | null;
    feeUsdc: number;
  },
  studioUrl: string
) {
  const studio = studioUrl.replace(/\/$/, '');
  const gateway = (process.env.PAY_GATEWAY_URL || '').replace(/\/$/, '');
  const invokeUrl = rewriteServiceUrl(row.invokeUrl, studio, {
    gatewayUrl: gateway,
    feeUsdc: row.feeUsdc,
    agentId: row.agentId,
  });
  const originInvokeUrl = rewriteServiceUrl(
    row.originInvokeUrl || `${studio}/api/agents/${encodeURIComponent(row.agentId)}/invoke`,
    studio,
    { feeUsdc: 0, agentId: row.agentId }
  );
  const agentCardUrl = rewriteServiceUrl(
    row.agentCardUrl || `${studio}/api/agents/${encodeURIComponent(row.agentId)}/agent-card`,
    studio,
    { feeUsdc: 0, agentId: row.agentId }
  ).replace(/\/invoke$/, '/agent-card');
  const studioOrigin =
    !row.studioOrigin || LOCAL_HOST_RE.test(row.studioOrigin) ? studio : row.studioOrigin;
  return { invokeUrl, originInvokeUrl, agentCardUrl, studioOrigin };
}

export function rowToPublic(
  row: {
    catalogId: string;
    agentId: string;
    fqn: string;
    title: string;
    description: string;
    useCase: string;
    category: string;
    role: string | null;
    tone: string | null;
    invokeUrl: string;
    originInvokeUrl: string | null;
    agentCardUrl: string | null;
    feeUsdc: number;
    token: string;
    network: string;
    usdcMint: string | null;
    paymentProtocol: string;
    recipientWallet: string | null;
    tags: string[];
    source: string;
    studioOrigin: string | null;
    tenantId: string | null;
    ownerUserId: string | null;
    ownerEmail: string | null;
    status: string;
    endpoints: unknown;
    listedAt: Date;
    updatedAt: Date;
  },
  catalogBase: string,
  studioUrl?: string
): PublicAgent {
  const studio = (studioUrl || process.env.STUDIO_URL || '').replace(/\/$/, '');
  const rewritten = studio
    ? rewriteOriginFields(
        {
          agentId: row.agentId,
          invokeUrl: row.invokeUrl,
          originInvokeUrl: row.originInvokeUrl,
          agentCardUrl: row.agentCardUrl,
          studioOrigin: row.studioOrigin,
          feeUsdc: row.feeUsdc,
        },
        studio
      )
    : {
        invokeUrl: row.invokeUrl,
        originInvokeUrl: row.originInvokeUrl,
        agentCardUrl: row.agentCardUrl,
        studioOrigin: row.studioOrigin,
      };

  return finalizeAgent(
    {
      catalog_id: row.catalogId,
      agent_id: row.agentId,
      fqn: row.fqn || `solvamos/${row.agentId}`,
      title: row.title,
      description: row.description,
      use_case: row.useCase,
      category: row.category,
      role: row.role || undefined,
      tone: row.tone || undefined,
      invoke_url: rewritten.invokeUrl,
      origin_invoke_url: rewritten.originInvokeUrl || undefined,
      agent_card_url: rewritten.agentCardUrl || undefined,
      fee_usdc: row.feeUsdc,
      token: row.token,
      network: row.network,
      usdc_mint: row.usdcMint || undefined,
      payment_protocol: row.paymentProtocol,
      recipient_wallet: row.recipientWallet || undefined,
      tags: row.tags || [],
      source: row.source,
      studio_origin: rewritten.studioOrigin || undefined,
      tenant_id: row.tenantId || undefined,
      status: (row.status as AgentStatus) || 'listed',
      listed_at: row.listedAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
      endpoints: asEndpoints(row.endpoints),
    },
    catalogBase
  );
}

export async function dbListListed(opts: {
  catalogBase: string;
  studioUrl: string;
  tenantId?: string;
  studioOrigin?: string;
}): Promise<PublicCatalog> {
  // Marketplace: real Studio agents only — never hardcoded seed/mock IDs.
  const SEED_IDS = ['support-copilot-001', 'academic-research-001', 'demo-rag'];
  const rows = await prisma.catalogAgent.findMany({
    where: {
      status: 'listed',
      agentId: { notIn: SEED_IDS },
      NOT: [{ source: 'seed' }],
      ...(opts.tenantId ? { tenantId: opts.tenantId } : {}),
      ...(opts.studioOrigin ? { studioOrigin: opts.studioOrigin } : {}),
    },
    orderBy: { title: 'asc' },
  });
  // Prefer owned agents when ownership rows exist; still include other non-seed listed
  // studio agents (pre-ownership rows) so marketplace does not shrink unexpectedly.
  const agents = rows.map((r) => rowToPublic(r, opts.catalogBase, opts.studioUrl));
  const paid_count = agents.filter((a) => a.fee_usdc > 0).length;
  return {
    version: 1,
    status: 'success',
    catalog: 'solvamos',
    protocol: 'x402 / MPP',
    generated_at: new Date().toISOString(),
    base_url: opts.catalogBase,
    studio_url: opts.studioUrl,
    marketplace_url: `${opts.catalogBase}/marketplace`,
    agent_count: agents.length,
    paid_count,
    free_count: agents.length - paid_count,
    payment_hint:
      'Paid agents: pay fetch "<invoke_url>?prompt=hello" (x402/MPP). Free agents: plain HTTP POST. CatalogAgent table is source of truth.',
    store: 'solvamos-catalog',
    agents,
    data: agents.map((agent) => ({
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
      ownerUserId: (rows.find((r) => r.agentId === agent.agent_id) as any)?.ownerUserId,
      ownerEmail: (rows.find((r) => r.agentId === agent.agent_id) as any)?.ownerEmail,
      status: agent.status,
      listedAt: agent.listed_at,
      updatedAt: agent.updated_at,
    })),
  };
}

export async function dbFindAgent(
  idOrFqn: string,
  catalogBase: string,
  studioUrl?: string
): Promise<PublicAgent | null> {
  const key = decodeURIComponent(idOrFqn).replace(/^solvamos\//, '');
  const row =
    (await prisma.catalogAgent.findFirst({
      where: {
        status: 'listed',
        OR: [{ agentId: key }, { catalogId: key }, { fqn: key }, { fqn: `solvamos/${key}` }],
      },
    })) || null;
  return row ? rowToPublic(row, catalogBase, studioUrl) : null;
}

/** Persist rewrite of localhost Lab URLs so DB SoT matches production Studio. */
export async function repairLocalhostListings(studioUrl: string): Promise<number> {
  const studio = studioUrl.replace(/\/$/, '');
  if (!studio || LOCAL_HOST_RE.test(studio)) return 0;
  const rows = await prisma.catalogAgent.findMany();
  let n = 0;
  for (const row of rows) {
    const next = rewriteOriginFields(
      {
        agentId: row.agentId,
        invokeUrl: row.invokeUrl,
        originInvokeUrl: row.originInvokeUrl,
        agentCardUrl: row.agentCardUrl,
        studioOrigin: row.studioOrigin,
        feeUsdc: row.feeUsdc,
      },
      studio
    );
    const changed =
      next.invokeUrl !== row.invokeUrl ||
      next.originInvokeUrl !== (row.originInvokeUrl || '') ||
      next.agentCardUrl !== (row.agentCardUrl || '') ||
      next.studioOrigin !== (row.studioOrigin || '');
    if (!changed) continue;
    await prisma.catalogAgent.update({
      where: { agentId: row.agentId },
      data: {
        invokeUrl: next.invokeUrl,
        originInvokeUrl: next.originInvokeUrl,
        agentCardUrl: next.agentCardUrl,
        studioOrigin: next.studioOrigin,
        network: process.env.PAYMENT_NETWORK || row.network || 'devnet',
      },
    });
    n += 1;
  }
  if (n) console.log(`[catalog-db] repaired ${n} localhost listing URL(s) → ${studio}`);
  return n;
}

export async function dbUpsertAgent(
  agent: PublicAgent,
  owner?: { ownerUserId?: string; ownerEmail?: string }
): Promise<PublicAgent> {
  const row = await prisma.catalogAgent.upsert({
    where: { agentId: agent.agent_id },
    create: {
      catalogId: agent.catalog_id,
      agentId: agent.agent_id,
      fqn: agent.fqn,
      title: agent.title,
      description: agent.description,
      useCase: agent.use_case,
      category: agent.category,
      role: agent.role || null,
      tone: agent.tone || null,
      invokeUrl: agent.invoke_url,
      originInvokeUrl: agent.origin_invoke_url || null,
      agentCardUrl: agent.agent_card_url || null,
      feeUsdc: agent.fee_usdc,
      token: agent.token,
      network: agent.network,
      usdcMint: agent.usdc_mint || null,
      paymentProtocol: agent.payment_protocol,
      recipientWallet: agent.recipient_wallet || null,
      tags: agent.tags,
      source: agent.source,
      studioOrigin: agent.studio_origin || null,
      tenantId: agent.tenant_id || null,
      ownerUserId: owner?.ownerUserId || null,
      ownerEmail: owner?.ownerEmail || null,
      status: agent.status,
      endpoints: agent.endpoints as object,
      listedAt: agent.listed_at ? new Date(agent.listed_at) : new Date(),
    },
    update: {
      catalogId: agent.catalog_id,
      fqn: agent.fqn,
      title: agent.title,
      description: agent.description,
      useCase: agent.use_case,
      category: agent.category,
      role: agent.role || null,
      tone: agent.tone || null,
      invokeUrl: agent.invoke_url,
      originInvokeUrl: agent.origin_invoke_url || null,
      agentCardUrl: agent.agent_card_url || null,
      feeUsdc: agent.fee_usdc,
      token: agent.token,
      network: agent.network,
      usdcMint: agent.usdc_mint || null,
      paymentProtocol: agent.payment_protocol,
      recipientWallet: agent.recipient_wallet || null,
      tags: agent.tags,
      source: agent.source,
      studioOrigin: agent.studio_origin || null,
      tenantId: agent.tenant_id || null,
      ownerUserId: owner?.ownerUserId !== undefined ? owner.ownerUserId || null : undefined,
      ownerEmail: owner?.ownerEmail !== undefined ? owner.ownerEmail || null : undefined,
      status: agent.status,
      endpoints: agent.endpoints as object,
    },
  });
  return rowToPublic(row, agent.page_url.split('/a/')[0] || '');
}

export async function dbUnlistAgent(agentId: string, catalogBase: string): Promise<PublicAgent | null> {
  const existing = await prisma.catalogAgent.findUnique({ where: { agentId } });
  if (!existing) return null;
  const row = await prisma.catalogAgent.update({
    where: { agentId },
    data: { status: 'unlisted' },
  });
  return rowToPublic(row, catalogBase, process.env.STUDIO_URL || undefined);
}
