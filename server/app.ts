import express from 'express';
import { timingSafeEqual, randomUUID } from 'node:crypto';
import path from 'node:path';
import { JsonStore } from './store';
import { research, ResearchError, validateRequest } from './research';
import { safeUrl } from '../shared/research';
import { sections, type Edition } from '../shared/curation';

const equal = (a: string, b: string) => { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
export function createApp(options: { production?: boolean; password?: string; dataDir?: string; researcher?: typeof research } = {}) {
  const production = options.production ?? process.env.NODE_ENV === 'production';
  const password = options.password ?? process.env.PILOT_PASSWORD;
  if (production && (!password || password.length < 16)) throw new Error('Configure PILOT_PASSWORD com pelo menos 16 caracteres antes de publicar o piloto.');
  const app = express();
  const dir = options.dataDir || process.env.DATA_DIR || '.data';
  const editions = new JsonStore<Edition>(path.join(dir, 'editions.json'));
  const researchLog = new JsonStore<any>(path.join(dir, 'research.json'));
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'no-store');
    if (!production) {
      const host = req.hostname;
      if (!['localhost', '127.0.0.1', '::1'].includes(host)) return res.status(403).json({ error: 'Host não autorizado.' });
    }
    if (password) {
      const authorization = req.get('authorization') || '';
      const credentials = authorization.startsWith('Basic ') ? Buffer.from(authorization.slice(6), 'base64').toString() : '';
      if (!equal(credentials, `kultur3:${password}`)) {
        res.setHeader('WWW-Authenticate', 'Basic realm="KULTUR3 piloto", charset="UTF-8"');
        return res.status(401).send('Entre com o acesso do piloto.');
      }
    }
    // Bind to loopback in development; disallow cross-site mutation requests as well.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.get('origin');
      if (req.get('sec-fetch-site') === 'cross-site' || (origin && (() => { try { return new URL(origin).host !== req.get('host'); } catch { return true; } })()))
        return res.status(403).json({ error: 'Origem não autorizada.' });
      if (!req.is('application/json')) return res.status(415).json({ error: 'Envie conteúdo JSON.' });
    }
    next();
  });
  app.use(express.json({ limit: '128kb' }));
  let active = 0;
  let windowStart = Date.now();
  let requests = 0;
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', researchConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY', collectionMode: 'on_demand' }));
  app.post('/api/research', async (req, res, next) => {
    let acquired = false;
    try {
      validateRequest(req.body);
      if (Date.now() - windowStart >= 60_000) { requests = 0; windowStart = Date.now(); }
      if (active >= 2 || requests >= 12) { res.setHeader('Retry-After', '60'); throw new ResearchError(429, 'Limite de pesquisas do piloto atingido. Aguarde um minuto.'); }
      requests++; active++; acquired = true;
      const result = await (options.researcher || research)(req.body);
      const id = randomUUID();
      await researchLog.put({ id, ...result });
      res.json({ ...result, research: { ...result.research, id } });
    } catch (e) { next(e); }
    finally { if (acquired) active--; }
  });
  app.get('/api/editions', async (_req, res, next) => { try { res.json(await editions.list()); } catch(e) { next(e); } });
  app.post('/api/editions', async (req, res, next) => {
    try {
      const body = req.body;
      const previous = (await editions.list()).find(e => e.id === body?.id);
      const records = await researchLog.list();
      const record = records.find(r => r.id === body?.research?.id) || (previous?.research.id === body?.research?.id ? { id: previous.research.id, research: previous.research } : undefined);
      if (!record || typeof body.brand !== 'string' || body.brand.length > 200 || !Array.isArray(body.items) || !body.items.length || body.items.length > 50)
        throw new ResearchError(400, 'Edição inválida ou pesquisa indisponível.');
      const urls = new Set(record.research.sources.map((s: any) => s.url));
      const ids = new Set();
      for (const item of body.items) {
        if (!item || !['id','title','summary','opportunity','section','sourceName','sourceUrl'].every(k => typeof item[k] === 'string' && item[k].length <= 10000) ||
            !item.id || ids.has(item.id) || !item.title.trim() || typeof item.selected !== 'boolean' || !sections.includes(item.section) || !urls.has(safeUrl(item.sourceUrl)))
          throw new ResearchError(400, 'Todas as pautas precisam de título e referência da pesquisa original.');
        ids.add(item.id);
      }
      const recordCopy = body.recordCopy === true && ['whatsapp','telegram'].includes(body.copiedChannel);
      const now = new Date().toISOString();
      const edition: Edition = { id: previous?.id || randomUUID(), brand: body.brand, createdAt: previous?.createdAt || now, updatedAt: now,
        items: body.items.map(({id,title,summary,opportunity,section,sourceName,sourceUrl,selected}: any) => ({id,title,summary,opportunity,section,sourceName,sourceUrl,selected})),
        research: { ...record.research, id: record.id }, copiedAt: recordCopy ? now : previous?.copiedAt,
        copiedChannel: recordCopy ? body.copiedChannel : previous?.copiedChannel } as Edition;
      await editions.put(edition);
      res.json(edition);
    } catch (e) { next(e); }
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Recurso não encontrado.' }));
  app.use((error: any, _req: any, res: any, _next: any) => {
    const status = error instanceof ResearchError ? error.status : error.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : Number(error.status) === 429 ? 429 : 500;
    // Never send provider errors or credentials to the browser or logs.
    res.status(status).json({ error: error instanceof ResearchError ? error.message : status === 429 ? 'Cota de pesquisa atingida. Tente novamente mais tarde.' : status === 400 ? 'JSON inválido.' : status === 413 ? 'A solicitação é muito grande.' : 'Não foi possível concluir a operação. Tente novamente.' });
  });
  return app;
}
