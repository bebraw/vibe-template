# Close Worker Runtime And Capability Readiness Gaps

Use this update after the September 2026 Cloudflare application kits to remove Node built-ins from Web-only Worker bundles, enforce AI deadlines independently of runner cooperation, preserve existing build outputs when adopting browser assets, enable starter observability, and make deployment environments explicit.

## Apply

1. Read ADR-061 and inspect the target's Worker runtime imports, stylesheet test seam, Wrangler observability settings, build scripts, browser-assets kit, Workers AI adapter, and deployment-safety wrapper.
2. Replace Node filesystem probes in production Worker code with injected unit-test dependencies. Add a production-source guard for Node built-in imports only while the target retains a Web-standards-only runtime contract.
3. Race Workers AI calls against an adapter-owned timeout rejection, abort the runner signal at the deadline, and reject non-positive or non-finite durations.
4. Route Wrangler's custom build and Workers Builds through one application-level `build` script that preserves every existing build step before adding `build:browser`. Merge existing watch roots.
5. Enable logs, invocation logs, and traces explicitly in Wrangler configuration, then tune committed sampling rates to the target's traffic and cost envelope.
6. Port `WORKER_ENVIRONMENT` support to every deployment-safety action so preview, status, promotion, and rollback append the same validated `--env` argument.
7. Apply `patch.diff` or record the equivalent global constraints in the target's architecture documentation.

## Fallback

If the target deliberately enables Node compatibility, omit the Node-import guard and document the adopted Node runtime surface. If it already has an application logger, build orchestrator, observability policy, or deployment environment parser, merge these contracts into those existing seams instead of adding parallel machinery.

Do not apply version-preview deployment safety to a Worker with Durable Objects. Design a separately named preview or staging Worker with isolated Durable Object storage in that application.

## Verify

- `npm run worker:node-import-guard`
- Workers AI tests with a permanently pending runner and invalid timeout values
- Deployment-safety wrapper tests with valid and flag-shaped environment values
- `npm run capabilities:verify`, including the composed starter/browser fixture
- `npm run quality:gate`
- `npm run ci:local`
