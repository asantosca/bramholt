# App Installation — Jim &amp; Kara (prototype)

An interactive, runnable implementation of the **two-device onboarding flow**: Kara (the
caregiver) sets Bramholt up on **bramholt.com** — a mobile-first website — and texts her
father Jim a link with his code baked in; Jim (the elder) taps it and the **Bramholt Android
app** connects itself.

> **Platform split** (see `company/decisions/0003-kara-web-jim-app.md`): Kara is a
> **mobile-first responsive website**, not an app. Jim's side is the **only native app**.
> One app in the store to maintain.

Implemented from the Claude Design source `App Installation - Jim & Kara.dc.html`
([project](https://claude.ai/design/p/c8494d6f-d89a-414c-b7b9-fbf05c6d4498)). The design's
canvas mockup is turned into a real, navigable HTML prototype here.

## Run it
It's a static page — just open `index.html` in a browser (needs internet for Google Fonts
and the Lucide icon CDN):

```
# from this folder
python -m http.server 8000      # then visit http://localhost:8000
# …or simply double-click index.html
```

## What's here
| Path | Purpose |
|------|---------|
| `index.html` | The prototype. Two modes + two flows (see below). |
| `ds/` | The Bramholt design system, mirrored from the source project (tokens + components). |
| `assets/bramholt-mark.svg` | The brand emblem used on the welcome screens. |

## How to use it
- **Walkthrough** mode shows one device and lets you step through. Advance by tapping the
  on-screen **gold / dark button** (the real CTA), the **← back** chevron, the **arrow keys**,
  or the bottom dock. The "Connecting…" screen (J3) auto-advances, like the real app.
- The **Kara · Web** / **Jim · Android app** toggle switches between the two flows (7 screens each).
- For Kara, a **Desktop / Mobile** toggle (top bar) shows the same website reflowing between a
  laptop browser and a phone browser — mobile-first, desktop-capable.
- **All screens** mode lays out every screen like the design canvas; click any one to jump
  into the walkthrough at that point.

## Flows
**Kara — bramholt.com (responsive website):** K1 Welcome → K2 Create account →
K3 Who you're protecting → K4 Send Jim the app → K5 Choose protection → K6 People Jim trusts →
K7 Connected. Rendered in a browser frame; reflows desktop ↔ mobile.

**Jim — Android app:** J1 Welcome → J2 Auto-connect (code from Kara's text) → J3 Connecting →
J4 Allow protection → J5 Forward calls → J6 People Jim trusts → J7 All set. Rendered in a phone frame.

## Design-system sync
`ds/` is a faithful copy of `_ds/bramholt-design-system-…` from the source design project.
If those tokens change upstream, re-pull them so this prototype stays on-brand. The screen
markup mirrors the design's structure and copy verbatim.

## Notes / fidelity
- The harness (toolbar, phone bezel, browser chrome, nav dock) is added scaffolding, not part
  of the product UI. Kara's screens reflow via a layout toggle rather than real CSS media
  queries, so the Desktop/Mobile switch works regardless of your actual window size.
- Inputs are shown read-only with the design's placeholder data (Kara / Jim Bramwell) — this
  is a click-through prototype, not a working signup. No real texting, forwarding, or payment.
