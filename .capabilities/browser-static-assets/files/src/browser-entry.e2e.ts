import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

test.use({ javaScriptEnabled: true });

test("loads the external typed browser entrypoint", async ({ page }) => {
  const source = await readFile(path.join(path.dirname(test.info().file), "browser", "browser-entry.ts"), "utf8");
  const moduleSource = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  await page.route("http://example.test/assets/browser-entry.js", async (route) => {
    await route.fulfill({ body: moduleSource, contentType: "text/javascript", status: 200 });
  });
  await page.route("http://example.test/", async (route) => {
    await route.fulfill({
      body: '<!doctype html><html><head><script type="module" src="/assets/browser-entry.js"></script></head><body></body></html>',
      contentType: "text/html",
      headers: { "content-security-policy": "default-src 'self'; script-src 'self'" },
      status: 200,
    });
  });

  await page.goto("http://example.test/");

  await expect(page.locator("html")).toHaveAttribute("data-browser-module", "ready");
});
