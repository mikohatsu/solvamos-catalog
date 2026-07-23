export type CatalogConfig = {
  port: number;
  publicBaseUrl: string;
  studioUrl: string;
  adminSecret: string;
  storePath: string;
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
