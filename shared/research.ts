export interface ResearchSource { url: string; title: string }
export interface ResearchSupport { text: string; sourceUrls: string[] }
export interface ResearchEvidence {
  id?: string;
  collectedAt: string;
  sources: ResearchSource[];
  supports: ResearchSupport[];
  queries: string[];
  searchSuggestions: string;
  status: 'references_found';
  omittedItems: number;
}

export function safeUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (url.hostname === 'localhost' || !url.hostname.includes('.') || /^[\d.]+$/.test(url.hostname) || url.hostname.includes(':')) return null;
    url.hash = '';
    return url.href;
  } catch { return null; }
}

// These are references returned by the provider, not an independent fact check.
export function extractEvidence(candidate: any, collectedAt: string): ResearchEvidence {
  const metadata = candidate?.groundingMetadata;
  const chunks = Array.isArray(metadata?.groundingChunks) ? metadata.groundingChunks : [];
  const sources: ResearchSource[] = [];
  for (const chunk of chunks) {
    const url = safeUrl(chunk?.web?.uri);
    if (url && !sources.some(s => s.url === url)) sources.push({ url, title: String(chunk.web.title || new URL(url).hostname) });
  }
  const supports = (Array.isArray(metadata?.groundingSupports) ? metadata.groundingSupports : []).flatMap((support: any) => {
    const sourceUrls = (Array.isArray(support.groundingChunkIndices) ? support.groundingChunkIndices : [])
      .map((i: number) => safeUrl(chunks[i]?.web?.uri)).filter((url: string | null): url is string => !!url);
    return typeof support.segment?.text === 'string' && sourceUrls.length ? [{ text: support.segment.text, sourceUrls }] : [];
  });
  return { collectedAt, sources, supports, queries: (metadata?.webSearchQueries || []).filter((q: unknown) => typeof q === 'string'),
    searchSuggestions: typeof metadata?.searchEntryPoint?.renderedContent === 'string' ? metadata.searchEntryPoint.renderedContent : '',
    status: 'references_found', omittedItems: 0 };
}

export function validateShape(value: any, schema: any, depth = 0): boolean {
  if (!schema || depth > 12) return false;
  if (value === null) return schema.nullable === true;
  if (schema.enum && !schema.enum.includes(value)) return false;
  switch (String(schema.type).toUpperCase()) {
    case 'OBJECT':
      return !!value && typeof value === 'object' && !Array.isArray(value)
        && (schema.required || []).every((k: string) => k in value)
        && Object.entries(value).every(([key, child]) => !['__proto__','constructor','prototype'].includes(key) &&
          (schema.properties?.[key] ? validateShape(child, schema.properties[key], depth + 1) :
           typeof schema.additionalProperties === 'object' ? validateShape(child, schema.additionalProperties, depth + 1) : true));
    case 'ARRAY': return Array.isArray(value) && value.length <= 100 && value.every(v => validateShape(v, schema.items, depth + 1));
    case 'STRING': return typeof value === 'string';
    case 'NUMBER': case 'INTEGER': return typeof value === 'number' && Number.isFinite(value);
    case 'BOOLEAN': return typeof value === 'boolean';
    default: return false;
  }
}

export function attachReferences(data: any, evidence: ResearchEvidence) {
  const sourceMap = new Map(evidence.sources.map(s => [s.url, s]));
  const normalize = (node: any): any => {
    if (Array.isArray(node)) return node.map(normalize);
    if (!node || typeof node !== 'object') return node;
    const out = Object.fromEntries(Object.entries(node).map(([k, v]) => [k, normalize(v)]));
    if ('source_url' in out) {
      const source = sourceMap.get(safeUrl(out.source_url) || '');
      out.source_url = source?.url || '';
      out.source_name = source?.title || '';
      out.source_status = source ? 'reference_found' : 'unconfirmed';
      // Publication dates and literal excerpts require a separate page-level check.
      out.source_date = 'Data da publicação não confirmada';
      delete out.source_excerpt;
    }
    return out;
  };
  const normalized = normalize(data);
  for (const key of ['assuntos', 'trends', 'rivals', 'events', 'sources']) {
    if (Array.isArray(normalized[key])) {
      const before = normalized[key].length;
      normalized[key] = normalized[key].filter((item: any) => !!item.source_url);
      evidence.omittedItems += before - normalized[key].length;
    }
  }
  return normalized;
}
