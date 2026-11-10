import { describe, expect, it } from "vitest";
import { ingestPayload, emptyWorkspace } from "@/lib/domain/pipeline";
import { reimportActivities } from "@/lib/domain/dedupe";
import successFixture from "../../fixtures/sucesso-sintetico.json";

describe("deduplicação e idempotência", () => {
  it("mescla duplicata verdadeira pela identidade estável e preserva URLs", () => {
    const first = ingestPayload(emptyWorkspace(), successFixture, "fixture-loader");
    const ids = first.state.activities.map((item) => item.stableId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);

    const duplicate = first.state.activities.find((item) =>
      item.nativeId === "c0ffee01abc",
    );
    expect(duplicate?.mergedFromCount).toBe(2);
    expect(duplicate?.provenance.originUrls).toContain(
      "https://example.org/espelho-sintetico/c0ffee01abc",
    );
    expect(duplicate?.warnings.some((warning) => warning.code === "DUPLICATA_MESCLADA")).toBe(
      true,
    );
  });

  it("reimportação do mesmo payload é idempotente", () => {
    const first = ingestPayload(emptyWorkspace(), successFixture, "fixture-loader");
    const second = ingestPayload(first.state, successFixture, "fixture-loader");
    expect(second.state.activities).toHaveLength(first.state.activities.length);
    expect(second.state.activities.map((item) => item.stableId)).toEqual(
      first.state.activities.map((item) => item.stableId),
    );
    const again = reimportActivities(first.state.activities, first.state.activities);
    expect(again).toHaveLength(first.state.activities.length);
  });

  it("títulos iguais com identidades distintas não colapsam", () => {
    const result = ingestPayload(emptyWorkspace(), successFixture, "fixture-loader");
    const sameTitle = result.state.activities.filter(
      (item) => item.title === "Ajuste de filtro de vitrine na loja demo",
    );
    expect(sameTitle.length).toBeGreaterThanOrEqual(2);
    const ids = new Set(sameTitle.map((item) => item.nativeId));
    expect(ids.has("c0ffee01abc")).toBe(true);
    expect(ids.has("c0ffee02def")).toBe(true);
  });
});
