import type {
  ActivityKind,
  AdapterMode,
  ReviewStatus,
  SourceKind,
} from "./constants";

export type WarningCode =
  | "TIMESTAMP_AUSENTE"
  | "TIMESTAMP_INVALIDO"
  | "TIMESTAMP_SEM_FUSO"
  | "FALTA_EVIDENCIA"
  | "URL_INVALIDA"
  | "URL_PROTOCOLO_INSEGURO"
  | "HTML_REMOVIDO"
  | "PAYLOAD_INVALIDO"
  | "HORAS_AUSENTES"
  | "HORAS_NEGATIVAS"
  | "HORAS_NAN"
  | "HORAS_EXCESSIVAS_ITEM"
  | "HORAS_EXCESSIVAS_DIA"
  | "HORAS_CONFLITANTES"
  | "DADOS_INSUFICIENTES"
  | "SCHEMA_DESCONHECIDO"
  | "NAO_SINTETICO"
  | "DUPLICATA_MESCLADA"
  | "IDENTIDADE_AUSENTE"
  | "CAMPO_OBRIGATORIO"
  | "LIMITE_PAYLOAD"
  | "LIMITE_ITENS"
  | "LIMITE_TEXTO"
  | "LIMITE_URL"
  | "TEXTO_COM_MARCACAO";

export interface Warning {
  code: WarningCode;
  message: string;
  activityId?: string;
  field?: string;
}

export interface Evidence {
  kind: "commit_sha" | "pr_number" | "task_id" | "import_record";
  value: string;
  summary: string;
}

export interface TimestampRecord {
  original: string;
  isoUtc: string | null;
  timezoneExplicit: boolean;
  valid: boolean;
  warnings: WarningCode[];
}

export interface DurationRecord {
  registeredHours: number | null;
  estimatedHours: number | null;
}

export interface Provenance {
  sourceKind: SourceKind;
  sourceLabel: string;
  originUrls: string[];
  adapter: AdapterMode;
  synthetic: true;
  evidence: Evidence | null;
  importedNote: string;
}

export interface IdentifiedActivity {
  stableId: string;
  identityVersion: "v1";
  nativeId: string;
  kind: ActivityKind;
  title: string;
  description: string;
  timestamp: TimestampRecord;
  duration: DurationRecord;
  provenance: Provenance;
  warnings: Warning[];
  insufficientData: boolean;
  duplicateOf?: string;
  mergedFromCount: number;
}

export interface ProposalItem {
  id: string;
  activityIds: string[];
  title: string;
  description: string;
  estimatedHours: number | null;
  registeredHours: number | null;
  originUrls: string[];
  originalTimestamps: string[];
  sources: string[];
  warnings: Warning[];
  insufficientData: boolean;
  kinds: ActivityKind[];
}

export interface DailyProposal {
  dateLocal: string;
  timezone: "America/Sao_Paulo";
  items: ProposalItem[];
  reviewStatus: ReviewStatus;
  reviewNote: string;
  dayWarnings: Warning[];
}

export interface ImportIssue {
  path: string;
  message: string;
  code: WarningCode;
}

export interface ImportResult {
  ok: boolean;
  activities: IdentifiedActivity[];
  issues: ImportIssue[];
  warnings: Warning[];
  sources: string[];
  synthetic: true;
  timezone: "America/Sao_Paulo";
}

export interface TimesheetDraft {
  schema: "timesheet-inteligente.exportacao.v1";
  synthetic: true;
  mode: "synthetic-demo";
  timezone: "America/Sao_Paulo";
  generatedAt: string;
  review: {
    overallStatus: ReviewStatus;
    humanApprovalRequired: true;
    notes: string;
  };
  sources: string[];
  warnings: Warning[];
  days: DailyProposal[];
  activities: IdentifiedActivity[];
  rules: string[];
}

export interface RawActivityInput {
  nativeId?: unknown;
  kind?: unknown;
  sourceKind?: unknown;
  sourceLabel?: unknown;
  title?: unknown;
  description?: unknown;
  occurredAt?: unknown;
  originUrls?: unknown;
  evidence?: unknown;
  registeredHours?: unknown;
}

export interface RawImportPayload {
  schema?: unknown;
  synthetic?: unknown;
  timezoneDefault?: unknown;
  activities?: unknown;
}
