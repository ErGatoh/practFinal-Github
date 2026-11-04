# Scrum project · GitHub Copilot contract form

Last updated: 2026-11-04.

## Purpose

Keep the Jira task scope and project decisions available on disk. Jira remains the source of truth for task status, time spent, acceptance checks, and evidence. Update this document as each task is reviewed; do not infer completion from plans.

Later approved corrections in this document supersede conflicting statements in an original task boundary or historical EARS prompt. The current files on disk remain the implementation source of truth.

## Approved shared decisions

- The six-step form is a simulation using fictional data. No real payments or backend are planned.
- The form is inserted in the existing `index.html`, between the customer carousel (`.customer-strip`) and the Copilot workflow (`.workflow-section`). Existing homepage content, navbar, carousel, 3D canvases, interactions, and JavaScript remain unchanged.
- Copilot Pro ($10 USD/month), Pro+ ($39 USD/month), and Max ($100 USD/month) are the three principal plans. Source: https://github.com/features/copilot/plans (consulted during planning; check current prices before future changes).
- Use Bootstrap first for layout and controls; custom CSS only for the visual identity Bootstrap cannot provide.
- On mobile and tablet, show one full-width plan card per row. From 1200 px, show three cards in one row. Preserve the page's side gutters.
- Reuse Mona Sans and the homepage palette: black `#000000`, panel `#0d1117`, text `#f0f6fc`, borders `#30363d`, green action `#08872b`, Copilot accent `#a371f7`.
- Only invalid fields receive error styling. Error: background `#2a1215`, text `#f85149`, darker border. Attention: background `#302203`, text `#d29922`, darker border. Errors require text and accessible attributes, not color alone.
- Development phases: (1) HTML and responsive design; (2) navigation, controls, and state; (3) validation and KO/OK paths. Do not implement a later phase before its approval.

## Current handoff

- Branch: `feature/formulario`, tracking `origin/feature/formulario`.
- The working tree contains uncommitted form work in `AGENTS.md`, `css/style.css`, `index.html`, `js/contract-form-navigation.js`, `js/contract-form-nebula.js`, `js/contract-plan-aura.js`, and `scrum_project.md`.
- `js/homepage.js` also has a local modification outside the latest form corrections. Do not revert, overwrite, or include it in form work without reading it and receiving explicit approval.
- Implemented form steps: 1 plan, 2 optional add-ons, 3 personal details, 4 Spanish address, and 5 fictional card details.
- Implemented navigation: Previous and Next traverse steps 1-5, preserve native control values, update progress, stop at the available boundaries, animate in opposite directions, and respect reduced motion.
- The step stage reserves the tallest responsive step height so Previous and Next remain in the same form position. Hidden fieldsets remain invisible and non-interactive.
- Implemented decoration: shared plan aura and a subtle form-wide nebula canvas. The nebula has no confirmed Jira task and must not be attributed by assumption.
- Not implemented: step 6, totals, legal consent controls, custom validation, KO/OK routes, submission behavior, backend, payment, final scroll, or the fixed success notice.
- Approved future completion: step 6 will review the request, total, and legal consent controls. After a successful simulated confirmation, return to the absolute top and show a closable Bootstrap notice fixed to the viewport for approximately ten seconds, once, with `Pago realizado` and `No se realizará ningún cargo a la cuenta.`
- Pending verification: real-browser visual checks on mobile, tablet, and desktop; keyboard-only checks; homepage regression checks; and the twelve PDF test cases when their corresponding phases exist.

## Latest verification

- `node --check js/contract-form-navigation.js`: passed.
- `node --check js/contract-form-nebula.js`: passed.
- Simulated animated navigation: advance, reverse movement, boundaries, one visible step, and retained values passed (`animated navigation and state: OK`).
- Simulated reduced-motion navigation and retained values passed (`reduced motion and state: OK`).
- Stable navigation test confirmed no temporary JavaScript stage height, retained values, one visible step, and the step-5 boundary (`stable navigation and state: OK`).
- `git diff --check`: passed without whitespace errors; only expected LF-to-CRLF working-copy warnings were reported.
- Code-level checks do not replace the pending browser, responsive, visual, accessibility, and homepage regression checks.

## Jira task tracking

| Task | Goal / approved scope | Status known here | Evidence / next check |
| --- | --- | --- | --- |
| SCRUM-7 | Break down PDF requirements into a six-step matrix and common rules in Jira. | Documented in Jira; final status not confirmed here. | Verify all six rows, common rules, and reference to twelve tests in Jira. |
| SCRUM-8 | Research official GitHub plans and select individual Copilot Pro, Pro+, and Max subscriptions. | Selection decided; final Jira status not confirmed here. | Jira comparison, official links, decision rationale, and recorded time. |
| SCRUM-9 | Define the form's colors, typography, spacing, Bootstrap components, and responsive appearance. | Visual choices discussed; final Jira status not confirmed here. | Check the Jira guide includes error and attention colors. |
| SCRUM-10 | Insert the form after the customer carousel with step 1 of 6 and three accessible plan cards. | Implementation complete; browser verification pending. | Check responsive layout, radio exclusivity, keyboard use, aura, homepage regressions, and Git diff. |
| SCRUM-13 | Add at least two real optional products with prices and checkboxes, including one explained dependency. | Implementation and approved visual corrections complete; browser verification pending. | Check independent keyboard selection, taller responsive cards, purple states, warning SVG, and responsive layout. |
| SCRUM-14 | Create the personal-data template with all required labeled fields and appropriate input types. | Implementation and label-spacing correction complete; browser verification pending. | Inspect labels and attributes, verify the 5 px label offset, responsive layout, and keyboard order. |
| SCRUM-15 | Specify and create the Spanish-address step required by the practice. | Implementation complete; verification pending. | Reveal step 4, inspect Spanish address fields and province codes, then record evidence in Jira. |
| SCRUM-16 | Add fictional card fields without connecting or performing a real payment. | Static fields implemented; premature success notice removed; browser verification pending. | Inspect card templates and fictional-data guidance; confirm no success notice, payment, storage, or network request occurs in step 5. |
| SCRUM-19 | Implement JavaScript navigation between the existing form steps while preserving entered values. | Navigation, directional animation, reduced motion, and stable button position implemented; browser verification pending. | Traverse steps 1-5 in both directions and verify progress, controls, values, animation, reduced motion, and stable navigation position. |

Other Jira tasks will be recorded here when their actual titles and scopes are provided.

## SCRUM-10 original implementation boundary (historical)

- `index.html`: only add a new standalone section between `.customer-strip` and `.workflow-section`; keep all existing markup intact. Include a form with `action`, `method`, `target`, `name`, and `novalidate`, a static step indicator, three radio plan cards, a disabled Previous button, and a Next button with no navigation yet.
- `css/style.css`: only append form-scoped CSS. Bootstrap supplies the container, 12-column responsive grid, card, form control, button, and spacing utilities; scoped CSS supplies exact GitHub colors, typography, selection appearance, and form-specific spacing.
- Approved design correction in progress: use the translucent photo-frame pattern from `.collaboration-image-canvas` around each plan card; keep the checked border purple, remove the blue click focus, and preserve a purple keyboard focus indicator. Add one static purple/pink/pink-white aura canvas behind all three cards.
- Exception approved for `js/contract-plan-aura.js`: decorative drawing and resize only. No navigation/state/validation or other form steps in this task. Do not edit `AGENTS.md`, the existing homepage sections, or document files unrelated to this task.
- Approved follow-up correction in progress: extend the shared canvas past the card edges and soften its fade; visually hide the real radios while retaining exclusive and keyboard-accessible selection; replace the checked purple border with slight enlargement and a brief selection animation; add a dark-purple pointer-following spotlight to every card. This explicitly extends `js/contract-plan-aura.js` to decorative pointer and radio-change effects only, without navigation or validation.

## Evidence to collect for SCRUM-10

- Mobile: one card per row, no horizontal scroll.
- Tablet: one wider card per row, with consistent side gutters.
- Desktop (at least 1200 px): three cards in one row.
- Radio selection: one active plan at a time, also usable by keyboard with a visible focus indicator.
- Existing carousel controls and Copilot model still work; no new console errors.
- Review the diff to ensure existing HTML/CSS was not rewritten. Record the relevant commit link in Jira when a commit is made.

## SCRUM-13 original implementation boundary (historical)

- `index.html`: add a hidden step 2 fieldset after the principal-plan fieldset. It contains three real optional GitHub services with checkboxes and official billing units: Codespaces 2-core compute ($0.18 USD/hour), Codespaces storage ($0.07 USD/GB-month), and a Git Large File Storage data pack ($5 USD/month for 50 GB storage and 50 GB bandwidth).
- The interface explains that Codespaces storage requires the 2-core Codespaces environment in this simulation. The storage checkbox references that explanation with `aria-describedby`.
- `css/style.css`: use Bootstrap for the grid, cards, checkboxes, spacing, and alert; add only form-scoped GitHub colors and checked, hover, and keyboard-focus states.
- Step 2 remains hidden until the navigation phase. Do not add Next-button behavior, state management, totals, or dependency validation in SCRUM-13.
- Official sources consulted on 2026-11-03: https://docs.github.com/en/billing/concepts/product-billing/github-codespaces and https://github.com/pricing.

## Evidence to collect for SCRUM-13

- Temporarily reveal step 2 during testing and verify that all three checkboxes can be independently selected with pointer and keyboard.
- Verify one card per row below 1200 px and three cards per row from 1200 px, without horizontal scrolling.
- Verify every price states its billing unit and the Codespaces storage dependency is visible and programmatically associated.
- Confirm the add-on corrections do not alter the implemented navigation or existing homepage behavior.

## SCRUM-14 original implementation boundary (historical)

- `index.html`: add a hidden step 3 fieldset after add-ons with required controls for first name, last name, DNI, email, email confirmation, phone number, and date of birth.
- Every control has an associated label, unique `id`, submission `name`, an appropriate HTML type, and autocomplete metadata where applicable. DNI remains a text control because it includes a letter.
- Bootstrap supplies the responsive 12-column grid and form controls: one field per row on mobile and two fields per row from the medium breakpoint.
- `css/style.css`: add only form-scoped colors and focus styling needed to integrate Bootstrap controls with the homepage identity.
- Step 3 remains hidden until the navigation phase. Do not add navigation, state persistence, or JavaScript validation in SCRUM-14.

## SCRUM-14 Jira documentation

**Main EARS prompt**

> Contexto: formulario de contratación por pasos con HTML5 y Bootstrap. Necesito generar la plantilla estática del paso de datos personales. El sistema deberá incluir los campos nombre, apellidos, DNI, correo electrónico, confirmación del correo, teléfono y fecha de nacimiento. Cada campo deberá tener una etiqueta asociada, un nombre para el envío y un tipo HTML adecuado. Mientras la navegación entre pasos no esté implementada, el paso de datos personales deberá permanecer oculto. Devuelve únicamente la estructura HTML responsive con Bootstrap, sin navegación ni validación JavaScript.

**Decisions**

Native controls and Bootstrap were accepted. All fields are required; DNI uses `text`, both email fields use `email`, phone uses `tel`, and birth date uses `date`. Format, matching, DNI control-letter, phone, and age checks are deferred to the JavaScript validation phase.

## Evidence to collect for SCRUM-14

- Temporarily reveal step 3 and verify all seven required controls are present in the expected visual and keyboard order.
- Verify each label targets its control and each control has a unique `id`, a `name`, and the agreed type.
- Verify one field per row on mobile and two per row from 768 px, without horizontal scrolling.
- Confirm the personal-data correction does not alter navigation behavior or field values.

## SCRUM-15 original implementation boundary (historical)

- The acceptance criterion is interpreted as the Spanish address format defined by the practice, not certification of general legal compliance.
- `index.html`: add a hidden step 4 fieldset with street type, street name, number, optional floor or door, postal code, city or town, and province. A hidden `country=ES` value and visible text limit the simulation to Spain.
- Province is a select containing the 50 provinces plus Ceuta and Melilla. Values use official postal prefixes `01` through `52` so the later JavaScript validation can compare the selected value with the postal-code prefix.
- Postal code uses a five-digit HTML pattern only as structural support. Because the form has `novalidate`, JavaScript must later enforce the `01`-`52` range and province correspondence.
- Bootstrap supplies the responsive grid, controls, and selects. Existing form-scoped personal-control styles are extended to the address step.
- Step 4 remains hidden until the navigation phase. Do not add navigation, state persistence, or JavaScript validation in SCRUM-15.

## SCRUM-15 Jira documentation

**Main EARS prompt**

> Contexto: formulario de contratación por pasos con HTML5 y Bootstrap limitado a direcciones de España. El sistema deberá solicitar tipo y nombre de vía, número, código postal, localidad y provincia, y permitirá indicar piso o puerta de forma opcional. Cada campo deberá tener una etiqueta asociada, un nombre de envío y un control adecuado. Mientras la navegación no esté implementada, el paso de dirección deberá permanecer oculto. Donde se introduzca el código postal, el sistema deberá limitar su plantilla a cinco cifras. Devuelve únicamente HTML responsive y los estilos necesarios, sin navegación ni validación JavaScript.

**Decisions**

The practice's Spanish address rules were used instead of claiming broad legal compliance. Street number remains a text control to support suffixes such as `12B`; postal code is a five-character text control with numeric input mode; province is selected from codes `01` to `52`. Floor or door is the only optional address field.

## Evidence to collect for SCRUM-15

- Temporarily reveal step 4 and verify all address controls, labels, names, and required states except the optional floor or door.
- Verify the province list contains exactly codes `01` through `52`, including Ceuta and Melilla.
- Verify the postal-code template accepts five digits structurally and that `country=ES` is included in submitted form data.
- Verify the responsive layout and keyboard order, and confirm the address step works with the approved navigation without validation.

## SCRUM-16 original implementation boundary (historical)

- `index.html`: add a hidden step 5 fieldset with required fictional cardholder, 16-digit card number, `MM/AA` expiry, and three-digit CVV controls.
- The original task requested a `Pago realizado` notice above the controls. This was superseded by the approved correction at the end of this document: step 5 now contains only fictional-data guidance, and the success notice is reserved for the future confirmed completion flow.
- Card fields are text controls with numeric input modes where appropriate. They use HTML length and pattern attributes only as structural support and disable autocomplete to avoid suggesting stored real payment details.
- No gateway, backend, network request, charge, storage, navigation, or JavaScript validation is added. Luhn and date checks remain part of the later validation phase.
- Bootstrap supplies the responsive grid and controls. Existing form-control styles are extended to step 5; no success alert is rendered there.
- Bank debit is not added because SCRUM-16 only specifies card fields. It remains required by the overall practice and must be covered by a later approved task.

## SCRUM-16 Jira documentation

**Historical main EARS prompt (success-notice placement superseded)**

> Contexto: formulario académico de contratación con HTML5 y Bootstrap. El pago será exclusivamente una simulación y no utilizará backend ni pasarela de pago. El sistema deberá mostrar el texto «Pago realizado» y, en texto más pequeño, «No se realizará ningún cargo a la cuenta». El sistema deberá incluir campos accesibles para titular, número de tarjeta de 16 cifras, caducidad en formato MM/AA y CVV de tres cifras. Mientras la navegación no esté implementada, el paso de pago deberá permanecer oculto. Si se muestran campos de tarjeta, entonces el sistema deberá evitar sugerir datos bancarios reales mediante autocompletado. Devuelve únicamente la plantilla HTML responsive y los estilos Bootstrap necesarios, sin cobro, envío, navegación ni validación JavaScript.

**Decisions**

Text controls were chosen instead of number controls to preserve leading zeroes and allow grouped card-number formatting. Autocomplete is disabled, and the interface explicitly requests fictional data. Luhn, expiration, and CVV checks are deferred to the JavaScript validation phase; no real payment operation exists.

## Evidence to collect for SCRUM-16

- Navigate to step 5 and verify fictional-data guidance appears without a premature `Pago realizado` success notice.
- Verify all four controls have associated labels, names, required states, and the agreed structural formats.
- Verify the number template accepts either 16 contiguous digits or four groups of four digits, expiry uses `MM/AA`, and CVV contains three digits.
- Verify responsive layout and keyboard order, and confirm no payment request, storage, or network request occurs.

## SCRUM-19 original implementation boundary (historical)

- `index.html`: identify each existing fieldset with an ordered `data-contract-step` and label, identify the progress text and navigation buttons, and load a dedicated form-navigation module.
- `js/contract-form-navigation.js`: show exactly one existing step, update `Step X of 6` and its label, and move one step with Previous or Next.
- Previous is disabled on step 1. Next is disabled on step 5 because step 6 has not been implemented yet; adding a sixth marked fieldset later will make it part of the same navigation automatically.
- Values are preserved because navigation only changes each fieldset's `hidden` property and never recreates, resets, submits, or serializes controls.
- No validation, error presentation, total calculation, payment behavior, submission, persistence across reloads, or homepage JavaScript is added.

## SCRUM-19 Jira documentation

**Main EARS prompt**

> Contexto: formulario de contratación con cinco pasos HTML ya creados y un total previsto de seis. Necesito implementar únicamente la navegación con JavaScript nativo. Cuando se pulse Siguiente, el sistema deberá ocultar el paso actual y mostrar el siguiente paso existente. Cuando se pulse Anterior, el sistema deberá mostrar el paso anterior sin validar el paso abandonado. Mientras el usuario navegue entre pasos, el sistema deberá conservar los valores introducidos. El sistema deberá actualizar el número y el nombre del paso visible, deshabilitar Anterior en el primer paso y deshabilitar Siguiente en el último paso actualmente disponible. No implementes validaciones, errores, cálculos, envíos ni lógica de pago.

**Decisions**

Navigation uses ordered `data-*` attributes instead of hard-coded field selectors. State remains in the existing native controls while fieldsets are hidden. The script is separate from homepage and decorative form JavaScript, and it intentionally stops at the fifth implemented step.

## Evidence to collect for SCRUM-19

- Verify initial state: step 1 visible, Previous disabled, Next enabled, and progress reads `Step 1 of 6`.
- Navigate to step 5 and back to step 1, confirming one visible fieldset and the correct progress label at every step.
- Enter representative values and selections in steps 1-5 and confirm they remain unchanged after moving backward and forward.
- Confirm Next is disabled on step 5 and no validation, submit, network request, payment operation, or console error occurs.

## Approved corrections after SCRUM-19

- SCRUM-13: the optional add-on cards retain real independent checkboxes while adopting the plan-card frame, checked indicator, and purple keyboard focus. The dependency notice now begins with a yellow warning SVG. Evidence: `index.html` add-on fieldset and `css/style.css` `.contract-addon-*` and `.contract-warning-icon`.
- SCRUM-14: personal-data labels are offset 5 px to the right. Evidence: `css/style.css` `.contract-personal-step .form-label`.
- SCRUM-16: remove the premature `Pago realizado` notice from the card-entry step and its card-number description reference. The approved final notice is reserved for the future completion flow. Evidence: `index.html` payment fieldset.
- SCRUM-19: Next moves old content left and new content in from the right; Previous reverses both directions. Navigation remains value-preserving and stops at step 5 until step 6 is implemented. Evidence: `js/contract-form-navigation.js` and the `.contract-step-stage` wrapper.
- Decorative nebula behind the entire form across steps: no existing Jira task has been identified for this newly requested behavior; do not attribute it by assumption. Evidence: `index.html` canvas, `js/contract-form-nebula.js`, and scoped canvas CSS.
- Future approved behavior, not implemented now: step 6 reviews the request and legal consents; only after a successful final confirmation will the page return to its absolute top and display a closable Bootstrap notice fixed to the viewport for approximately ten seconds, once. The approved notice text is `Pago realizado` with `No se realizará ningún cargo a la cuenta.` No step 6, validation, or confirmation logic is included in this correction.
- SCRUM-13 correction: increase the optional add-on cards' responsive minimum height so their vertical presence matches the intended selection-card treatment without enlarging the checkbox indicator. Evidence: `css/style.css` `.contract-addon-card`.
- SCRUM-19 correction: all steps share the tallest responsive stage height, keeping Previous and Next in the same form position while hidden steps remain invisible and non-interactive. The animation no longer writes a temporary inline stage height. Evidence: `css/style.css` `.contract-step-stage` and `js/contract-form-navigation.js`.
