export const Type = {
  OBJECT: 'OBJECT',
  ARRAY: 'ARRAY',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
} as const;

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

// Source fields are mandatory on factual records across every research view.
const referenceFields = {
  source_name: { type: Type.STRING }, source_url: { type: Type.STRING }, source_date: { type: Type.STRING }
};
for (const schema of Object.values(SCHEMAS)) {
  for (const key of ['assuntos', 'trends', 'rivals', 'sources']) {
    const collection = (schema.properties as any)[key];
    if (collection) {
      Object.assign(collection.items.properties, referenceFields);
      collection.items.required = ['source_name', 'source_url'];
    }
  }
}
