import { APP_TIMEZONE } from "./constants";
import { calendarDateInAppZone } from "./timezone";
import type { DailyProposal, IdentifiedActivity, ProposalItem } from "./types";
import { warning } from "./warnings";
import { validateDayHours, validateEstimatedHours } from "./duration";

const UNSORTED = "sem-data-local";

export function toProposalItem(activity: IdentifiedActivity): ProposalItem {
  const hourWarnings = validateEstimatedHours(null, activity.stableId);
  return {
    id: activity.stableId,
    activityIds: [activity.stableId],
    title: activity.title,
    description: activity.description,
    estimatedHours: null,
    registeredHours: activity.duration.registeredHours,
    originUrls: activity.provenance.originUrls,
    originalTimestamps: [activity.timestamp.original],
    sources: [activity.provenance.sourceLabel],
    warnings: [...activity.warnings, ...hourWarnings],
    insufficientData: activity.insufficientData,
    kinds: [activity.kind],
  };
}

export function groupBySaoPauloDay(
  activities: IdentifiedActivity[],
): DailyProposal[] {
  const buckets = new Map<string, IdentifiedActivity[]>();
  for (const activity of activities) {
    const date =
      activity.timestamp.valid && activity.timestamp.isoUtc
        ? calendarDateInAppZone(activity.timestamp.isoUtc) ?? UNSORTED
        : UNSORTED;
    const list = buckets.get(date) ?? [];
    list.push(activity);
    buckets.set(date, list);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateLocal, grouped]) => {
      const items = grouped
        .sort((a, b) => a.stableId.localeCompare(b.stableId))
        .map(toProposalItem);
      const dayWarnings = [
        ...validateDayHours(items),
        ...(dateLocal === UNSORTED
          ? [
              warning("DADOS_INSUFICIENTES", {
                message:
                  "Atividades sem timestamp válido/com fuso não entram em um dia civil de America/Sao_Paulo.",
              }),
            ]
          : []),
      ];
      return {
        dateLocal,
        timezone: APP_TIMEZONE,
        items,
        reviewStatus: "precisa_revisao",
        reviewNote: "",
        dayWarnings,
      };
    });
}
