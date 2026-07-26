/**
 * Machine-readable discovery surfaces for external AI agents.
 * Prefer these over HTML UI scraping.
 */
import type { PublicAgent, PublicCatalog } from './catalog-model.js';

export type AgentsIndexItem = {
  id: string;
  name: string;
  description: string;
  use_case: string;
  price: number;
  priceCurrency: string;
  network: string;
  payment_protocol: string;
  detail_url: string;
  invoke_url: string;
  api_url: string;
  markdown_url: string;
  agent_card_url: string | null;
  usdc_mint?: string;
  /** Discovery hint only — pay using the live HTTP 402 challenge, not these fields. */
  price_is_hint?: boolean;
};

/**
 * Payment contract for autonomous buyers.
 * Source of truth is always the live HTTP 402 challenge — not catalog price fields.
 */
export const SETTLEMENT_GUIDE = {
  source_of_truth: 'http_402_challenge' as const,
  challenge_header: 'WWW-Authenticate: Payment … request="<base64url-json>"',
  rules: [
    'Call invoke_url without payment → expect HTTP 402.',
    'Parse WWW-Authenticate Payment request="<base64url-json>" and decode that JSON.',
    'Build the Solana tx ONLY from the decoded challenge (amount, currency, recipient, methodDetails.*).',
    'If methodDetails.splits is present, build multi-leg transferChecked; do not invent a single transfer.',
    'Retry invoke with the payment credential (prefer: pay fetch).',
    'Catalog price / usdc_mint / recipient fields are discovery hints only.',
  ],
};

export function buildAgentsIndex(catalog: PublicCatalog): {
  version: number;
  status: 'success';
  protocol: string;
  generated_at: string;
  marketplace_url: string;
  llms_txt: string;
  agent_count: number;
  settlement: typeof SETTLEMENT_GUIDE;
  agents: AgentsIndexItem[];
} {
  const base = catalog.base_url.replace(/\/$/, '');
  return {
    version: 1,
    status: 'success',
    protocol: catalog.protocol,
    generated_at: catalog.generated_at,
    marketplace_url: catalog.marketplace_url,
    llms_txt: `${base}/llms.txt`,
    agent_count: catalog.agent_count,
    settlement: SETTLEMENT_GUIDE,
    agents: (catalog.agents || []).map((a) => toIndexItem(a)),
  };
}

function toIndexItem(a: PublicAgent): AgentsIndexItem {
  return {
    id: a.agent_id,
    name: a.title,
    description: a.description || a.use_case,
    use_case: a.use_case,
    price: a.fee_usdc,
    priceCurrency: a.token || 'USDC',
    network: a.network,
    payment_protocol: a.payment_protocol,
    detail_url: a.page_url,
    invoke_url: a.invoke_url,
    api_url: a.api_url,
    markdown_url: a.markdown_url,
    agent_card_url: a.agent_card_url || null,
    usdc_mint: a.usdc_mint,
    price_is_hint: a.fee_usdc > 0 ? true : undefined,
  };
}

export function buildRobotsTxt(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '');
  return `# SolVamos Catalog — AI crawlers welcome
User-agent: *
Allow: /
Allow: /marketplace
Allow: /a/
Allow: /api/
Allow: /llms.txt
Allow: /marketplace.json
Allow: /api/v1/agents

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Bytespider
Allow: /

Sitemap: ${base}/marketplace.json
# Human UI: ${base}/marketplace
# Machine index: ${base}/api/catalog  or  ${base}/api/v1/agents
# Agent guide: ${base}/llms.txt
`;
}

export function buildLlmsTxt(catalog: PublicCatalog): string {
  const base = catalog.base_url.replace(/\/$/, '');
  const studio = (catalog.studio_url || '').replace(/\/$/, '');
  const lines = (catalog.agents || []).slice(0, 50).map((a) => {
    const price =
      a.fee_usdc > 0 ? `${a.fee_usdc} ${a.token}` : 'free';
    return `- [${a.title}](${a.page_url}): ${oneLine(a.description || a.use_case)} · ${price} · invoke ${a.invoke_url}`;
  });

  return `# SolVamos Agent Marketplace
> External AI agents can discover tools here, read Agent Cards, and call paid invoke URLs with x402 / MPP (Solana Devnet USDC). Do not scrape HTML layouts — use the machine APIs below.

Generated-At: ${catalog.generated_at}
Catalog-Base: ${base}
Studio: ${studio || '(see /api/catalog studio_url)'}
Protocol: ${catalog.protocol}
Listed-Agents: ${catalog.agent_count} (paid=${catalog.paid_count}, free=${catalog.free_count})

## Quick Start for Agents
1. GET ${base}/api/v1/agents  (slim JSON index)  OR  GET ${base}/api/catalog  (full catalog)
2. Pick an agent by description / use_case / tags
3. GET agent_card_url (A2A card on Studio) and/or markdown_url
4. Call invoke_url:
   - paid: HTTP 402 challenge → pay with x402/MPP Solana Devnet USDC → retry with payment proof
   - free: plain HTTP GET/POST with \`prompt\`
5. Prefer \`pay fetch "<invoke_url>?prompt=…"\` when available

## Canonical Machine Endpoints (this host)
- Guide (this file): GET ${base}/llms.txt
- Robots: GET ${base}/robots.txt
- Slim index: GET ${base}/api/v1/agents
- Slim alias: GET ${base}/marketplace.json
- Full catalog: GET ${base}/api/catalog
- Agent JSON: GET ${base}/api/solvamos/{agent_id}
- Agent Markdown: GET ${base}/api/solvamos/{agent_id}/index.md
- Human marketplace: ${base}/marketplace
- Human detail: ${base}/a/{agent_id}

## Agent Card & invoke (Studio / Gateway)
- A2A Agent Card: GET {studio}/api/agents/{agent_id}/agent-card  (HTTPS only)
- Paid invoke (typical): GET|POST {pay-gateway}/v1/agents/{agent_id}/invoke
- Free invoke (typical): POST {studio}/api/agents/{agent_id}/invoke
- Protocol: x402 / MPP · Solana Devnet USDC

## Payment (source of truth = HTTP 402)
1. Call invoke_url without payment → expect 402
2. Parse \`WWW-Authenticate: Payment … request="<base64url-json>"\`
3. Build the Solana tx ONLY from that JSON (\`amount\`, \`currency\`, \`recipient\`, \`methodDetails.*\`)
4. If \`methodDetails.splits\` is present, use multi-leg \`transferChecked\`; do not invent a single transfer
5. Retry invoke with the payment credential (prefer: \`pay fetch "<invoke_url>?prompt=…"\`)

Catalog \`price\` / mint / wallet fields are discovery hints only. Do not hardcode settlement from this file.

## Input contract (all SolVamos RAG agents)
\`\`\`json
{
  "type": "object",
  "properties": {
    "prompt": {
      "type": "string",
      "description": "Natural-language question for the agent"
    }
  },
  "required": ["prompt"]
}
\`\`\`
Also accepted as query: \`?prompt=\`

## Currently listed agents
${lines.length ? lines.join('\n') : '- (none listed)'}

## Notes for autonomous buyers
- Prefer description + use_case over UI chrome.
- Always use HTTPS discovery URLs (\`agent_card_url\`, invoke, markdown).
- Catalog HTML pages include JSON-LD and \`<link rel="agent-card">\` for scrapers that only fetch HTML.
- Source of truth for listings: CatalogAgent / GET /api/catalog (not HTML).
- Source of truth for payment: the live 402 challenge on invoke_url.
`;
}

function oneLine(s: string): string {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

/** schema.org DataCatalog JSON-LD for marketplace HTML */
export function buildMarketplaceJsonLd(catalog: PublicCatalog) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DataCatalog',
    name: 'SolVamos Agent Marketplace',
    description:
      'Discover SolVamos A2A agents and call them with x402/MPP Solana Devnet USDC.',
    url: catalog.marketplace_url,
    dataset: (catalog.agents || []).map((a) => ({
      '@type': 'SoftwareApplication',
      name: a.title,
      identifier: a.agent_id,
      description: a.description || a.use_case,
      url: a.page_url,
      applicationCategory: 'AIAgent',
      offers: {
        '@type': 'Offer',
        price: String(a.fee_usdc),
        priceCurrency: a.token || 'USDC',
      },
    })),
  };
}

/** schema.org SoftwareApplication JSON-LD for agent detail HTML */
export function buildAgentJsonLd(agent: PublicAgent) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: agent.title,
    identifier: agent.agent_id,
    description: agent.description || agent.use_case,
    url: agent.page_url,
    applicationCategory: 'AIAgent',
    offers: {
      '@type': 'Offer',
      price: String(agent.fee_usdc),
      priceCurrency: agent.token || 'USDC',
    },
    potentialAction: {
      '@type': 'ConsumeAction',
      target: agent.invoke_url,
      description: 'Invoke with JSON { prompt } or ?prompt= ; paid agents require x402/MPP',
    },
  };
}
