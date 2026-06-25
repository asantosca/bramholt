# Bramholt — Company Workspace

This repository is the operating system for **Bramholt**, a company run by a solo founder.
It holds *everything* — strategy, product, design, marketing, docs, code, and ops — so that
Claude Code can work across every function with full context.

> Stage: **Pre-product / idea stage.** The weight right now is on strategy, product
> definition, design, and early marketing. `dev/` is a placeholder until the stack is chosen.

## What Bramholt is
<!-- One paragraph: what we're building, for whom, and why it matters.
     Fill this in — it's the single most important context for every task. -->
_TODO: describe the product, the target customer, and the core problem._

## How to work in this repo
- **Markdown-first.** Everything except `dev/` is markdown so it can be drafted and edited directly.
- **Scope by folder.** Each business area has its own directory (see README.md for the map).
- **Log decisions.** Non-obvious choices go in `company/decisions/` as dated records (ADR style).
- **One source of truth.** Strategy lives in `company/strategy.md`; the plan in `company/roadmap.md`.

## Voice & brand
<!-- How Bramholt sounds in writing — for marketing copy, docs, and product text. -->
_TODO: 3–5 adjectives + a do/don't list. See `design/brand/voice.md`._

## Conventions
- Dates are absolute (`2026-06-25`), never "last week".
- Decision records and meeting notes are prefixed with their date: `YYYY-MM-DD-title.md`.
- Keep large binary assets out of git history (see `.gitignore`); use a links file or Git LFS.
