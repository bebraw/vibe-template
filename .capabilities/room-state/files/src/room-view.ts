import type { RoomSnapshot } from "./room-state";

export interface RoomViewModel {
  roomId: string;
  snapshot: RoomSnapshot;
}

export function renderRoomDocument(view: RoomViewModel): string {
  const title = `Room ${view.roomId}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      ${renderRoomFragment(view)}
    </main>
  </body>
</html>`;
}

export function renderRoomFragment({ roomId, snapshot }: RoomViewModel): string {
  const action = `/rooms/${encodeURIComponent(roomId)}`;
  const sectionAttributes = `data-room-revision="${snapshot.revision}" data-room-status="${snapshot.status}"`;

  if (snapshot.choices.length === 0) {
    return `<section id="room-results" data-progressive-fragment ${sectionAttributes} tabindex="-1" aria-live="polite">
  <p>This room has no choices yet.</p>
</section>`;
  }

  const choices = snapshot.choices
    .map(
      (choice, index) => `<div>
  <input id="room-choice-${index}" name="choice" type="radio" value="${escapeHtml(choice.id)}" required${
    snapshot.currentSelection === choice.id ? " checked" : ""
  }>
  <label for="room-choice-${index}">${escapeHtml(choice.label)} — ${choice.votes}</label>
</div>`,
    )
    .join("\n");

  const lockedMessage = snapshot.status === "locked" ? `<p>Voting is locked at revision ${snapshot.revision}.</p>` : "";
  const submitButton = snapshot.status === "open" ? '    <button type="submit">Vote</button>' : "";
  const disabled = snapshot.status === "locked" ? " disabled" : "";

  return `<section id="room-results" data-progressive-fragment ${sectionAttributes} tabindex="-1" aria-live="polite">
  <p>${snapshot.totalVotes} total votes</p>
  ${lockedMessage}
  <form action="${action}" method="post" data-progressive-form data-progressive-target="#room-results">
    <fieldset${disabled}>
      <legend>Choose one option</legend>
      ${choices}
    </fieldset>
${submitButton}
  </form>
</section>`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
