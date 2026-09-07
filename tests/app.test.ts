import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createApp } from '../server/app';
import type { ResearchEvidence } from '../shared/research';

const evidence: ResearchEvidence = {
  collectedAt: '2026-09-07T12:00:00.000Z',
  sources: [{ url: 'https://www.meioemensagem.com.br/marketing/campanha', title: 'Meio & Mensagem' }],
  supports: [{ text: 'Resposta vinculada.', sourceUrls: ['https://www.meioemensagem.com.br/marketing/campanha'] }],
  queries: ['campanha publicidade'],
  searchSuggestions: '',
  status: 'references_found',
  omittedItems: 0,
};

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'kultur3-test-'));
  const app = createApp({
    dataDir,
    researcher: async () => ({
      data: { assuntos: [{ titulo: 'Campanha real', descricao: 'Resumo', oportunidade: 'Ideia', source_url: evidence.sources[0].url, source_name: evidence.sources[0].title }] },
      research: evidence,
    }),
  });
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();
    assert(address && typeof address === 'object');
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await rm(dataDir, { recursive: true, force: true });
  }
}

test('research endpoint persists provider evidence without needing a real Gemini key', async () => {
  await withServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: '', prompt: 'Pesquisar', schema: { type: 'OBJECT', properties: {} } }),
    });
    assert.equal(response.status, 200);
    const body: any = await response.json();
    assert.equal(typeof body.research.id, 'string');
    assert.equal(body.research.sources[0].url, evidence.sources[0].url);
  });
});

test('editions keep copy history only for explicit copy actions', async () => {
  await withServer(async baseUrl => {
    const researched = await fetch(`${baseUrl}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: '', prompt: 'Pesquisar', schema: { type: 'OBJECT', properties: {} } }),
    }).then(r => r.json() as Promise<any>);
    const edition = {
      id: '',
      brand: 'KULTUR3',
      createdAt: '2026-09-07T12:00:00.000Z',
      updatedAt: '2026-09-07T12:00:00.000Z',
      research: researched.research,
      items: [{
        id: 'item-1',
        title: 'Campanha real',
        summary: 'Resumo',
        opportunity: 'Ideia',
        section: '🔥 Destaques do dia',
        sourceName: evidence.sources[0].title,
        sourceUrl: evidence.sources[0].url,
        selected: true,
      }],
    };
    const saved = await fetch(`${baseUrl}/api/editions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edition),
    }).then(r => r.json() as Promise<any>);
    assert.equal(saved.copiedAt, undefined);
    const copied = await fetch(`${baseUrl}/api/editions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...saved, copiedChannel: 'whatsapp', recordCopy: true }),
    }).then(r => r.json() as Promise<any>);
    assert.equal(copied.copiedChannel, 'whatsapp');
    assert.equal(typeof copied.copiedAt, 'string');
    const edited = await fetch(`${baseUrl}/api/editions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...copied, items: [{ ...copied.items[0], title: 'Campanha real editada' }], copiedChannel: 'telegram' }),
    }).then(r => r.json() as Promise<any>);
    assert.equal(edited.copiedChannel, 'whatsapp');
    assert.equal(edited.copiedAt, copied.copiedAt);
  });
});

test('editions reject items whose source was not returned by research', async () => {
  await withServer(async baseUrl => {
    const researched = await fetch(`${baseUrl}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: '', prompt: 'Pesquisar', schema: { type: 'OBJECT', properties: {} } }),
    }).then(r => r.json() as Promise<any>);
    const response = await fetch(`${baseUrl}/api/editions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand: 'KULTUR3',
        research: researched.research,
        items: [{
          id: 'item-1',
          title: 'Sem fonte',
          summary: '',
          opportunity: '',
          section: '🔥 Destaques do dia',
          sourceName: 'Exemplo',
          sourceUrl: 'https://example.com/noticia',
          selected: true,
        }],
      }),
    });
    assert.equal(response.status, 400);
  });
});
