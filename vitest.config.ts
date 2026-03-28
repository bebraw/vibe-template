import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/e2e/**"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}"],
      exclude: ["src/**/*.d.ts"],
      reporter: ["text", "html"],
      reportsDirectory: "reports/coverage",
      thresholds: {
        branches: 80,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
});
