import { describe, expect, it } from "vitest";
import { exampleRoutes } from "../app-routes";
import { renderHomePage } from "./home";

describe("renderHomePage", () => {
  it("renders stable starter copy and stylesheet wiring", () => {
    const html = renderHomePage(exampleRoutes);

    expect(html).toContain("HTML stub app for developers");
    expect(html).toContain("A concrete Worker entry point");
    expect(html).toContain('rel="stylesheet" href="/styles.css"');
  });
});
