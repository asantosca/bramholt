# 0001 — Adopt a single company workspace

- **Date:** 2026-06-25
- **Status:** Accepted

## Context
Bramholt is run by a solo founder spanning design, docs, marketing, product, and
development. Splitting these across separate tools/repos fragments context and slows
solo execution.

## Decision
Keep everything in one git-tracked, markdown-first workspace, with a root `CLAUDE.md`
so Claude Code has full cross-functional context. Each business function gets its own
top-level folder. Code lives under `dev/` with its own toolchain.

## Consequences
- (+) One place to find anything; Claude works across functions without re-priming.
- (+) Decisions and history are versioned.
- (−) Large binary design assets need care (Git LFS or external links).

---
_Template for new decisions: copy this file to `NNNN-title.md`, bump the number._
