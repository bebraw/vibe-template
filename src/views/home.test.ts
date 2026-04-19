import { describe, expect, it } from "vitest";
import { exampleRoutes } from "../app-routes";
import { renderHomePage } from "./home";

describe("renderHomePage", () => {
  it("renders the route index starter copy and stylesheet wiring", () => {
    const html = renderHomePage(exampleRoutes);

    expect(html).toContain("Route Index");
    expect(html).toContain("Use the health probe to confirm the Worker is live");
    expect(html).toContain('rel="stylesheet" href="/styles.css"');
  });
});
