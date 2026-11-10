import { APP_TIMEZONE } from "./constants";
import { reimportActivities } from "./dedupe";
import { groupBySaoPauloDay } from "./group-days";
import { buildDraft } from "./proposal";
import { validateImportPayload } from "./validate-import";
import type {
  DailyProposal,
  IdentifiedActivity,
  ImportResult,
  TimesheetDraft,
} from "./types";

export interface WorkspaceState {
  activities: IdentifiedActivity[];
  days: DailyProposal[];
  sources: string[];
  importLog: ImportResult[];
  lastImportOk: boolean;
}

export function emptyWorkspace(): WorkspaceState {
  return {
    activities: [],
    days: [],
    sources: [],
    importLog: [],
    lastImportOk: false,
  };
}

export function ingestPayload(
  state: WorkspaceState,
  raw: unknown,
  adapter: "json-import" | "fixture-loader" | "offline-fixture" = "json-import",
): { state: WorkspaceState; result: ImportResult; draft: TimesheetDraft } {
  const result = validateImportPayload(raw, adapter);
  if (!result.ok) {
    return {
      state: {
        ...state,
        importLog: [...state.importLog, result],
        lastImportOk: false,
      },
      result,
      draft: buildDraft(state.days, state.activities, state.sources),
    };
  }

  const activities = reimportActivities(state.activities, result.activities);
  const days = groupBySaoPauloDay(activities);
  const sources = [...new Set(activities.map((item) => item.provenance.sourceLabel))];
  const next: WorkspaceState = {
    activities,
    days,
    sources,
    importLog: [...state.importLog, result],
    lastImportOk: true,
  };
  return {
    state: next,
    result,
    draft: buildDraft(next.days, next.activities, next.sources),
  };
}

export function applyDays(
  state: WorkspaceState,
  days: DailyProposal[],
): { state: WorkspaceState; draft: TimesheetDraft } {
  const next = { ...state, days };
  return {
    state: next,
    draft: buildDraft(next.days, next.activities, next.sources),
  };
}

export function workspaceSummary(state: WorkspaceState) {
  return {
    timezone: APP_TIMEZONE,
    activityCount: state.activities.length,
    dayCount: state.days.length,
    synthetic: true as const,
    discardedOnReload: true,
  };
}
