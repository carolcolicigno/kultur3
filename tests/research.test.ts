import assert from 'node:assert/strict';
import test from 'node:test';
import { attachReferences, extractEvidence, safeUrl, validateShape } from '../shared/research';

const collectedAt = '2026-09-07T12:00:00.000Z';

test('safeUrl only accepts public https references', () => {
  assert.equal(safeUrl('https://www.meioemensagem.com.br/marketing/example#frag'), 'https://www.meioemensagem.com.br/marketing/example');
  assert.equal(safeUrl('http://www.meioemensagem.com.br/'), null);
  assert.equal(safeUrl('https://localhost/admin'), null);
  assert.equal(safeUrl('https://127.0.0.1/admin'), null);
  assert.equal(safeUrl('https://user:pass@example.com/'), null);
});

test('extractEvidence keeps provider URLs and support links', () => {
  const evidence = extractEvidence({
    groundingMetadata: {
      webSearchQueries: ['campanhas publicidade brasil'],
      groundingChunks: [
        { web: { uri: 'https://www.meioemensagem.com.br/marketing/campanha', title: 'Meio & Mensagem' } },
        { web: { uri: 'https://www.meioemensagem.com.br/marketing/campanha#comentario', title: 'Duplicado' } },
        { web: { uri: 'http://unsafe.example.com/', title: 'Inseguro' } },
      ],
      groundingSupports: [
        { segment: { text: 'Texto vinculado a uma fonte.' }, groundingChunkIndices: [0] },
      ],
      searchEntryPoint: { renderedContent: '<div>Busca</div>' },
    },
  }, collectedAt);
  assert.equal(evidence.sources.length, 1);
  assert.equal(evidence.sources[0].url, 'https://www.meioemensagem.com.br/marketing/campanha');
  assert.deepEqual(evidence.supports[0].sourceUrls, ['https://www.meioemensagem.com.br/marketing/campanha']);
  assert.deepEqual(evidence.queries, ['campanhas publicidade brasil']);
});

test('attachReferences removes unfounded factual items', () => {
  const evidence = extractEvidence({
    groundingMetadata: {
      groundingChunks: [{ web: { uri: 'https://www.propmark.com.br/noticia', title: 'Propmark' } }],
      groundingSupports: [{ segment: { text: 'Trecho gerado com referência.' }, groundingChunkIndices: [0] }],
    },
  }, collectedAt);
  const normalized = attachReferences({
    assuntos: [
      { titulo: 'Com fonte', source_url: 'https://www.propmark.com.br/noticia', source_name: 'Nome inventado', source_excerpt: 'aspas' },
      { titulo: 'Sem fonte', source_url: 'https://example.com/sem-grounding' },
    ],
  }, evidence);
  assert.equal(normalized.assuntos.length, 1);
  assert.equal(normalized.assuntos[0].source_name, 'Propmark');
  assert.equal(normalized.assuntos[0].source_excerpt, undefined);
  assert.equal(evidence.omittedItems, 1);
});

test('validateShape rejects prototype keys and malformed values', () => {
  const schema = {
    type: 'OBJECT',
    required: ['items'],
    properties: {
      items: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          required: ['title'],
          properties: { title: { type: 'STRING' }, score: { type: 'NUMBER' } },
        },
      },
    },
  };
  assert.equal(validateShape({ items: [{ title: 'ok', score: 1 }] }, schema), true);
  assert.equal(validateShape({ items: [{ title: 'ok', score: Number.NaN }] }, schema), false);
  const polluted: any = { title: 'ok' };
  Object.defineProperty(polluted, '__proto__', { enumerable: true, value: { polluted: true } });
  assert.equal(validateShape({ items: [polluted] }, schema), false);
});
