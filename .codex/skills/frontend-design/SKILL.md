---
name: frontend-design
description: Design or substantially restyle frontend pages, components, and app shells, extend the starter Worker’s editorial UI, or refresh its README screenshot.
---

# Frontend Design

Build on the surrounding UI and existing tooling. A new dependency, build step, or parallel design system needs user approval.

For the [starter Worker](../../../specs/stub-worker/spec.md), follow the narrow layout and serif typography in the [home view](../../../src/views/home.ts) and reuse the [single-accent theme tokens](../../../src/tailwind-input.css). Extend the route rows to new capabilities, match new inputs to the links’ rounded edges and visible focus rings, and keep status text inline. Introduce a new visual identity when the user requests one.

Use the verified rendered page as the source for the README image. Refresh the screenshot manually after a material UI change, following the [README screenshot contract](../../../specs/readme-docs/spec.md).
