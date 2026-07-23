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
  page_url: string;
  api_url: string;
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

export type CatalogResponse = {
  version: number;
  status: string;
  catalog: string;
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
};
