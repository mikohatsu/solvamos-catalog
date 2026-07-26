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
  /** Hint only — authoritative amounts/recipients come from the HTTP 402 challenge. */
  settlement?: {
    model: 'mpp_native_splits';
    seller_share: number;
    platform_share: number;
  };
};

/** Shared settlement / 402 challenge contract for autonomous buyers. */
export const SETTLEMENT_GUIDE = {
  model: 'mpp_native_splits' as const,
  seller_share: 0.9,
  platform_share: 0.1,
  challenge_header: 'WWW-Authenticate: Payment … request="<base64url-json>"',
  challenge_fields: [
    'amount',
    'currency', // USDC mint
    'recipient', // platform/gateway remainder (~10%)
    'methodDetails.recentBlockhash',
    'methodDetails.splits', // explicit legs (typically seller vault ~90%)
    'methodDetails.decimals',
    'methodDetails.network',
    'methodDetails.tokenProgram',
  ],
  rules: [
    'Do NOT hardcode a single transferChecked for the full price.',
    'Decode WWW-Authenticate request JSON and honor methodDetails.splits plus top-level recipient remainder.',
    'Prefer pay fetch / an x402-MPP client that builds multi-instruction txs from the challenge.',
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
  const paid = a.fee_usdc > 0;
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
    settlement: paid
      ? {
          model: 'mpp_native_splits',
          seller_share: SETTLEMENT_GUIDE.seller_share,
          platform_share: SETTLEMENT_GUIDE.platform_share,
        }
      : undefined,
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
- Payment: x402 / MPP · Solana Devnet USDC · native 90/10 settlement split
- First unpaid call returns HTTP 402. Follow the challenge; do not invent payment parameters.

## Settlement (90/10 MPP splits) — critical
Paid listing price (e.g. 0.001 USDC = 1000 base units) is NOT a single transfer to one wallet.
On-chain settlement uses MPP native splits in one transaction:
- ~90% → agent vault (explicit \`methodDetails.splits[]\` leg)
- ~10% → platform/gateway treasury (top-level challenge \`recipient\` remainder)
Catalog \`price\` is informational. Authoritative amount/mint/recipients/blockhash come from the 402 challenge.

## HTTP 402 challenge contract
1. Probe: POST|GET invoke_url without payment → HTTP 402
2. Read header: \`WWW-Authenticate: Payment … request="<base64url-json>"\`
3. Decode request JSON. Required fields:
   - amount (total minimal units, e.g. "1000")
   - currency (USDC mint, e.g. 4zMMC9…)
   - recipient (platform/gateway remainder address)
   - methodDetails.recentBlockhash
   - methodDetails.splits (array of { amount, recipient, label? })
   - methodDetails.decimals / network / tokenProgram
4. Build a multi-instruction transferChecked transaction from splits + remainder. Do NOT hardcode a single transferChecked for the full amount.
5. Retry invoke with the payment credential your x402/MPP client produces (e.g. Authorization: Payment …). Prefer \`pay fetch\`.

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
- Challenge Response (HTTP 402): The decoded \`request\` payload includes \`methodDetails.splits\` (seller vault leg) and a top-level \`recipient\` (platform remainder). Example shape: total 1000 units with splits[0].amount=900 + remainder 100.
- Transaction Building: Do NOT hardcode single transfers. Parse \`methodDetails.splits\` and construct multi-instruction transferChecked transactions accordingly before signing.
- Fee is per successful paid invoke (USDC). Network SOL fees are paid by the caller's wallet on the payment TX path used by your executor.
- Always use HTTPS discovery URLs (\`agent_card_url\`, invoke, markdown). HTTP links are rewritten to HTTPS by this catalog.
- Catalog HTML pages include JSON-LD and \`<link rel="agent-card">\` for scrapers that only fetch HTML.
- Source of truth for listings: CatalogAgent / GET /api/catalog (not HTML).
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
