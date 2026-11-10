import type { IdentifiedActivity, Warning } from "./types";
import { warning } from "./warnings";

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function mergeDuplicate(
  current: IdentifiedActivity,
  incoming: IdentifiedActivity,
): IdentifiedActivity {
  const mergedWarnings: Warning[] = [
    ...current.warnings,
    ...incoming.warnings,
    warning("DUPLICATA_MESCLADA", {
      activityId: current.stableId,
      message: `Duplicata verdadeira mesclada pela identidade ${current.stableId}. Vínculos de origem foram preservados.`,
    }),
  ];

  return {
    ...current,
    title: current.title,
    description: current.description || incoming.description,
    timestamp: current.timestamp.valid ? current.timestamp : incoming.timestamp,
    duration: {
      registeredHours:
        current.duration.registeredHours ?? incoming.duration.registeredHours,
      estimatedHours: null,
    },
    provenance: {
      ...current.provenance,
      originUrls: unique([
        ...current.provenance.originUrls,
        ...incoming.provenance.originUrls,
      ]),
      evidence: current.provenance.evidence ?? incoming.provenance.evidence,
    },
    warnings: mergedWarnings,
    insufficientData: current.insufficientData && incoming.insufficientData,
    mergedFromCount: current.mergedFromCount + incoming.mergedFromCount,
  };
}

export function dedupeActivities(
  activities: IdentifiedActivity[],
): IdentifiedActivity[] {
  const byId = new Map<string, IdentifiedActivity>();
  for (const activity of activities) {
    const existing = byId.get(activity.stableId);
    if (!existing) {
      byId.set(activity.stableId, activity);
    } else {
      byId.set(activity.stableId, mergeDuplicate(existing, activity));
    }
  }
  return [...byId.values()].sort((a, b) =>
    a.stableId.localeCompare(b.stableId),
  );
}

export function reimportActivities(
  current: IdentifiedActivity[],
  incoming: IdentifiedActivity[],
): IdentifiedActivity[] {
  return dedupeActivities([...current, ...incoming]);
}
