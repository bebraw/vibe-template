import { posix } from "node:path";

function indexLink(label, target, fragment) {
  const pathname = posix.relative("docs/adrs", target).split("/").map(encodeURIComponent).join("/");
  return `[${label}](${pathname}${fragment ? "#" + encodeURIComponent(fragment) : ""})`;
}

function decisionRows(decision, definition, markdown) {
  function command(script) {
    const text = `npm run ${script}`;
    return markdown ? `\`${text}\`` : text;
  }

  const cases = Object.entries(decision.cases ?? decision.gates);
  cases.sort(([left], [right]) => Number(left === "otherwise") - Number(right === "otherwise"));
  const rows = definition.script ? [`Command ${command(definition.script)}`] : [];
  for (const [key, value] of cases) {
    const term = definition.cases[key];
    const action = definition.outcomes[value];
    if (term.script) {
      const prefix = markdown ? "" : `${key} — `;
      rows.push(`${prefix}${command(term.script)} ${action}.`);
      if (!markdown) rows.push(`  Scope  ${term.definition}`);
    } else {
      rows.push(`${term.definition} — ${action}.`);
    }
  }
  return rows;
}

export function renderRuleIndex(histories, definitions) {
  return histories
    .map(({ id, history }) => {
      const current = history.at(-1);
      const definition = definitions[id];
      const links = [indexLink(current.adr, current.source), indexLink("Rationale", current.source, "context")];
      if (current.evidence) {
        const [file, fragment] = current.evidence.split("#");
        links.push(indexLink(definition.evidenceLabel, file, fragment));
      }
      const rows = decisionRows(current, definition, true).map((row) => `- ${row}`);
      const chain = history.map(({ adr, source }) => indexLink(adr, source)).join(" → ");
      return [`### \`${id}\``, "", `Current decision ${links.join(" · ")}`, "", ...rows, "", `History ${chain}`].join("\n");
    })
    .join("\n\n");
}

export function updateRuleIndex(readme, content) {
  const markers = [...readme.matchAll(/^.*<!--[ \t]*adr-rules\b.*$/gm)];
  const [start, end] = markers;
  if (markers.length !== 2 || start[0] !== "<!-- adr-rules:start -->" || end[0] !== "<!-- adr-rules:end -->") {
    throw new Error("Expected exactly one pair of ADR rule index markers on separate lines, start before end.");
  }

  const prefix = readme.slice(0, start.index + start[0].length);
  const existingBody = readme.slice(prefix.length, end.index);
  const atxHeading = /^ {0,3}#{1,2}(?:[ \t]|$)/m;
  const setextHeading = /^ {0,3}\S[^\r\n]*\r?\n {0,3}(?:=+|-+)[ \t]*$/m;
  if (atxHeading.test(existingBody) || setextHeading.test(existingBody)) {
    throw new Error("The ADR rule index markers enclose a level-1 or level-2 heading. Check the marker positions before refreshing.");
  }
  const newline = readme.startsWith("\r\n", prefix.length) ? "\r\n" : "\n";
  const body = content ? content.replace(/\r?\n/g, newline) + newline + newline : "";
  return prefix + newline + newline + body + readme.slice(end.index);
}

function describeDecision(decision, definition) {
  const lines = decisionRows(decision, definition, false).map((row) => `  ${row}`);
  lines.push(`  Context when ${decision.adr} was written\n  ${decision.rationale}`, `  Source  ${decision.source}#context`);
  if (decision.evidence) lines.push(`  ${definition.evidenceLabel}  ${decision.evidence}`);
  return lines.join("\n");
}

export function describeRule({ id, history }, definitions) {
  const current = history.at(-1);
  const chain = history.map(({ adr }) => adr).join(" → ");
  const definition = definitions[id];
  const previous = history.slice(0, -1).map((decision) => `${decision.adr}\n${describeDecision(decision, definition)}`);
  return [id, `Current decision ${current.adr}\n${describeDecision(current, definition)}`, `History ${chain}`, ...previous].join("\n\n");
}

function changeLabel(before, after) {
  if (before === undefined) return "Added";
  if (after === undefined) return "Removed";
  return "Changed";
}

function describeTransition(before, after) {
  return before === after ? `${before} (unchanged)` : `${before} → ${after}`;
}

export function describeDraftRule(draft, previous, definition, replacements = {}) {
  const before = new Map(Object.entries(previous?.gates ?? previous?.cases ?? {}));
  const after = new Map(Object.entries(draft.gates ?? draft.cases));
  const keys = new Set([...before.keys(), ...after.keys()]);
  const lines = [`Draft ${draft.adr} · ${draft.id}`, `Implemented head ${previous?.adr ?? "none"}`, "Settings (implemented → proposed)"];
  if (draft.cases) {
    keys.delete("otherwise");
    lines.push(`Command npm run ${definition.script}`, "Any matching named condition takes precedence over the fallback.");
  }
  const scopes = Object.entries(replacements);
  for (const [id, { replaces, definition: proposedScope }] of scopes) {
    keys.delete(replaces);
    keys.delete(id);
    const current = definition.cases[replaces];
    const oldMode = before.get(replaces) ?? (previous ? "no declaration" : "no implemented rule");
    lines.push(
      `  Proposed gate scope ${replaces} → ${id} · npm run ${current.script}`,
      `    Current scope  ${current.definition}`,
      `    Proposed scope  ${proposedScope}`,
      `    Mutation mode  ${describeTransition(oldMode, after.get(id))}`,
    );
  }
  const changed = [...keys].filter((key) => before.get(key) !== after.get(key));
  const sameFallback = before.get("otherwise") === after.get("otherwise");
  if (scopes.length === 0 && changed.length === 0 && sameFallback) lines.push("No changed settings.");
  for (const key of changed) {
    const oldValue = before.get(key);
    const proposedValue = after.get(key);
    const term = definition.cases[key];
    const change = changeLabel(oldValue, proposedValue);
    const subject = draft.cases ? `condition ${key}` : `gate ${key} · npm run ${term.script}`;
    const missing = draft.cases ? "no explicit condition" : "no declaration";
    lines.push(`  ${change} ${subject} — ${term.definition}`);
    lines.push(`    ${definition.outcomes[oldValue] ?? missing} → ${definition.outcomes[proposedValue] ?? missing}`);
  }
  if (draft.cases) {
    const oldFallback = definition.outcomes[before.get("otherwise")] ?? "no implemented rule";
    const nextFallback = definition.outcomes[after.get("otherwise")];
    lines.push("  Fallback when no named condition matches", `    ${describeTransition(oldFallback, nextFallback)}`);
  }
  const label = definition.evidenceLabel.toLowerCase();
  if (previous?.evidence && previous.evidence !== draft.evidence) lines.push(`Implemented ${label}  ${previous.evidence}`);
  lines.push(`Proposed ${label}  ${draft.evidence ?? "pending"}`);
  return lines.join("\n");
}
