import { env } from "cloudflare:workers";
import { runInDurableObject } from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";

describe("RoomState", () => {
  it("initializes an empty room with the supplied choices", async ({ expect }) => {
    const room = env.ROOM_STATE.getByName("initialize-empty");

    await expect(room.initializeChoices([{ id: "first", label: "First" }])).resolves.toEqual({
      choices: [{ id: "first", label: "First", votes: 0 }],
      currentSelection: null,
      revision: 1,
      status: "open",
      totalVotes: 0,
    });
  });

  it.each(["open", "locked"] as const)("preserves an initialized %s room even with different or invalid input", async (status) => {
    const room = env.ROOM_STATE.getByName(`initialize-repeat-${status}`);
    const choices = [
      { id: "first", label: "First" },
      { id: "second", label: "Second" },
    ];
    await room.seedChoices(choices);
    await room.castVote("voter", "second");
    await room.setStatus(status);
    const snapshot = await room.getSnapshot();
    const participant = await room.getSnapshot("voter");

    for (const supplied of [choices, [{ id: "different", label: "Different" }], []]) {
      await expect(room.initializeChoices(supplied)).resolves.toEqual(snapshot);
      await expect(room.getSnapshot("voter")).resolves.toEqual(participant);
    }
    await room.resetVotes();
    const reset = await room.getSnapshot();
    await expect(room.initializeChoices([{ id: "different", label: "Different" }])).resolves.toEqual(reset);
  });

  it("initializes only once when different setup requests overlap", async ({ expect }) => {
    const room = env.ROOM_STATE.getByName("initialize-concurrent");
    const results = await Promise.all([
      room.initializeChoices([{ id: "first", label: "First" }]),
      room.initializeChoices([{ id: "second", label: "Second" }]),
    ]);
    expect(results[0]).toEqual(results[1]);
    expect(results[0]).toMatchObject({ revision: 1, status: "open", totalVotes: 0 });
    expect([[{ id: "first", label: "First", votes: 0 }], [{ id: "second", label: "Second", votes: 0 }]]).toContainEqual(
      results[0]?.choices,
    );
    await expect(room.getSnapshot()).resolves.toEqual(results[0]);
  });

  it("preserves a vote between overlapping setup requests", async ({ expect }) => {
    const room = env.ROOM_STATE.getByName("initialize-intervening-vote");
    const choices = [{ id: "first", label: "First" }];
    const results = await Promise.all([
      room.initializeChoices(choices),
      room.castVote("voter", "first"),
      room.initializeChoices([{ id: "different", label: "Different" }]),
    ]);
    expect(results[1]).toMatchObject({ ok: true, snapshot: { revision: 2, totalVotes: 1 } });
    await expect(room.getSnapshot("voter")).resolves.toEqual({
      choices: [{ id: "first", label: "First", votes: 1 }],
      currentSelection: "first",
      revision: 2,
      status: "open",
      totalVotes: 1,
    });
  });

  it("rejects invalid initial choices without changing an empty room", async ({ expect }) => {
    const room = env.ROOM_STATE.getByName("initialize-invalid");
    await room.setStatus("locked");
    const empty = await room.getSnapshot();
    const invalidChoices = [
      [],
      Array.from({ length: 21 }, (_, index) => ({ id: String(index), label: "Choice" })),
      [{ id: " ", label: "Choice" }],
      [{ id: "x".repeat(129), label: "Choice" }],
      [{ id: "first", label: " " }],
      [{ id: "first", label: "x".repeat(201) }],
      [
        { id: "first", label: "First" },
        { id: "first", label: "Duplicate" },
      ],
    ];
    // Catch expected validation errors inside the object to avoid the RPC test
    // harness also reporting them as unhandled remote rejections.
    await runInDurableObject(room, async (instance) => {
      for (const choices of invalidChoices) {
        await expect(instance.initializeChoices(choices)).rejects.toThrow();
        await expect(instance.getSnapshot()).resolves.toEqual(empty);
      }
    });
    await expect(room.initializeChoices([{ id: "valid", label: "Valid" }])).resolves.toMatchObject({
      choices: [{ id: "valid", label: "Valid", votes: 0 }],
      revision: 2,
      status: "open",
      totalVotes: 0,
    });
  });

  it("still allows explicit destructive reseeding after initialization", async ({ expect }) => {
    const room = env.ROOM_STATE.getByName("initialize-reseed");
    await room.initializeChoices([{ id: "first", label: "First" }]);
    await room.castVote("voter", "first");
    await room.setStatus("locked");
    await expect(room.seedChoices([{ id: "second", label: "Second" }])).resolves.toEqual({
      choices: [{ id: "second", label: "Second", votes: 0 }],
      currentSelection: null,
      revision: 4,
      status: "open",
      totalVotes: 0,
    });
    await expect(room.getSnapshot("voter")).resolves.toMatchObject({ currentSelection: null });
    await expect(room.seedChoices([{ id: "second", label: "Second" }], "locked")).resolves.toMatchObject({
      revision: 5,
      status: "locked",
      totalVotes: 0,
    });
  });

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
