export interface AiMessage {
  role: "assistant" | "system" | "user";
  content: string;
}

export interface WorkersAiRunner {
  run(input: Record<string, unknown>, signal: AbortSignal): Promise<unknown>;
}

export type StructuredAiFallbackReason = "binding-error" | "invalid-output" | "timeout";

export type StructuredAiEvent =
  | { event: "workers-ai.call.start" }
  | { event: "workers-ai.call.finish"; outcome: "model" }
  | { event: "workers-ai.call.finish"; outcome: "fallback"; reason: StructuredAiFallbackReason };

export type StructuredAiResult<T> =
  | { source: "model"; value: T }
  | {
      source: "fallback";
      value: T;
      reason: StructuredAiFallbackReason;
    };

export interface StructuredAiRequest<T> {
  fallback: T;
  log?(event: StructuredAiEvent): void;
  messages: AiMessage[];
  runner: WorkersAiRunner;
  schema: Record<string, unknown>;
  timeoutMs?: number;
  validate(value: unknown): value is T;
}

const defaultTimeoutMs = 5_000;
const defaultLog = (event: StructuredAiEvent): void => console.log(JSON.stringify(event));

export function createWorkersAiRunner(env: Pick<Env, "AI" | "AI_MODEL">): WorkersAiRunner {
  return {
    async run(input, signal) {
      return await env.AI.run(env.AI_MODEL, input, { signal });
    },
  };
}

export async function runStructuredAi<T>({
  fallback,
  log = defaultLog,
  messages,
  runner,
  schema,
  timeoutMs = defaultTimeoutMs,
  validate,
}: StructuredAiRequest<T>): Promise<StructuredAiResult<T>> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError("timeoutMs must be a positive finite number.");
  }

  emit(log, { event: "workers-ai.call.start" });
  const controller = new AbortController();
  const timeoutError = new Error("Workers AI request timed out.");
  let timedOut = false;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(timeoutError);
    }, timeoutMs);
  });

  let rawOutput: unknown;

  try {
    rawOutput = await Promise.race([
      runner.run(
        {
          messages,
          response_format: {
            json_schema: schema,
            type: "json_schema",
          },
        },
        controller.signal,
      ),
      timeout,
    ]);
  } catch {
    const reason = timedOut ? "timeout" : "binding-error";
    emit(log, { event: "workers-ai.call.finish", outcome: "fallback", reason });
    return {
      source: "fallback",
      value: fallback,
      reason,
    };
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
  }

  const candidate = parseCandidate(rawOutput);

  if (validate(candidate)) {
    emit(log, { event: "workers-ai.call.finish", outcome: "model" });
    return { source: "model", value: candidate };
  }

  emit(log, { event: "workers-ai.call.finish", outcome: "fallback", reason: "invalid-output" });
  return { source: "fallback", value: fallback, reason: "invalid-output" };
}

function emit(log: (event: StructuredAiEvent) => void, event: StructuredAiEvent): void {
  try {
    log(event);
  } catch {
    // Observability must not change the inference or fallback result.
  }
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
