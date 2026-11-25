export function resolveRuleHistories(revisions) {
  const byRule = Map.groupBy(revisions, (revision) => revision.id);
  return [...byRule.keys()].sort().map((id) => ({ id, history: orderRevisions(byRule.get(id)) }));
}

function orderRevisions(revisions) {
  const owners = new Set();
  for (const { id, adr } of revisions) {
    if (owners.has(adr)) throw new Error(`Duplicate revision of ${id} in ${adr}.`);
    owners.add(adr);
  }

  const successors = new Map();
  for (const revision of revisions) {
    const { id, adr, replaces } = revision;
    if (replaces && !owners.has(replaces)) {
      throw new Error(`${id} in ${adr} has no predecessor revision in ${replaces}.`);
    }
    const existing = successors.get(replaces);
    if (existing) {
      if (!replaces) throw new Error(`Multiple roots for ${id}: ${existing.adr} and ${adr}.`);
      throw new Error(`Fork in ${id}: ${existing.adr} and ${adr} both replace ${replaces}.`);
    }
    successors.set(replaces, revision);
  }

  const history = [];
  for (let revision = successors.get(undefined); revision; revision = successors.get(revision.adr)) {
    history.push(revision);
  }
  if (history.length !== revisions.length) throw new Error(`Cycle in the history of ${revisions[0].id}.`);
  const head = history.at(-1);
  if (!head.evidence) throw new Error(`Current revision of ${head.id} in ${head.adr} requires evidence.`);
  return history;
}
