import { env } from "cloudflare:workers";
import { describe, it, vi } from "vitest";

describe("RoomState", () => {
  it("counts predefined choices and replaces an anonymous vote", async ({ expect }) => {
    const room = env.ROOM_STATE.getByName("replaceable-vote");
    await expect(
      room.seedChoices([
        { id: "first", label: "First" },
        { id: "second", label: "Second" },
      ]),
    ).resolves.toMatchObject({ currentSelection: null, revision: 1, status: "open" });

    await expect(room.castVote("anonymous-voter", "first")).resolves.toMatchObject({
      ok: true,
      snapshot: { currentSelection: "first", revision: 2 },
    });
    await expect(room.castVote("anonymous-voter", "second")).resolves.toMatchObject({
      ok: true,
      snapshot: { currentSelection: "second", revision: 3 },
    });
    await expect(room.castVote("anonymous-voter", "second")).resolves.toMatchObject({
      ok: true,
      snapshot: { currentSelection: "second", revision: 3 },
    });
    await expect(room.getSnapshot("anonymous-voter")).resolves.toEqual({
      choices: [
        { id: "first", label: "First", votes: 0 },
        { id: "second", label: "Second", votes: 1 },
      ],
      currentSelection: "second",
      revision: 3,
      status: "open",
      totalVotes: 1,
    });
    await expect(room.getSnapshot()).resolves.toMatchObject({ currentSelection: null, revision: 3 });
  });

  it("rejects votes outside the predefined choices", async ({ expect }) => {
    const room = env.ROOM_STATE.getByName("predefined-only");
    await room.seedChoices([{ id: "known", label: "Known" }]);

    await expect(room.castVote("anonymous-voter", "unknown")).resolves.toEqual({
      ok: false,
      code: "unknown-choice",
    });
  });

  it("locks a result at a stable revision until voting reopens", async ({ expect }) => {
    const room = env.ROOM_STATE.getByName("locked-result");
    await room.seedChoices([
      { id: "first", label: "First" },
      { id: "second", label: "Second" },
    ]);
    await room.castVote("first-voter", "first");

    await expect(room.setStatus("locked")).resolves.toMatchObject({ revision: 3, status: "locked", totalVotes: 1 });
    await expect(room.castVote("second-voter", "second")).resolves.toEqual({ ok: false, code: "room-locked" });
    await expect(room.setStatus("locked")).resolves.toMatchObject({ revision: 3, status: "locked" });
    await expect(room.setStatus("open")).resolves.toMatchObject({ revision: 4, status: "open" });
    await expect(room.castVote("second-voter", "second")).resolves.toMatchObject({
      ok: true,
      snapshot: { revision: 5, totalVotes: 2 },
    });
  });

  it("keeps rooms isolated and can reset counts without removing choices", async ({ expect }) => {
    const firstRoom = env.ROOM_STATE.getByName("first-room");
    const secondRoom = env.ROOM_STATE.getByName("second-room");
    const choices = [{ id: "only", label: "Only" }];
    await firstRoom.seedChoices(choices);
    await secondRoom.seedChoices(choices);
    await firstRoom.castVote("anonymous-voter", "only");
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await expect(secondRoom.getSnapshot()).resolves.toMatchObject({ revision: 1, totalVotes: 0 });
    await expect(firstRoom.resetVotes()).resolves.toEqual({
      choices: [{ id: "only", label: "Only", votes: 0 }],
      currentSelection: null,
      revision: 3,
      status: "open",
      totalVotes: 0,
    });
    expect(log).toHaveBeenCalledWith(JSON.stringify({ event: "room.reset", outcome: "changed", removedVotes: 1, revision: 3 }));
    await expect(firstRoom.resetVotes()).resolves.toMatchObject({ revision: 3, totalVotes: 0 });
    expect(log).toHaveBeenLastCalledWith(JSON.stringify({ event: "room.reset", outcome: "unchanged", removedVotes: 0, revision: 3 }));
    log.mockRestore();
  });
});
