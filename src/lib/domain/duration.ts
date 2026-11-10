import { MAX_HOURS_PER_DAY, MAX_HOURS_PER_ITEM } from "./constants";
import type { Warning } from "./types";

export type HoursParse =
  | { ok: true; hours: number | null }
  | { ok: false; hours: null; warning: Warning };

/**
 * Gramática inequívoca de horas (entrada humana ou JSON):
 * - vazio / só espaços / null → nulo (sem duração)
 * - inteiro: 0, 8, 12
 * - decimal com ponto OU vírgula: 1.5 e 1,5 são o mesmo valor (1,5 h)
 * - não há milhar: "1.500" é mil e quinhentos milésimos, não "mil e quinhentos"
 * - nunca deriva duração de timestamp ou evidência
 */
const DECIMAL_RE = /^-?\d+([.,]\d+)?$/;

export function normalizeHoursToken(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return "nan";
    return String(raw);
  }
  if (typeof raw !== "string") return "invalid";
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  return trimmed;
}

export function parseHours(raw: unknown, field: string): HoursParse {
  const token = normalizeHoursToken(raw);
  if (token === null) {
    return { ok: true, hours: null };
  }
  if (token === "nan" || token === "invalid" || !DECIMAL_RE.test(token)) {
    return {
      ok: false,
      hours: null,
      warning: {
        code: "HORAS_NAN",
        message: `${field} deve ser um número (ex.: 1,5 ou 1.5). Vazio permanece nulo.`,
        field,
      },
    };
  }

  const numeric = Number(token.replace(",", "."));
  if (!Number.isFinite(numeric)) {
    return {
      ok: false,
      hours: null,
      warning: {
        code: "HORAS_NAN",
        message: `${field} não é um número finito.`,
        field,
      },
    };
  }
  if (numeric < 0) {
    return {
      ok: false,
      hours: null,
      warning: {
        code: "HORAS_NEGATIVAS",
        message: `${field} não pode ser negativo.`,
        field,
      },
    };
  }
  if (numeric > MAX_HOURS_PER_ITEM) {
    return {
      ok: false,
      hours: null,
      warning: {
        code: "HORAS_EXCESSIVAS_ITEM",
        message: `${field} excede ${MAX_HOURS_PER_ITEM}h por item.`,
        field,
      },
    };
  }
  return { ok: true, hours: numeric };
}

export function validateEstimatedHours(
  hours: number | null,
  itemId: string,
): Warning[] {
  if (hours == null) {
    return [
      {
        code: "HORAS_AUSENTES",
        message: "Duração sugerida permanece vazia até entrada humana explícita.",
        activityId: itemId,
        field: "estimatedHours",
      },
    ];
  }
  const parsed = parseHours(hours, "estimatedHours");
  if (!parsed.ok && parsed.warning) {
    return [{ ...parsed.warning, activityId: itemId }];
  }
  return [];
}

export function validateDayHours(items: { estimatedHours: number | null }[]): Warning[] {
  const sum = items.reduce((total, item) => total + (item.estimatedHours ?? 0), 0);
  if (sum > MAX_HOURS_PER_DAY) {
    return [
      {
        code: "HORAS_EXCESSIVAS_DIA",
        message: `Soma de horas estimadas no dia (${sum}) excede ${MAX_HOURS_PER_DAY}h.`,
        field: "estimatedHours",
      },
    ];
  }
  return [];
}

export function conflictWarning(
  registeredHours: number | null,
  estimatedHours: number | null,
  itemId: string,
): Warning[] {
  if (
    registeredHours != null &&
    estimatedHours != null &&
    registeredHours !== estimatedHours
  ) {
    return [
      {
        code: "HORAS_CONFLITANTES",
        message:
          "Horas registradas na origem diferem da estimativa manual. Nenhuma é sobrescrita automaticamente.",
        activityId: itemId,
        field: "estimatedHours",
      },
    ];
  }
  return [];
}
