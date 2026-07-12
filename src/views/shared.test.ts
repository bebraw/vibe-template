import { describe, expect, it } from "vitest";
import { cssResponse, escapeHtml, htmlResponse } from "./shared";

describe("htmlResponse", () => {
  it("returns no-store HTML responses", () => {
    const response = htmlResponse("<p>Hello</p>", 201);

    expect(response.status).toBe(201);
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-security-policy")).toBe(
      "default-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
    );
    expect(response.headers.get("permissions-policy")).toBe("camera=(), geolocation=(), microphone=()");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

describe("cssResponse", () => {
  it("returns no-store CSS responses", () => {
    const response = cssResponse(":root {}");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/css; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

describe("escapeHtml", () => {
  it("escapes characters that are significant in HTML", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });
});
