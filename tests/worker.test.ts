import { describe, expect, it } from "vitest";
import worker, { handleRequest, renderHomePage } from "../src/worker";

describe("worker", () => {
  it("renders the stub home page", async () => {
    const response = handleRequest(new Request("http://example.com/"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");

    const body = await response.text();
    expect(body).toContain("vibe-template Worker");
    expect(body).toContain("/api/health");
  });

  it("returns a JSON health response", async () => {
    const response = handleRequest(new Request("http://example.com/api/health"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      name: "vibe-template-worker",
      routes: ["/", "/api/health"],
    });
  });

  it("returns a not found page for unknown routes", async () => {
    const response = handleRequest(new Request("http://example.com/missing"));

    expect(response.status).toBe(404);

    const body = await response.text();
    expect(body).toContain("Not Found");
    expect(body).toContain("/missing");
  });

  it("renders stable starter copy", () => {
    const html = renderHomePage();

    expect(html).toContain("HTML stub app for developers");
    expect(html).toContain("A concrete Worker entry point");
  });

  it("exposes the same behavior through the worker fetch entrypoint", async () => {
    const response = worker.fetch(new Request("http://example.com/api/health"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
  });
});
