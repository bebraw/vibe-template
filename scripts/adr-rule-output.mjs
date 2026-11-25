import { posix } from "node:path";

function indexLink(label, target, fragment = "") {
  const pathname = posix.relative("docs/adrs", target).split("/").map(encodeURIComponent).join("/");
  return `[${label}](${pathname}${fragment})`;
}

function mutationAction(mode) {
  return mode === "none" ? "skips mutation testing" : `runs ${mode} mutation testing`;
}

export function renderRuleIndex(histories, terms) {
  return histories
    .map(({ id, history }) => {
      const current = history.at(-1);
      const links = [indexLink(current.adr, current.source), indexLink("Rationale", current.source, "#context")];
      if (current.evidence) links.push(indexLink("Verification", current.evidence));
      const gates = Object.entries(current.gates).map(([term, mode]) => `- \`npm run ${terms[term].script}\` ${mutationAction(mode)}.`);
      const chain = history.map(({ adr, source }) => indexLink(adr, source)).join(" → ");
      return [`### \`${id}\``, "", `Current decision ${links.join(" · ")}`, "", ...gates, "", `History ${chain}`].join("\n");
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

function describeDecision(decision, terms) {
  const lines = Object.entries(decision.gates).map(([term, mode]) => `  ${term} — npm run ${terms[term].script} ${mutationAction(mode)}.`);
  lines.push(`  Rationale  ${decision.rationale}`, `  Source  ${decision.source}#context`);
  if (decision.evidence) lines.push(`  Verification  ${decision.evidence}`);
  return lines.join("\n");
}

export function describeRule({ id, history }, terms) {
  const current = history.at(-1);
  const chain = history.map(({ adr }) => adr).join(" → ");
  const previous = history.slice(0, -1).map((decision) => `${decision.adr}\n${describeDecision(decision, terms)}`);
  return [id, `Current decision ${current.adr}\n${describeDecision(current, terms)}`, `History ${chain}`, ...previous].join("\n\n");
}
