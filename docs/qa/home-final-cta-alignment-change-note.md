# Home final CTA alignment change note

Checked: 2026-07-23

## Scope

Public home-route regression repair for the final “מצאי את התכשיט המושלם
בשבילך” panel. The full-width panel had already been approved and shipped, but
its bounded copy remained aligned to the right edge, leaving a visually
disconnected half-panel on the left.

## High Jewelry Reference Gate record

- Classification: public home UI alignment correction.
- Gate score: not rescored; this is an owner-selected correction to the shipped
  implementation after direct production inspection.
- Exception: explicit owner direction, recorded in the follow-up request as
  “שטח ריק משמאל.”
- Restraint: no new component, content, CTA, decoration, or mobile behavior was
  introduced. Desktop copy and actions are centered inside the existing
  full-width panel.
- Manifesto check: the correction follows `docs/DESIGN.md` Part II, which says
  space should frame reading or action and becomes a failure when it disconnects
  the user from them.

## Verification

- The browser contract measures the title center against the panel center.
- Mobile behavior is unchanged because the alignment rule starts at `1024px`.
- `pnpm verify:fast` passed with 1,767 tests.
