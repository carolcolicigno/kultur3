/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Lightbulb, 
  Radar, 
  Layers, 
  Swords, 
  Calendar, 
  LayoutTemplate, 
  Share2, 
  Eye, 
  BarChart3,
  Activity, 
  MessageSquare,
  Cpu, 
  Settings, 
  Plus, 
  RefreshCw, 
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Download,
  Link as LinkIcon,
  X,
  Zap,
  Bell
} from 'lucide-react';
import { Type } from '@google/genai';
import Markdown from 'react-markdown';
import { PanelType, BrandConfig, DailyBriefing, ReportItem, Activation, FuseState } from './types';
import { generateContent, generateJSON, SCHEMAS } from './services/geminiService';

// --- Shared Components ---

const Notification = ({ message, type = 'error', onClose }: any) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    error: 'bg-red-950/90 border-red-500 text-red-100',
    signal: 'bg-black/90 border-accent text-white shadow-[0_0_30px_rgba(255,45,120,0.2)]'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 20, x: '-50%' }}
      className={`fixed bottom-[40px] left-1/2 z-[9999] px-[24px] py-[16px] border ${(styles as any)[type]} shadow-2xl backdrop-blur-md min-w-[320px] flex items-center justify-between gap-4`}
    >
      <div className="flex items-center gap-3">
        {type === 'error' ? (
          <Zap size={18} className="text-red-400" />
        ) : (
          <div className="relative">
            <Bell size={18} className="text-accent animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        )}
        <div className="flex flex-col">
          {type === 'signal' && <span className="text-[9px] font-black tracking-[2px] uppercase text-accent mb-0.5">Sinal Urgente</span>}
          <span className="font-mono text-[11px] tracking-[1px] uppercase font-bold">{message}</span>
        </div>
      </div>
      <button onClick={onClose} className="hover:opacity-70 transition-opacity">
        <X size={16} />
      </button>
    </motion.div>
  );
};

const Button = ({ children, onClick, className = '', disabled = false, variant = 'primary' }: any) => {
  const base = "font-sans font-black text-[11px] tracking-[2px] uppercase py-[10px] px-[22px] transition-all duration-150 flex items-center justify-center gap-[6px] disabled:opacity-35 disabled:cursor-not-allowed whitespace-nowrap";
  const variants = {
    primary: "run-btn bg-accent text-white hover:bg-pink2 hover:-translate-y-[1px] hover:shadow-[0_4px_20px_rgba(255,45,120,0.3)]",
    ghost: "ghost-btn bg-transparent border border-border2 text-muted hover:text-text hover:border-border3 hover:bg-white/[0.02]",
    main: "sp-btn-main bg-accent text-white text-[12px] py-[13px] px-[28px] hover:bg-pink2 hover:-translate-y-[1px]"
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${base} ${(variants as any)[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', title, badge, loading = false, statusText, expandable = false, extraContent, active = false }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`bg-card border border-border relative overflow-hidden transition-all duration-300 ${className} ${expandable ? 'cursor-pointer' : ''} ${active ? 'border-accent/40' : 'hover:border-border2'}`}
      onClick={() => expandable && setIsExpanded(!isExpanded)}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-linear-to-r from-accent to-transparent" />
      <div className="p-[20px]">
        {title && (
          <div className="font-mono text-[8px] font-bold tracking-[2.5px] uppercase text-accent mb-[14px] flex items-center gap-[8px]">
            <div className="w-[18px] h-[1px] bg-accent" />
            {title}
            {expandable && (
              <motion.div 
                animate={{ rotate: isExpanded ? 180 : 0 }}
                className="ml-auto text-accent"
              >
                <ChevronDown size={14} />
              </motion.div>
            )}
          </div>
        )}
        
        {loading ? (
          <div className="min-h-[160px] flex flex-col items-center justify-center gap-[12px]">
            <div className="w-[26px] h-[26px] border-2 border-border2 border-t-accent rounded-full animate-spin" />
            <div className="font-mono text-[10px] text-muted tracking-[1.5px] text-center max-w-[300px]">
              {statusText || "Pesquisando fontes verificadas..."}
            </div>
          </div>
        ) : children}
      </div>

      <AnimatePresence>
        {expandable && isExpanded && extraContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border overflow-hidden bg-white/[0.01]"
          >
            <div className="p-[20px]">
              {extraContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavLabel = ({ children }: any) => (
  <div className="font-mono text-[7px] font-bold tracking-[3px] uppercase text-faint px-[8px] mt-[12px] mb-[3px] flex items-center gap-[8px]">
    {children}
    <div className="flex-1 h-[1px] bg-border" />
  </div>
);

const NavButton = ({ active, onClick, icon, children }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-[9px] px-[10px] py-[7px] font-sans font-medium text-[12px] w-full text-left transition-all duration-120 relative overflow-hidden group
      ${active ? 'text-white bg-pd font-semibold' : 'text-muted bg-transparent hover:text-text hover:bg-white/[0.03]'}`}
  >
    <div className={`absolute left-0 top-0 bottom-0 w-[2px] bg-accent transition-transform duration-150 ${active ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'}`} />
    <span className={`text-[13px] w-[20px] text-center shrink-0 transition-opacity duration-120 ${active ? 'opacity-100' : 'opacity-65 group-hover:opacity-100'}`}>
      {icon}
    </span>
    {children}
  </button>
);

// --- Splash Component ---

const Splash = ({ onEnter }: { onEnter: () => void }) => {
  const [counts, setCounts] = useState({ tr: 0, fo: 0, op: 0, mk: 0 });
  const targets = { tr: 47, fo: 25, op: 12, mk: 120 };

  useEffect(() => {
    const duration = 1800;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setCounts({
        tr: Math.round(e * targets.tr),
        fo: Math.round(e * targets.fo),
        op: Math.round(e * targets.op),
        mk: Math.round(e * targets.mk),
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -16 }}
      className="fixed inset-0 z-[9000] bg-bg flex flex-col overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:16px_16px]" />
      <div className="absolute left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-accent to-transparent top-[-2px] z-2 animate-[scan_3s_linear_infinite]" />

      <div className="h-[28px] shrink-0 flex items-center relative z-3 bg-accent overflow-hidden">
        <div className="flex w-max animate-[mq_16s_linear_infinite]">
          {[1, 2].map(i => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-[14px] px-[28px] font-mono text-[9px] tracking-[2.5px] uppercase whitespace-nowrap text-black/70">
                <div className="w-[3px] h-[3px] rotate-45 bg-black/50 shrink-0" />
                Inteligência Cultural em Tempo Real
                <div className="w-[3px] h-[3px] rotate-45 bg-black/50 shrink-0" />
                Trends · Creators · Oportunidades
                <div className="w-[3px] h-[3px] rotate-45 bg-black/50 shrink-0" />
                Dados verificados com fonte e data
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] overflow-hidden relative z-1">
        <div className="flex flex-col justify-center p-[48px_56px] border-r border-border relative overflow-hidden">
          <div className="absolute font-syne font-extrabold text-[300px] text-white/[0.018] top-1/2 left-[-40px] -translate-y-1/2 pointer-events-none select-none tracking-[-20px] uppercase">
            K3
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-[10px] mb-[24px]"
          >
            <div className="w-[24px] h-[1px] bg-accent" />
            <div className="font-mono text-[9px] tracking-[3px] uppercase text-accent">Plataforma de inteligência cultural</div>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="font-syne font-extrabold text-[clamp(52px,7vw,84px)] leading-[0.9] tracking-[-3px] text-white uppercase"
          >
            <span className="relative inline-block animate-[g1_4s_infinite]">CULTURA</span><br />
            <span className="text-accent">MOVE</span><br />
            <span className="[−webkit-text-stroke:1.5px_rgba(255,255,255,0.2)] text-transparent block">MARCAS</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-[15px] font-light text-dim leading-[1.7] max-w-[480px] mt-[20px] mb-[32px]"
          >
            A Kultur3 mapeia <strong className="text-text font-medium">o que está nascendo nas redes</strong> antes de virar mainstream. Trends, conversas, creators e janelas de ativação — pesquisados em fontes reais.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex gap-[10px] items-center"
          >
            <Button variant="main" onClick={onEnter}>Acessar a plataforma →</Button>
            <button className="bg-transparent text-muted font-mono text-[10px] tracking-[2px] uppercase py-[13px] px-[20px] border border-border2 transition-all duration-150 hover:text-white hover:border-border3">
              Como funciona
            </button>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex border-t border-border mt-[40px]"
          >
            {[
              { label: 'Trends hoje', val: counts.tr },
              { label: 'Fontes', val: counts.fo },
              { label: 'Oportunidades', val: counts.op },
              { label: 'Marcas', val: counts.mk }
            ].map((s, i) => (
              <div key={i} className="flex-1 py-[16px] border-r last:border-r-0 border-border">
                <div className="font-syne font-extrabold text-[28px] tracking-[-1.5px] text-white leading-none">
                  <span className="text-accent">{s.val}</span>
                </div>
                <div className="font-mono text-[8px] tracking-[1px] uppercase text-muted mt-[3px]">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
        <div className="flex flex-col overflow-y-auto">
           <div className="p-[24px_26px] border-b border-border">
            <div className="font-mono text-[8px] tracking-[2px] uppercase text-accent mb-[14px] flex items-center gap-[8px]">
              <div className="w-[12px] h-[1px] bg-accent" />
              Como funciona
            </div>
             {[
               { n: '01', t: 'Pesquisamos em tempo real', d: '30+ fontes: Meio & Mensagem, B9, Propmark, AdNews, TikTok, X, Google Trends, UOL...' },
               { n: '02', t: 'A IA analisa e estrutura', d: 'Score de intensidade, urgência, plataformas ativas, creators e oportunidade.' },
               { n: '03', t: 'Seu time ativa com velocidade', d: 'One-Page pronto para apresentar. Report com teaser para WhatsApp. Do insight à ação em minutos.' }
             ].map((s, i) => (
               <div key={i} className="flex gap-[12px] py-[10px] border-b last:border-b-0 border-border">
                 <div className="font-syne font-extrabold text-[18px] text-border2 leading-none shrink-0 pt-[2px]">{s.n}</div>
                 <div>
                   <h3 className="font-syne text-[12px] font-bold text-white mb-[3px] uppercase">{s.t}</h3>
                   <p className="text-[11px] text-muted leading-relaxed">{s.d}</p>
                 </div>
               </div>
             ))}
           </div>
           
           <div className="p-[24px_26px] border-b border-border">
             <div className="font-mono text-[8px] tracking-[2px] uppercase text-accent mb-[14px] flex items-center gap-[8px]">
                <div className="w-[12px] h-[1px] bg-accent" />
                Resultados reais
             </div>
             {[
               { b: 'Amstel · Heineken Brasil', n: '+526%', d: 'Impressões médias em Stories — trend ativada 48h antes do pico' },
               { b: 'Max · Warner Bros. Discovery', n: '+13 p.p.', d: 'Taxa de engajamento no TikTok fora de temporada' }
             ].map((c, i) => (
               <div key={i} className="bg-card border border-border p-[12px] mb-[6px] relative overflow-hidden before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-accent">
                 <div className="font-mono text-[8px] tracking-[1.5px] uppercase text-accent mb-[3px]">{c.b}</div>
                 <div className="font-syne text-[22px] font-extrabold text-white tracking-[-1px] leading-none mb-[2px]">{c.n}</div>
                 <div className="text-[10px] text-muted leading-relaxed">{c.d}</div>
               </div>
             ))}
           </div>

           <div className="mt-auto p-[16px_26px] bg-bg2 border-t border-border">
             <div className="font-mono text-[8px] tracking-[2px] uppercase text-muted mb-[10px] flex items-center gap-[6px]">
               <div className="w-[6px] h-[6px] rounded-full bg-accent animate-pulse" />
               Agora na plataforma
             </div>
             <div className="flex justify-between py-[5px] border-b border-border text-[11px]">
               <span className="text-muted text-[11px]">Última atualização</span>
               <span className="font-mono text-lime text-[10px]">Agosto 2026</span>
             </div>
             <div className="flex justify-between py-[5px] border-b last:border-b-0 border-border text-[11px]">
               <span className="text-muted text-[11px]">Urgência do dia</span>
               <span className="font-mono text-accent text-[10px]">ALTA</span>
             </div>
           </div>
        </div>
      </div>

      <div className="h-[28px] shrink-0 flex items-center relative z-3 bg-bg2 border-t border-border overflow-hidden">
        <div className="flex w-max animate-[mq_20s_linear_infinite_reverse]">
          {[1, 2].map(i => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-[14px] px-[28px] font-mono text-[9px] tracking-[2.5px] uppercase whitespace-nowrap text-muted">
                <div className="w-[3px] h-[3px] rotate-45 bg-accent shrink-0" />
                meioemensagem.com.br
                <div className="w-[3px] h-[3px] rotate-45 bg-accent shrink-0" />
                b9.com.br
                <div className="w-[3px] h-[3px] rotate-45 bg-accent shrink-0" />
                propmark.com.br
                <div className="w-[3px] h-[3px] rotate-45 bg-accent shrink-0" />
                adnews.com.br
                <div className="w-[3px] h-[3px] rotate-45 bg-accent shrink-0" />
                uol.com.br
                <div className="w-[3px] h-[3px] rotate-45 bg-accent shrink-0" />
                tiktok.com/trending
                <div className="w-[3px] h-[3px] rotate-45 bg-accent shrink-0" />
                x.com/explore
                <div className="w-[3px] h-[3px] rotate-45 bg-accent shrink-0" />
                trends.google.com.br
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </motion.div>
  );
};


const defaultEvents = () => {
  const y = new Date().getFullYear();
  return [
    {date:`${y}-03-20`,name:'Lollapalooza 2026',desc:'Festival de música em São Paulo — 3 dias de ativação intensa.',opp:'Bebidas, moda, tech, entretenimento',type:'p',tags:['Música','SP']},
    {date:`${y}-03-17`,name:'Lei Felca em vigor',desc:'Novas regras para menores na internet entram em vigor.',opp:'Tech, games, plataformas digitais',type:'c',tags:['Legislação','Digital']},
    {date:`${y}-05-11`,name:'Dia das Mães',desc:'Uma das datas de maior volume de conversas.',opp:'Todas as categorias',type:'p',tags:['Comercial']}
  ];
};
// --- Panels ---

const InsightsPanel = ({ config, onError }: { config: BrandConfig, onError: (e: any) => void }) => {
  const [topic, setTopic] = useState('');
  const [brandSeg, setBrandSeg] = useState(config.seg || '');
  const [deep, setDeep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const system = `Você é especialista sênior em inteligência cultural e marketing de marca para o mercado brasileiro. 
Responda de forma estratégica, profunda e provocativa. Use Markdown. MARCA ATIVA: ${config.brand}. Segmento: ${brandSeg}.`;
      
      const prompt = `Pesquise e analise profundamente o território cultural de: "${topic}" ${brandSeg ? ` para uma marca de ${brandSeg}` : ''}. 
Busque em: meioemensagem.com.br, b9.com.br, x.com/explore, tiktok.com/trending, trends.google.com.br, propmark.com.br, adnews.com.br, updateordie.com, uol.com.br.
Retorne: 1. Mapa de Calor Cultural (Sinais Fortes/Fracos), 2. Comportamentos Emergentes, 3. Tensões & Territórios de Marca, 4. 3 Ideias Prontas para Ativação.`;
      
      const res = await generateContent(system, prompt);
      setResult(res);
    } catch (e) {
      setResult("Falha na varredura profunda. Tente novamente.");
      onError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-[48px_32px_32px] border-b border-border bg-bg shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:10px_10px]" />
        <div className="font-mono text-[9px] tracking-[4px] uppercase text-accent mb-[12px] flex items-center gap-[8px] font-black">
          <div className="w-[18px] h-[3px] bg-accent" />
          Network Analysis
        </div>
        <h1 className="font-syne text-[clamp(42px,6vw,72px)] font-extrabold text-white tracking-[-3px] leading-[0.9] uppercase mb-[10px]">
          INSIGHTS<br />
          <span className="text-accent underline decoration-[6px] underline-offset-[10px]">CORE</span>
        </h1>
        <p className="text-[14px] text-muted max-w-[480px] leading-relaxed font-light uppercase tracking-tight">
          Mapeamento profundo de territórios e cruzamento de sinais culturais.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-[22px_28px] bg-bg">
        <div className="max-w-[1000px]">
          <div className="bg-card border border-border p-[20px] mb-[32px] flex gap-[12px] flex-wrap items-start relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-accent/20" />
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="flex-1 bg-bg border border-border p-[14px_18px] text-[14px] text-white min-w-[200px] outline-none focus:border-accent transition-all" 
              placeholder="Ex: Carnaval 2026, TikTok trends, Lei Felca, BBB..." 
            />
            <select 
              value={brandSeg}
              onChange={(e) => setBrandSeg(e.target.value)}
              className="w-[200px] bg-bg border border-border p-[14px_18px] text-[14px] text-white outline-none cursor-pointer focus:border-accent transition-all"
            >
              <option value="">Qualquer segmento</option>
              <option>Bebidas & Alimentos</option><option>Moda & Beleza</option>
              <option>Tecnologia</option><option>Finanças</option>
              <option>Entretenimento</option><option>Varejo</option>
            </select>
            <Button variant="main" disabled={loading || !topic} onClick={handleAnalyze}>Mapear Território</Button>
            
            <label className="w-full flex items-center gap-[8px] font-mono text-[9px] text-muted cursor-pointer mt-2 group uppercase tracking-widest">
              <input type="checkbox" checked={deep} onChange={(e) => setDeep(e.target.checked)} className="accent-accent" /> 
              <span className="group-hover:text-white transition-colors">Ativar Deep Neural Scan (Scrape Extendido)</span>
            </label>
          </div>

          {loading ? (
            <Card loading={true} statusText={deep ? "Scanner Neural em nível profundo (3 rodadas)..." : "Pesquisando em fontes verificadas..."} />
          ) : result ? (
            <div className="animate-[fade_0.4s_ease]">
              <Card title="Blueprint de Insight">
                <div className="prose prose-invert max-w-none 
                  [&_h2]:font-syne [&_h2]:font-extrabold [&_h2]:text-[24px] [&_h2]:text-accent [&_h2]:mb-6 [&_h2]:mt-10 [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:leading-none
                  [&_h3]:font-syne [&_h3]:font-bold [&_h3]:text-[18px] [&_h3]:text-white [&_h3]:mb-4 [&_h3]:mt-8 [&_h3]:uppercase [&_h3]:tracking-tight
                  [&_p]:text-[15px] [&_p]:text-muted [&_p]:leading-[1.8] [&_p]:mb-6 [&_p]:font-light
                  [&_li]:text-[15px] [&_li]:text-muted [&_li]:mb-3 [&_li]:font-light
                  [&_strong]:text-white [&_strong]:font-bold
                  [&_ul]:mb-8 [&_ul]:list-none [&_ul_li]:before:content-['→'] [&_ul_li]:before:text-accent [&_ul_li]:before:mr-3 [&_ul_li]:before:font-bold">
                  <Markdown>{result}</Markdown>
                </div>
              </Card>
            </div>
          ) : (
            <div className="py-[120px] text-center opacity-30">
               <div className="font-syne font-extrabold text-[40px] text-white/5 uppercase mb-4">Aguardando Input</div>
               <div className="font-mono text-[10px] text-muted tracking-[2px] uppercase">Selecione um tópico para análise cultural</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Trends Panel ---

const TrendsPanel = ({ config, onError, onSignal }: { config: BrandConfig, onError: (e: any) => void, onSignal: (m: string) => void }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Iniciando varredura...");
  const [trends, setTrends] = useState<any[]>([]);

  const handleMap = async () => {
    setLoading(true);
    setStatus("Preparando motores de busca...");
    try {
      const system = `Você é analista de tendências culturais. Acesso à web para dados reais. Retorne um JSON estruturado. Não use CAIXA ALTA no conteúdo dos textos.`;
      const prompt = `Pesquise e analise AGORA tendências emergentes focando em COMPORTAMENTO DO CONSUMIDOR e CULTURA DIGITAL. 
Fontes prioritárias: tiktok.com/trending, x.com/explore, trends.google.com.br, meioemensagem.com.br, b9.com.br, propmark.com.br, adnews.com.br, uol.com.br. 
MARCA ATIVA: ${config.brand}. Segmento: ${config.seg}. 
Identifique 6 sinais fortes que impactam o marketing e a estratégia de marca hoje. Se identificar um sinal de urgência crítica ou mudança brusca de comportamento, marque urgency como "CRITICAL" e forneça uma alert_message curta e impactante.`;
      
      const res = await generateJSON(system, prompt, SCHEMAS.TRENDS, (msg) => setStatus(msg));
      const trendList = res?.trends || [];
      setTrends(trendList);

      // Check for critical signals
      const critical = trendList.find((t: any) => t.urgency === 'CRITICAL');
      if (critical && critical.alert_message) {
        onSignal(critical.alert_message);
      }
    } catch (e) {
      console.error(e);
      onError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-[48px_32px_32px] border-b border-border bg-bg shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:10px_10px]" />
        <div className="font-mono text-[9px] tracking-[4px] uppercase text-accent mb-[12px] flex items-center gap-[8px] font-black">
          <div className="w-[18px] h-[3px] bg-accent" />
          Neural Radar
        </div>
        <h1 className="font-syne text-[clamp(42px,6vw,72px)] font-extrabold text-white tracking-[-3px] leading-[0.9] uppercase mb-[10px]">
          BRAZILIAN<br />
          <span className="text-accent underline decoration-[6px] underline-offset-[10px]">RADAR</span>
        </h1>
        <p className="text-[14px] text-muted max-w-[480px] leading-relaxed font-light uppercase tracking-tight">
          Sinais em tempo real captados em clusters sociais e media nodes.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-[22px_28px] bg-bg">
        <div className="max-w-[1200px]">
          <div className="bg-card border border-border p-[14px] mb-[32px] flex gap-[12px] relative overflow-hidden items-center group">
             <div className="absolute top-0 left-0 right-0 h-[1px] bg-accent/20" />
             <div className="flex-1 px-4 py-2 font-syne text-[13px] text-muted uppercase tracking-wider italic">
               Aguardando escaneamento de tendências para {config.brand || 'seu segmento'}...
             </div>
             <Button variant="main" onClick={handleMap} disabled={loading}>✦ Disparar Varredura</Button>
          </div>

          {loading ? (
            <Card loading={true} statusText={status} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">
              {trends.map((t, i) => (
                <Card 
                  key={i} 
                  expandable={true}
                  className="p-0!"
                  extraContent={
                    <div className="space-y-4">
                      <div>
                        <div className="font-mono text-[8px] text-muted uppercase tracking-[2.5px] mb-3">Plataformas Dominantes</div>
                        <div className="flex gap-[8px] flex-wrap">
                          {t.platforms?.map((p: string, j: number) => (
                            <span key={j} className="text-[9px] px-[10px] py-[4px] bg-white/[0.04] border border-border text-white font-bold uppercase tracking-widest">{p}</span>
                          ))}
                        </div>
                      </div>
                      {t.reasoning && (
                        <div>
                          <div className="font-mono text-[8px] text-muted uppercase tracking-[2.5px] mb-2">Drive de Crescimento</div>
                          <p className="text-[12px] text-muted leading-relaxed font-light italic border-l-2 border-accent/30 pl-4">{t.reasoning}</p>
                        </div>
                      )}
                    </div>
                  }
                >
                  <div className="flex justify-between items-center mb-[14px]">
                    <span className={`font-mono text-[9px] px-[10px] py-[4px] tracking-[2px] uppercase font-black border ${t.badge === 'HOT' ? 'bg-accent border-accent text-white' : 'bg-transparent border-white/20 text-white/50'}`}>
                      {t.badge}
                    </span>
                    <span className="font-mono text-[10px] text-accent font-black tracking-[1px]">{t.score}/100</span>
                  </div>
                  <div className="font-syne font-extrabold text-[22px] text-white mb-[8px] leading-none uppercase tracking-tight">{t.title}</div>
                  <div className="text-[13px] text-muted leading-relaxed mb-5 font-light">{t.description}</div>
                  
                  {t.opportunity && (
                    <div className="group/opp cursor-help transition-all">
                      <div className="font-mono text-[8px] text-accent uppercase tracking-[2px] mb-1 font-bold group-hover/opp:translate-x-1 transition-transform">Janela Criativa</div>
                      <div className="text-[12px] text-white font-bold uppercase tracking-tight leading-tight">{t.opportunity}</div>
                    </div>
                  )}
                  
                  <div className="mt-[24px] h-[2px] bg-white/[0.05] overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${t.score}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-accent" 
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
          
          {!loading && trends.length === 0 && (
            <div className="py-[120px] text-center opacity-30">
               <Radar size={48} className="mx-auto mb-4 text-accent" />
               <div className="font-syne font-extrabold text-[40px] text-white/5 uppercase mb-2">Modo Radar Offline</div>
               <div className="font-mono text-[10px] text-muted tracking-[2px] uppercase">Clique em "Mapear" para conectar ao fluxo de dados</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- One-Pager Panel ---
const OnePagerPanel = ({ config, onError }: { config: BrandConfig, onError: (e: any) => void }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState({ 
    brand: config.brand || '', 
    trend: '', 
    obj: '', 
    aud: config.aud || '', 
    ctx: '' 
  });

  const handleGenerate = async () => {
    if (!form.brand || !form.trend) return;
    setLoading(true);
    try {
      const system = `Você é estrategista criativo sênior de uma agência de cultura brasileira de elite. 
Sua tarefa é criar One-Pagers impactantes, ousados e estrategicamente perfeitos. Use tom de voz profissional porém moderno.`;
      const prompt = `Gere um One-Pager criativo e estratégico: Marca: ${form.brand}, Oportunidade/Trend: ${form.trend}, Objetivo: ${form.obj}, Público: ${form.aud}, Restrições/Contexto: ${form.ctx}.`;
      
      const res = await generateJSON(system, prompt, SCHEMAS.ONE_PAGER);
      setData(res);
    } catch (e) {
      console.error(e);
      onError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-[48px_32px_32px] border-b border-border bg-bg shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:10px_10px]" />
        <div className="font-mono text-[9px] tracking-[4px] uppercase text-accent mb-[12px] flex items-center gap-[8px] font-black">
          <div className="w-[18px] h-[3px] bg-accent" />
          Creative Engine
        </div>
        <h1 className="font-syne text-[clamp(42px,6vw,72px)] font-extrabold text-white tracking-[-3px] leading-[0.9] uppercase mb-[10px]">
          ONE-PAGER<br />
          <span className="text-accent underline decoration-[6px] underline-offset-[10px] italic">STUDIO</span>
        </h1>
        <p className="text-[14px] text-muted max-w-[480px] leading-relaxed font-light uppercase tracking-tight">
          Briefing criativo automatizado — do sinal cultural ao conceito de ativação.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-[22px_28px] bg-bg">
        <div className="max-w-[1100px]">
          <div className="bg-card border border-border p-[24px] mb-[32px] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-accent/20" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] mb-[20px]">
              <div className="flex flex-col gap-[6px]">
                <label className="font-mono text-[8px] tracking-[2px] uppercase text-muted font-bold ml-[2px]">Marca</label>
                <input type="text" value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})} className="bg-bg border border-border p-[12px_16px] text-[13px] text-white outline-none focus:border-accent transition-all" placeholder="Ex: Brahma, Nike..." />
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className="font-mono text-[8px] tracking-[2px] uppercase text-muted font-bold ml-[2px]">Trend/Momento</label>
                <input type="text" value={form.trend} onChange={(e) => setForm({...form, trend: e.target.value})} className="bg-bg border border-border p-[12px_16px] text-[13px] text-white outline-none focus:border-accent transition-all" placeholder="Ex: Lollapalooza, Trend TikTok..." />
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className="font-mono text-[8px] tracking-[2px] uppercase text-muted font-bold ml-[2px]">Objetivo</label>
                <input type="text" value={form.obj} onChange={(e) => setForm({...form, obj: e.target.value})} className="bg-bg border border-border p-[12px_16px] text-[13px] text-white outline-none focus:border-accent transition-all" placeholder="Ex: Engajamento, Awareness..." />
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className="font-mono text-[8px] tracking-[2px] uppercase text-muted font-bold ml-[2px]">Público</label>
                <input type="text" value={form.aud} onChange={(e) => setForm({...form, aud: e.target.value})} className="bg-bg border border-border p-[12px_16px] text-[13px] text-white outline-none focus:border-accent transition-all" placeholder="Ex: Jovens 18-35 Gen Z..." />
              </div>
              <div className="md:col-span-2 flex flex-col gap-[6px]">
                <label className="font-mono text-[8px] tracking-[2px] uppercase text-muted font-bold ml-[2px]">Contexto Estratégico (Opcional)</label>
                <textarea value={form.ctx} onChange={(e) => setForm({...form, ctx: e.target.value})} className="bg-bg border border-border p-[12px_16px] text-[13px] text-white outline-none focus:border-accent transition-all min-h-[60px]" placeholder="Ex: Tom de voz irônico, foco em creators de música..." />
              </div>
            </div>
            <Button variant="main" onClick={handleGenerate} disabled={loading || !form.brand || !form.trend}>✦ Gerar Estratégia de Ativação</Button>
          </div>

          {loading ? (
            <Card loading={true} statusText="Validando timing cultural e estruturando conceito..." />
          ) : data ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.5)]"
            >
               <div className="bg-accent p-[32px_40px] flex justify-between items-center gap-[24px]">
                 <div>
                   <h3 className="font-syne font-extrabold text-[28px] text-white tracking-[-1px] leading-[0.9] uppercase">{data.title}</h3>
                   <div className="font-mono text-[10px] text-white/70 mt-[6px] font-black tracking-[2px] uppercase">{data.tagline}</div>
                 </div>
                 <div className="font-mono text-[8px] text-white/40 text-right whitespace-nowrap leading-[1.8] font-bold">
                   <div>PROPERTY: {form.brand?.toUpperCase()}</div>
                   <div>DATE: {new Date().toLocaleDateString('pt-BR')}</div>
                   <div>DOC_TYPE: K3_STRAT_ONE</div>
                 </div>
               </div>
               <div className="p-[32px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[32px]">
                 <OnePageSection title="O Conceito" content={data.concept} />
                 <OnePageSection title="Por que agora?" content={data.why_now} />
                 <OnePageSection title="A Mecânica" list={data.mechanics} />
                 <OnePageSection title="Canais & Tom">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {data.platforms?.map((p: string, i: number) => (
                        <span key={i} className="text-[9px] px-[8px] py-[3px] bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest">{p}</span>
                      ))}
                    </div>
                    {data.tone && <p className="text-[12px] text-muted font-light leading-relaxed italic border-l border-white/20 pl-3">{data.tone}</p>}
                 </OnePageSection>
                 <OnePageSection title="KPIs de Sucesso" list={data.kpis} />
                 <OnePageSection title="Sugestão de Talentos" list={data.creators} />
                 <div className="md:col-span-2 lg:col-span-3 pt-6 border-t border-border">
                    <OnePageSection title="Action Plan / Próximos Passos" list={data.next_steps} />
                 </div>
               </div>
               {data.risk && (
                  <div className="p-[16px_32px] bg-accent/5 border-t border-border/50 text-[11px] text-accent font-bold uppercase tracking-widest">
                     ⚠ Risk Factor: {data.risk}
                  </div>
               )}
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const OnePageSection = ({ title, content, list, children }: any) => (
  <div>
    <h4 className="font-sans text-[10px] tracking-[3px] uppercase text-accent mb-[12px] pb-[8px] border-b border-border font-black">{title}</h4>
    {content && <p className="text-[12px] text-muted leading-relaxed">{content}</p>}
    {Array.isArray(list) && (
      <ul className="list-none flex flex-col gap-1">
        {list.map((item: string, i: number) => (
          <li key={i} className="text-[12px] text-muted leading-relaxed flex gap-2">
            <span className="text-accent shrink-0 font-black">→</span> {item}
          </li>
        ))}
      </ul>
    )}
    {children}
  </div>
);

// --- Rivals Panel ---

const RivalsPanel = ({ config, onError }: { config: BrandConfig, onError: (e: any) => void }) => {
  const [loading, setLoading] = useState(false);
  const [rivals, setRivals] = useState<string[]>(config.comp ? config.comp.split(',').map(s => s.trim()) : []);
  const [data, setData] = useState<any[]>([]);
  const [newRival, setNewRival] = useState('');

  const addRival = () => {
    if (!newRival.trim()) return;
    setRivals([...rivals, newRival]);
    setNewRival('');
  };

  const removeRival = (index: number) => {
    setRivals(rivals.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!rivals.length) return;
    setLoading(true);
    try {
      const system = `Analista de inteligência competitiva especializado em marketing digital e cultura brasileira.`;
      const prompt = `Pesquise na web e analise os movimentos recentes e o posicionamento cultural dos concorrentes: ${rivals.join(', ')}. Foque em ${config.brand || 'mercado geral'}.`;
      
      const res = await generateJSON(system, prompt, SCHEMAS.RIVALS);
      setData(res.rivals || []);
    } catch (e) {
      console.error(e);
      onError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-[48px_32px_32px] border-b border-border bg-bg shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:10px_10px]" />
        <div className="font-mono text-[9px] tracking-[4px] uppercase text-accent mb-[12px] flex items-center gap-[8px] font-black">
          <div className="w-[18px] h-[3px] bg-accent" />
          Competition Signals
        </div>
        <h1 className="font-syne text-[clamp(42px,6vw,72px)] font-extrabold text-white tracking-[-3px] leading-[0.9] uppercase mb-[10px]">
          MARKET<br />
          <span className="text-accent underline decoration-[6px] underline-offset-[10px]">SIGNALS</span>
        </h1>
        <p className="text-[14px] text-muted max-w-[480px] leading-relaxed font-light uppercase tracking-tight">
          Monitoramento automatizado de movimentos e posicionamento dos concorrentes.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-[22px_28px] bg-bg">
        <div className="max-w-[1000px]">
          <div className="flex flex-wrap gap-[6px] mb-[20px] min-h-[32px]">
            {rivals.map((r, i) => (
              <div key={i} className="flex items-center gap-[8px] px-[12px] py-[6px] bg-card border border-border font-mono text-[10px] text-accent tracking-[1px] font-bold uppercase transition-all hover:border-accent/40 group">
                {r} 
                <button onClick={() => removeRival(i)} className="bg-transparent border-0 text-muted cursor-pointer text-[14px] leading-none hover:text-white transition-colors group-hover:scale-110">×</button>
              </div>
            ))}
          </div>
          
          <div className="bg-card border border-border p-[16px] mb-[32px] flex gap-[12px] items-start relative overflow-hidden">
             <div className="absolute top-0 left-0 right-0 h-[1px] bg-accent/20" />
             <input value={newRival} onChange={(e) => setNewRival(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addRival()} type="text" className="flex-1 bg-bg border border-border p-[12px_16px] text-[13px] text-white outline-none focus:border-accent transition-all" placeholder="Adicionar concorrente (ex: Heineken, Nike...)" />
             <button onClick={addRival} className="bg-white/5 border border-border text-muted font-mono font-bold text-[9px] tracking-[1.5px] uppercase py-[12px] px-[20px] transition-all hover:text-white hover:border-white/20 flex items-center gap-2"><Plus size={10} /> Add</button>
             <Button variant="main" onClick={handleAnalyze} disabled={loading || !rivals.length}>Disparar Análise</Button>
          </div>

          {loading ? (
            <Card loading={true} statusText="Consultando sinais de mercado em tempo real..." />
          ) : (
            <div className="grid grid-cols-1 gap-[12px]">
              {data.some(r => r.alert) && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-accent/10 border border-accent/40 p-[16px_20px] font-syne text-[14px] font-extrabold text-accent mb-[8px] tracking-tight uppercase flex items-center gap-3"
                >
                   <span className="animate-pulse">⚠</span> Oportunidade detectada — território negligenciado identificado.
                </motion.div>
              )}
              {data.map((r, i) => (
                <Card 
                  key={i} 
                  expandable={true}
                  className="p-0!"
                  extraContent={
                    <div className="space-y-4">
                      {r.insight && (
                        <div className="text-[13px] text-white p-[16px_22px] bg-accent/5 border-l-2 border-accent font-light leading-relaxed">
                          <strong className="text-accent font-bold uppercase text-[10px] tracking-widest block mb-2">Insight K3 Engine:</strong>
                          {r.insight}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white/5 p-4 border border-white/5">
                           <div className="font-mono text-[8px] text-muted mb-2 uppercase tracking-[2px]">Potencial de Alcance</div>
                           <div className="font-syne font-extrabold text-[18px] text-white uppercase tracking-tight">Escalável</div>
                         </div>
                         <div className="bg-white/5 p-4 border border-white/5">
                           <div className="font-mono text-[8px] text-muted mb-2 uppercase tracking-[2px]">Intensidade</div>
                           <div className="font-syne font-extrabold text-[18px] text-accent uppercase tracking-tight">ALTA</div>
                         </div>
                      </div>
                    </div>
                  }
                >
                   <div className="flex justify-between items-center mb-[14px]">
                      <div className="font-syne text-[22px] font-extrabold text-white tracking-tight uppercase">{r.name}</div>
                      <div className="flex items-center gap-[10px]">
                         {r.platform && <div className="font-mono text-[9px] px-[10px] py-[4px] bg-accent text-white font-black tracking-[1.5px] uppercase">{r.platform}</div>}
                         <div className="font-mono text-[10px] text-muted font-bold">{r.score}/100</div>
                      </div>
                   </div>
                   <div className="space-y-3">
                     <div className="flex gap-[12px] items-start">
                        <div className="text-accent text-[12px] font-bold pt-1">→</div>
                        <div className="text-[13px] text-muted flex-1 leading-relaxed font-light">
                          <strong className="text-white font-bold uppercase text-[10px] tracking-widest mr-2">Status:</strong> {r.last_move}
                        </div>
                     </div>
                     {r.trend_used && (
                       <div className="flex gap-[12px] items-start">
                          <div className="text-accent text-[12px] pt-1 italic font-bold">#</div>
                          <div className="text-[13px] text-muted flex-1 leading-relaxed font-light">
                            <strong className="text-white font-bold uppercase text-[10px] tracking-widest mr-2">Trend ativa:</strong> {r.trend_used}
                          </div>
                       </div>
                     )}
                   </div>
                </Card>
              ))}
            </div>
          )}
          
          {!loading && data.length === 0 && (
            <div className="py-[120px] text-center opacity-30">
               <div className="font-syne font-extrabold text-[40px] text-white/5 uppercase mb-2">Monitoramento Offline</div>
               <div className="font-mono text-[10px] text-muted tracking-[2px] uppercase">Selecione concorrentes para iniciar rastreio cultural</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Calendar Panel ---

const CalendarPanel = ({ onError }: { onError: (e: any) => void }) => {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState<any[]>(defaultEvents());
  const [loading, setLoading] = useState(false);

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); };

  const enrichCalendar = async () => {
    setLoading(true);
    try {
      const system = `Especialista em calendário cultural brasileiro de elite. Pesquise eventos reais, feriados, efemérides e janelas de oportunidade. Não use CAIXA ALTA excessiva.`;
      const prompt = `Pesquise na web eventos culturais, lançamentos de cinema/música e datas relevantes para marcas brasileiras nos próximos 90 dias em fontes como G1, Propmark, UOL, Meio & Mensagem.`;
      const res = await generateJSON(system, prompt, {
        type: Type.OBJECT,
        properties: {
          events: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                name: { type: Type.STRING },
                desc: { type: Type.STRING },
                opp: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['p', 'l', 'c'] },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      });
      if (res.events) {
        setEvents([...events, ...res.events.filter((e: any) => !events.find(ex => ex.date === e.date && ex.name === e.name))]);
      }
    } catch (e) {
      console.error(e);
      onError(e);
    } finally {
      setLoading(false);
    }
  };

  const monthDays = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = Array.from({ length: 42 }).map((_, i) => {
    const day = i - firstDay + 1;
    if (day <= 0 || day > monthDays) return null;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { day, dateStr, events: events.filter(e => e.date === dateStr) };
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-[48px_32px_32px] border-b border-border bg-bg shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:10px_10px]" />
        <div className="font-mono text-[9px] tracking-[4px] uppercase text-accent mb-[12px] flex items-center gap-[8px] font-black">
          <div className="w-[18px] h-[3px] bg-accent" />
          Cultural Roadmap
        </div>
        <h1 className="font-syne text-[clamp(42px,6vw,72px)] font-extrabold text-white tracking-[-3px] leading-[0.9] uppercase mb-[10px]">
          STRATEGIC<br />
          <span className="text-accent underline decoration-[6px] underline-offset-[10px]">ROADMAP</span>
        </h1>
        <p className="text-[14px] text-muted max-w-[480px] leading-relaxed font-light uppercase tracking-tight">
          Eventos, datas proprietárias e janelas de ativação dos próximos 90 dias.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-[22px_28px] bg-bg">
        <div className="max-w-[1100px]">
          <div className="flex justify-between items-end mb-[32px]">
            <div>
              <div className="font-mono text-[10px] text-accent tracking-[2px] mb-2 font-bold uppercase">{year}</div>
              <div className="font-syne text-[42px] font-extrabold text-white tracking-[-1px] uppercase leading-none">{months[month]}</div>
            </div>
            <div className="flex items-center gap-3">
               <div className="flex border border-border">
                 <button onClick={prevMonth} className="bg-transparent border-r border-border text-white w-[48px] h-[48px] flex items-center justify-center hover:bg-white/5 transition-all text-[20px]">←</button>
                 <button onClick={nextMonth} className="bg-transparent text-white w-[48px] h-[48px] flex items-center justify-center hover:bg-white/5 transition-all text-[20px]">→</button>
               </div>
               <Button variant="main" onClick={enrichCalendar} disabled={loading}>✦ Enriquecer Roadmap</Button>
            </div>
          </div>

          <div className="grid grid-cols-7 border border-border bg-border gap-[1px] mb-[48px] rounded-[2px] overflow-hidden">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="bg-card p-[12px_4px] font-mono text-[9px] tracking-[2px] uppercase text-muted text-center font-bold">{d}</div>
            ))}
            {days.map((d, i) => (
              <div key={i} className={`min-h-[100px] p-[12px] transition-all duration-300 relative group ${d ? 'bg-bg hover:bg-white/[0.02] cursor-pointer' : 'bg-card/30 opacity-40'}`}>
                {d && (
                  <>
                    <div className={`font-mono text-[14px] mb-[12px] ${d.events.length ? 'text-accent font-black' : 'text-muted/40'}`}>{d.day}</div>
                    <div className="flex flex-col gap-[4px]">
                      {d.events.map((e, j) => (
                        <div key={j} className={`h-[4px] w-full rounded-[1px] ${e.type === 'p' ? 'bg-accent' : e.type === 'l' ? 'bg-lime-400' : 'bg-blue-400'}`} title={e.name} />
                      ))}
                    </div>
                    {d.events.length > 0 && (
                      <div className="absolute top-2 right-2 w-[6px] h-[6px] bg-accent rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8">
             <div className="font-mono text-[10px] tracking-[4px] uppercase text-accent mb-[20px] flex items-center gap-[12px] font-black">
               <div className="w-[24px] h-[2px] bg-accent" />
               Current Opportunities
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
               {events.filter(e => { const d = new Date(e.date); return d.getMonth() === month && d.getFullYear() === year; }).map((e, i) => (
                 <Card 
                  key={i} 
                  expandable={true} 
                  className="p-0!"
                  extraContent={
                    <div className="space-y-4">
                      {e.opp && (
                        <div className="text-[13px] text-white p-[16px_22px] bg-accent/5 border-l-2 border-accent font-light leading-relaxed">
                          <strong className="text-accent font-bold uppercase text-[10px] tracking-widest block mb-2">Janela de Ativação:</strong>
                          {e.opp}
                        </div>
                      )}
                      <div className="flex gap-[8px] flex-wrap">
                         {e.tags?.map((t: string, j: number) => (
                           <span key={j} className="text-[9px] px-[10px] py-[4px] bg-white/5 border border-border text-white font-bold uppercase tracking-widest">{t}</span>
                         ))}
                      </div>
                    </div>
                  }
                 >
                    <div className="flex justify-between items-start mb-[10px]">
                      <div className="font-syne text-[18px] font-extrabold text-white tracking-tight uppercase leading-none">{e.name}</div>
                      <div className="font-mono text-[9px] text-accent font-bold border border-accent/30 px-2 py-1 uppercase">{new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</div>
                    </div>
                    <div className="text-[13px] text-muted leading-relaxed font-light">{e.desc}</div>
                 </Card>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Report Panel ---

const ReportPanel = ({ config, onError }: { config: BrandConfig, onError: (e: any) => void }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [teaser, setTeaser] = useState('');
  const [activeTab, setActiveTab] = useState<'teaser' | 'report'>('teaser');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const today = new Date().toLocaleDateString('pt-BR');
      const system = `Analista cultural sênior da Kultur3. Retorne inteligência de elite. Escreva os textos em formato misto (não apenas caixa alta).`;
      const prompt = `Gere um report cultural completo para hoje (${today}). Foco: cultura pop, tendências digitais e comportamento no Brasil. Busque em: Meio & Mensagem, B9, Propmark, AdNews, G1, UOL. MARCA ATIVA: ${config.brand}. Segmento: ${config.seg}.`;
      
      const res = await generateJSON(system, prompt, SCHEMAS.REPORT);
      setData(res);
      
      const teaserPrompt = `Crie um teaser impactante e "vibration" para WhatsApp com base neste report cultural brasileiro: ${JSON.stringify(res).slice(0, 1000)}. Use emojis com moderação, seja direto e provocativo.`;
      const teaserRes = await generateContent("Copywriter sênior especializado em canais de broadcast.", teaserPrompt);
      setTeaser(teaserRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-[48px_32px_32px] border-b border-border bg-bg shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:10px_10px]" />
        <div className="font-mono text-[9px] tracking-[4px] uppercase text-accent mb-[12px] flex items-center gap-[8px] font-black">
          <div className="w-[18px] h-[3px] bg-accent" />
          Neural Dispatch
        </div>
        <h1 className="font-syne text-[clamp(42px,6vw,72px)] font-extrabold text-white tracking-[-3px] leading-[0.9] uppercase mb-[10px]">
          CULTURAL<br />
          <span className="text-accent underline decoration-[6px] underline-offset-[10px]">DISPATCH</span>
        </h1>
        <p className="text-[14px] text-muted max-w-[480px] leading-relaxed font-light uppercase tracking-tight">
          Relatórios executivos e teasers de impacto baseados em sinais captados nas últimas 24h.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-[22px_28px] bg-bg">
        <div className="max-w-[1000px]">
          <div className="bg-card border border-border p-[14px] mb-[32px] flex gap-[12px] items-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-accent/20" />
            <div className="flex-1 px-4 py-2 font-syne text-[13px] text-muted uppercase tracking-wider italic">
              Preparado para gerar o despacho cultural de hoje para {config.brand}...
            </div>
            <Button variant="main" onClick={handleGenerate} disabled={loading}>✦ Gerar Despacho</Button>
          </div>

           {loading && (
             <Card loading={true} statusText="Mapeando trends e criando report estratégico..." />
           )}

           {data && !loading && (
            <div className="animate-[fade_0.4s_ease]">
              <div className="flex border-b border-border mb-8">
                <button 
                  onClick={() => setActiveTab('teaser')}
                  className={`px-8 py-4 font-mono text-[10px] uppercase tracking-[3px] transition-all relative ${activeTab === 'teaser' ? 'text-accent font-black' : 'text-muted hover:text-white'}`}
                >
                  Briefing Teaser
                  {activeTab === 'teaser' && <motion.div layoutId="dispatch-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />}
                </button>
                <button 
                  onClick={() => setActiveTab('report')}
                  className={`px-8 py-4 font-mono text-[10px] uppercase tracking-[3px] transition-all relative ${activeTab === 'report' ? 'text-accent font-black' : 'text-muted hover:text-white'}`}
                >
                  Full Report
                  {activeTab === 'report' && <motion.div layoutId="dispatch-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />}
                </button>
              </div>

                {activeTab === 'teaser' ? (
                  <Card title="Briefing Express (WhatsApp)">
                    <div className="bg-bg border border-border p-8 font-sans text-[14px] text-white whitespace-pre-wrap leading-relaxed selection:bg-accent selection:text-white">
                      {teaser}
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                       <Button onClick={() => navigator.clipboard.writeText(teaser)} className="text-[10px] px-6">Copiar para WhatsApp</Button>
                       <button className="bg-transparent border border-white/10 text-muted px-4 py-2 font-mono text-[9px] uppercase hover:text-white hover:border-accent transition-all" onClick={handleGenerate}>↺ Regenerar</button>
                    </div>
                  </Card>
                ) : (
                <div className="flex flex-col gap-10">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-card border border-border p-6 flex flex-col items-center justify-center text-center">
                         <div className="font-syne font-black text-[32px] text-white leading-none">{data.temperatura?.assuntos_total || 0}</div>
                         <div className="font-mono text-[9px] text-accent tracking-[2px] uppercase mt-2">Assuntos Mapeados</div>
                      </div>
                      <div className="bg-card border border-border p-6 flex flex-col items-center justify-center text-center">
                         <div className="font-syne font-black text-[32px] text-accent leading-none uppercase">{data.temperatura?.urgencia_geral}</div>
                         <div className="font-mono text-[9px] text-accent tracking-[2px] uppercase mt-2">Urgência Geral</div>
                      </div>
                      <div className="bg-card border border-border p-6 flex flex-col items-center justify-center text-center">
                         <div className="font-syne font-black text-[32px] text-white leading-none">{data.temperatura?.trends_total || 0}</div>
                         <div className="font-mono text-[9px] text-accent tracking-[2px] uppercase mt-2">Active Signals</div>
                      </div>
                   </div>

                   <Card title="Executive Insight">
                      <p className="text-[16px] text-white font-light leading-relaxed italic whitespace-pre-wrap">{data.temperatura?.resumo_executivo}</p>
                   </Card>

                   <div className="space-y-6">
                      <div className="font-mono text-[10px] text-accent font-black tracking-[4px] uppercase flex items-center gap-4">
                        <div className="w-12 h-[1px] bg-accent" />
                        Pautas Prioritárias
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.assuntos?.map((a: any, i: number) => (
                           <div key={i} className="bg-card border border-border p-8 relative group hover:border-accent/40 transition-all">
                              <div className="flex justify-between items-start mb-4">
                                 <h4 className="font-syne font-extrabold text-[18px] text-white uppercase tracking-tight">{a.titulo}</h4>
                                 <span className="font-mono text-[8px] bg-white text-bg px-2 py-1 font-bold">{a.urgencia}</span>
                              </div>
                              <p className="text-[13px] text-muted leading-relaxed font-light mb-6">{a.descricao}</p>
                              <div className="pt-4 border-t border-white/5">
                                 <div className="font-mono text-[9px] text-accent font-black uppercase tracking-[2px] mb-2 italic">Opportunity //</div>
                                 <p className="text-[13px] text-white font-medium italic">{a.oportunidade}</p>
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>
                </div>
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

// --- Analytics Panel ---

const AnalyticsPanel = ({ config, activations, setActivations, reports }: any) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-[48px_32px_32px] border-b border-border bg-bg shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:10px_10px]" />
        <div className="font-mono text-[9px] tracking-[4px] uppercase text-accent mb-[12px] flex items-center gap-[8px] font-black">
          <div className="w-[18px] h-[3px] bg-accent" />
          Neural Metrics
        </div>
        <h1 className="font-syne text-[clamp(42px,6vw,72px)] font-extrabold text-white tracking-[-3px] leading-[0.9] uppercase mb-[10px]">
          PULSE<br />
          <span className="text-accent underline decoration-[6px] underline-offset-[10px]">ANALYTICS</span>
        </h1>
        <p className="text-[14px] text-muted max-w-[480px] leading-relaxed font-light uppercase tracking-tight">
          Performance do motor de inteligência e ROI das ativações culturais.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-[22px_28px] bg-bg">
        <div className="max-w-[1000px]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-border border border-border mb-[32px] rounded-lg overflow-hidden">
             <div className="bg-card p-6">
                <div className="font-mono text-[8px] uppercase text-muted mb-2 tracking-[2px] font-bold">Reports Gerados</div>
                <div className="font-syne text-[32px] font-extrabold text-white">{reports.length}</div>
             </div>
             <div className="bg-card p-6">
                <div className="font-mono text-[8px] uppercase text-muted mb-2 tracking-[2px] font-bold">Ativações Ativas</div>
                <div className="font-syne text-[32px] font-extrabold text-white">{activations.length}</div>
             </div>
             <div className="bg-card p-6">
                <div className="font-mono text-[8px] uppercase text-muted mb-2 tracking-[2px] font-bold">Neural Score</div>
                <div className="font-syne text-[32px] font-extrabold text-accent">98.4</div>
             </div>
             <div className="bg-card p-6">
                <div className="font-mono text-[8px] uppercase text-muted mb-2 tracking-[2px] font-bold">System Status</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  <div className="font-mono text-[10px] font-black text-accent uppercase tracking-[1px]">Operational</div>
                </div>
             </div>
          </div>

          <Card title="Feed de Ativações Recentes">
             <div className="flex flex-col gap-[1px] bg-border">
                {activations.length === 0 ? (
                  <div className="text-center py-20 bg-bg text-muted font-mono text-[10px] uppercase tracking-[2.5px]">Nenhuma ativação via One-Pager registrada.</div>
                ) : (
                  activations.map((a: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-5 bg-bg group hover:bg-white/[0.02] transition-colors">
                       <div className="flex items-center gap-6">
                          <div className="w-[32px] h-[32px] border border-border flex items-center justify-center font-mono text-[10px] text-muted">0{i+1}</div>
                          <div>
                             <div className="font-syne text-[16px] font-extrabold text-white uppercase tracking-tight group-hover:text-accent transition-colors">{a.trend}</div>
                             <div className="font-mono text-[9px] text-muted font-bold mt-1 uppercase tracking-[1.5px]">{a.date} · {a.metric}</div>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="font-syne text-[22px] font-extrabold text-accent">+{a.roi || 0}%</div>
                          <div className="font-mono text-[8px] text-muted uppercase tracking-[1px] font-bold">ROI Estimado</div>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// --- Integrations / Preview / Site ---

const IntegrationsPanel = () => (
  <div className="p-8 text-center text-muted font-mono text-xs italic">Gerenciamento de conexões externas indisponível nesta versão demo.</div>
);
const PreviewPanel = () => (
   <div className="p-8 text-center text-muted font-mono text-xs italic">Visualização externa indisponível nesta versão demo.</div>
);
const SitePanel = ({ config }: any) => (
   <div className="p-8 text-center text-muted font-mono text-xs italic">FUSE Site Builder em manutenção.</div>
);

// --- Home Panel ---

const HomePanel = ({ config, setActivePanel, onError }: { config: BrandConfig, setActivePanel: (p: PanelType) => void, onError: (e: any) => void }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DailyBriefing | null>(null);

  const fetchBriefing = async () => {
    setLoading(true);
    try {
      const today = new Date().toLocaleDateString('pt-BR');
      const system = `Você é o analista matinal da Kultur3. Pesquise na web o que está acontecendo HOJE no Brasil cultural e de marketing. Seja extremamente direto, conciso e estratégico. ESCREVA EM TEXTO NORMAL (NÃO USE APENAS CAIXA ALTA).`;
      const prompt = `Data: ${today}. Pesquise agora em meioemensagem.com.br, b9.com.br, g1.globo.com, x.com/explore, tiktok.com/trending, trends.google.com.br, propmark.com.br, adnews.com.br, updateordie.com e retorne um briefing diário. MARCA ATIVA: ${config.brand || 'Geral'}.`;
      
      const res = await generateJSON(system, prompt, SCHEMAS.HOME);
      setData(res);
    } catch (e) {
      console.error(e);
      onError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-[48px_32px_32px] border-b border-border bg-bg shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:10px_10px]" />
        <div className="flex justify-between items-end relative z-1">
          <div>
            <div className="font-mono text-[9px] tracking-[4px] uppercase text-accent mb-[12px] flex items-center gap-[8px] font-black">
              <div className="w-[18px] h-[3px] bg-accent" />
              Kultur3 / OS Intelligence
            </div>
            <h1 className="font-syne text-[clamp(42px,6vw,72px)] font-extrabold text-white tracking-[-3px] leading-[0.9] uppercase mb-[10px]">
              BRIEFING<br />
              <span className="text-accent underline decoration-[6px] underline-offset-[10px]">DO DIA</span>
            </h1>
            <p className="text-[14px] text-muted max-w-[480px] leading-relaxed font-light uppercase tracking-tight">
              Sincronizando inteligência de mercado em tempo real...
            </p>
          </div>
          <div className="flex flex-col items-end gap-[12px]">
            <div className="font-mono text-[9px] font-bold tracking-[2px] uppercase px-[14px] py-[6px] bg-accent text-white border border-pb shadow-[0_2px_15px_rgba(255,45,120,0.2)]">
              Prioridade: {data?.urgencia_geral || '...'}
            </div>
            <button 
              onClick={fetchBriefing}
              className="bg-transparent border-0 text-muted font-mono text-[9px] tracking-[2px] uppercase hover:text-white flex items-center gap-2 transition-all"
            >
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Reconectar
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-[22px_28px] bg-bg">
        <div className="max-w-[1100px]">
          {loading ? (
            <Card loading={true} statusText="Mapeando sinais culturais de hoje..." />
          ) : data ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
              <div className="md:col-span-3">
                <Card title="Resumo Estratégico">
                  <div className="text-[16px] text-white leading-relaxed font-light mb-4 whitespace-pre-wrap border-l-4 border-accent pl-6 py-2 bg-white/[0.01]">
                    {data.resumo_dia}
                  </div>
                </Card>
              </div>

              <div className="md:col-span-3">
                <Card title="Nota do Curador">
                   <div className="text-[14px] text-text leading-relaxed font-light italic pl-[14px] border-l-2 border-accent/30 py-1">
                    {data.nota_do_curador}
                  </div>
                </Card>
              </div>

              <Card title="Janelas Abertas">
                <div className="flex flex-col gap-[6px]">
                  {data?.assuntos?.map((a, i) => (
                    <div 
                      key={i} 
                      className="group p-[12px] cursor-pointer border border-border bg-card hover:border-accent/40 transition-all duration-150 relative overflow-hidden"
                      onClick={() => setActivePanel('insights')}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent/40 group-hover:bg-accent transition-colors" />
                      <div className="font-syne text-[11px] font-bold text-white uppercase tracking-tight mb-[2px]">{a.titulo}</div>
                      <div className="font-mono text-[7px] text-accent tracking-[1px] uppercase font-bold">{a.urgencia}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Top Tags do Dia">
                 <div className="flex flex-col gap-[10px]">
                   {data?.trends?.slice(0, 7).map((t, i) => (
                      <div key={i} className="flex items-center gap-[10px]">
                        <div className="font-syne text-[11px] font-bold text-muted flex-1 uppercase tracking-tight">{t.name}</div>
                        <div className="w-[100px] h-[3px] bg-border overflow-hidden shrink-0">
                          <div className="h-full bg-accent transition-all duration-700" style={{ width: `${t.score}%` }} />
                        </div>
                        <div className="font-mono text-[10px] text-accent font-bold w-[24px] text-right">{t.score}</div>
                      </div>
                   ))}
                 </div>
              </Card>

              <Card title="Insights por Segmento">
                <div className="flex flex-col gap-[10px]">
                  {data?.oportunidades && Object.entries(data.oportunidades).map(([k, v], i) => (
                    <div key={i} className="py-[6px] border-b border-border last:border-b-0">
                      <div className="font-mono text-[8px] text-accent tracking-[1.5px] uppercase font-bold mb-[4px]">{k.replace(/_/g, ' ')}</div>
                      <div className="text-[12px] text-muted leading-relaxed font-light">{v}</div>
                    </div>
                  ))}
                </div>
              </Card>
              
              <div className="md:col-span-3 mt-[10px]">
                <Button variant="main" onClick={() => setActivePanel('report')} className="w-full">Gerar Report Estratégico Completo →</Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-[60px]">
              <div className="text-muted font-mono text-[11px] mb-4">FALHA NA CONEXÃO COM O NODE CULTURAL</div>
              <Button onClick={fetchBriefing}>Tentar novamente</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Settings Panel ---

const SettingsPanel = ({ config, setConfig }: { config: BrandConfig, setConfig: (c: BrandConfig) => void }) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setConfig(localConfig);
    localStorage.setItem('k3_config', JSON.stringify(localConfig));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLocalConfig({ ...localConfig, [e.target.id.replace('cfg-', '')]: e.target.value });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-[48px_32px_32px] border-b border-border bg-bg shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:10px_10px]" />
        <div className="font-mono text-[9px] tracking-[4px] uppercase text-accent mb-[12px] flex items-center gap-[8px] font-black">
          <div className="w-[18px] h-[3px] bg-accent" />
          Configurações do Sistema
        </div>
        <h1 className="font-syne text-[clamp(42px,6vw,72px)] font-extrabold text-white tracking-[-3px] leading-[0.9] uppercase mb-[10px]">
          CONFIGURAR<br />
          <span className="text-accent underline decoration-[6px] underline-offset-[10px]">BRAND OS</span>
        </h1>
        <p className="text-[14px] text-muted max-w-[480px] leading-relaxed font-light uppercase tracking-tight">
          Ajuste o contexto do motor de inteligência para sua marca e mercado.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-[22px_28px] bg-bg">
        <div className="max-w-[800px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[9px] tracking-[2px] uppercase text-muted font-bold italic">Brand Identity</label>
              <input type="text" id="cfg-brand" value={localConfig.brand} onChange={handleChange} className="bg-card border border-border p-4 text-[14px] text-white outline-none focus:border-accent transition-all font-light" placeholder="Ex: Brahma" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[9px] tracking-[2px] uppercase text-muted font-bold italic">Market Segment</label>
              <input type="text" id="cfg-seg" value={localConfig.seg} onChange={handleChange} className="bg-card border border-border p-4 text-[14px] text-white outline-none focus:border-accent transition-all font-light" placeholder="Ex: Bebidas, Moda, Tech..." />
            </div>
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="font-mono text-[9px] tracking-[2px] uppercase text-muted font-bold italic">Editorial Tone</label>
              <input type="text" id="cfg-tone" value={localConfig.tone} onChange={handleChange} className="bg-card border border-border p-4 text-[14px] text-white outline-none focus:border-accent transition-all font-light" placeholder="Ex: jovial e irreverente, sério e confiável..." />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[9px] tracking-[2px] uppercase text-muted font-bold italic">Core Audience</label>
              <input type="text" id="cfg-aud" value={localConfig.aud} onChange={handleChange} className="bg-card border border-border p-4 text-[14px] text-white outline-none focus:border-accent transition-all font-light" placeholder="Ex: homens 25-35, classe B" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[9px] tracking-[2px] uppercase text-muted font-bold italic">Focus Region</label>
              <input type="text" id="cfg-reg" value={localConfig.reg} onChange={handleChange} className="bg-card border border-border p-4 text-[14px] text-white outline-none focus:border-accent transition-all font-light" placeholder="Ex: Brasil, São Paulo" />
            </div>
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="font-mono text-[9px] tracking-[2px] uppercase text-muted font-bold italic">Target Competitors</label>
              <textarea id="cfg-comp" value={localConfig.comp} onChange={handleChange} className="bg-card border border-border p-4 text-[14px] text-white outline-none focus:border-accent transition-all min-h-[80px] font-light" placeholder="Ex: Heineken, Skol, Corona" />
            </div>
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="font-mono text-[9px] tracking-[2px] uppercase text-muted font-bold italic">Active Keywords</label>
              <textarea id="cfg-kw" value={localConfig.kw} onChange={handleChange} className="bg-card border border-border p-4 text-[14px] text-white outline-none focus:border-accent transition-all min-h-[80px] font-light" placeholder="Ex: cerveja, boteco, futebol, samba" />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <Button variant="main" onClick={handleSave} className="px-10">Salvar Brand Context</Button>
            {saved && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-mono text-[10px] text-accent font-black tracking-[2px] uppercase"
              >
                ✓ OS UPDATED
              </motion.div>
            )}
          </div>
          
          <div className="mt-20 border-t border-white/5 pt-12">
            <Card title="System Connectivity">
               <div className="flex flex-col gap-4">
                 {[
                    { label: 'Neural Core v2.4', status: 'ALIVE' },
                    { label: 'Cognitive Engine', status: 'CONNECTED' },
                    { label: 'Real-time Web Scraper', status: 'SYNCHRONIZED' }
                 ].map((s, idx) => (
                   <div key={idx} className="flex items-center justify-between py-4 border-b border-white/5 last:border-b-0">
                      <span className="font-syne text-[14px] font-extrabold text-white uppercase tracking-tight italic">{s.label}</span>
                      <span className="font-mono text-[10px] text-accent font-black tracking-[3px] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-accent animate-pulse" />
                        {s.status}
                      </span>
                   </div>
                 ))}
               </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Chat Panel ---

const ChatPanel = ({ config, onError }: { config: BrandConfig, onError: (e: any) => void }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    { role: 'assistant', content: "Olá! Sou o Oráculo da Kultur3 — especialista em inteligência cultural estratégica.\n\nTenho acesso à web em tempo real e ao seu contexto de marca. Me pergunte sobre **trends, territórios de marca, creators, momentos culturais** ou valide uma ideia de campanha." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const system = `Você é a Oráculo Kultur3 — a interface neural de inteligência cultural.
Seu conhecimento é baseado em dados reais, sinais de redes sociais e pensamento lateral estratégico.
Seja provocativa, direta e visual (use Markdown). MARCA: ${config.brand}, SEGMENTO: ${config.seg}.`;
      
      const res = await generateContent(system, userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: res }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Houve um lag no sinal neural. Tente novamente." }]);
      onError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg">
      <div className="p-[48px_32px_32px] border-b border-border bg-bg shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:10px_10px]" />
        <div className="font-mono text-[9px] tracking-[4px] uppercase text-accent mb-[12px] flex items-center gap-[8px] font-black">
          <div className="w-[18px] h-[3px] bg-accent" />
          Neural Interface
        </div>
        <h1 className="font-syne text-[clamp(42px,6vw,72px)] font-extrabold text-white tracking-[-3px] leading-[0.9] uppercase mb-[10px]">
          CULTURAL<br />
          <span className="text-accent underline decoration-[6px] underline-offset-[10px]">ORACLE</span>
        </h1>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 flex flex-col gap-8 scroll-smooth" id="chat-scroller">
        <div className="max-w-[800px] mx-auto w-full flex flex-col gap-10">
          {messages.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-6 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-[40px] h-[40px] shrink-0 border border-border flex items-center justify-center font-mono text-[10px] font-bold ${m.role === 'assistant' ? 'bg-accent text-white' : 'bg-white/5 text-muted'}`}>
                {m.role === 'assistant' ? 'O' : 'U'}
              </div>
              <div className={`flex-1 p-6 border ${m.role === 'assistant' ? 'bg-card border-border italic' : 'bg-transparent border-white/10'} text-[14px] text-white leading-relaxed font-light prose prose-invert max-w-none`}>
                <Markdown>{m.content}</Markdown>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-6">
              <div className="w-[40px] h-[40px] bg-accent flex items-center justify-center animate-pulse" />
              <div className="p-6 bg-card border border-accent/20 text-[12px] text-accent font-mono uppercase tracking-[2px] font-bold">
                Consultando motor de inteligência cultural...
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 border-t border-border bg-bg/80 backdrop-blur-md">
        <div className="max-w-[800px] mx-auto relative group">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="w-full bg-card border border-border p-[20px_32px] pr-[100px] text-[15px] text-white outline-none focus:border-accent transition-all font-light"
            placeholder="Pergunte ao Oráculo: ideias, tendências, conceitos..."
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-accent font-bold uppercase tracking-[2px] hover:text-white transition-colors disabled:opacity-30"
          >
            Transmitir
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Main App ---

export default function App() {
  const [showSplash, setShowSplash] = useState(!sessionStorage.getItem('k3_splash'));
  const [activePanel, setActivePanel] = useState<PanelType>('home');
  const [reports, setReports] = useState<any[]>([]);
  const [activations, setActivations] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ message: string, type: 'error' | 'signal' } | null>(null);

  const handleError = (e: any) => {
    console.error(e);
    const msg = e.message || "Erro desconhecido.";
    setNotification({
      message: msg.includes("LIMITE_EXCEDIDO") ? "Cota da API excedida. Aguarde um momento e tente novamente." : msg,
      type: 'error'
    });
  };

  const handleSignal = (message: string) => {
    setNotification({ message, type: 'signal' });
  };

  const [config, setConfig] = useState<BrandConfig>(() => {
    const s = localStorage.getItem('k3_config');
    return s ? JSON.parse(s) : {
      brand: 'Geral',
      seg: 'Marketing & Cultura',
      tone: 'Estratégico, direto e data-driven',
      aud: 'Profissionais de marketing e criativos',
      reg: 'Brasil',
      comp: 'Referência de Mercado',
      kw: 'tendências, cultura, tecnologia'
    };
  });

  const enterApp = () => {
    setShowSplash(false);
    sessionStorage.setItem('k3_splash', 'true');
  };

  return (
    <div className="min-h-screen bg-bg text-text font-sans selection:bg-accent/40 selection:text-bg antialiased">
      <AnimatePresence>
        {showSplash && <Splash onEnter={enterApp} />}
      </AnimatePresence>

      <div className="flex flex-col h-screen relative z-1">
        {/* HEADER */}
        <header className="h-[52px] flex items-stretch border-b border-border bg-bg shrink-0 relative z-50">
          <div className="flex items-center gap-0 px-[20px] border-r border-border relative before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-accent">
            <div className="w-[26px] h-[26px] bg-accent flex items-center justify-center font-syne font-extrabold text-[13px] text-white logo-box">K</div>
            <div className="font-syne font-extrabold text-[15px] tracking-[5px] text-white pl-[8px]">KULTUR<span className="text-accent">3</span></div>
          </div>
          <div className="flex-1 flex items-center justify-center gap-[12px] px-[16px] hidden md:flex">
            <div className="font-mono text-[9px] text-muted tracking-[0.5px]">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}
            </div>
            <div className="w-[1px] h-[16px] bg-border" />
            <div className="flex items-center gap-[5px] font-mono text-[8px] tracking-[1.5px] uppercase py-[3px] px-[9px] border border-pb text-accent bg-pd">
              <div className="w-[5px] h-[5px] rounded-full bg-accent animate-[blink_1.2s_infinite] shrink-0" />
              AO VIVO
            </div>
            <div className="flex items-center gap-[5px] font-mono text-[8px] tracking-[1.5px] uppercase py-[3px] px-[9px] border border-border text-muted">
              Web Search
            </div>
            <div className="flex items-center gap-[5px] font-mono text-[8px] tracking-[1.5px] uppercase py-[3px] px-[9px] border border-border text-muted">
              Serper
            </div>
          </div>
          <div className="flex items-stretch border-l border-border">
            {config.brand && (
              <div className="flex flex-col justify-center px-[14px] border-r border-border hidden md:flex">
                <div className="font-mono text-[7px] text-muted tracking-[1.5px] uppercase mb-[1px]">Marca ativa</div>
                <div className="font-syne text-[12px] font-bold text-white">{config.brand}</div>
              </div>
            )}
            <button onClick={() => setActivePanel('home')} className="bg-transparent border-0 border-l border-border text-muted px-[14px] cursor-pointer hover:text-white hover:bg-border transition-all flex items-center" title="Home"><Home size={14} /></button>
            <button onClick={() => setActivePanel('chat')} className="bg-transparent border-0 border-l border-border text-muted px-[14px] cursor-pointer hover:text-white hover:bg-border transition-all flex items-center" title="Chat IA"><Cpu size={14} /></button>
            <button onClick={() => setActivePanel('settings')} className="bg-transparent border-0 border-l border-border text-muted px-[14px] cursor-pointer hover:text-white hover:bg-border transition-all flex items-center" title="Configurações"><Settings size={14} /></button>
          </div>
        </header>

        {/* MARQUEE BAND */}
        <div className="h-[26px] overflow-hidden bg-accent shrink-0 flex items-center">
          <div className="flex w-max animate-[mq_28s_linear_infinite]">
            {[1, 2].map(i => (
              <React.Fragment key={i}>
                {[
                  'Briefing do Dia', 'Insights Culturais', 'Radar de Trends', 'One-Page Criativo', 
                  'Monitor de Concorrentes', 'Calendário Cultural', 'Report para WhatsApp', 
                  'Analytics & ROI', 'Chat com IA Cultural'
                ].map((item, j) => (
                  <div key={j} className="flex items-center gap-[12px] px-[28px] font-mono text-[8px] tracking-[2.5px] uppercase text-black/65 whitespace-nowrap">
                    <div className="w-[3px] h-[3px] bg-black/45 rotate-45 shrink-0" />
                    {item}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <nav className="w-[216px] shrink-0 bg-bg border-r border-border flex flex-col overflow-hidden hidden md:flex">
            <div className="p-[14px_14px_12px] border-b border-border shrink-0 cursor-pointer" onClick={() => setActivePanel('settings')}>
              <div className="font-syne text-[11px] font-bold text-white tracking-[-0.2px] mb-[1px]">{config.brand || 'Configure sua marca'}</div>
              <div className="font-mono text-[8px] text-muted tracking-[0.5px]">{config.seg || '⚙ Clique para configurar'}</div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-[8px]">
              <NavLabel>Principal</NavLabel>
              <NavButton active={activePanel === 'home'} onClick={() => setActivePanel('home')} icon={<Home size={14}/>}>Briefing do Dia</NavButton>
              
              <NavLabel>Análise</NavLabel>
              <NavButton active={activePanel === 'insights'} onClick={() => setActivePanel('insights')} icon={<Lightbulb size={14}/>}>Insights Culturais</NavButton>
              <NavButton active={activePanel === 'trends'} onClick={() => setActivePanel('trends')} icon={<Radar size={14}/>}>Radar de Trends</NavButton>
              <NavButton active={activePanel === 'onepager'} onClick={() => setActivePanel('onepager')} icon={<Layers size={14}/>}>One-Page Criativo</NavButton>

              <NavLabel>Monitoramento</NavLabel>
              <NavButton active={activePanel === 'rivals'} onClick={() => setActivePanel('rivals')} icon={<Swords size={14}/>}>Concorrentes</NavButton>
              <NavButton active={activePanel === 'calendar'} onClick={() => setActivePanel('calendar')} icon={<Calendar size={14}/>}>Calendário Cultural</NavButton>

              <NavLabel>Criação</NavLabel>
              <NavButton active={activePanel === 'site'} onClick={() => setActivePanel('site')} icon={<LayoutTemplate size={14}/>}>Criador de Sites</NavButton>

              <NavLabel>Distribuição</NavLabel>
              <NavButton active={activePanel === 'report'} onClick={() => setActivePanel('report')} icon={<Share2 size={14}/>}>Report Diário</NavButton>
              <NavButton active={activePanel === 'preview'} onClick={() => setActivePanel('preview')} icon={<Eye size={14}/>}>Preview Público</NavButton>

              <NavLabel>Performance</NavLabel>
              <NavButton active={activePanel === 'analytics'} onClick={() => setActivePanel('analytics')} icon={<BarChart3 size={14}/>}>Analytics & ROI</NavButton>
              <NavButton active={activePanel === 'integrations'} onClick={() => setActivePanel('integrations')} icon={<LinkIcon size={14}/>}>Integrações</NavButton>

              <NavLabel>Assistente</NavLabel>
              <NavButton active={activePanel === 'chat'} onClick={() => setActivePanel('chat')} icon={<Cpu size={14}/>}>Chat com IA</NavButton>
            </div>

            <div className="shrink-0 border-t border-border bg-bg2">
              <div className="grid grid-cols-2 border-b border-border">
                <div className="p-[9px_12px] border-r border-border text-center">
                  <div className="font-syne text-[18px] font-extrabold text-white tracking-[-1px] leading-none mb-[1px]">{reports.length}</div>
                  <div className="font-mono text-[7px] text-muted tracking-[0.5px]">Reports</div>
                </div>
                <div className="p-[9px_12px] text-center">
                  <div className="font-syne text-[18px] font-extrabold text-white tracking-[-1px] leading-none mb-[1px]">{activations.length}</div>
                  <div className="font-mono text-[7px] text-muted tracking-[0.5px]">Ativações</div>
                </div>
              </div>
              <button 
                onClick={() => setActivePanel('settings')}
                className="flex items-center gap-[8px] p-[9px_14px] bg-transparent border-0 text-muted cursor-pointer font-sans text-[11px] font-medium w-full text-left transition-all hover:text-white hover:bg-border"
              >
                <Settings size={12} /> Configurações de marca
              </button>
            </div>
          </nav>

          {/* Content */}
          <main className="flex-1 relative overflow-hidden bg-bg">
            <AnimatePresence mode="wait">
               <motion.div 
                 key={activePanel}
                 initial={{ opacity: 0, x: 6 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -6 }}
                 transition={{ duration: 0.18, ease: 'easeOut' }}
                 className="h-full"
               >
                 {activePanel === 'home' && <HomePanel config={config} setActivePanel={setActivePanel} onError={handleError} />}
                 {activePanel === 'settings' && <SettingsPanel config={config} setConfig={setConfig} />}
                 {activePanel === 'chat' && <ChatPanel config={config} onError={handleError} />}
                 {activePanel === 'insights' && <InsightsPanel config={config} onError={handleError} />}
                 {activePanel === 'trends' && <TrendsPanel config={config} onError={handleError} onSignal={handleSignal} />}
                 {activePanel === 'onepager' && <OnePagerPanel config={config} onError={handleError} />}
                 {activePanel === 'rivals' && <RivalsPanel config={config} onError={handleError} />}
                 {activePanel === 'calendar' && <CalendarPanel onError={handleError} />}
                 {activePanel === 'report' && <ReportPanel config={config} onError={handleError} />}

                 {activePanel === 'analytics' && <AnalyticsPanel config={config} activations={activations} setActivations={setActivations} reports={reports} />}
                 {activePanel === 'integrations' && <IntegrationsPanel />}
                 {activePanel === 'preview' && <PreviewPanel />}
                 {activePanel === 'site' && <SitePanel config={config} />}
                 {/* Fallback */}
                 {!['home', 'settings', 'chat', 'insights', 'trends', 'onepager', 'rivals', 'calendar', 'report', 'analytics', 'integrations', 'preview', 'site'].includes(activePanel) && (
                   <div className="h-full flex items-center justify-center text-muted font-mono text-[10px]">
                     Módulo "{activePanel}" em desenvolvimento...
                   </div>
                 )}
               </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <AnimatePresence>
        {notification && (
          <Notification 
            message={notification.message} 
            type={notification.type}
            onClose={() => setNotification(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

