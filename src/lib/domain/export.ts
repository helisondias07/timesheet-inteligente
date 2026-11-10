import { toCsv } from "./sanitize";
import type { TimesheetDraft, Warning } from "./types";
import { validateDraftForExport } from "./proposal";

export interface ExportArtifacts {
  json: string;
  csv: string;
  warnings: Warning[];
}

function join(values: string[]): string {
  return values.join(" | ");
}

export function exportDraft(draft: TimesheetDraft): ExportArtifacts {
  const warnings = validateDraftForExport(draft);
  if (warnings.length > 0) {
    return { json: "", csv: "", warnings };
  }

  const json = JSON.stringify(draft, null, 2);
  const header = [
    "data_local",
    "fuso",
    "titulo",
    "descricao",
    "horas_estimadas_manuais",
    "horas_registradas_origem",
    "status_revisao",
    "modo_sintetico",
    "fontes",
    "avisos",
    "ids_estaveis",
    "urls_origem",
    "timestamps_originais",
    "dados_insuficientes",
  ];

  const rows = [header];
  for (const day of draft.days) {
    for (const item of day.items) {
      rows.push([
        day.dateLocal,
        day.timezone,
        item.title,
        item.description,
        item.estimatedHours == null ? "" : String(item.estimatedHours),
        item.registeredHours == null ? "" : String(item.registeredHours),
        day.reviewStatus,
        draft.mode,
        join(item.sources),
        join(item.warnings.map((warning) => warning.code)),
        join(item.activityIds),
        join(item.originUrls),
        join(item.originalTimestamps),
        item.insufficientData ? "sim" : "nao",
      ]);
    }
  }

  const csv = `\uFEFF${toCsv(rows)}\r\n`;
  return { json, csv, warnings: [] };
}

export function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
