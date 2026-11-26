import { dirname, join, normalize } from "node:path";

function updatePath(token, source, targets) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(token)) return token;
  const match = /^([^?#]+\.md)(\?[^#]*)?(?:#.*)?$/i.exec(token);
  if (!match) return token;
  const [, pathname, query = ""] = match;
  let path;
  try {
    path = decodeURIComponent(pathname.replace(/\\([()<>\\])/g, "$1"));
  } catch {
    return token;
  }
  const local = path.startsWith("/") ? normalize(path.slice(1)) : join(dirname(source), path);
  // Inline code and update manifests often spell paths from the repository root.
  if (!targets.has(local) && !(path.startsWith("docs/adrs/") && targets.has(normalize(path)))) return token;
  return pathname.slice(0, -3) + ".yaml" + query;
}

function destinationEnd(text, start, angled) {
  let depth = 0;
  for (let end = start; end < text.length; end++) {
    const char = text[end];
    if (char === "\\") end++;
    else if (angled) {
      if (char === ">") return end;
    } else if (/\s/.test(char) || (char === ")" && depth === 0)) return end;
    else if (char === "(") depth++;
    else if (char === ")") depth--;
  }
  return text.length;
}

function updateBarePaths(text, source, targets) {
  const tokens = /(?:[a-z][a-z\d+.-]*:\/\/|\/\/)[^\s<>"'\x60\]]+|[^\s<>()[\]{}"'\x60]+/gi;
  return text.replace(tokens, (token) => {
    const stripped = token.replace(/[.,;!]+$/, "");
    return updatePath(stripped, source, targets) + token.slice(stripped.length);
  });
}

export function migrateReferences(text, source, targets) {
  if (!text.includes(".md")) return text;
  const links = /\](?:\(\s*|:[ \t]+)/g;
  let result = "";
  let offset = 0;
  while (links.test(text)) {
    const angled = text[links.lastIndex] === "<";
    const start = links.lastIndex + Number(angled);
    const end = destinationEnd(text, start, angled);
    result += updateBarePaths(text.slice(offset, start), source, targets);
    result += updatePath(text.slice(start, end), source, targets);
    offset = end;
    links.lastIndex = end;
  }
  return result + updateBarePaths(text.slice(offset), source, targets);
}
