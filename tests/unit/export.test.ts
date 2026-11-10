import { describe, expect, it } from "vitest";
import { exportDraft } from "@/lib/domain/export";
import { updateDayReview, updateItemHours, updateItemText } from "@/lib/domain/proposal";
import { emptyWorkspace, ingestPayload } from "@/lib/domain/pipeline";
import { validateDraftForExport } from "@/lib/domain/proposal";
import successFixture from "../../fixtures/sucesso-sintetico.json";
import type { TimesheetDraft } from "@/lib/domain/types";

describe("exportação", () => {
  it("exporta revisão, proveniência, modo sintético e fuso", () => {
    const ingested = ingestPayload(emptyWorkspace(), successFixture, "fixture-loader");
    const day = ingested.state.days.find((item) => item.dateLocal !== "sem-data-local")!;
    const item = day.items[0]!;
    let days = updateItemText(ingested.state.days, day.dateLocal, item.id, {
      description: 'Linha com "aspas", acento café\ne quebra.',
    });
    days = updateItemHours(days, day.dateLocal, item.id, 1);
    days = updateDayReview(days, day.dateLocal, "aprovado", "Revisão humana sintética");
    const draft = {
      ...ingested.draft,
      days,
      review: {
        ...ingested.draft.review,
        overallStatus: "precisa_revisao" as const,
      },
    };
    const artifacts = exportDraft(draft);
    expect(artifacts.warnings).toHaveLength(0);
    const parsed = JSON.parse(artifacts.json) as TimesheetDraft;
    expect(parsed.synthetic).toBe(true);
    expect(parsed.mode).toBe("synthetic-demo");
    expect(parsed.timezone).toBe("America/Sao_Paulo");
    expect(parsed.review.humanApprovalRequired).toBe(true);
    expect(artifacts.csv).toContain("America/Sao_Paulo");
    expect(artifacts.csv).toContain("aprovado");
    expect(artifacts.csv).toContain("synthetic-demo");
    expect(artifacts.csv).toContain("café");
    expect(artifacts.csv).toContain('""aspas""');
    expect(artifacts.json).toContain(item.id);
    expect(artifacts.json).toContain("originUrls");
  });

  it("neutraliza fórmula CSV", () => {
    const ingested = ingestPayload(emptyWorkspace(), successFixture, "fixture-loader");
    const day = ingested.state.days[0]!;
    const item = day.items[0]!;
    const days = updateItemText(ingested.state.days, day.dateLocal, item.id, {
      title: "=CMD('calc')",
      description: "+1+1",
    });
    const artifacts = exportDraft({ ...ingested.draft, days });
    expect(artifacts.csv).toMatch(/'=CMD\('calc'\)/);
    expect(artifacts.csv).toContain("'+1+1");
  });

  it("recusa exportação com schema inválido", () => {
    const ingested = ingestPayload(emptyWorkspace(), successFixture, "fixture-loader");
    const invalid = {
      ...ingested.draft,
      schema: "nope",
    } as unknown as TimesheetDraft;
    expect(validateDraftForExport(invalid)[0]?.code).toBe("PAYLOAD_INVALIDO");
    expect(exportDraft(invalid).json).toBe("");
  });
});
