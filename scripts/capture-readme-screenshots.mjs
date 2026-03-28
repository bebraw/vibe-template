import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

const DEFAULT_BASE_URL = "http://127.0.0.1:3000";
const DEFAULT_OUTPUT_DIR = "docs/screenshots";
const DEFAULT_VIEWPORT = { width: 1600, height: 1200 };
const DEFAULT_PAGES = [{ route: "/", fileName: "home.png" }];

const helpText = `
Capture README screenshots with Playwright.

Environment variables:
  SCREENSHOT_BASE_URL   Optional. Base URL to capture. Defaults to http://127.0.0.1:3000.
  SCREENSHOT_OUTPUT_DIR Optional. Output directory. Defaults to docs/screenshots.
  SCREENSHOT_PAGES      Optional. Comma-separated route=file entries.
                        Example: /=home.png,/docs=docs.png

Examples:
  npm run screenshots:readme
  SCREENSHOT_BASE_URL=http://127.0.0.1:8788 npm run screenshots:readme
  SCREENSHOT_PAGES="/=landing.png,/about=about.png" npm run screenshots:readme
`.trim();

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(helpText);
  process.exit(0);
}

const baseUrl = new URL(process.env.SCREENSHOT_BASE_URL || DEFAULT_BASE_URL);
const outputDir = path.resolve(process.cwd(), process.env.SCREENSHOT_OUTPUT_DIR || DEFAULT_OUTPUT_DIR);
const pages = parsePages(process.env.SCREENSHOT_PAGES);

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();

try {
  for (const pageDefinition of pages) {
    const context = await browser.newContext({
      viewport: DEFAULT_VIEWPORT,
      colorScheme: "light",
    });

    try {
      const page = await context.newPage();
      await capturePage(page, pageDefinition);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

async function capturePage(page, pageDefinition) {
  const targetUrl = new URL(pageDefinition.route, baseUrl).toString();
  const outputPath = path.join(outputDir, pageDefinition.fileName);

  await page.goto(targetUrl, { waitUntil: "networkidle" });
  await page.screenshot({ path: outputPath, fullPage: true });

  console.log(`Captured ${targetUrl} -> ${outputPath}`);
}

function parsePages(rawPages) {
  if (!rawPages) {
    return DEFAULT_PAGES;
  }

  return rawPages
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.indexOf("=");

      if (separatorIndex === -1) {
        throw new Error(`Invalid SCREENSHOT_PAGES entry: ${entry}\nExpected route=fileName.`);
      }

      const route = entry.slice(0, separatorIndex).trim();
      const fileName = entry.slice(separatorIndex + 1).trim();

      if (!route || !fileName) {
        throw new Error(`Invalid SCREENSHOT_PAGES entry: ${entry}\nExpected route=fileName.`);
      }

      return { route, fileName };
    });
}
