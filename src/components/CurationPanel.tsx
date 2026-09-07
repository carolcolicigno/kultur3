import React, { useEffect, useState } from 'react';
import { api, generateJSON, SCHEMAS } from '../services/geminiService';
import { editionItems, formatEdition, sections, type Edition } from '../../shared/curation';
import type { BrandConfig } from '../types';
import { ResearchSources } from './ResearchSources';

const control = 'bg-bg border border-border rounded px-3 py-2 text-base text-white w-full focus:outline-accent';
const button = 'border border-border rounded px-4 py-2 text-sm font-semibold text-white hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed';
export function CurationPanel({ config }: { config: BrandConfig }) {
  const [edition, setEdition] = useState<Edition | null>(null);
  const [history, setHistory] = useState<Edition[]>([]);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [length, setLength] = useState<'short'|'full'>('full');
  const [channel, setChannel] = useState<'whatsapp'|'telegram'>('whatsapp');
  const filtered = history.filter(e => e.brand === config.brand);
  useEffect(() => {
    let current = true;
    api<Edition[]>('/api/editions').then(list => { if (current) setHistory(list); }).catch(e => { if (current) setError(e.message); });
    return () => { current = false; };
  }, []);
  const remember = (e: Edition) => { setEdition(e); setHistory(h => [e, ...h.filter(x => x.id !== e.id)]); setDirty(false); };
  const persist = async (e: Edition) => { const saved = await api<Edition>('/api/editions', e); remember(saved); return saved; };
  const generate = async () => {
    setBusy(true); setError(''); setMessage('Pesquisando campanhas, marcas e creator economy...');
    try {
      const result = await generateJSON('Prepare uma curadoria editorial para profissionais de publicidade. Separe notícia, contexto e oportunidade criativa.',
        `Pesquise publicações das últimas 24 horas sobre campanhas publicitárias, comunicação, marcas, creator economy e pesquisas do mercado. Marca: ${config.brand}. Segmento: ${config.seg}. Região: ${config.reg}. Não preencha uma quantidade mínima: retorne somente pautas com fonte. Informe categoria por pauta. Se precisar usar material mais antigo, deixe explícito no resumo.`, SCHEMAS.REPORT);
      const items = editionItems(result);
      if (!items.length) throw new Error('Não foram encontradas pautas com referências para esta edição.');
      const now = new Date().toISOString();
      const draft: Edition = { id: '', brand: config.brand, createdAt: now, updatedAt: now, items, research: result._research };
      setEdition(draft); setDirty(true);
      await persist(draft);
      setMessage('Edição salva. Confira as fontes e ajuste os textos antes de copiar.');
    } catch (e: any) { setError(e.message); setMessage(''); }
    finally { setBusy(false); }
  };
  const save = async () => {
    if (!edition) return;
    setBusy(true); setError('');
    try { await persist(edition); setMessage('Edição salva no histórico.'); } catch(e: any) { setError(e.message); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    if (!edition) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await navigator.clipboard.writeText(formatEdition(edition, channel, length));
      setMessage(`Texto copiado para ${channel === 'whatsapp' ? 'WhatsApp' : 'Telegram'}.`);
      try { await persist({ ...edition, copiedChannel: channel, recordCopy: true } as Edition & { recordCopy: true }); }
      catch { setError('O texto foi copiado, mas o histórico não foi salvo. Clique em Salvar edição para tentar novamente.'); }
    } catch { setError('O navegador não permitiu copiar. Selecione o texto da prévia e copie manualmente.'); }
    finally { setBusy(false); }
  };
  const update = (index: number, field: string, value: unknown) => { setEdition(e => e && ({...e, items: e.items.map((item,i) => i === index ? {...item, [field]:value} : item)})); setDirty(true); setMessage(''); };
  const move = (index: number, direction: number) => { setEdition(e => { if (!e) return e; const items = [...e.items]; [items[index],items[index+direction]] = [items[index+direction],items[index]]; return {...e,items}; }); setDirty(true); };
  const text = edition ? formatEdition(edition, channel, length) : '';
  return <div className="h-full overflow-y-auto p-5 md:p-8 text-text">
    <div className="flex flex-wrap gap-4 justify-between items-start mb-6"><div><p className="text-accent text-sm mb-2">KULTUR3 / Curadoria</p><h1 className="font-syne text-3xl font-extrabold text-white">Curadoria do dia</h1><p className="text-base text-muted mt-2">Selecione as pautas, revise e copie para o seu canal.</p></div>
      <button className={`${button} bg-accent`} disabled={busy || dirty} onClick={generate}>{busy ? 'Aguarde…' : 'Pesquisar nova edição'}</button></div>
    <p className="text-sm text-muted mb-4">Pesquisa sob demanda · Histórico compartilhado do piloto · As edições são preparadas quando você solicita.</p>
    {dirty && <p className="text-sm text-amber-300 mb-3">Há alterações não salvas. Salve antes de abrir outra edição ou iniciar uma pesquisa.</p>}
    {error && <p role="alert" className="border border-red-500 text-red-200 p-3 rounded mb-4">{error}</p>}
    <p role="status" aria-live="polite" className="text-sm text-accent mb-4">{message}</p>
    <div className="flex flex-wrap gap-3 mb-6 items-end">
      <label className="text-sm flex-1 min-w-48">Histórico de {config.brand}<select className={control} value={edition?.id || ''} disabled={busy || dirty} onChange={e => { setEdition(history.find(x => x.id === e.target.value) || null); setMessage(''); setError(''); }}><option value="">Selecione uma edição</option>{filtered.map(e => <option key={e.id} value={e.id}>{new Date(e.createdAt).toLocaleString('pt-BR')} · {e.items.filter(i=>i.selected).length} pautas{e.copiedAt ? ' · copiada' : ''}</option>)}</select></label>
      {edition && <button className={button} disabled={busy || !dirty} onClick={save}>Salvar edição</button>}
    </div>
    {!edition ? <div className="p-8 border border-border text-base text-muted">Comece uma pesquisa ou abra uma edição salva. Nenhuma pauta de demonstração será publicada.</div> : <>
      <ResearchSources evidence={edition.research} />
      <div className="grid xl:grid-cols-2 gap-6 items-start">
        <fieldset disabled={busy} className="space-y-4 min-w-0"><legend className="font-bold mb-3">Pautas da edição · {edition.items.filter(i=>i.selected).length} selecionadas</legend>
          {edition.items.map((item,index) => <article key={item.id} className={`border rounded p-4 space-y-3 ${item.selected ? 'border-border bg-card' : 'border-border opacity-60'}`}>
            <div className="flex justify-between gap-2 items-center"><label className="text-sm flex gap-2 items-center"><input type="checkbox" checked={item.selected} onChange={e=>update(index,'selected',e.target.checked)} /> Incluir pauta {index+1}</label><div className="flex gap-2"><button className={button} aria-label={`Mover pauta ${index+1} para cima`} disabled={index===0} onClick={()=>move(index,-1)}>↑</button><button className={button} aria-label={`Mover pauta ${index+1} para baixo`} disabled={index===edition.items.length-1} onClick={()=>move(index,1)}>↓</button></div></div>
            <label className="block text-sm">Seção<select className={control} value={item.section} onChange={e=>update(index,'section',e.target.value)}>{sections.map(s=><option key={s}>{s}</option>)}</select></label>
            <label className="block text-sm">Título<input className={control} value={item.title} maxLength={300} onChange={e=>update(index,'title',e.target.value)} /></label>
            <label className="block text-sm">Resumo da publicação<textarea rows={3} className={control} value={item.summary} maxLength={3000} onChange={e=>update(index,'summary',e.target.value)} /></label>
            <label className="block text-sm">Leitura KULTUR3 · análise editorial<textarea rows={2} className={control} value={item.opportunity} maxLength={2000} onChange={e=>update(index,'opportunity',e.target.value)} /></label>
            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="block text-sm underline text-accent break-words">Conferir publicação: {item.sourceName}</a>
            <p className="text-sm text-muted">Data de publicação não confirmada automaticamente.</p>
          </article>)}
        </fieldset>
        <div className="border border-border rounded bg-card p-4 xl:sticky xl:top-4">
          <h2 className="font-bold text-lg mb-4">Prévia para copiar</h2>
          <div className="flex flex-wrap gap-3 mb-4"><label className="text-sm flex-1">Canal<select className={control} value={channel} onChange={e=>setChannel(e.target.value as any)}><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option></select></label><label className="text-sm flex-1">Versão<select className={control} value={length} onChange={e=>setLength(e.target.value as any)}><option value="full">Completa</option><option value="short">Curta · títulos e fontes</option></select></label></div>
          <textarea aria-label="Texto pronto para copiar" readOnly rows={20} value={text} className={`${control} leading-relaxed`} />
          <p className="text-sm text-muted my-3">{text.length} caracteres · {channel === 'telegram' ? 'Texto simples com emojis e links, pronto para colar.' : 'Títulos com asteriscos para negrito no WhatsApp.'} Se o aplicativo limitar o tamanho, envie por seções.</p>
          <button className={`${button} bg-accent w-full`} disabled={busy || !text || edition.items.some(i=>i.selected&&!i.title.trim())} onClick={copy}>Copiar para {channel === 'whatsapp' ? 'WhatsApp' : 'Telegram'}</button>
          {edition.copiedAt && <p className="text-sm text-muted mt-3">Última cópia: {new Date(edition.copiedAt).toLocaleString('pt-BR')} · {edition.copiedChannel}. O envio é feito por você.</p>}
        </div>
      </div>
    </>}
  </div>;
}
