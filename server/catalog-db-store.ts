/**
 * CatalogAgent table access (shared Cloud SQL with Studio).
 * agentId links to Agent / AgentOwnership in Studio schema.
 */

import { prisma } from './db.js';
import type { AgentEndpoint, AgentStatus, PublicAgent, PublicCatalog } from './catalog-model.js';
import { finalizeAgent } from './catalog-model.js';

function asEndpoints(value: unknown): AgentEndpoint[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value as AgentEndpoint[];
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
  catalogBase: string
): PublicAgent {
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
      invoke_url: row.invokeUrl,
      origin_invoke_url: row.originInvokeUrl || undefined,
      agent_card_url: row.agentCardUrl || undefined,
      fee_usdc: row.feeUsdc,
      token: row.token,
      network: row.network,
      usdc_mint: row.usdcMint || undefined,
      payment_protocol: row.paymentProtocol,
      recipient_wallet: row.recipientWallet || undefined,
      tags: row.tags || [],
      source: row.source,
      studio_origin: row.studioOrigin || undefined,
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
  const rows = await prisma.catalogAgent.findMany({
    where: {
      status: 'listed',
      ...(opts.tenantId ? { tenantId: opts.tenantId } : {}),
      ...(opts.studioOrigin ? { studioOrigin: opts.studioOrigin } : {}),
    },
    orderBy: { title: 'asc' },
  });
  const agents = rows.map((r) => rowToPublic(r, opts.catalogBase));
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

export async function dbFindAgent(idOrFqn: string, catalogBase: string): Promise<PublicAgent | null> {
  const key = decodeURIComponent(idOrFqn).replace(/^solvamos\//, '');
  const row =
    (await prisma.catalogAgent.findFirst({
      where: {
        status: 'listed',
        OR: [{ agentId: key }, { catalogId: key }, { fqn: key }, { fqn: `solvamos/${key}` }],
      },
    })) || null;
  return row ? rowToPublic(row, catalogBase) : null;
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
  return rowToPublic(row, catalogBase);
}
