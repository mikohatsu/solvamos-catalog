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

export type CatalogResponse = {
  version: number;
  status: string;
  catalog: string;
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
};
