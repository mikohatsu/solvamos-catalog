# SolVamos Catalog

Public discovery site + machine-readable API for SolVamos agents — analogous to [`https://pay.sh/api/catalog`](https://pay.sh/api/catalog).

| Surface | URL |
|---------|-----|
| Site | `/` |
| JSON API | `/api/catalog` |
| Agent lookup | `/api/catalog/:agentId` |

Paid invoke URLs settle via **x402 / MPP** (`pay fetch`). Discovery is SolVamos-owned; payment rails stay pay.sh-compatible.

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://127.0.0.1:4173 and http://127.0.0.1:4173/api/catalog

Point `CATALOG_SOURCES` at one or more SolVamos Studio origins (their `/api/catalog`).

```env
CATALOG_SOURCES=http://127.0.0.1:3000
STUDIO_URL=http://localhost:3000
PUBLIC_BASE_URL=http://localhost:4173
```

If every source is unreachable, the seed listing in `.data/seed-catalog.json` is shown.

## API shape (v1)

```json
{
  "version": 1,
  "status": "success",
  "catalog": "solvamos",
  "protocol": "x402 / MPP",
  "agent_count": 1,
  "agents": [
    {
      "fqn": "solvamos/<agentId>",
      "title": "...",
      "invoke_url": "https://gateway/.../invoke",
      "fee_usdc": 0.001,
      "payment_protocol": "x402 / MPP"
    }
  ],
  "data": []
}
```

`data` mirrors the Studio listing format for existing clients.

## Production

```bash
npm run build
NODE_ENV=production npm start
```

Serve behind HTTPS and set `PUBLIC_BASE_URL` / `CATALOG_SOURCES` to your Studio Cloud Run URL(s).

## Studio wiring

In `solvamos-studio`:

```env
CATALOG_SITE_URL=https://catalog.example.com
CATALOG_CORS_ORIGINS=*
```

Studio then advertises the catalog site in status + listing `catalogPageUrl` / `catalogApiUrl`.
