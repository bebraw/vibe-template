# Development

This document collects development-facing setup and workflow notes for the template.

## Agent Context

The template vendors the ASDLC knowledge base in `.asdlc/`.

- Start with `.asdlc/SKILL.md` for ASDLC concepts, patterns, and practices.
- Use `AGENTS.md` as the Codex-native context anchor for this repo.

## Local CI

This template is set up for the local Agent CI runner from `agent-ci.dev`.

### Prerequisites

- Install dependencies with `npm install`.
- Start a Docker runtime before running Agent CI.
- In a normal cloned repo, keep the `origin` remote configured so Agent CI can inspect repository metadata cleanly.

### Commands

- Run the local workflow with `npx agent-ci run --workflow .github/workflows/ci.yml`.
- Run all relevant workflows with `npx agent-ci run --all`.
- If a run pauses on failure, fix the issue and resume with `npx agent-ci retry --name <runner-name>`.
