import { describe, expect, it } from "vitest";
import { csvSafeCell, sanitizeUrl, stripHtml } from "@/lib/domain/sanitize";

describe("sanitização", () => {
  it("remove script e tags", () => {
    const { text, removed } = stripHtml(
      "<script>alert(1)</script>Título <b>ok</b>",
    );
    expect(removed).toBe(true);
    expect(text).not.toContain("<script>");
    expect(text).not.toContain("alert(1)");
    expect(text).toContain("Título");
    expect(text).toContain("ok");
  });

  it("rejeita protocolos inseguros", () => {
    expect(sanitizeUrl("javascript:alert(1)").url).toBeNull();
    expect(sanitizeUrl("data:text/html,x").warning).toBe("URL_PROTOCOLO_INSEGURO");
    expect(sanitizeUrl("https://example.org/demo").url).toContain("https://example.org/demo");
  });

  it("prefixa fórmulas CSV", () => {
    expect(csvSafeCell("=1+1")).toContain("'=1+1");
    expect(csvSafeCell("@SUM(A1)")).toContain("'@SUM(A1)");
    expect(csvSafeCell('linha "aspas"')).toContain('""aspas""');
  });
});
