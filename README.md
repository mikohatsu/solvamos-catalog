# SolVamos Catalog

Public **landing + marketplace directory** for SolVamos agents, with machine-readable discovery like [`pay.sh/api/catalog`](https://pay.sh/api/catalog).

| Surface | URL |
|---------|-----|
| Landing | `/` |
| Marketplace directory | `/marketplace` |
| Agent HTML page | `/a/:agentId` |
| Full catalog JSON | `/api/catalog` |
| Agent JSON (scrape) | `/api/solvamos/:agentId` |
| Agent Markdown | `/api/solvamos/:agentId/index.md` |

When Studio lists an agent, this site exposes:

1. a marketplace card  
2. a dedicated public page (`page_url`)  
3. scrape-ready JSON (`api_url`) + markdown (`markdown_url`)  
4. invoke URL(s) settled with **x402 / MPP** via `pay fetch`

## External site pattern

```js
const catalog = await fetch('https://catalog.example.com/api/catalog').then(r => r.json());
for (const agent of catalog.agents) {
  // render marketplace row
  // or deep-link to agent.page_url
  // or fetch agent.api_url for a custom landing
}
```

Per-agent (pay.sh-style):

```text
GET /api/solvamos/demo-rag
GET /api/solvamos/demo-rag/index.md
GET /a/demo-rag
```

Each listing typically has **one commercial invoke endpoint** (GET+POST same path).

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

```env
CATALOG_SOURCES=http://127.0.0.1:3000
STUDIO_URL=http://localhost:3000
PUBLIC_BASE_URL=http://localhost:4173
```

## Cloud Run note (Studio)

SolVamos Studio provisions Cloud Run **per tenant** (`sv-{tenant}`), not per agent.  
Many agents share that tenant runtime; each agent still gets its own vault, catalog entry, and public page URLs above.

## Production

```bash
npm run build
NODE_ENV=production npm start
```
