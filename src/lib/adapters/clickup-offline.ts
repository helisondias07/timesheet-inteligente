import { SCHEMA_IMPORT } from "../domain/constants";
import { validateImportPayload } from "../domain/validate-import";
import type { ImportResult, RawActivityInput } from "../domain/types";
import {
  assertOfflineQuery,
  OfflineOnlyError,
  type ActivitySourcePort,
  type OfflineQuery,
} from "./ports";

interface ClickUpTaskFixture {
  id?: unknown;
  name?: unknown;
  url?: unknown;
  date_updated?: unknown;
  description?: unknown;
  time_spent_hours?: unknown;
}

export interface ClickUpOfflineFixture {
  synthetic?: unknown;
  mode?: unknown;
  tasks?: ClickUpTaskFixture[];
}

function toIsoFromClickUp(value: unknown): unknown {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1e12 ? value : value * 1000;
    return new Date(millis).toISOString();
  }
  return value;
}

function mapClickUp(payload: ClickUpOfflineFixture): unknown {
  const activities: RawActivityInput[] = (payload.tasks ?? []).map((task) => ({
    nativeId: typeof task.id === "string" ? task.id : "",
    kind: "task",
    sourceKind: "clickup",
    sourceLabel: "clickup-offline-sintetico",
    title: task.name,
    description: task.description,
    occurredAt: toIsoFromClickUp(task.date_updated),
    originUrls: typeof task.url === "string" ? [task.url] : [],
    evidence:
      typeof task.id === "string"
        ? {
            kind: "task_id",
            value: task.id,
            summary: `Tarefa sintética ${task.id}`,
          }
        : undefined,
    registeredHours: task.time_spent_hours ?? null,
  }));

  return {
    schema: SCHEMA_IMPORT,
    synthetic: payload.synthetic === true,
    timezoneDefault: "America/Sao_Paulo",
    activities,
  };
}

export const clickupOfflinePort: ActivitySourcePort = {
  kind: "clickup",
  label: "ClickUp (porta offline, sem rede)",
  mode: "offline-fixture",
  isRealIntegration: false,
  networkCallsEnabled: false,
  loadFromFixture(payload: unknown, query: OfflineQuery): ImportResult {
    assertOfflineQuery(query);
    if (payload == null || typeof payload !== "object") {
      return validateImportPayload(payload, "offline-fixture");
    }
    return validateImportPayload(
      mapClickUp(payload as ClickUpOfflineFixture),
      "offline-fixture",
    );
  },
  fetchRemote(): never {
    throw new OfflineOnlyError("clickup");
  },
};
