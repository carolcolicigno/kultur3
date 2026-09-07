import { safeUrl, type ResearchEvidence } from './research';
export const sections = ['🔥 Destaques do dia', '🎬 Campanhas & marcas', '🤳 Creator economy', '📊 Dados & pesquisas', '💡 Cultura & comportamento'] as const;
export interface CurationItem { id: string; title: string; summary: string; opportunity: string; section: string; sourceUrl: string; sourceName: string; selected: boolean }
export interface Edition { id: string; brand: string; createdAt: string; updatedAt: string; items: CurationItem[]; research: ResearchEvidence; copiedAt?: string; copiedChannel?: string }
export function editionItems(report: any): CurationItem[] {
  const seen = new Set<string>();
  return [...(report.assuntos || []), ...(report.trends || [])].flatMap((item: any) => {
    const sourceUrl = safeUrl(item.source_url);
    const title = String(item.titulo || item.name || '').trim();
    const key = `${sourceUrl}|${title.toLocaleLowerCase('pt-BR')}`;
    if (!sourceUrl || !title || seen.has(key)) return [];
    seen.add(key);
    const category = String(item.categoria || '').toLowerCase();
    const section = /creator|influenc/.test(category) ? sections[2] : /dado|pesquisa/.test(category) ? sections[3] : /marca|campanha|publicidade/.test(category) ? sections[1] : sections[0];
    return [{ id: `item-${seen.size}`, title, summary: String(item.descricao || ''), opportunity: String(item.oportunidade || item.oportunidade_marca || ''), section, sourceUrl, sourceName: String(item.source_name || new URL(sourceUrl).hostname), selected: true }];
  });
}
export function formatEdition(edition: Edition, channel: 'whatsapp' | 'telegram', length: 'short' | 'full'): string {
  const items = edition.items.filter(i => i.selected && safeUrl(i.sourceUrl));
  if (!items.length) return '';
  // Telegram clipboard paste does not interpret Bot API Markdown. Use plain headings there.
  const clean = (s: string) => s.replace(/[\r\n]+/g, ' ').replace(/[*_~`]/g, '').trim();
  const heading = (s: string) => channel === 'whatsapp' ? `*${clean(s)}*` : clean(s);
  const date = new Date(edition.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const lines = [heading(`KULTUR3 | Curadoria de ${date}`), `Recorte: ${clean(edition.brand)}`, ''];
  let lastSection = '';
  for (const item of items) {
    if (item.section !== lastSection) { lines.push(heading(item.section), ''); lastSection = item.section; }
    lines.push(heading(item.title));
    if (length === 'full' && item.summary.trim()) lines.push(clean(item.summary));
    if (length === 'full' && item.opportunity.trim()) lines.push(`💡 Leitura KULTUR3: ${clean(item.opportunity)}`);
    lines.push(`🔗 ${clean(item.sourceName)}: ${safeUrl(item.sourceUrl)}`, '');
  }
  lines.push('Curadoria assistida por IA. Confira as publicações originais; análises e sugestões são editoriais.');
  return lines.join('\n').trim();
}
