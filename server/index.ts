import { config } from 'dotenv';
import express from 'express';
import path from 'node:path';
import { createApp } from './app';
config({ path: '.env.local', quiet: true });
config({ quiet: true });
const production = process.env.NODE_ENV === 'production';
const app = createApp();
if (production) {
  app.use(express.static(path.resolve('dist')));
  app.get('*', (_req, res) => res.sendFile(path.resolve('dist/index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT || 3000);
app.listen(port, production ? '0.0.0.0' : '127.0.0.1', () => console.log(`KULTUR3: http://localhost:${port}/`));
