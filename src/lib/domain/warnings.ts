import type { Warning, WarningCode } from "./types";

export const WARNING_COPY: Record<WarningCode, string> = {
  TIMESTAMP_AUSENTE: "Timestamp ausente.",
  TIMESTAMP_INVALIDO: "Timestamp inválido.",
  TIMESTAMP_SEM_FUSO: "Timestamp sem fuso horário explícito.",
  FALTA_EVIDENCIA: "Evidência ausente; a atividade permanece sinalizada.",
  URL_INVALIDA: "URL de origem inválida e ignorada.",
  URL_PROTOCOLO_INSEGURO: "URL com protocolo inseguro foi rejeitada.",
  HTML_REMOVIDO: "Marcação HTML/JS foi removida na importação.",
  PAYLOAD_INVALIDO: "Payload de importação inválido.",
  HORAS_AUSENTES: "Horas não preenchidas (esperado neste MVP).",
  HORAS_NEGATIVAS: "Horas negativas são inválidas.",
  HORAS_NAN: "Horas não numéricas são inválidas.",
  HORAS_EXCESSIVAS_ITEM: "Horas do item excedem o limite explícito.",
  HORAS_EXCESSIVAS_DIA: "Soma de horas do dia excede o limite explícito.",
  HORAS_CONFLITANTES: "Estimativa manual diverge das horas registradas na origem.",
  DADOS_INSUFICIENTES: "Dados insuficientes para uma proposta confiável.",
  SCHEMA_DESCONHECIDO: "Schema de importação desconhecido.",
  NAO_SINTETICO: "Payload sem marcação sintética explícita.",
  DUPLICATA_MESCLADA: "Duplicata verdadeira mesclada pela identidade estável.",
  IDENTIDADE_AUSENTE: "Identidade nativa ausente.",
  CAMPO_OBRIGATORIO: "Campo obrigatório ausente.",
  LIMITE_PAYLOAD: "O JSON excede o limite de tamanho deste MVP.",
  LIMITE_ITENS: "Número de atividades excede o limite deste MVP.",
  LIMITE_TEXTO: "Texto excede o comprimento máximo permitido.",
  LIMITE_URL: "URL excede o comprimento máximo ou a quantidade por item.",
  TEXTO_COM_MARCACAO:
    "Há marcação no texto; é tratada como texto inerte, não como HTML executável.",
};

export function warning(code: WarningCode, extra?: Partial<Warning>): Warning {
  return {
    code,
    message: extra?.message ?? WARNING_COPY[code],
    activityId: extra?.activityId,
    field: extra?.field,
  };
}
