import { chromium, expect, test } from "@playwright/test";

interface TraceChunk {
  data: string;
  base64Encoded?: boolean;
  eof: boolean;
}

for (const mode of ["headless shell", "full Chromium"]) {
  test(`collects screenshot trace events with ${mode}`, async () => {
    const options = mode === "full Chromium" ? { executablePath: chromium.executablePath(), args: ["--disable-gpu"] } : {};
    const browser = await chromium.launch(options);

    try {
      const page = await browser.newPage();
      const session = await page.context().newCDPSession(page);
      await session.send("Tracing.start", {
        categories: "devtools.timeline,v8.execute,disabled-by-default-devtools.screenshot",
        transferMode: "ReturnAsStream",
      });

      await page.goto("data:text/html,<h1>Browser tracing regression</h1>");
      await page.waitForTimeout(5_000);

      const completion = new Promise<string>((resolve, reject) => {
        session.once("Tracing.tracingComplete", ({ stream }) => {
          if (stream) resolve(stream);
          else reject(new Error("Screenshot trace did not return a stream."));
        });
      });
      await session.send("Tracing.end");
      const stream = await completion;
      let contents = "";

      while (true) {
        const chunk: TraceChunk = await session.send("IO.read", { handle: stream });
        contents += chunk.base64Encoded ? Buffer.from(chunk.data, "base64").toString("utf8") : chunk.data;
        if (chunk.eof) break;
      }

      await session.send("IO.close", { handle: stream });
      const trace: unknown = JSON.parse(contents);
      expect(trace).toMatchObject({
        traceEvents: expect.arrayContaining([
          expect.objectContaining({
            name: "Screenshot",
            args: expect.objectContaining({ snapshot: expect.any(String) }),
          }),
        ]),
      });
    } finally {
      await browser.close();
    }
  });
}
