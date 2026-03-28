# vibe-template

This is a template for my vibecoding projects and it captures what I consider my best practices so I don't have to repeat them for each experiment.

## Agent Context

This template vendors the ASDLC knowledge base in `.asdlc/`.

- Start with `.asdlc/SKILL.md` for ASDLC concepts, patterns, and practices.
- Use `AGENTS.md` as the Codex-native context anchor for this repo.

## Local CI

This template is set up for the local Agent CI runner from `agent-ci.dev`.

- Install dependencies with `npm install`.
- Start a Docker runtime before running Agent CI.
- Run the local workflow with `npx agent-ci run --workflow .github/workflows/ci.yml`.
- Run all relevant workflows with `npx agent-ci run --all`.
- If a run pauses on failure, fix the issue and resume with `npx agent-ci retry --name <runner-name>`.
- In a normal cloned repo, keep the `origin` remote configured so Agent CI can inspect repository metadata cleanly.
