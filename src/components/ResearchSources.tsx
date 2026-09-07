import React from 'react';
import type { ResearchEvidence } from '../../shared/research';

export function ResearchSources({ evidence }: { evidence?: ResearchEvidence }) {
  if (!evidence) return null;
  const stale = Date.now() - new Date(evidence.collectedAt).getTime() > 24 * 60 * 60 * 1000;
  return <details className="border border-border bg-card p-4 my-4 text-sm text-text">
    <summary className="cursor-pointer font-semibold">{evidence.sources.length} referências da pesquisa · {new Date(evidence.collectedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (Brasília){stale ? ' · Pesquisa com mais de 24 horas' : ''}</summary>
    <p className="mt-3 leading-relaxed text-muted">Referências retornadas pela busca. A presença de um link não confirma todas as afirmações. Datas de publicação e números precisam de conferência editorial; o horário acima é o da coleta. Ideias e oportunidades são sugestões.</p>
    {!!evidence.omittedItems && <p className="mt-2 text-amber-300">{evidence.omittedItems} item(ns) sem referência reconhecida foram omitidos.</p>}
    <ul className="mt-3 space-y-2">{evidence.sources.map(s => <li key={s.url}><a className="text-accent underline break-words" href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>)}</ul>
    {evidence.supports.length > 0 && <details className="mt-3"><summary className="cursor-pointer">Trechos da resposta associados a fontes</summary><ul className="space-y-3 mt-3">{evidence.supports.map((s,i) => <li key={i}><p className="whitespace-pre-wrap break-words">{s.text}</p><div>{s.sourceUrls.map((url,j) => <a className="underline text-accent mr-3" key={url+j} href={url} target="_blank" rel="noopener noreferrer">Referência {j+1}</a>)}</div></li>)}</ul></details>}
    {evidence.searchSuggestions && <iframe title="Sugestões da Pesquisa Google" className="w-full mt-4 border-0 h-40 bg-white rounded" sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" srcDoc={evidence.searchSuggestions} />}
  </details>;
}
