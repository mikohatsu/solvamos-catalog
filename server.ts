import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import {
  buildPublicCatalog,
  getCachedCatalog,
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
  studioUrl: (process.env.STUDIO_URL || 'http://localhost:3000').replace(/\/$/, ''),
  sources: String(process.env.CATALOG_SOURCES || 'http://127.0.0.1:3000')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean),
  cacheTtlSec: Number(process.env.CATALOG_CACHE_TTL_SEC || 30),
};

async function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Cache-Control', 'public, max-age=15');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'solvamos-catalog', version: '0.1.0' });
  });

  /** Public machine-readable catalog — analogous to https://pay.sh/api/catalog */
  app.get('/api/catalog', async (_req, res) => {
    try {
      const catalog = await getCachedCatalog(config);
      res.json(catalog);
    } catch (err: any) {
      res.status(502).json({
        status: 'error',
        message: err?.message || 'Failed to build catalog',
      });
    }
  });

  app.get('/api/catalog/:agentId', async (req, res) => {
    try {
      const catalog = await getCachedCatalog(config);
      const agent =
        catalog.agents.find(
          (a) => a.agent_id === req.params.agentId || a.catalog_id === req.params.agentId
        ) || null;
      if (!agent) {
        res.status(404).json({ status: 'error', message: 'Agent not found in catalog' });
        return;
      }
      res.json({ status: 'success', agent });
    } catch (err: any) {
      res.status(502).json({ status: 'error', message: err?.message || 'Lookup failed' });
    }
  });

  app.post('/api/catalog/refresh', async (_req, res) => {
    try {
      const catalog = await buildPublicCatalog(config, { force: true });
      res.json({
        status: 'success',
        agent_count: catalog.agent_count,
        generated_at: catalog.generated_at,
      });
    } catch (err: any) {
      res.status(502).json({ status: 'error', message: err?.message || 'Refresh failed' });
    }
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
    console.log(`[solvamos-catalog] API  ${config.publicBaseUrl}/api/catalog`);
    console.log(`[solvamos-catalog] sources=${config.sources.join(', ') || '(none)'}`);
  });
}

main().catch((err) => {
  console.error('[solvamos-catalog] failed to start', err);
  process.exit(1);
});
