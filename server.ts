import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import {
  agentToMarkdown,
  buildPublicCatalog,
  findAgent,
  getCachedCatalog,
  initCatalogStore,
  normalizeStudioPayload,
  unlistAgent,
  upsertAgent,
  type CatalogConfig,
} from './server/catalog.js';

const rootDir = process.cwd();
const isProd = process.env.NODE_ENV === 'production';

const config: CatalogConfig = {
  port: Number(process.env.PORT || 4173),
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${process.env.PORT || 4173}`).replace(
    /\/$/,
    ''
  ),
  studioUrl: (process.env.STUDIO_URL || 'https://solvamos-studio-74094114833.asia-northeast3.run.app').replace(/\/$/, ''),
  adminSecret: process.env.CATALOG_ADMIN_SECRET || '',
  storePath:
    process.env.CATALOG_STORE_PATH ||
    (isProd
      ? path.join('/tmp', 'solvamos-catalog-store.json')
      : path.join(rootDir, '.data', 'catalog-store.json')),
  importSources: String(process.env.CATALOG_SOURCES || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean),
};

initCatalogStore(config);

function assertAdmin(req: express.Request, res: express.Response): boolean {
  if (!config.adminSecret) {
    // Dev convenience: allow writes when secret unset (local only)
    if (!isProd) return true;
    res.status(503).json({
      status: 'error',
      message: 'CATALOG_ADMIN_SECRET is not configured on catalog service',
    });
    return false;
  }
  const provided =
    (req.headers['x-catalog-admin-secret'] as string) ||
    (req.headers['x-solvamos-catalog-secret'] as string) ||
    '';
  if (provided !== config.adminSecret) {
    res.status(401).json({ status: 'error', message: 'Unauthorized catalog write' });
    return false;
  }
  return true;
}

async function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '2mb' }));

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Accept, X-Catalog-Admin-Secret, X-Solvamos-Catalog-Secret'
    );
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, max-age=10');
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/health', (_req, res) => {
    const catalog = getCachedCatalog();
    res.json({
      status: 'ok',
      service: 'solvamos-catalog',
      version: '0.3.0',
      store: 'solvamos-catalog',
      agent_count: catalog.agent_count,
    });
  });

  /** Public catalog — source of truth on this service */
  app.get('/api/catalog', (req, res) => {
    const tenantId = typeof req.query.tenantId === 'string' ? req.query.tenantId : undefined;
    const studioOrigin =
      typeof req.query.studioOrigin === 'string' ? req.query.studioOrigin : undefined;
    res.json(buildPublicCatalog({ tenantId, studioOrigin }));
  });

  /** Studio → catalog upsert (source of truth write path) */
  app.post('/api/catalog/agents', (req, res) => {
    if (!assertAdmin(req, res)) return;
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const studioOrigin =
        typeof body.studio_origin === 'string'
          ? body.studio_origin
          : typeof body.studioOrigin === 'string'
            ? body.studioOrigin
            : undefined;
      const payload = body.agent || body.listing || body;
      const normalized = normalizeStudioPayload(
        payload as Record<string, unknown>,
        studioOrigin
      );
      const agent = upsertAgent(normalized);
      res.json({
        status: 'success',
        agent,
        data: buildPublicCatalog().data.find((d) => d.agentId === agent.agent_id),
      });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err?.message || 'Upsert failed' });
    }
  });

  /** Bulk upsert (Studio hydrate on boot) */
  app.post('/api/catalog/agents/bulk', (req, res) => {
    if (!assertAdmin(req, res)) return;
    try {
      const body = (req.body || {}) as {
        agents?: unknown[];
        studioOrigin?: string;
        studio_origin?: string;
      };
      const rows = Array.isArray(body.agents) ? body.agents : [];
      const studioOrigin = body.studio_origin || body.studioOrigin;
      const agents = rows.map((row) =>
        upsertAgent(normalizeStudioPayload(row as Record<string, unknown>, studioOrigin))
      );
      res.json({
        status: 'success',
        upserted: agents.length,
        agent_ids: agents.map((a) => a.agent_id),
      });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err?.message || 'Bulk upsert failed' });
    }
  });

  app.delete('/api/catalog/agents/:agentId', (req, res) => {
    if (!assertAdmin(req, res)) return;
    const agent = unlistAgent(req.params.agentId);
    if (!agent) {
      res.status(404).json({ status: 'error', message: 'Agent not found' });
      return;
    }
    res.json({ status: 'success', agent });
  });

  app.post('/api/catalog/agents/:agentId/unlist', (req, res) => {
    if (!assertAdmin(req, res)) return;
    const agent = unlistAgent(req.params.agentId);
    if (!agent) {
      res.status(404).json({ status: 'error', message: 'Agent not found' });
      return;
    }
    res.json({ status: 'success', agent });
  });

  app.get('/api/catalog/:agentId', (req, res) => {
    const agent = findAgent(req.params.agentId);
    if (!agent) {
      res.status(404).json({ status: 'error', message: 'Agent not found in catalog' });
      return;
    }
    res.json({ status: 'success', agent });
  });
  app.get('/api/solvamos/:agentId/index.md', (req, res) => {
    const agent = findAgent(req.params.agentId);
    if (!agent) {
      res.status(404).type('text/plain').send('Agent not found');
      return;
    }
    res.type('text/markdown; charset=utf-8').send(agentToMarkdown(agent));
  });

  app.get('/api/solvamos/:agentId', (req, res) => {
    const agent = findAgent(req.params.agentId);
    if (!agent) {
      res.status(404).json({ status: 'error', message: 'Agent not found in catalog' });
      return;
    }
    const catalog = getCachedCatalog();
    res.json({
      status: 'success',
      version: catalog.version,
      generated_at: catalog.generated_at,
      protocol: catalog.protocol,
      agent,
    });
  });

  const clientDir = path.join(rootDir, 'dist', 'client');
  if (fs.existsSync(path.join(clientDir, 'index.html'))) {
    app.use(express.static(clientDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/health') return next();
      res.sendFile(path.join(clientDir, 'index.html'));
    });
    return app;
  }

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.use(async (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl === '/health') return next();
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  return app;
}

async function main() {
  const app = await createApp();
  app.listen(config.port, () => {
    console.log(`[solvamos-catalog] http://127.0.0.1:${config.port}`);
    console.log(`[solvamos-catalog] landing     ${config.publicBaseUrl}/`);
    console.log(`[solvamos-catalog] marketplace ${config.publicBaseUrl}/marketplace`);
    console.log(`[solvamos-catalog] API         ${config.publicBaseUrl}/api/catalog`);
    console.log(`[solvamos-catalog] store       ${config.storePath}`);
    console.log(
      `[solvamos-catalog] admin       ${config.adminSecret ? 'CATALOG_ADMIN_SECRET set' : 'open (dev) / required in prod'}`
    );
  });
}

main().catch((err) => {
  console.error('[solvamos-catalog] failed to start', err);
  process.exit(1);
});
