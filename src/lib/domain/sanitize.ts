import {
  MAX_URLS_PER_ACTIVITY,
  MAX_URL_LENGTH,
} from "./constants";
import type { Warning, WarningCode } from "./types";

const UNSAFE_PROTOCOLS = new Set([
  "javascript:",
  "data:",
  "vbscript:",
  "file:",
  "blob:",
]);

export function stripHtml(input: string): { text: string; removed: boolean } {
  const withoutBlocks = input.replace(
    /<(script|style|iframe)\b[\s\S]*?<\/\1>/gi,
    "",
  );
  const text = withoutBlocks.replace(/<\/?[^>]+>/g, "");
  return { text, removed: text !== input };
}

export function sanitizePlainText(input: unknown): {
  text: string;
  warnings: WarningCode[];
} {
  if (typeof input !== "string") {
    return { text: "", warnings: ["CAMPO_OBRIGATORIO"] };
  }
  const { text, removed } = stripHtml(input);
  const warnings: WarningCode[] = removed ? ["HTML_REMOVIDO"] : [];
  return { text: text.replace(/\u0000/g, "").trim(), warnings };
}

export function sanitizeUrl(raw: string): {
  url: string | null;
  warning?: WarningCode;
} {
  const candidate = raw.trim();
  if (!candidate) return { url: null, warning: "URL_INVALIDA" };
  if (candidate.length > MAX_URL_LENGTH) {
    return { url: null, warning: "LIMITE_URL" };
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { url: null, warning: "URL_INVALIDA" };
  }

  const protocol = parsed.protocol.toLowerCase();
  if (UNSAFE_PROTOCOLS.has(protocol) || (protocol !== "http:" && protocol !== "https:")) {
    return { url: null, warning: "URL_PROTOCOLO_INSEGURO" };
  }

  return { url: parsed.toString() };
}

export function sanitizeUrlList(raw: unknown): {
  urls: string[];
  warnings: Warning[];
} {
  if (raw == null) return { urls: [], warnings: [] };
  if (!Array.isArray(raw)) {
    return {
      urls: [],
      warnings: [
        {
          code: "URL_INVALIDA",
          message: "originUrls precisa ser uma lista.",
          field: "originUrls",
        },
      ],
    };
  }

  const urls: string[] = [];
  const warnings: Warning[] = [];
  if (raw.length > MAX_URLS_PER_ACTIVITY) {
    warnings.push({
      code: "LIMITE_URL",
      message: `originUrls excede ${MAX_URLS_PER_ACTIVITY} itens; extras ignorados.`,
      field: "originUrls",
    });
  }
  for (const item of raw.slice(0, MAX_URLS_PER_ACTIVITY)) {
    if (typeof item !== "string") {
      warnings.push({
        code: "URL_INVALIDA",
        message: "URL ignorada porque não é texto.",
        field: "originUrls",
      });
      continue;
    }
    const result = sanitizeUrl(item);
    if (result.url) urls.push(result.url);
    else if (result.warning) {
      warnings.push({
        code: result.warning,
        message: `URL rejeitada: ${item.slice(0, 80)}`,
        field: "originUrls",
      });
    }
  }
  return { urls: [...new Set(urls)], warnings };
}

export function csvSafeCell(value: string): string {
  const needsQuote =
    /[",\n\r]/.test(value) || value.startsWith(" ") || value.endsWith(" ");
  let escaped = value.replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(escaped)) {
    escaped = `'${escaped}`;
  }
  return needsQuote || escaped.startsWith("'") ? `"${escaped}"` : escaped;
}

export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map((cell) => csvSafeCell(cell)).join(",")).join("\r\n");
}
