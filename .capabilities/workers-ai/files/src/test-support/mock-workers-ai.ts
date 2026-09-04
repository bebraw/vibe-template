import type { WorkersAiRunner } from "../lib/workers-ai";

export interface MockWorkersAiCall {
  input: Record<string, unknown>;
  signal: AbortSignal;
}

export function createMockWorkersAi(handler: (call: MockWorkersAiCall) => Promise<unknown> | unknown): {
  calls: MockWorkersAiCall[];
  runner: WorkersAiRunner;
} {
  const calls: MockWorkersAiCall[] = [];

  return {
    calls,
    runner: {
      async run(input, signal) {
        const call = { input, signal };
        calls.push(call);
        return await handler(call);
      },
    },
  };
}
