# Global form-label spacing change note

Checked: 2026-07-23

## Scope and gate record

- Classification: global public form usability and readability correction.
- Route evidence: the guest order-tracking fields on `/account` rendered with
  `0px` between the label and input.
- Gate handling: mandatory accessibility/usability exception. The correction
  restores a readable label-to-control relationship and does not alter content,
  hierarchy, controls, or commerce behavior.
- Restraint: only labels directly preceding text-entry controls receive the
  shared `8px` rhythm. Checkbox, radio, hidden-control labels, and wrappers that
  already define the audited field gaps (`gap-2`, `gap-3`, `gap-y-2`, or
  `gap-y-3`) are excluded.

## Verification

- Browser coverage measures both guest order-tracking fields.
- Browser coverage also checks checkbox exclusion and prevents doubled explicit
  gaps.
- Static coverage locks the shared selectors.
