import { describe, expect, it } from "vitest";
import { calendarDateInAppZone, parseTimestamp } from "@/lib/domain/timezone";
import { groupBySaoPauloDay } from "@/lib/domain/group-days";
import { ingestPayload, emptyWorkspace } from "@/lib/domain/pipeline";
import successFixture from "../../fixtures/sucesso-sintetico.json";

describe("fuso America/Sao_Paulo", () => {
  it("02:30Z cai no dia civil anterior em São Paulo", () => {
    const parsed = parseTimestamp("2026-04-10T02:30:00Z");
    expect(parsed.valid).toBe(true);
    expect(calendarDateInAppZone(parsed.isoUtc!)).toBe("2026-04-09");
  });

  it("03:15Z já é 10/04 em São Paulo", () => {
    const parsed = parseTimestamp("2026-04-10T04:15:00Z");
    expect(calendarDateInAppZone(parsed.isoUtc!)).toBe("2026-04-10");
  });

  it("preserva timestamp original após agrupamento", () => {
    const ingested = ingestPayload(emptyWorkspace(), successFixture, "fixture-loader");
    const days = groupBySaoPauloDay(ingested.state.activities);
    const ninth = days.find((day) => day.dateLocal === "2026-04-09");
    expect(ninth).toBeTruthy();
    expect(ninth?.items.some((item) => item.originalTimestamps.includes("2026-04-10T02:30:00Z"))).toBe(
      true,
    );
  });

  it("timestamp sem zona é inválido e não inventa data", () => {
    const parsed = parseTimestamp("2026-04-10T10:00:00");
    expect(parsed.valid).toBe(false);
    expect(parsed.warnings).toContain("TIMESTAMP_SEM_FUSO");
    expect(parsed.isoUtc).toBeNull();
  });

  it("timestamp inválido é sinalizado", () => {
    const parsed = parseTimestamp("não-é-data");
    expect(parsed.valid).toBe(false);
    expect(parsed.warnings).toContain("TIMESTAMP_INVALIDO");
  });
});
