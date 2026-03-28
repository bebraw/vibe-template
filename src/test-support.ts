import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function ensureGeneratedStylesheet(): void {
  mkdirSync(".generated", { recursive: true });
  writeFileSync(join(".generated", "styles.css"), "body{color:black;}", "utf8");
}
