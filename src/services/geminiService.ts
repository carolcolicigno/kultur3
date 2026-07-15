import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SM = `REGRAS ABSOLUTAS DE PESQUISA — NUNCA VIOLE:

1. ZERO ALUCINAÇÕES: Se não encontrou na web, OMITA. Nunca invente dados, datas, URLs ou exemplos.
2. Pesquise ATIVAMENTE nestas fontes antes de responder:
MARKETING & CULTURA BR: meioemensagem.com.br, b9.com.br, adnews.com.br, propmark.com.br, clubedecriacao.com.br
TENDÊNCIAS DIGITAIS EM TEMPO REAL: tiktok.com/trending, x.com/explore, trends.google.com.br
NOTÍCIAS GERAIS: g1.globo.com, folha.uol.com.br, uol.com.br, estadao.com.br, r7.com
ENTRETENIMENTO & CULTURA POP: omelete.com.br, papelpop.com.br, jovempan.news, rollingstone.com.br
CREATOR ECONOMY: tubefilter.com, later.com/blog, sparktoro.com

3. Para cada afirmação factual inclua: source_name, source_url (URL real), source_date (DD/MM/AAAA), source_excerpt (trecho literal).
4. URLs REAIS apenas — não construa URLs fictícias.
5. Datas reais — se não encontrou, escreva "data não disponível".`;

export async function generateContent(system: string, prompt: string, history: any[] = [], maxOutputTokens: number = 2000) {
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        ...history,
        { role: "user", parts: [{ text: `${system}\n\n${prompt}` }] }
      ],
      config: {
        maxOutputTokens,
        tools: [{ googleSearch: {} }],
      }
    });
    return result.text || "";
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.status === 429 || error?.message?.includes("quota")) {
      throw new Error("LIMITE_EXCEDIDO: Você atingiu o limite de requisições por minuto da API. Aguarde 60 segundos e tente novamente.");
    }
    console.error("Gemini Error:", error);
    throw new Error(error.message || "Erro na comunicação com a IA.");
  }
}

export async function generateJSON(system: string, prompt: string, schema: any, statusCallback?: (msg: string) => void) {
  if (statusCallback) statusCallback("🔍 Pesquisando na web em tempo real...");
  
  const maxRetries = 2;
  let lastError: any = null;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      if (i > 0 && statusCallback) statusCallback(`🔄 Re-tentando (${i}/${maxRetries})...`);
      
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: "user", parts: [{ text: `${SM}\n\n${system}\n\n${prompt}\n\nRESPONDA APENAS EM JSON VÁLIDO CONFORME O SCHEMA. SEJA DIRETO E CONCISO. ESCAPE TODOS OS CARACTERES ESPECIAIS NECESSÁRIOS. CERTIFIQUE-SE DE QUE O JSON ESTEJA COMPLETO E BEM FORMADO.` }] }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          tools: [{ googleSearch: {} }],
          maxOutputTokens: 4096,
        }
      });
      
      let text = result.text || "{}";
      
      // Limpeza robusta contra blocos de código markdown que o modelo as vezes insere mesmo com MIME type setado
      if (text.includes("```json")) {
        text = text.split("```json")[1].split("```")[0].trim();
      } else if (text.includes("```")) {
        text = text.split("```")[1].split("```")[0].trim();
      }

      // Tentativa de corrigir JSON truncado simples (apenas se terminar em string aberta ou similar)
      // Nota: Correções complexas são arriscadas, melhor apenas tentar dar parse e se falhar, re-tentar a chamada.
      return JSON.parse(text);
    } catch (error: any) {
      lastError = error;
      if (error?.message?.includes("429") || error?.status === 429 || error?.message?.includes("quota")) {
        throw new Error("LIMITE_EXCEDIDO: Você atingiu o limite de requisições por minuto da API. Aguarde 60 segundos e tente novamente.");
      }
      console.warn(`Tentativa ${i + 1} falhou:`, error.message);
      // Se for erro de parse ou timeout, ele vai para a próxima iteração
    }
  }

  console.error("Gemini JSON Error após retentativas:", lastError);
  throw new Error(`A IA falhou em gerar um JSON válido após ${maxRetries + 1} tentativas. Motivo: ${lastError?.message || "Desconhecido"}`);
}

export const SCHEMAS = {
  HOME: {
    type: Type.OBJECT,
    properties: {
      urgencia_geral: { type: Type.STRING, enum: ["ALTA", "MÉDIA", "BAIXA"] },
      resumo_dia: { type: Type.STRING },
      nota_do_curador: { type: Type.STRING },
      assuntos: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            titulo: { type: Type.STRING },
            urgencia: { type: Type.STRING, enum: ["HOJE", "48H", "SEMANA", "RECORRENTE"] },
            oportunidade: { type: Type.STRING }
          }
        }
      },
      trends: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            score: { type: Type.NUMBER },
            crescimento: { type: Type.STRING },
            plataforma: { type: Type.STRING }
          }
        }
      },
      oportunidades: {
        type: Type.OBJECT,
        additionalProperties: { type: Type.STRING }
      }
    }
  },
  TRENDS: {
    type: Type.OBJECT,
    properties: {
      trends: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            badge: { type: Type.STRING, enum: ["HOT", "RISING", "STABLE"] },
            urgency: { type: Type.STRING, enum: ["CRITICAL", "NORMAL"] },
            alert_message: { type: Type.STRING },
            score: { type: Type.NUMBER },
            description: { type: Type.STRING },
            opportunity: { type: Type.STRING },
            platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
            source_name: { type: Type.STRING },
            source_url: { type: Type.STRING },
            source_date: { type: Type.STRING },
            source_excerpt: { type: Type.STRING }
          }
        }
      }
    }
  },
  ONE_PAGER: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      tagline: { type: Type.STRING },
      concept: { type: Type.STRING },
      why_now: { type: Type.STRING },
      mechanics: { type: Type.ARRAY, items: { type: Type.STRING } },
      platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
      tone: { type: Type.STRING },
      kpis: { type: Type.ARRAY, items: { type: Type.STRING } },
      creators: { type: Type.ARRAY, items: { type: Type.STRING } },
      next_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
      risk: { type: Type.STRING },
      sources: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            source_name: { type: Type.STRING },
            source_url: { type: Type.STRING },
            source_date: { type: Type.STRING },
            source_excerpt: { type: Type.STRING }
          }
        }
      }
    }
  },
  REPORT: {
    type: Type.OBJECT,
    properties: {
      edicao: { type: Type.STRING },
      data: { type: Type.STRING },
      regiao: { type: Type.STRING },
      tema_foco: { type: Type.STRING },
      temperatura: {
        type: Type.OBJECT,
        properties: {
          urgencia_geral: { type: Type.STRING, enum: ["ALTA", "MÉDIA", "BAIXA"] },
          resumo_executivo: { type: Type.STRING },
          assuntos_total: { type: Type.NUMBER },
          trends_total: { type: Type.NUMBER },
          oportunidades_total: { type: Type.NUMBER }
        }
      },
      nota_do_curador: { type: Type.STRING },
      assuntos: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            titulo: { type: Type.STRING },
            descricao: { type: Type.STRING },
            categoria: { type: Type.STRING },
            urgencia: { type: Type.STRING },
            volume: { type: Type.STRING },
            geo: { type: Type.STRING },
            oportunidade: { type: Type.STRING },
            source_name: { type: Type.STRING },
            source_url: { type: Type.STRING },
            source_date: { type: Type.STRING }
          }
        }
      },
      trends: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            plataforma: { type: Type.STRING },
            formato: { type: Type.STRING },
            score: { type: Type.NUMBER },
            crescimento: { type: Type.STRING },
            origem: { type: Type.STRING },
            descricao: { type: Type.STRING },
            oportunidade_marca: { type: Type.STRING },
            source_name: { type: Type.STRING },
            source_url: { type: Type.STRING },
            source_date: { type: Type.STRING },
            source_excerpt: { type: Type.STRING }
          }
        }
      },
      oportunidades_por_segmento: {
        type: Type.OBJECT,
        additionalProperties: { type: Type.STRING }
      },
      mapa_plataformas: {
        type: Type.OBJECT,
        additionalProperties: { type: Type.STRING }
      }
    }
  },
  RIVALS: {
    type: Type.OBJECT,
    properties: {
      rivals: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            last_move: { type: Type.STRING },
            platform: { type: Type.STRING },
            trend_used: { type: Type.STRING },
            score: { type: Type.NUMBER },
            alert: { type: Type.BOOLEAN },
            alert_msg: { type: Type.STRING },
            source_name: { type: Type.STRING },
            source_url: { type: Type.STRING },
            source_date: { type: Type.STRING },
            insight: { type: Type.STRING }
          }
        }
      }
    }
  }
};
