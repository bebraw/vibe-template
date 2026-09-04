import { expect, test } from "@playwright/test";

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
