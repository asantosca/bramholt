# 0003 — Kara is mobile-first web; Jim is the only app

- **Date:** 2026-06-25
- **Status:** Accepted

## Context
The onboarding design left Kara's platform ambiguous (it was drawn in an iPhone frame, like
Jim's). Two facts settled it:
1. **The trigger is a visit.** Kara sets Jim up because she's *there* — standing next to him,
   phone in hand, no laptop. So her setup surface must work on a phone, and the two-phone
   handoff (she sets up, texts Jim a link) assumes both are phones in the same room.
2. **At that kitchen-table moment, a web link beats an app install.** Tapping a link is lower
   friction than "App Store → search → install → sign in." Ongoing real-time alerts ("we just
   screened a scam call") lean native, but push can be added later (web push / PWA / thin
   wrapper) without rebuilding her management UI.

## Decision
- **Kara (caregiver):** a **mobile-first responsive website** — renders well on phone *and*
  desktop. Not a native app.
- **Jim (elder):** a **native Android app** (it needs OS-level call handling: receiving calls,
  the forwarding code, the listen permission).
- **One app in the store** (Jim's), so one app to maintain, ship, and pass review.

## Consequences
- (+) Fastest path for a solo founder: web iterates instantly, no store review for Kara's side.
- (+) Frictionless setup at the moment that matters (a tapped link, not an install).
- (+) Single native codebase to maintain.
- (−) Real-time push to Kara is weaker on web; revisit if live alerting becomes a core promise.
- Supersedes the iPhone-framed Kara mockup in
  [[0002-app-installation-prototype]]; the prototype is updated to match.
