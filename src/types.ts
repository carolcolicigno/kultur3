export type PanelType =
  | 'home'
  | 'insights'
  | 'trends'
  | 'onepager'
  | 'site'
  | 'report'
  | 'preview'
  | 'chat'
  | 'rivals'
  | 'calendar'
  | 'analytics'
  | 'integrations'
  | 'settings';

export interface BrandConfig {
  brand: string;
  seg: string;
  tone: string;
  aud: string;
  reg: string;
  comp: string;
  kw: string;
}

export interface Source {
  source_name: string;
  source_url: string;
  source_date: string;
  source_excerpt?: string;
}

export interface Trend {
  name: string;
  score: number;
  crescimento: string;
  plataforma: string;
  description?: string;
  opportunity?: string;
  badge?: string;
  source_name?: string;
  source_url?: string;
  source_date?: string;
}

export interface DailyBriefing {
  urgencia_geral: string;
  resumo_dia: string;
  nota_do_curador: string;
  assuntos: Array<{
    titulo: string;
    urgencia: 'HOJE' | '48H' | 'SEMANA' | 'RECORRENTE';
    oportunidade: string;
  }>;
  trends: Trend[];
  oportunidades: Record<string, string>;
}

export interface ReportItem {
  id: number;
  data: string;
  edicao: string | number;
  resumo: string;
  tema: string;
}

export interface Activation {
  trend: string;
  roi: number | null;
  metric: string;
  platform: string;
  brand: string;
  date: string;
  obs: string;
}

export interface FuseState {
  step: number;
  briefing: any | null;
  wireframe: string;
  copy: string;
  seo: string;
  html: string;
  qa: string;
}
