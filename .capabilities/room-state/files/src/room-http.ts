import type { RoomChoice, RoomSnapshot, RoomStatus } from "./room-state";
import { renderRoomDocument } from "./room-view";

type RoomEnvironment = Pick<Env, "ROOM_STATE">;
type AuthorizeRoomAdministration = (request: Request) => Promise<boolean> | boolean;

export interface RoomRequestOptions {
  allowedOrigins?: readonly string[];
  voterCookieMaxAgeSeconds?: number;
}

const defaultVoterCookieMaxAgeSeconds = 8 * 60 * 60;
const maximumBodyBytes = 4_096;
const maximumCookieMaxAgeSeconds = 365 * 24 * 60 * 60;
const minimumCookieMaxAgeSeconds = 60;
const voterCookieName = "room_voter";
const voterIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export class RoomAdministrationUnauthorizedError extends Error {
  constructor() {
    super("Room administration requires explicit authorization.");
    this.name = "RoomAdministrationUnauthorizedError";
  }
}

export async function handleRoomRequest(
  request: Request,
  env: RoomEnvironment,
  options: RoomRequestOptions = {},
): Promise<Response | undefined> {
  const url = new URL(request.url);
  const roomId = parseRoomId(url.pathname);
  if (!roomId) return undefined;

  const room = env.ROOM_STATE.getByName(roomId);

  if (request.method === "GET") {
    const voterId = readVoterId(request);
    const snapshot = voterId ? await room.getSnapshot(await hashVoterKey(roomId, voterId)) : await room.getSnapshot();
    return htmlResponse(renderRoomDocument({ roomId, snapshot }));
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET, POST" } });
  }

  if (!hasAllowedOrigin(request, options.allowedOrigins)) {
    return new Response("Vote origin is not allowed.", { status: 403 });
  }

  const form = await readUrlEncodedForm(request);
  if (form instanceof Response) return form;

  const choiceId = form.get("choice");
  if (!choiceId) return new Response("Choose one option.", { status: 400 });

  const voter = readOrCreateVoter(request, resolveCookieMaxAge(options.voterCookieMaxAgeSeconds));
  const voterKey = await hashVoterKey(roomId, voter.id);
  const result = await room.castVote(voterKey, choiceId);

  if (!result.ok) {
    if (result.code === "room-locked") return new Response("Voting is locked.", { status: 409 });
    return new Response(result.code === "unknown-choice" ? "Unknown choice." : "Invalid voter.", { status: 400 });
  }

  const headers = new Headers({ location: url.pathname });
  if (voter.cookie) headers.set("set-cookie", voter.cookie);
  return new Response(null, { status: 303, headers });
}

export async function seedRoom(
  request: Request,
  env: RoomEnvironment,
  roomId: string,
  choices: RoomChoice[],
  authorize: AuthorizeRoomAdministration,
): Promise<RoomSnapshot> {
  if (!(await authorize(request))) throw new RoomAdministrationUnauthorizedError();
  return await env.ROOM_STATE.getByName(roomId).seedChoices(choices);
}

export async function resetRoom(
  request: Request,
  env: RoomEnvironment,
  roomId: string,
  authorize: AuthorizeRoomAdministration,
): Promise<RoomSnapshot> {
  if (!(await authorize(request))) throw new RoomAdministrationUnauthorizedError();
  return await env.ROOM_STATE.getByName(roomId).resetVotes();
}

export async function setRoomStatus(
  request: Request,
  env: RoomEnvironment,
  roomId: string,
  status: RoomStatus,
  authorize: AuthorizeRoomAdministration,
): Promise<RoomSnapshot> {
  if (!(await authorize(request))) throw new RoomAdministrationUnauthorizedError();
  return await env.ROOM_STATE.getByName(roomId).setStatus(status);
}

function parseRoomId(pathname: string): string | undefined {
  const match = /^\/rooms\/([^/]+)$/.exec(pathname);
  if (!match?.[1]) return undefined;

  try {
    const roomId = decodeURIComponent(match[1]);
    return roomId.trim().length > 0 && roomId.length <= 128 ? roomId : undefined;
  } catch {
    return undefined;
  }
}

async function readUrlEncodedForm(request: Request): Promise<URLSearchParams | Response> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
  if (contentType !== "application/x-www-form-urlencoded") {
    return new Response("Expected an HTML form submission.", { status: 415 });
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBodyBytes) {
    return new Response("Form submission is too large.", { status: 413 });
  }

  if (!request.body) return new URLSearchParams();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    receivedBytes += value.byteLength;
    if (receivedBytes > maximumBodyBytes) {
      await reader.cancel();
      return new Response("Form submission is too large.", { status: 413 });
    }
    chunks.push(value);
  }

  const body = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new URLSearchParams(new TextDecoder().decode(body));
}

function readVoterId(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const existingId = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${voterCookieName}=`))
    ?.slice(voterCookieName.length + 1);

  return existingId && voterIdPattern.test(existingId) ? existingId : undefined;
}

function readOrCreateVoter(request: Request, maxAgeSeconds: number): { id: string; cookie?: string } {
  const existingId = readVoterId(request);
  if (existingId) return { id: existingId };

  const id = crypto.randomUUID();
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return {
    id,
    cookie: `${voterCookieName}=${id}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${secure}`,
  };
}

function hasAllowedOrigin(request: Request, additionalOrigins: readonly string[] = []): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const requestOrigin = new URL(request.url).origin;
  return origin === requestOrigin || additionalOrigins.includes(origin);
}

function resolveCookieMaxAge(configuredSeconds: number | undefined): number {
  const seconds = configuredSeconds ?? defaultVoterCookieMaxAgeSeconds;
  if (!Number.isInteger(seconds) || seconds < minimumCookieMaxAgeSeconds || seconds > maximumCookieMaxAgeSeconds) {
    throw new TypeError(
      `Voter cookie duration must be an integer from ${minimumCookieMaxAgeSeconds} to ${maximumCookieMaxAgeSeconds} seconds.`,
    );
  }
  return seconds;
}

async function hashVoterKey(roomId: string, voterId: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${roomId}:${voterId}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function htmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "cache-control": "no-store",
      "content-security-policy": "default-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
      "content-type": "text/html; charset=utf-8",
      "referrer-policy": "strict-origin-when-cross-origin",
      "x-content-type-options": "nosniff",
    },
  });
}
