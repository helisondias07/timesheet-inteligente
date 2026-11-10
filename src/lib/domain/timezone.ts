import { APP_TIMEZONE } from "./constants";
import type { TimestampRecord, WarningCode } from "./types";

const OFFSET_RE = /(Z|[+-]\d{2}:\d{2}|[+-]\d{4})$/i;

export function hasExplicitTimezone(value: string): boolean {
  return OFFSET_RE.test(value.trim()) || /\[[A-Za-z_]+\/[A-Za-z_]+\]$/.test(value.trim());
}

export function parseTimestamp(raw: unknown): TimestampRecord {
  if (typeof raw !== "string" || !raw.trim()) {
    return {
      original: raw == null ? "" : String(raw),
      isoUtc: null,
      timezoneExplicit: false,
      valid: false,
      warnings: ["TIMESTAMP_AUSENTE"],
    };
  }

  const original = raw.trim();
  const timezoneExplicit = hasExplicitTimezone(original);
  const parsed = Date.parse(original);
  const warnings: WarningCode[] = [];

  if (Number.isNaN(parsed)) {
    return {
      original,
      isoUtc: null,
      timezoneExplicit,
      valid: false,
      warnings: ["TIMESTAMP_INVALIDO"],
    };
  }

  if (!timezoneExplicit) {
    warnings.push("TIMESTAMP_SEM_FUSO");
    return {
      original,
      isoUtc: null,
      timezoneExplicit: false,
      valid: false,
      warnings,
    };
  }

  return {
    original,
    isoUtc: new Date(parsed).toISOString(),
    timezoneExplicit: true,
    valid: true,
    warnings: [],
  };
}

export function calendarDateInAppZone(isoUtc: string): string | null {
  const date = new Date(isoUtc);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) return null;
  return `${year}-${month}-${day}`;
}

export function formatDateLabel(dateLocal: string): string {
  const [year, month, day] = dateLocal.split("-").map(Number);
  if (!year || !month || !day) return dateLocal;
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  }).format(new Date(Date.UTC(year, month - 1, day, 15)));
}
