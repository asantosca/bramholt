# Bramholt — Company Workspace

This repository is the operating system for **Bramholt**, a company run by a solo founder.
It holds _everything_ — strategy, product, design, marketing, docs, code, and ops — so that
Claude Code can work across every function with full context.

> Stage: **Pre-product / idea stage.** The weight right now is on strategy, product
> definition, design, and early marketing. `dev/` is a placeholder until the stack is chosen.

## What Bramholt is

Bramholt builds a call-screening service that protects an elderly person from scam and spam
phone calls. The person who gets the calls is an aging parent who can't always tell a real bank
or a real relative from a thief. The person who buys it and runs it is their grown child — in
another city, worried. Most tools block robocalls at the front door and stop there. Ours stays
on the line during the live call, the moment when a human voice talks an old person out of their
savings, because that is where the money is actually lost. We don't sell a fortress. We sell the
sense that someone trustworthy is listening, and that the parent never has to feel like a mark.

> **Names.** "Bramholt" is the product. The company is not yet defined. For the full strategy, see `company/strategy.md` and the project brief.
>
> **Domains.** We own **bramholt.com** (canonical) and **bramholt.ca**, which **redirects to
> `.com`**. Use `bramholt.com` as the primary web address; Kara's caregiver site and the app
> install link live there. (Revisit the `.ca` redirect later if a distinct Canadian presence is
> ever wanted. We do **not** own `bramholt.app`.)

## How to work in this repo

- **Markdown-first.** Everything except `dev/` is markdown so it can be drafted and edited directly.
- **Scope by folder.** Each business area has its own directory (see README.md for the map).
- **Log decisions.** Non-obvious choices go in `company/decisions/` as dated records (ADR style).
- **One source of truth.** Strategy lives in `company/strategy.md`; the plan in `company/roadmap.md`.
- **Don't reopen settled ground.** Several things are fixed (e.g. forwarding not porting; buyer ≠ user;
  signals not verdicts). If a task seems to need reversing one, say so and say why — never quietly.

## Voice & brand

Five words: **warm, plain, honest, calm, unpatronising.**

The brand's edge is dignity. Fear-based rivals make the parent feel like a victim; we don't.
Every word should treat the parent as a competent adult and the worried child as someone who
wants to help without taking over.

**Do**

- Write in short words and short sentences. Read it aloud; if it trips, cut it.
- Aim humour at the scam, never at the person being scammed.
- Lead with one honest fact, not a list of features.
- Be plain about what we are — a company building a product — early and on purpose.

**Don't**

- Sell with fear.
- Talk down to the elderly or the family.
- Promise certainty the system can't keep. It gives signals, not verdicts.

See `design/brand/voice.md` for the full guide.

## How to reason here

- **Hold settled questions settled.** Once we fix something, it stays fixed. If new facts force it
  open, flag it and explain — don't reverse it in silence.
- **Split things that are bleeding together.** Name the distinction before judging. Evaluate each side
  on its own (a targeted spoof and a mass robocall are different problems; don't blur them).
- **Trace the consequences.** For any choice, follow what it unlocks and what it breaks two or three
  steps out before giving a verdict.
- **Argue the other side.** Make the strongest case for the option you're about to drop, then find
  where your own pick fails. Premature agreement is the failure to avoid.
- **Length isn't depth.** Structure and distinctions, not volume or hedging.

## Conventions

- Dates are absolute (`2026-06-25`), never "last week".
- Decision records and meeting notes are prefixed with their date: `YYYY-MM-DD-title.md`.
- Keep large binary assets out of git history (see `.gitignore`); use a links file or Git LFS.
