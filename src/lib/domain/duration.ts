import { MAX_HOURS_PER_DAY, MAX_HOURS_PER_ITEM } from "./constants";
import type { Warning } from "./types";

export type HoursParse =
  | { ok: true; hours: number | null }
  | { ok: false; hours: null; warning: Warning };

export function parseHours(raw: unknown, field: string): HoursParse {
  if (raw == null || raw === "") {
    return { ok: true, hours: null };
  }

  if (typeof raw === "string" && raw.trim() === "") {
    return { ok: true, hours: null };
  }

  const numeric = typeof raw === "number" ? raw : Number(raw);
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
