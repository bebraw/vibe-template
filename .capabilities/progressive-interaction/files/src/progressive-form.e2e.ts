import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

test.use({ javaScriptEnabled: false });

test("a declared form still submits and renders a response without JavaScript", async ({ page }) => {
  let submittedBody = "";

  await page.route("http://example.test/rooms/example", async (route) => {
    submittedBody = route.request().postData() ?? "";
    await route.fulfill({
      body: "<!doctype html><html><body><h1>Vote recorded</h1></body></html>",
      contentType: "text/html",
      status: 200,
    });
  });
  await page.setContent(`
    <form action="http://example.test/rooms/example" method="post" data-progressive-form data-progressive-target="#results">
      <section id="results" data-progressive-fragment>
        <label><input name="choice" type="radio" value="first" checked> First</label>
        <button type="submit">Vote</button>
      </section>
    </form>
  `);

  await page.getByRole("button", { name: "Vote" }).click();

  await expect(page).toHaveURL("http://example.test/rooms/example");
  await expect(page.getByRole("heading", { name: "Vote recorded" })).toBeVisible();
  expect(submittedBody).toContain("choice=first");
});

test.describe("with JavaScript enabled", () => {
  test.use({ javaScriptEnabled: true });

  test("replaces the fragment and keeps URL, focus, and history coherent", async ({ page }) => {
    const source = await readFile(path.join(path.dirname(test.info().file), "browser", "progressive-form.ts"), "utf8");
    const moduleSource = ts.transpileModule(`${source}\ninstallProgressiveForms();`, {
      compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    await page.route("http://example.test/assets/progressive-form-test.js", async (route) => {
      await route.fulfill({ body: moduleSource, contentType: "text/javascript", status: 200 });
    });
    await page.route("http://example.test/rooms/example**", async (route) => {
      const url = new URL(route.request().url());
      const submitted = url.searchParams.has("submitted") || route.request().method() === "POST";
      await route.fulfill({
        body: submitted ? submittedDocument : initialDocument,
        contentType: "text/html",
        status: 200,
      });
    });
    await page.goto("http://example.test/rooms/example");

    await page.getByRole("button", { name: "Vote" }).click();

    await expect(page).toHaveURL("http://example.test/rooms/example?submitted=1");
    await expect(page.locator("#outside-fragment")).toHaveText("unchanged");
    await expect(page.getByRole("heading", { name: "Vote recorded" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Vote recorded" })).toBeFocused();

    await page.goBack();
    await expect(page).toHaveURL("http://example.test/rooms/example");
    await expect(page.getByRole("button", { name: "Vote" })).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL("http://example.test/rooms/example?submitted=1");
    await expect(page.getByRole("heading", { name: "Vote recorded" })).toBeVisible();
  });
});

const initialDocument = `<!doctype html>
<html><head><script type="module" src="/assets/progressive-form-test.js"></script></head><body>
  <p id="outside-fragment">unchanged</p>
  <section id="results" data-progressive-fragment>
    <form action="/rooms/example?submitted=1" method="post" data-progressive-form data-progressive-target="#results">
      <label><input name="choice" type="radio" value="first" checked> First</label>
      <button id="vote-button" type="submit">Vote</button>
    </form>
  </section>
</body></html>`;

const submittedDocument = `<!doctype html>
<html><head><script type="module" src="/assets/progressive-form-test.js"></script></head><body>
  <p id="outside-fragment">server copy</p>
  <section id="results" data-progressive-fragment>
    <h2 tabindex="-1" data-progressive-focus>Vote recorded</h2>
  </section>
</body></html>`;
