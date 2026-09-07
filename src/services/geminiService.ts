export { SCHEMAS, Type } from '../../shared/schemas';
import type { ResearchEvidence } from '../../shared/research';

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(100_000),
  });
  const result = await response.json().catch(() => ({ error: 'O servidor não respondeu. Tente novamente.' }));
  if (!response.ok) throw new Error(result.error || 'Não foi possível concluir a solicitação.');
  return result as T;
}

export async function generateTextResearch(system: string, prompt: string, history: any[] = [], maxOutputTokens = 2000) {
  return api<{ text: string; research: ResearchEvidence }>('/api/research', { system, prompt, history, maxOutputTokens });
}

export async function generateContent(system: string, prompt: string, history: any[] = [], maxOutputTokens = 2000) {
  const result = await generateTextResearch(system, prompt, history, maxOutputTokens);
  return result.text;
}

export async function generateJSON(system: string, prompt: string, schema: any, statusCallback?: (msg: string) => void) {
  statusCallback?.('Pesquisando publicações e conferindo referências...');
  const result = await api<{ data: any; research: ResearchEvidence }>('/api/research', { system, prompt, schema });
  return { ...result.data, _research: result.research };
}
