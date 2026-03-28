const appTitle = "vibe-template Worker";
const appDescription = "A minimal Cloudflare Worker baseline for experiments, tests, and local CI.";
const exampleRoutes = [
  { path: "/", purpose: "HTML stub app for developers" },
  { path: "/api/health", purpose: "JSON health endpoint for tooling and smoke tests" },
];

export default {
  fetch(request: Request): Response {
    return handleRequest(request);
  },
};

export function handleRequest(request: Request): Response {
  const url = new URL(request.url);

  if (url.pathname === "/") {
    return htmlResponse(renderHomePage());
  }

  if (url.pathname === "/api/health") {
    return Response.json({
      ok: true,
      name: "vibe-template-worker",
      routes: exampleRoutes.map((route) => route.path),
    });
  }

  return htmlResponse(renderNotFoundPage(url.pathname), 404);
}

export function renderHomePage(): string {
  const routeList = exampleRoutes.map((route) => `<li><code>${escapeHtml(route.path)}</code> - ${escapeHtml(route.purpose)}</li>`).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(appTitle)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5efe6;
        --surface: rgba(255, 251, 245, 0.92);
        --ink: #1e1a16;
        --muted: #5f554b;
        --accent: #0b6e4f;
        --accent-strong: #084c39;
        --line: rgba(30, 26, 22, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: Georgia, "Times New Roman", serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(11, 110, 79, 0.18), transparent 35%),
          linear-gradient(180deg, #f7f0e8 0%, var(--bg) 100%);
      }

      main {
        width: min(56rem, calc(100vw - 2rem));
        margin: 0 auto;
        padding: 4rem 0 5rem;
      }

      .card {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 1.5rem;
        box-shadow: 0 1.5rem 4rem rgba(30, 26, 22, 0.08);
        overflow: hidden;
      }

      .hero {
        padding: 3rem;
        border-bottom: 1px solid var(--line);
      }

      .eyebrow {
        margin: 0 0 0.75rem;
        font-size: 0.85rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--accent);
      }

      h1 {
        margin: 0;
        font-size: clamp(2.25rem, 7vw, 4rem);
        line-height: 0.95;
      }

      .lede {
        max-width: 42rem;
        margin: 1rem 0 0;
        font-size: 1.1rem;
        line-height: 1.7;
        color: var(--muted);
      }

      .content {
        display: grid;
        gap: 1.5rem;
        padding: 2rem 3rem 3rem;
      }

      section {
        padding: 1.5rem;
        border: 1px solid var(--line);
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.72);
      }

      h2 {
        margin: 0 0 0.75rem;
        font-size: 1.15rem;
      }

      p,
      li {
        line-height: 1.6;
        color: var(--muted);
      }

      ul {
        margin: 0;
        padding-left: 1.25rem;
      }

      a {
        color: var(--accent-strong);
        font-weight: 700;
      }

      code {
        font-family: "SFMono-Regular", Menlo, monospace;
        font-size: 0.95em;
      }

      @media (max-width: 640px) {
        .hero,
        .content {
          padding-inline: 1.25rem;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <article class="card">
        <section class="hero">
          <p class="eyebrow">Starter Surface</p>
          <h1>${escapeHtml(appTitle)}</h1>
          <p class="lede">${escapeHtml(appDescription)}</p>
        </section>
        <div class="content">
          <section>
            <h2>What this gives you</h2>
            <p>A concrete Worker entry point, a simple HTML page, a health endpoint, and testable flows that keep the template green from the start.</p>
          </section>
          <section>
            <h2>Available routes</h2>
            <ul>${routeList}</ul>
          </section>
          <section>
            <h2>Next steps</h2>
            <p>Replace this stub with your real feature work, update the relevant spec, and keep the quality gate passing as the app evolves.</p>
            <p>Health probe: <a href="/api/health">/api/health</a></p>
          </section>
        </div>
      </article>
    </main>
  </body>
</html>`;
}

export function renderNotFoundPage(pathname: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Not Found</title>
  </head>
  <body>
    <h1>Not Found</h1>
    <p>No route is defined for <code>${escapeHtml(pathname)}</code>.</p>
  </body>
</html>`;
}

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
