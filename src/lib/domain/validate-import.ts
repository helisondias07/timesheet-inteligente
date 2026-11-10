import {
  ACTIVITY_KINDS,
  APP_TIMEZONE,
  SCHEMA_IMPORT,
  SOURCE_KINDS,
  type ActivityKind,
  type SourceKind,
} from "./constants";
import { parseHours } from "./duration";
import { buildStableId } from "./identity";
import { sanitizePlainText, sanitizeUrlList } from "./sanitize";
import { parseTimestamp } from "./timezone";
import type {
  Evidence,
  IdentifiedActivity,
  ImportIssue,
  ImportResult,
  Provenance,
  RawActivityInput,
  RawImportPayload,
  Warning,
} from "./types";
import { warning } from "./warnings";

function isActivityKind(value: unknown): value is ActivityKind {
  return typeof value === "string" && ACTIVITY_KINDS.includes(value as ActivityKind);
}

function isSourceKind(value: unknown): value is SourceKind {
  return typeof value === "string" && SOURCE_KINDS.includes(value as SourceKind);
}

function parseEvidence(raw: unknown): { evidence: Evidence | null; warnings: Warning[] } {
  if (raw == null) {
    return { evidence: null, warnings: [warning("FALTA_EVIDENCIA")] };
  }
  if (typeof raw !== "object") {
    return { evidence: null, warnings: [warning("FALTA_EVIDENCIA")] };
  }
  const record = raw as { kind?: unknown; value?: unknown; summary?: unknown };
  const kind = record.kind;
  const value = typeof record.value === "string" ? record.value.trim() : "";
  const allowed = ["commit_sha", "pr_number", "task_id", "import_record"] as const;
  if (!allowed.includes(kind as (typeof allowed)[number]) || !value) {
    return { evidence: null, warnings: [warning("FALTA_EVIDENCIA")] };
  }
  const summary =
    typeof record.summary === "string" && record.summary.trim()
      ? record.summary.trim()
      : `Evidência ${kind}: ${value}`;
  return {
    evidence: { kind: kind as Evidence["kind"], value, summary },
    warnings: [],
  };
}

export function parseActivity(
  raw: RawActivityInput,
  index: number,
  adapter: Provenance["adapter"],
): { activity?: IdentifiedActivity; issues: ImportIssue[] } {
  const issues: ImportIssue[] = [];
  const path = `activities[${index}]`;
  const warnings: Warning[] = [];

  if (!isActivityKind(raw.kind)) {
    issues.push({
      path: `${path}.kind`,
      message: "kind deve ser commit, pull_request ou task.",
      code: "PAYLOAD_INVALIDO",
    });
  }
  if (!isSourceKind(raw.sourceKind)) {
    issues.push({
      path: `${path}.sourceKind`,
      message: "sourceKind inválido.",
      code: "PAYLOAD_INVALIDO",
    });
  }
  const native =
    typeof raw.nativeId === "string" ? raw.nativeId.trim() : "";
  if (!native) {
    issues.push({
      path: `${path}.nativeId`,
      message: "nativeId é obrigatório para identidade estável.",
      code: "IDENTIDADE_AUSENTE",
    });
  }

  const title = sanitizePlainText(raw.title);
  const description = sanitizePlainText(raw.description ?? "");
  warnings.push(
    ...title.warnings.map((code) => warning(code, { field: "title" })),
    ...description.warnings.map((code) => warning(code, { field: "description" })),
  );
  if (!title.text) {
    issues.push({
      path: `${path}.title`,
      message: "title é obrigatório.",
      code: "CAMPO_OBRIGATORIO",
    });
  }

  if (issues.length > 0) return { issues };

  const kind = raw.kind as ActivityKind;
  const sourceKind = raw.sourceKind as SourceKind;
  const timestamp = parseTimestamp(raw.occurredAt);
  warnings.push(
    ...timestamp.warnings.map((code) => warning(code, { field: "occurredAt" })),
  );

  const urls = sanitizeUrlList(raw.originUrls);
  warnings.push(...urls.warnings);

  const evidence = parseEvidence(raw.evidence);
  warnings.push(...evidence.warnings);

  const hours = parseHours(raw.registeredHours, "registeredHours");
  if (!hours.ok && hours.warning) warnings.push(hours.warning);

  const insufficientData =
    !timestamp.valid ||
    evidence.evidence == null ||
    warnings.some((item) =>
      [
        "TIMESTAMP_AUSENTE",
        "TIMESTAMP_INVALIDO",
        "TIMESTAMP_SEM_FUSO",
        "FALTA_EVIDENCIA",
      ].includes(item.code),
    );

  if (insufficientData) {
    warnings.push(warning("DADOS_INSUFICIENTES"));
  }

  const sourceLabel =
    typeof raw.sourceLabel === "string" && raw.sourceLabel.trim()
      ? raw.sourceLabel.trim()
      : sourceKind;

  const activity: IdentifiedActivity = {
    stableId: buildStableId({ sourceKind, kind, nativeId: native }),
    identityVersion: "v1",
    nativeId: native,
    kind,
    title: title.text,
    description: description.text,
    timestamp,
    duration: {
      registeredHours: hours.ok ? hours.hours : null,
      estimatedHours: null,
    },
    provenance: {
      sourceKind,
      sourceLabel,
      originUrls: urls.urls,
      adapter,
      synthetic: true,
      evidence: evidence.evidence,
      importedNote:
        "Registro sintético de demonstração. Nenhuma conta real foi consultada.",
    },
    warnings,
    insufficientData,
    mergedFromCount: 1,
  };

  return { activity, issues: [] };
}

export function validateImportPayload(
  raw: unknown,
  adapter: Provenance["adapter"] = "json-import",
): ImportResult {
  const issues: ImportIssue[] = [];
  const warnings: Warning[] = [];

  if (raw == null || typeof raw !== "object") {
    return {
      ok: false,
      activities: [],
      issues: [
        {
          path: "$",
          message: "O payload precisa ser um objeto JSON.",
          code: "PAYLOAD_INVALIDO",
        },
      ],
      warnings: [warning("PAYLOAD_INVALIDO")],
      sources: [],
      synthetic: true,
      timezone: APP_TIMEZONE,
    };
  }

  const payload = raw as RawImportPayload;
  if (payload.schema !== SCHEMA_IMPORT) {
    issues.push({
      path: "schema",
      message: `schema deve ser ${SCHEMA_IMPORT}.`,
      code: "SCHEMA_DESCONHECIDO",
    });
  }
  if (payload.synthetic !== true) {
    issues.push({
      path: "synthetic",
      message: "Este MVP só aceita payloads explicitamente sintéticos (synthetic: true).",
      code: "NAO_SINTETICO",
    });
  }
  if (
    payload.timezoneDefault != null &&
    payload.timezoneDefault !== APP_TIMEZONE
  ) {
    warnings.push(
      warning("TIMESTAMP_SEM_FUSO", {
        message:
          "timezoneDefault diferente de America/Sao_Paulo foi ignorado; o agrupamento usa America/Sao_Paulo.",
        field: "timezoneDefault",
      }),
    );
  }
  if (!Array.isArray(payload.activities)) {
    issues.push({
      path: "activities",
      message: "activities precisa ser uma lista.",
      code: "PAYLOAD_INVALIDO",
    });
  }

  if (issues.length > 0 || !Array.isArray(payload.activities)) {
    return {
      ok: false,
      activities: [],
      issues,
      warnings: [...warnings, warning("PAYLOAD_INVALIDO")],
      sources: [],
      synthetic: true,
      timezone: APP_TIMEZONE,
    };
  }

  const activities: IdentifiedActivity[] = [];
  payload.activities.forEach((item, index) => {
    if (item == null || typeof item !== "object") {
      issues.push({
        path: `activities[${index}]`,
        message: "Atividade inválida.",
        code: "PAYLOAD_INVALIDO",
      });
      return;
    }
    const parsed = parseActivity(item as RawActivityInput, index, adapter);
    issues.push(...parsed.issues);
    if (parsed.activity) activities.push(parsed.activity);
  });

  const sources = [
    ...new Set(activities.map((activity) => activity.provenance.sourceLabel)),
  ];

  return {
    ok: issues.length === 0,
    activities,
    issues,
    warnings: [
      ...warnings,
      ...activities.flatMap((activity) => activity.warnings),
    ],
    sources,
    synthetic: true,
    timezone: APP_TIMEZONE,
  };
}
