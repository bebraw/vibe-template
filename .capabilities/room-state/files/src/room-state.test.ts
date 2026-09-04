import { env } from "cloudflare:workers";
import { describe, it } from "vitest";

describe("RoomState", () => {
  it("counts predefined choices and replaces an anonymous vote", async ({ expect }) => {
    const room = env.ROOM_STATE.getByName("replaceable-vote");
    await room.seedChoices([
      { id: "first", label: "First" },
      { id: "second", label: "Second" },
    ]);

    await expect(room.castVote("anonymous-voter", "first")).resolves.toMatchObject({ ok: true });
    await expect(room.castVote("anonymous-voter", "second")).resolves.toMatchObject({ ok: true });
    await expect(room.getSnapshot()).resolves.toEqual({
      choices: [
        { id: "first", label: "First", votes: 0 },
        { id: "second", label: "Second", votes: 1 },
      ],
      totalVotes: 1,
    });
  });

  it("rejects votes outside the predefined choices", async ({ expect }) => {
    const room = env.ROOM_STATE.getByName("predefined-only");
    await room.seedChoices([{ id: "known", label: "Known" }]);

    await expect(room.castVote("anonymous-voter", "unknown")).resolves.toEqual({
      ok: false,
      code: "unknown-choice",
    });
  });

  it("keeps rooms isolated and can reset counts without removing choices", async ({ expect }) => {
    const firstRoom = env.ROOM_STATE.getByName("first-room");
    const secondRoom = env.ROOM_STATE.getByName("second-room");
    const choices = [{ id: "only", label: "Only" }];
    await firstRoom.seedChoices(choices);
    await secondRoom.seedChoices(choices);
    await firstRoom.castVote("anonymous-voter", "only");

    await expect(secondRoom.getSnapshot()).resolves.toMatchObject({ totalVotes: 0 });
    await expect(firstRoom.resetVotes()).resolves.toEqual({
      choices: [{ id: "only", label: "Only", votes: 0 }],
      totalVotes: 0,
    });
  });
});
