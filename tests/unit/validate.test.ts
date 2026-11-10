import { describe, expect, it } from "vitest";
import { validateImportPayload } from "@/lib/domain/validate-import";
import errorFixture from "../../fixtures/erro-payload-invalido.json";
import successFixture from "../../fixtures/sucesso-sintetico.json";

describe("validação de payload", () => {
  it("rejeita payload inválido e não sintético", () => {
    const result = validateImportPayload(errorFixture);
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["SCHEMA_DESCONHECIDO", "NAO_SINTETICO", "PAYLOAD_INVALIDO"]),
    );
    expect(result.activities).toHaveLength(0);
  });

  it("rejeita objeto sem activities", () => {
    const result = validateImportPayload(null);
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe("PAYLOAD_INVALIDO");
  });

  it("sinaliza falta de evidência sem inventar trabalho", () => {
    const result = validateImportPayload(successFixture);
    const missing = result.activities.find((item) => item.nativeId === "TASK-SIN-1002");
    expect(missing?.insufficientData).toBe(true);
    expect(missing?.warnings.some((warning) => warning.code === "FALTA_EVIDENCIA")).toBe(true);
  });

  it("mantém HTML como texto e rejeita javascript/data só em originUrls/href", () => {
    const result = validateImportPayload(successFixture);
    const injected = result.activities.find((item) => item.nativeId === "html-inject-01");
    expect(injected?.title).toContain("<script>");
    expect(injected?.title).toContain("Título com HTML sintético");
    expect(injected?.warnings.some((warning) => warning.code === "TEXTO_COM_MARCACAO")).toBe(
      true,
    );
    expect(injected?.provenance.originUrls).toEqual([
      "https://example.net/demo-sintetico/ok",
    ]);
    expect(
      injected?.warnings.some((warning) => warning.code === "URL_PROTOCOLO_INSEGURO"),
    ).toBe(true);
  });
});
