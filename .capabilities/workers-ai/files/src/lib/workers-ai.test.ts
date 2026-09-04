import { describe, expect, it } from "vitest";
import { createMockWorkersAi } from "../test-support/mock-workers-ai";
import { runStructuredAi } from "./workers-ai";

interface ExampleOutput {
  summary: string;
}

const schema = {
  additionalProperties: false,
  properties: { summary: { type: "string" } },
  required: ["summary"],
  type: "object",
};

function isExampleOutput(value: unknown): value is ExampleOutput {
  return (
    typeof value === "object" &&
    value !== null &&
    "summary" in value &&
    typeof value.summary === "string" &&
    Object.keys(value).length === 1
  );
}

describe("runStructuredAi", () => {
  it("returns validated structured model output", async () => {
    const mock = createMockWorkersAi(() => ({ response: { summary: "model value" } }));

    await expect(
      runStructuredAi({
        fallback: { summary: "fallback value" },
        messages: [{ role: "user", content: "Provide a summary." }],
        runner: mock.runner,
        schema,
        validate: isExampleOutput,
      }),
    ).resolves.toEqual({ source: "model", value: { summary: "model value" } });

    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0]?.input).toMatchObject({ response_format: { type: "json_schema" } });
  });

  it("parses a JSON string before validating it", async () => {
    const mock = createMockWorkersAi(() => ({ response: '{"summary":"model value"}' }));

    await expect(
      runStructuredAi({
        fallback: { summary: "fallback value" },
        messages: [],
        runner: mock.runner,
        schema,
        validate: isExampleOutput,
      }),
    ).resolves.toEqual({ source: "model", value: { summary: "model value" } });
  });

  it("uses the deterministic fallback for invalid output", async () => {
    const fallback = { summary: "fallback value" };
    const mock = createMockWorkersAi(() => ({ response: { unexpected: true } }));

    await expect(runStructuredAi({ fallback, messages: [], runner: mock.runner, schema, validate: isExampleOutput })).resolves.toEqual({
      source: "fallback",
      value: fallback,
      reason: "invalid-output",
    });
  });

  it("distinguishes binding failures from timeouts", async () => {
    const fallback = { summary: "fallback value" };
    const failed = createMockWorkersAi(() => {
      throw new Error("binding unavailable");
    });
    const delayed = createMockWorkersAi(
      ({ signal }) =>
        new Promise((_, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
        }),
    );

    await expect(
      runStructuredAi({ fallback, messages: [], runner: failed.runner, schema, validate: isExampleOutput }),
    ).resolves.toMatchObject({ reason: "binding-error", source: "fallback" });
    await expect(
      runStructuredAi({
        fallback,
        messages: [],
        runner: delayed.runner,
        schema,
        timeoutMs: 1,
        validate: isExampleOutput,
      }),
    ).resolves.toMatchObject({ reason: "timeout", source: "fallback" });
  });
});
