import { describe, expect, it } from "vitest";
import { exportDraft } from "@/lib/domain/export";
import { emptyWorkspace, ingestPayload } from "@/lib/domain/pipeline";
import { updateItemText } from "@/lib/domain/proposal";
import { hrefIfSafeHttp, sanitizePlainText, sanitizeUrl } from "@/lib/domain/sanitize";
import { validateImportPayload } from "@/lib/domain/validate-import";
import successFixture from "../../fixtures/sucesso-sintetico.json";

describe("contrato texto inerte vs href", () => {
  it("preserva <img> e markdown javascript: como texto, sem apagar", () => {
    const img = sanitizePlainText('<img src=x onerror=alert(1)>foto');
    expect(img.text).toContain("<img");
    expect(img.warnings).toContain("TEXTO_COM_MARCACAO");
    const md = sanitizePlainText("[x](javascript:alert(1))");
    expect(md.text).toBe("[x](javascript:alert(1))");
  });

  it("URL origem perigosa não vira href; HTTPS legítimo sim", () => {
    expect(hrefIfSafeHttp("javascript:alert(1)")).toBeNull();
    expect(sanitizeUrl("javascript:alert(1)").warning).toBe("URL_PROTOCOLO_INSEGURO");
    expect(hrefIfSafeHttp("data:text/html,x")).toBeNull();
    const https = hrefIfSafeHttp("https://github.example.com/demo-sintetico/loja-demo");
    expect(https).toMatch(/^https:\/\//);
    const liveHttps = hrefIfSafeHttp(
      "https://github.com/example/demo-sintetico-nao-usado-aqui",
    );
    expect(liveHttps).toBe(
      "https://github.com/example/demo-sintetico-nao-usado-aqui",
    );
  });

  it("JSON de exportação pode ecoar javascript: como texto inerte", () => {
    const result = validateImportPayload({
      schema: "timesheet-inteligente.atividades.v1",
      synthetic: true,
      activities: [
        {
          nativeId: "md-js",
          kind: "task",
          sourceKind: "json_import",
          title: "Markdown sintético",
          description: "[x](javascript:alert(1))",
          occurredAt: "2026-04-11T16:00:00-03:00",
          originUrls: ["javascript:alert(1)", "https://example.net/ok"],
          evidence: { kind: "import_record", value: "md-js" },
        },
      ],
    });
    expect(result.ok).toBe(true);
    const activity = result.activities[0]!;
    expect(activity.description).toContain("javascript:");
    expect(activity.provenance.originUrls).toEqual(["https://example.net/ok"]);
    const envelope = {
      schema: "timesheet-inteligente.atividades.v1" as const,
      synthetic: true as const,
      activities: [
        {
          nativeId: activity.nativeId,
          kind: activity.kind,
          sourceKind: activity.provenance.sourceKind,
          title: activity.title,
          description: activity.description,
          occurredAt: activity.timestamp.original,
          originUrls: activity.provenance.originUrls,
          evidence: activity.provenance.evidence,
        },
      ],
    };
    const ws = ingestPayload(emptyWorkspace(), envelope, "json-import");
    expect(JSON.stringify(ws.draft)).toContain("javascript:");
    expect(ws.draft.days[0]?.items[0]?.originUrls.every((url) => url.startsWith("https:"))).toBe(
      true,
    );
  });

  it("aspas/entidades e fórmulas após edição vão para o CSV protegidas", () => {
    const ingested = ingestPayload(emptyWorkspace(), successFixture, "fixture-loader");
    const day = ingested.state.days[0]!;
    const item = day.items[0]!;
    const days = updateItemText(ingested.state.days, day.dateLocal, item.id, {
      title: "=CMD('calc')",
      description: 'café &amp; "aspas" <img src=x>',
    });
    const artifacts = exportDraft({ ...ingested.draft, days });
    expect(artifacts.csv).toMatch(/'=CMD\('calc'\)/);
    expect(artifacts.csv).toContain("café");
    expect(artifacts.csv).toContain("<img");
    expect(artifacts.json).toContain("<img");
  });
});
