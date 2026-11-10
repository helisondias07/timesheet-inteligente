import { describe, expect, it } from "vitest";
import {
  csvSafeCell,
  hrefIfSafeHttp,
  sanitizePlainText,
  sanitizeUrl,
} from "@/lib/domain/sanitize";

describe("sanitização e contrato de texto", () => {
  it("não apaga marcação; avisa que é texto", () => {
    const { text, warnings } = sanitizePlainText(
      "<script>alert(1)</script>Título <b>ok</b>",
    );
    expect(text).toContain("<script>");
    expect(text).toContain("Título");
    expect(warnings).toContain("TEXTO_COM_MARCACAO");
  });

  it("rejeita protocolos inseguros só para href", () => {
    expect(hrefIfSafeHttp("javascript:alert(1)")).toBeNull();
    expect(sanitizeUrl("data:text/html,x").warning).toBe("URL_PROTOCOLO_INSEGURO");
    expect(sanitizeUrl("https://example.org/demo").url).toContain(
      "https://example.org/demo",
    );
  });

  it("prefixa fórmulas CSV em qualquer coluna de texto", () => {
    expect(csvSafeCell("=1+1")).toContain("'=1+1");
    expect(csvSafeCell("@SUM(A1)")).toContain("'@SUM(A1)");
    expect(csvSafeCell("+1+1")).toContain("'+1+1");
    expect(csvSafeCell('linha "aspas"')).toContain('""aspas""');
  });
});
