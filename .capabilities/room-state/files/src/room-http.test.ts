import { env } from "cloudflare:workers";
import { describe, it } from "vitest";
import { handleRoomRequest } from "./room-http";

describe("handleRoomRequest", () => {
  it("accepts a same-origin vote with a configurable cookie lifetime and renders the participant selection", async ({ expect }) => {
    const roomId = "same-origin-http";
    const room = env.ROOM_STATE.getByName(roomId);
    await room.seedChoices([
      { id: "first", label: "First" },
      { id: "second", label: "Second" },
    ]);
    const url = `https://example.com/rooms/${roomId}`;

    const response = await handleRoomRequest(
      new Request(url, {
        body: "choice=second",
        headers: { "content-type": "application/x-www-form-urlencoded", origin: "https://example.com" },
        method: "POST",
      }),
      env,
      { voterCookieMaxAgeSeconds: 3_600 },
    );

    expect(response?.status).toBe(303);
    const setCookie = response?.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("Max-Age=3600");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Secure");

    const documentResponse = await handleRoomRequest(new Request(url, { headers: { cookie: setCookie.split(";", 1)[0] ?? "" } }), env);
    const document = await documentResponse?.text();
    expect(document).toContain('data-room-status="open"');
    expect(document).toContain('data-room-revision="2"');
    expect(document).toMatch(/value="second"[^>]*checked/);
  });

  it("rejects missing and cross-origin vote submissions before state changes", async ({ expect }) => {
    const roomId = "csrf-http";
    const room = env.ROOM_STATE.getByName(roomId);
    await room.seedChoices([{ id: "first", label: "First" }]);
    const url = `https://example.com/rooms/${roomId}`;
    const form = { body: "choice=first", headers: { "content-type": "application/x-www-form-urlencoded" }, method: "POST" };

    await expect(handleRoomRequest(new Request(url, form), env)).resolves.toMatchObject({ status: 403 });
    await expect(
      handleRoomRequest(new Request(url, { ...form, headers: { ...form.headers, origin: "https://attacker.example" } }), env),
    ).resolves.toMatchObject({ status: 403 });
    await expect(room.getSnapshot()).resolves.toMatchObject({ revision: 1, totalVotes: 0 });
  });

  it("rejects votes while the room is locked", async ({ expect }) => {
    const roomId = "locked-http";
    const room = env.ROOM_STATE.getByName(roomId);
    await room.seedChoices([{ id: "first", label: "First" }]);
    await room.setStatus("locked");

    const response = await handleRoomRequest(
      new Request(`https://example.com/rooms/${roomId}`, {
        body: "choice=first",
        headers: { "content-type": "application/x-www-form-urlencoded", origin: "https://example.com" },
        method: "POST",
      }),
      env,
    );

    expect(response?.status).toBe(409);
    await expect(room.getSnapshot()).resolves.toMatchObject({ revision: 2, status: "locked", totalVotes: 0 });
  });
});
