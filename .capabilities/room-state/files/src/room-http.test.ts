import { env } from "cloudflare:workers";
import { describe, it } from "vitest";
import { handleRoomRequest, resetRoom, RoomAdministrationUnauthorizedError, seedRoom, setRoomStatus } from "./room-http";

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

  it("handles non-room routes, empty rooms, unsupported methods, and malformed forms", async ({ expect }) => {
    await expect(handleRoomRequest(new Request("https://example.com/"), env)).resolves.toBeUndefined();
    await expect(handleRoomRequest(new Request("https://example.com/rooms/%E0%A4%A"), env)).resolves.toBeUndefined();

    const roomUrl = "https://example.com/rooms/validation";
    const emptyRoom = await handleRoomRequest(new Request(roomUrl), env);
    expect(await emptyRoom?.text()).toContain("This room has no choices yet.");

    const unsupported = await handleRoomRequest(new Request(roomUrl, { method: "PUT" }), env);
    expect(unsupported?.status).toBe(405);
    expect(unsupported?.headers.get("allow")).toBe("GET, POST");

    const wrongContentType = await handleRoomRequest(
      new Request(roomUrl, { body: "choice=first", headers: { origin: "https://example.com" }, method: "POST" }),
      env,
    );
    expect(wrongContentType?.status).toBe(415);

    const missingChoice = await handleRoomRequest(
      new Request(roomUrl, {
        body: "ignored=value",
        headers: { "content-type": "application/x-www-form-urlencoded", origin: "https://example.com" },
        method: "POST",
      }),
      env,
    );
    expect(missingChoice?.status).toBe(400);
  });

  it("accepts an additional origin, reuses valid voter cookies, and validates cookie duration", async ({ expect }) => {
    const roomId = "configured-http";
    const room = env.ROOM_STATE.getByName(roomId);
    await room.seedChoices([{ id: "first", label: "First" }]);
    const url = `http://example.com/rooms/${roomId}`;
    const headers = {
      "content-type": "application/x-www-form-urlencoded",
      origin: "https://presenter.example",
    };

    const first = await handleRoomRequest(new Request(url, { body: "choice=first", headers, method: "POST" }), env, {
      allowedOrigins: ["https://presenter.example"],
    });
    const cookie = first?.headers.get("set-cookie") ?? "";
    expect(cookie).not.toContain("Secure");

    const second = await handleRoomRequest(
      new Request(url, { body: "choice=first", headers: { ...headers, cookie: cookie.split(";", 1)[0] ?? "" }, method: "POST" }),
      env,
      { allowedOrigins: ["https://presenter.example"] },
    );
    expect(second?.headers.has("set-cookie")).toBe(false);

    await expect(
      handleRoomRequest(new Request(url, { body: "choice=first", headers, method: "POST" }), env, {
        allowedOrigins: ["https://presenter.example"],
        voterCookieMaxAgeSeconds: 1,
      }),
    ).rejects.toThrow(/integer from 60/);
  });

  it("keeps room administration behind explicit authorization", async ({ expect }) => {
    const request = new Request("https://example.com/internal/room");
    const roomId = "admin-http";
    const deny = () => false;
    const allow = async () => true;

    await expect(seedRoom(request, env, roomId, [{ id: "first", label: "First" }], deny)).rejects.toBeInstanceOf(
      RoomAdministrationUnauthorizedError,
    );
    await expect(seedRoom(request, env, roomId, [{ id: "first", label: "First" }], allow)).resolves.toMatchObject({
      revision: 1,
      status: "open",
    });
    await expect(setRoomStatus(request, env, roomId, "locked", allow)).resolves.toMatchObject({
      revision: 2,
      status: "locked",
    });
    await expect(resetRoom(request, env, roomId, allow)).resolves.toMatchObject({ revision: 2, totalVotes: 0 });
  });
});
