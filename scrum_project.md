# Scrum project · GitHub Copilot contract form

Last updated: 2026-11-10. Jira is the source of truth for task status and evidence; the current code is the source of truth for implementation. The PDF defines the six-step requirements.

## Current decisions

- This is a fictional six-step simulation without a backend or real charges. The form follows the homepage's Mona Sans and GitHub palette, sits after the customer carousel, and does not change the navbar, homepage modules, or 3D models. Use Bootstrap first.
- Below 1200 px, navigation follows the visible step's height; from 1200 px, it stays below the tallest natural step. The gap is 20 px. Values survive navigation, and reduced motion is respected.
- The review has four cards (two per row from 768 px), live totals separated by billing unit, and a masked card number without CVV. Five edit links return to steps 1-5. Two required and one optional consent have sample-text modals; `Confirm request` remains disabled.
- Simulated success follows the PDF: return to the top of the home and show a closable Bootstrap modal once, without repeating after reload. The approved error presentation uses Bootstrap `is-invalid`/`invalid-feedback`, field messages, and a linked summary; error colors are `#2a1215` / `#f85149`.

## Task log

| Task | Change; test and result |
| --- | --- |
| SCRUM-7 | PDF requirements and six steps recorded in Jira; final Jira status unconfirmed. |
| SCRUM-8 | Individual Copilot Pro ($10/month), Pro+ ($39/month), and Max ($100/month) selected; prices sourced from https://github.com/features/copilot/plans. Recheck before future pricing changes. |
| SCRUM-9 | Mona Sans and GitHub colors selected; error and attention colors recorded above. Final Jira status unconfirmed. |
| SCRUM-10 | Three accessible plan radio cards with decorative aura; complete browser/keyboard and homepage regression review pending. |
| SCRUM-13 | Three optional priced add-ons with checkboxes and explained Codespaces storage dependency; complete keyboard review pending. Sources: https://docs.github.com/en/billing/concepts/product-billing/github-codespaces and https://github.com/pricing. |
| SCRUM-14 | Seven labeled personal-data fields and 5 px label offset; full keyboard review pending. |
| SCRUM-15 | Spanish address fields, province codes `01`-`52`, optional floor/door, and `country=ES`; full field and keyboard review pending. |
| SCRUM-16 | Fictional card fields only; no real payment or premature success notice. |
| SCRUM-17 | Mobile/tablet navigation follows visible-step height below 1200 px; desktop keeps a fixed natural boundary. Chrome 375/768/1199/1200: 20 px gap, no document overflow. |
| SCRUM-18 | Partial visual review of step 6 passed across mobile, tablet, and desktop; complete review of steps 1-5 pending. |
| SCRUM-19 | Directional Previous/Next animation, reduced-motion support, and value retention; Chrome 375/768/992/1199/1200 passed forward/backward without JavaScript exceptions. |
| SCRUM-21 | Responsive four-card review and sixth step navigation; Chrome 375/768/1200/1440 passed without document overflow. |
| SCRUM-22 | Live summary, masked card and separate monthly/hourly/GB-month prices; Chrome 375/768/1200/1440 passed, CVV absent. The compact cards use equal row heights and GitHub styling. |
| SCRUM-23 | Five edit links open steps 1-5 and preserve values; Chrome 320/375/768/1200 passed, including keyboard activation and return to review. |
| SCRUM-24 | Three initially unchecked consents, three sample modals, purple keyboard focus, and disabled final submit; Chrome 320-1440 passed without document overflow. |
| SCRUM-25 | Exclusive card/bank radios switch visible, enabled fields without losing values; review shows only the active method. Chrome 375/768/1200 passed for pointer/keyboard switching, FormData, masked card, 20 px gap, and no overflow or JavaScript errors. |
| SCRUM-26 | Corrected missing-plan feedback and centered GitHub-red add-on error; success modal now has a GitHub-dark container and plain English simulation text without a yellow notice. Linked error summary remains. HTML/CSS inspection and `git diff --check` passed; browser, keyboard, and twelve PDF scenarios remain pending. |

The form-wide decorative nebula has no confirmed Jira task; do not assign it one by assumption.

## Pending

- Do not claim server validation without a backend.
- Complete the PDF's twelve test cases, full keyboard-only and homepage regression checks, and record the results in Jira. Jira statuses remain unconfirmed here.
