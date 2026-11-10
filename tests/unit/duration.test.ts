import { describe, expect, it } from "vitest";
import { parseHours } from "@/lib/domain/duration";
import {
  buildDraft,
  updateItemHours,
} from "@/lib/domain/proposal";
import { emptyWorkspace, ingestPayload } from "@/lib/domain/pipeline";
import successFixture from "../../fixtures/sucesso-sintetico.json";

describe("horas manuais", () => {
  it("permanece nula até entrada humana", () => {
    const ingested = ingestPayload(emptyWorkspace(), successFixture, "fixture-loader");
    expect(
      ingested.state.activities.every((item) => item.duration.estimatedHours === null),
    ).toBe(true);
    expect(
      ingested.state.days.every((day) =>
        day.items.every((item) => item.estimatedHours === null),
      ),
    ).toBe(true);
  });

  it("rejeita negativas, NaN e excesso por item", () => {
    expect(parseHours(-1, "estimatedHours").ok).toBe(false);
    expect(parseHours(Number.NaN, "estimatedHours").ok).toBe(false);
    expect(parseHours(13, "estimatedHours").ok).toBe(false);
    expect(parseHours(2, "estimatedHours").ok).toBe(true);
  });

  it("sinaliza conflito entre registrado e estimado e excesso no dia", () => {
    const ingested = ingestPayload(emptyWorkspace(), successFixture, "fixture-loader");
    const day = ingested.state.days.find((item) =>
      item.items.some((entry) => entry.registeredHours === 1.5),
    );
    expect(day).toBeTruthy();
    const item = day!.items.find((entry) => entry.registeredHours === 1.5)!;
    const withConflict = updateItemHours(ingested.state.days, day!.dateLocal, item.id, 3);
    const updated = withConflict.find((entry) => entry.dateLocal === day!.dateLocal);
    expect(
      updated?.items
        .find((entry) => entry.id === item.id)
        ?.warnings.some((warning) => warning.code === "HORAS_CONFLITANTES"),
    ).toBe(true);

    const crowded = ingested.state.days.reduce((best, current) =>
      current.items.length > best.items.length ? current : best,
    );
    let days = ingested.state.days;
    for (const entry of crowded.items) {
      days = updateItemHours(days, crowded.dateLocal, entry.id, 12);
    }
    expect(
      days
        .find((day) => day.dateLocal === crowded.dateLocal)
        ?.dayWarnings.some((warning) => warning.code === "HORAS_EXCESSIVAS_DIA"),
    ).toBe(true);
  });

  it("distingue horas registradas das estimadas no rascunho", () => {
    const ingested = ingestPayload(emptyWorkspace(), successFixture, "fixture-loader");
    const task = ingested.state.activities.find((item) => item.nativeId === "TASK-SIN-1001");
    expect(task?.duration.registeredHours).toBe(1.5);
    expect(task?.duration.estimatedHours).toBeNull();
    const draft = buildDraft(
      ingested.state.days,
      ingested.state.activities,
      ingested.state.sources,
    );
    expect(draft.synthetic).toBe(true);
  });
});
