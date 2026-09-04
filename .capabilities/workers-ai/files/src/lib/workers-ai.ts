export interface AiMessage {
  role: "assistant" | "system" | "user";
  content: string;
}

export interface WorkersAiRunner {
  run(input: Record<string, unknown>, signal: AbortSignal): Promise<unknown>;
}

export type StructuredAiResult<T> =
  | { source: "model"; value: T }
  | {
      source: "fallback";
      value: T;
      reason: "binding-error" | "invalid-output" | "timeout";
    };

export interface StructuredAiRequest<T> {
  fallback: T;
  messages: AiMessage[];
  runner: WorkersAiRunner;
  schema: Record<string, unknown>;
  timeoutMs?: number;
  validate(value: unknown): value is T;
}

const defaultTimeoutMs = 5_000;

export function createWorkersAiRunner(env: Pick<Env, "AI" | "AI_MODEL">): WorkersAiRunner {
  return {
    async run(input, signal) {
      return await env.AI.run(env.AI_MODEL, input, { signal });
    },
  };
}

export async function runStructuredAi<T>({
  fallback,
  messages,
  runner,
  schema,
  timeoutMs = defaultTimeoutMs,
  validate,
}: StructuredAiRequest<T>): Promise<StructuredAiResult<T>> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  let rawOutput: unknown;

  try {
    rawOutput = await runner.run(
      {
        messages,
        response_format: {
          json_schema: schema,
          type: "json_schema",
        },
      },
      controller.signal,
    );
  } catch {
    return {
      source: "fallback",
      value: fallback,
      reason: timedOut ? "timeout" : "binding-error",
    };
  } finally {
    clearTimeout(timer);
  }

  const candidate = parseCandidate(rawOutput);

  return validate(candidate) ? { source: "model", value: candidate } : { source: "fallback", value: fallback, reason: "invalid-output" };
}

function parseCandidate(rawOutput: unknown): unknown {
  const response = isRecord(rawOutput) && "response" in rawOutput ? rawOutput.response : rawOutput;

  if (typeof response !== "string") return response;

  try {
    return JSON.parse(response);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
