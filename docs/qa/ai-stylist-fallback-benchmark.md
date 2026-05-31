# AI and Stylist Fallback UX Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-010 AI and Stylist Fallback UX
- `Status`: Supported and implemented

## Scope

This benchmark covers `/ai`, `/stylist`, gift recommendation, stylist chat,
provider unavailable states, quota or rate-limit failure states, and recovery
paths back to product discovery and service.

## Gate Classification

- `Change Type`: AI and stylist degraded-state UX.
- `Route Context`: demoted AI/service tool routes.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: AI/stylist route guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site               | Evidence URL                                                 | Observed Pattern                                                                                              | Weight |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------ |
| Cartier            | https://www.cartier.com/en-us/experience-gift-selection.html | Gift selection is treated as assisted discovery and routes shoppers to boutique or Client Relations guidance. | 1.5    |
| Tiffany & Co.      | https://www.tiffany.com/customer-service                     | Client care groups gift choice, virtual appointments, product help, and service escalation.                   | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/services                       | Services connect gifting, appointments, personalization, order information, care, and store discovery.        | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/contact-us--info.html          | Contact paths include chat, call, web message, and virtual or in-person appointment recovery.                 | 1.5    |
| Van Cleef & Arpels | https://www.vancleefarpels.com/us/en/care-and-services.html  | Care and service content offers advisor contact and appointment recovery instead of relying on one tool.      | 1.5    |
| Boucheron          | https://www.boucheron.com/us/services                        | Services provide contact, size guide, appointment preparation, remote boutique visit, and after-sales paths.  | 1.5    |
| Chopard            | https://www.chopard.com/en-us/pendant/799070-1001.html       | Product assistance includes ambassador contact and boutique appointment actions near product discovery.       | 1.5    |
| De Beers           | https://www.debeers.com/                                     | Client Services support store appointments, live chat, enquiry, email, call back, and fallback contact copy.  | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. AI and stylist tools may expose compact degraded-state
  recovery paths when those paths route to real product discovery, size/service,
  or client-care surfaces and do not promote AI as the primary shopping path.

## Implementation Decision

Implement a narrow degraded-state pass:

- Add a shared AI fallback recovery component for stylist chat and gift
  recommendation failures.
- Show safe, customer-facing copy for unavailable, quota, rate-limit, or
  unknown AI failures without exposing provider credentials or internal model
  names in the UI.
- Route customers to `/search`, a category path, `/size-guide`, and `/service`
  with a prefilled fallback context.
- Keep existing AI SDK transport, chat route, TRPC mutation, product
  recommendation contracts, provider router, and audit behavior unchanged.

## Acceptance Checks

- AI remains a demoted service/tool experience and does not move into primary
  navigation or checkout hierarchy.
- Fallback copy is visible only when AI tool calls fail or degraded states are
  reached.
- Recovery links route to existing product discovery and service surfaces.
- Provider, quota, credential, and model details are not shown directly in the
  customer UI.
- Existing validation messages remain field-oriented and do not get replaced by
  generic AI fallback copy.

## Verification

- `pnpm test -- src/app/ai/_lib/ai-fallback.test.ts src/styles/ai-fallback-recovery.test.ts src/app/api/chat/route.test.ts src/server/ai/model.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Browser smoke for `/stylist` and `/ai?tab=gifts`.

## Residual Risk

The benchmark supports degraded-state recovery only. Any future automatic
appointment booking, AI-authored checkout guidance, live agent routing,
provider-specific quota UI, or AI promotion on primary shopping routes must run
through a new benchmark or provider readiness review.
