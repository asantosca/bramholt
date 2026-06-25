# 0002 — App installation prototype (Jim & Kara)

- **Date:** 2026-06-25
- **Status:** Accepted

## Context
The first product flow designed in Claude Design is the **two-phone onboarding**: Kara (caregiver,
iPhone) sets up Bramholt and texts Jim (elder, Android) a link with his code baked in; Jim taps it
and connects automatically. We needed a runnable artifact, not just a canvas mockup.

## Decision
Implement it as a static, interactive HTML prototype under
`dev/prototypes/app-installation/`, built directly from the design source
`App Installation - Jim & Kara.dc.html`
([project](https://claude.ai/design/p/c8494d6f-d89a-414c-b7b9-fbf05c6d4498)).
The Bramholt design system (tokens + components) is mirrored into `ds/` so the prototype renders
on-brand and can be re-synced if the system changes upstream.

## Consequences
- (+) A clickable flow to test with caregivers/elders before any app code exists.
- (+) Establishes the design-system → `dev/` sync path for future screens.
- (−) `ds/` is a copy; upstream token changes must be re-pulled (noted in the prototype README).
- Reinforces settled product facts: buyer ≠ user (Kara buys, Jim uses); forwarding not porting
  (J5 dials a forwarding code); "signals not verdicts" (J4 copy promises listening, not certainty).
