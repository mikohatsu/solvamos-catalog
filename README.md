# SolVamos Catalog

Public **landing + marketplace** for SolVamos agents. This service is the **source of truth** for discovery listings.

| Surface | URL |
|---------|-----|
| Landing | `/` |
| Marketplace | `/marketplace` |
| Agent page | `/a/:agentId` |
| Catalog JSON | `/api/catalog` |
| Upsert (Studio) | `POST /api/catalog/agents` |
| Bulk hydrate | `POST /api/catalog/agents/bulk` |
| Unlist | `POST /api/catalog/agents/:id/unlist` |

## Architecture

```
Studio (create/update agent)
   │  POST /api/catalog/agents  (+ X-Catalog-Admin-Secret)
   ▼
solvamos-catalog store  ←── source of truth
   │  GET /api/catalog
   ▼
Marketplace / external sites / Studio UI (read)
```

Studio no longer owns the public catalog file. It **publishes** here and **reads** listings back.

## Auth for writes

```env
CATALOG_ADMIN_SECRET=shared-secret
```

Studio must set the same value as `CATALOG_ADMIN_SECRET`. Header: `X-Catalog-Admin-Secret`.

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

## Production (Cloud Run)

| Item | Value |
|------|-------|
| URL | https://solvamos-catalog-2ggrwml2ba-du.a.run.app |
| Store | `/tmp/solvamos-catalog-store.json` (ephemeral — Studio rehydrates on boot) |

Set on Cloud Run:

```env
PUBLIC_BASE_URL=https://solvamos-catalog-2ggrwml2ba-du.a.run.app
STUDIO_URL=https://solvamos-studio-74094114833.asia-northeast3.run.app
CATALOG_ADMIN_SECRET=<shared>
```

Studio:

```env
CATALOG_SITE_URL=https://solvamos-catalog-2ggrwml2ba-du.a.run.app
CATALOG_ADMIN_SECRET=<same>
```
