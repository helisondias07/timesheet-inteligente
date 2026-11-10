import {
  MAX_HOURS_PER_DAY,
  MAX_HOURS_PER_ITEM,
  MAX_TEXT_LENGTH,
  REVIEW_STATUSES,
  type ReviewStatus,
} from "./constants";
import {
  conflictWarning,
  parseHours,
  validateDayHours,
  validateEstimatedHours,
} from "./duration";
import type { DailyProposal, IdentifiedActivity, TimesheetDraft, Warning } from "./types";
import { APP_TIMEZONE, SCHEMA_EXPORT, SYNTHETIC_MODE } from "./constants";

export const EXPLICIT_RULES = [
  "Não inventar trabalho.",
  "Não derivar duração a partir de commits ou timestamps.",
  "Não distribuir 8h automaticamente.",
  "Duração sugerida permanece nula até entrada humana explícita.",
  "Horas registradas na origem (se existirem) não são confundidas com estimativa manual.",
  "Deduplicação só pela identidade estável (fonte + tipo + id nativo).",
  "Títulos iguais com identidades diferentes permanecem atividades distintas.",
  "Agrupamento civil em America/Sao_Paulo, preservando timestamps originais.",
  "Aprovação humana é obrigatória antes de tratar o rascunho como revisado.",
  "Este MVP opera só com dados sintéticos de demonstração.",
];

export function updateItemHours(
  days: DailyProposal[],
  dateLocal: string,
  itemId: string,
  rawHours: unknown,
): DailyProposal[] {
  return days.map((day) => {
    if (day.dateLocal !== dateLocal) return day;
    const items = day.items.map((item) => {
      if (item.id !== itemId) return item;
      const parsed = parseHours(rawHours, "estimatedHours");
      const estimatedHours = parsed.ok ? parsed.hours : null;
      const extra: Warning[] = parsed.ok
        ? []
        : parsed.warning
          ? [parsed.warning]
          : [];
      const warnings = [
        ...item.warnings.filter(
          (warning) =>
            ![
              "HORAS_AUSENTES",
              "HORAS_NEGATIVAS",
              "HORAS_NAN",
              "HORAS_EXCESSIVAS_ITEM",
              "HORAS_CONFLITANTES",
            ].includes(warning.code),
        ),
        ...validateEstimatedHours(estimatedHours, item.id),
        ...conflictWarning(item.registeredHours, estimatedHours, item.id),
        ...extra,
      ];
      return { ...item, estimatedHours, warnings };
    });
    return {
      ...day,
      items,
      dayWarnings: validateDayHours(items),
      reviewStatus:
        day.reviewStatus === "aprovado" ? "precisa_revisao" : day.reviewStatus,
    };
  });
}

export function updateItemText(
  days: DailyProposal[],
  dateLocal: string,
  itemId: string,
  patch: { title?: string; description?: string },
): DailyProposal[] {
  return days.map((day) => {
    if (day.dateLocal !== dateLocal) return day;
    return {
      ...day,
      items: day.items.map((item) => {
        if (item.id !== itemId) return item;
        const next = { ...item };
        const extra: Warning[] = item.warnings.filter(
          (entry) => entry.code !== "LIMITE_TEXTO",
        );
        if (patch.title !== undefined) {
          if (patch.title.length > MAX_TEXT_LENGTH) {
            extra.push({
              code: "LIMITE_TEXTO",
              message: `Título excede ${MAX_TEXT_LENGTH} caracteres e não foi aplicado.`,
              activityId: item.id,
              field: "title",
            });
          } else {
            next.title = patch.title;
          }
        }
        if (patch.description !== undefined) {
          if (patch.description.length > MAX_TEXT_LENGTH) {
            extra.push({
              code: "LIMITE_TEXTO",
              message: `Descrição excede ${MAX_TEXT_LENGTH} caracteres e não foi aplicada.`,
              activityId: item.id,
              field: "description",
            });
          } else {
            next.description = patch.description;
          }
        }
        next.warnings = extra;
        return next;
      }),
      reviewStatus:
        day.reviewStatus === "aprovado" ? "precisa_revisao" : day.reviewStatus,
    };
  });
}

export function updateDayReview(
  days: DailyProposal[],
  dateLocal: string,
  reviewStatus: ReviewStatus,
  reviewNote: string,
): DailyProposal[] {
  if (!REVIEW_STATUSES.includes(reviewStatus)) return days;
  return days.map((day) =>
    day.dateLocal === dateLocal ? { ...day, reviewStatus, reviewNote } : day,
  );
}

export function overallReviewStatus(days: DailyProposal[]): ReviewStatus {
  if (days.length === 0) return "rascunho";
  if (days.every((day) => day.reviewStatus === "aprovado")) return "aprovado";
  if (days.some((day) => day.reviewStatus === "rejeitado")) return "rejeitado";
  if (days.some((day) => day.reviewStatus === "precisa_revisao")) {
    return "precisa_revisao";
  }
  return "rascunho";
}

export function buildDraft(
  days: DailyProposal[],
  activities: IdentifiedActivity[],
  sources: string[],
): TimesheetDraft {
  return {
    schema: SCHEMA_EXPORT,
    synthetic: true,
    mode: SYNTHETIC_MODE,
    timezone: APP_TIMEZONE,
    generatedAt: new Date().toISOString(),
    review: {
      overallStatus: overallReviewStatus(days),
      humanApprovalRequired: true,
      notes: "Rascunho de demonstração. Não é apontamento oficial.",
    },
    sources,
    warnings: [
      ...days.flatMap((day) => day.dayWarnings),
      ...days.flatMap((day) => day.items.flatMap((item) => item.warnings)),
    ],
    days,
    activities,
    rules: [
      ...EXPLICIT_RULES,
      `Limite explícito por item: ${MAX_HOURS_PER_ITEM}h.`,
      `Limite explícito por dia: ${MAX_HOURS_PER_DAY}h.`,
    ],
  };
}

export function validateDraftForExport(draft: TimesheetDraft): Warning[] {
  if (draft.schema !== SCHEMA_EXPORT) {
    return [
      {
        code: "PAYLOAD_INVALIDO",
        message: "Schema de exportação inválido.",
      },
    ];
  }
  if (draft.synthetic !== true) {
    return [
      {
        code: "NAO_SINTETICO",
        message: "Exportação recusada: modo não sintético.",
      },
    ];
  }
  return [];
}
