import { describe, expect, it } from "vitest";
import { emptyWorkspace, ingestPayload, workspaceSummary } from "@/lib/domain/pipeline";
import successFixture from "../../fixtures/sucesso-sintetico.json";

describe("pipeline", () => {
  it("preserva proveniência e marca sessão como descartável", () => {
    const ingested = ingestPayload(emptyWorkspace(), successFixture, "fixture-loader");
    expect(
      ingested.state.activities.every((item) => item.provenance.synthetic === true),
    ).toBe(true);
    expect(
      ingested.state.activities.every((item) => item.provenance.originUrls.every(Boolean)),
    ).toBe(true);
    const summary = workspaceSummary(ingested.state);
    expect(summary.discardedOnReload).toBe(true);
    expect(summary.timezone).toBe("America/Sao_Paulo");
  });
});
