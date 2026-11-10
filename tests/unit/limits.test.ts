import { describe, expect, it } from "vitest";
import { MAX_ACTIVITIES, MAX_PAYLOAD_BYTES, MAX_TEXT_LENGTH } from "@/lib/domain/constants";
import { emptyWorkspace, ingestJsonText, ingestPayload } from "@/lib/domain/pipeline";
import { updateItemText } from "@/lib/domain/proposal";
import { validateImportPayload } from "@/lib/domain/validate-import";
import successFixture from "../../fixtures/sucesso-sintetico.json";

describe("limites explícitos", () => {
  it("recusa JSON acima do teto de bytes antes do parse de atividades", () => {
    const huge = "x".repeat(MAX_PAYLOAD_BYTES + 1);
    const ingested = ingestJsonText(emptyWorkspace(), huge, "json-import");
    expect(ingested.result.ok).toBe(false);
    expect(ingested.result.issues[0]?.code).toBe("LIMITE_PAYLOAD");
    expect(ingested.result.activities).toHaveLength(0);
  });

  it("recusa objeto já parseado cujo JSON serializado passa de 256 KiB", () => {
    const ingested = ingestPayload(
      emptyWorkspace(),
      {
        schema: "timesheet-inteligente.atividades.v1",
        synthetic: true,
        padding: "y".repeat(MAX_PAYLOAD_BYTES),
        activities: [],
      },
      "json-import",
    );
    expect(ingested.result.ok).toBe(false);
    expect(ingested.result.issues[0]?.code).toBe("LIMITE_PAYLOAD");
    expect(ingested.result.activities).toHaveLength(0);
  });

  it("recusa quantidade de itens acima do teto sem processar o lote", () => {
    const activities = Array.from({ length: MAX_ACTIVITIES + 1 }, (_, index) => ({
      nativeId: `n-${index}`,
      kind: "task",
      sourceKind: "json_import",
      title: "x",
      occurredAt: "2026-04-10T15:00:00-03:00",
      evidence: { kind: "import_record", value: `n-${index}` },
    }));
    const result = validateImportPayload({
      schema: "timesheet-inteligente.atividades.v1",
      synthetic: true,
      activities,
    });
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe("LIMITE_ITENS");
    expect(result.activities).toHaveLength(0);
  });

  it("recusa título longo na importação e não aplica na edição", () => {
    const long = "t".repeat(MAX_TEXT_LENGTH + 1);
    const result = validateImportPayload({
      schema: "timesheet-inteligente.atividades.v1",
      synthetic: true,
      activities: [
        {
          nativeId: "limite-1",
          kind: "task",
          sourceKind: "json_import",
          title: long,
          occurredAt: "2026-04-10T15:00:00-03:00",
          evidence: { kind: "import_record", value: "limite-1" },
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "LIMITE_TEXTO")).toBe(true);

    const ingested = ingestPayload(emptyWorkspace(), successFixture, "fixture-loader");
    const day = ingested.state.days[0]!;
    const item = day.items[0]!;
    const previous = item.title;
    const edited = updateItemText(ingested.state.days, day.dateLocal, item.id, {
      title: long,
    });
    const next = edited
      .find((entry) => entry.dateLocal === day.dateLocal)
      ?.items.find((entry) => entry.id === item.id);
    expect(next?.title).toBe(previous);
    expect(next?.warnings.some((warning) => warning.code === "LIMITE_TEXTO")).toBe(true);
  });
});
