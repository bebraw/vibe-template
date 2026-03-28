import { describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHealthResponse } from "../src/api/health";
import { exampleRoutes } from "../src/app-routes";
import worker, { handleRequest } from "../src/worker";
import { renderHomePage } from "../src/views/home";
import { renderNotFoundPage } from "../src/views/not-found";

mkdirSync(".generated", { recursive: true });
writeFileSync(join(".generated", "styles.css"), "body{color:black;}", "utf8");

describe("worker", () => {
  it("renders the stub home page", async () => {
    const response = await handleRequest(new Request("http://example.com/"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");

    const body = await response.text();
    expect(body).toContain("vibe-template Worker");
    expect(body).toContain("/api/health");
  });

  it("returns a JSON health response", async () => {
    const response = await handleRequest(new Request("http://example.com/api/health"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      name: "vibe-template-worker",
      routes: ["/", "/api/health"],
    });
  });

  it("returns a not found page for unknown routes", async () => {
    const response = await handleRequest(new Request("http://example.com/missing"));

    expect(response.status).toBe(404);

    const body = await response.text();
    expect(body).toContain("Not Found");
    expect(body).toContain("/missing");
  });

  it("renders stable starter copy", () => {
    const html = renderHomePage(exampleRoutes);

    expect(html).toContain("HTML stub app for developers");
    expect(html).toContain("A concrete Worker entry point");
    expect(html).toContain('rel="stylesheet" href="/styles.css"');
  });

  it("exposes the same behavior through the worker fetch entrypoint", async () => {
    const response = await worker.fetch(new Request("http://example.com/api/health"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
  });

  it("builds the health response from the api module", async () => {
    const response = createHealthResponse(exampleRoutes.map((route) => route.path));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      name: "vibe-template-worker",
      routes: ["/", "/api/health"],
    });
  });

  it("renders a standalone not found view", () => {
    const html = renderNotFoundPage("/missing");

    expect(html).toContain("Not Found");
    expect(html).toContain("/missing");
  });

  it("serves generated styles", async () => {
    const response = await handleRequest(new Request("http://example.com/styles.css"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/css");
    await expect(response.text()).resolves.toContain("color:black");
  });
});
