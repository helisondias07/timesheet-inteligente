import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const screenshotDir = path.join(process.cwd(), "artifacts", "screenshots");

function viewportName(page: Page) {
  const size = page.viewportSize();
  return `${size?.width}x${size?.height}`;
}

async function saveShot(page: Page, name: string) {
  fs.mkdirSync(screenshotDir, { recursive: true });
  const file = path.join(screenshotDir, `${name}-${viewportName(page)}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

test.describe("fluxo UI carregar / importar / editar / revisar / exportar", () => {
  test("estados vazios, fixture, revisão e exportação", async ({ page }, testInfo) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Timesheet inteligente" })).toBeVisible();
    await expect(page.getByText("Demonstração · dados sintéticos").first()).toBeVisible();
    await expect(page.getByTestId("empty-state")).toBeVisible();
    await saveShot(page, `01-vazio-${testInfo.project.name}`);

    await page.getByTestId("load-fixture").click();
    await expect(page.getByText(/Fixture sintética carregada/)).toBeVisible();
    await expect(page.getByText("Dados insuficientes").first()).toBeVisible();
    await saveShot(page, `02-fixture-${testInfo.project.name}`);

    const title = page.locator('input[id^="title-"]').first();
    await title.fill('Tarefa revisada "café" da loja demo');
    const hours = page.locator('input[id^="hours-"]').first();
    await hours.fill("1,5");
    await hours.blur();
    await expect(hours).toHaveValue("1.5");
    await hours.fill("1.5");
    await hours.blur();
    await expect(hours).toHaveValue("1.5");

    await page.getByRole("button", { name: "Aprovar dia" }).first().click();
    await expect(page.getByText("Aprovado (humano)").first()).toBeVisible();
    await saveShot(page, `03-revisao-${testInfo.project.name}`);

    const downloadJson = page.waitForEvent("download");
    await page.getByTestId("export-json").click();
    const jsonFile = await downloadJson;
    expect(jsonFile.suggestedFilename()).toContain("sintetico");

    const downloadCsv = page.waitForEvent("download");
    await page.getByTestId("export-csv").click();
    const csvFile = await downloadCsv;
    expect(csvFile.suggestedFilename()).toContain(".csv");

    await page.getByRole("button", { name: "Carregar fixture de erro" }).click();
    await expect(page.getByTestId("error-state")).toBeVisible();
    await saveShot(page, `04-erro-${testInfo.project.name}`);
  });

  test("teclado foca importação e carrega fixture", async ({ page }, testInfo) => {
    await page.goto("/");
    await page.getByTestId("import-json").focus();
    await expect(page.getByTestId("import-json")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("import-submit")).toBeFocused();
    await page.getByTestId("load-fixture").focus();
    await expect(page.getByTestId("load-fixture")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByText(/Fixture sintética carregada/)).toBeVisible();
    await page.getByRole("link", { name: "Pular para a revisão" }).focus();
    await page.keyboard.press("Enter");
    await saveShot(page, `05-teclado-${testInfo.project.name}`);
  });

  test("diálogo de atalhos prende foco, Escape devolve ao acionador", async ({
    page,
  }, testInfo) => {
    await page.goto("/");
    const trigger = page.getByTestId("help-trigger");
    await trigger.click();
    await expect(page.getByTestId("help-dialog")).toBeVisible();
    await expect(page.locator("#atalhos-titulo")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("help-close")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("help-ok")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("help-close")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByTestId("help-ok")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("help-dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await saveShot(page, `06-dialogo-${testInfo.project.name}`);
  });
});
