import { expect, test } from "@playwright/test";

test("renders the worker home page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "vibe-template Worker" })).toBeVisible();
  await expect(page.getByText("A minimal Cloudflare Worker baseline for experiments, tests, and local CI.")).toBeVisible();
  await expect(page.getByRole("link", { name: "/api/health" })).toBeVisible();
});

test("serves the health endpoint", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toEqual({
    ok: true,
    name: "vibe-template-worker",
    routes: ["/", "/api/health"],
  });
});

test("serves the generated stylesheet", async ({ request }) => {
  const response = await request.get("/styles.css");

  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("text/css");
  await expect(response.text()).resolves.toContain("--color-app-canvas:#f5efe6");
});
