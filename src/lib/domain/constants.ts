export const APP_TIMEZONE = "America/Sao_Paulo" as const;
export const SCHEMA_IMPORT = "timesheet-inteligente.atividades.v1" as const;
export const SCHEMA_EXPORT = "timesheet-inteligente.exportacao.v1" as const;
export const IDENTITY_VERSION = "v1" as const;
export const MAX_HOURS_PER_ITEM = 12;
export const MAX_HOURS_PER_DAY = 24;
export const MAX_PAYLOAD_BYTES = 256 * 1024;
export const MAX_ACTIVITIES = 500;
export const MAX_TEXT_LENGTH = 4000;
export const MAX_URL_LENGTH = 2048;
export const MAX_URLS_PER_ACTIVITY = 20;
export const MAX_NATIVE_ID_LENGTH = 256;
export const SYNTHETIC_MODE = "synthetic-demo" as const;
export const REVIEW_STATUSES = [
  "rascunho",
  "precisa_revisao",
  "aprovado",
  "rejeitado",
] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export type ActivityKind = "commit" | "pull_request" | "task";
export type SourceKind = "github" | "clickup" | "json_import" | "fixture";
export type AdapterMode = "offline-fixture" | "json-import" | "fixture-loader";

export const ACTIVITY_KINDS: ActivityKind[] = [
  "commit",
  "pull_request",
  "task",
];
export const SOURCE_KINDS: SourceKind[] = [
  "github",
  "clickup",
  "json_import",
  "fixture",
];
