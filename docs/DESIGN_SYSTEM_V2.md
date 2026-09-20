# Studepartment Global Product Design System v2

Studepartment is a global medical research intelligence platform. Its interface should feel closer to a premium scientific instrument and editorial research publication than a generic SaaS dashboard.

## Design posture

The visual language combines two qualities:

1. Editorial scientific authority.
2. Precision research software.

The product should communicate trust, rigor, restraint, and international relevance before decoration.

## Typography

### Editorial display

Newsreader is reserved for high-value research-facing titles:

- page hero titles
- Scientific Identity names
- key research statements
- selected analytical headings

It should not be used for dense UI labels, controls, or data tables.

### Product sans

Manrope is the primary interface typeface.

Use it for:

- navigation
- buttons
- controls
- filters
- descriptions
- metadata
- cards
- system messages

### Data mono

IBM Plex Mono is reserved for:

- identifiers
- release/version values
- numeric trust/evidence summaries
- technical source IDs
- machine-readable research references

## Color system

The palette is intentionally restrained.

- warm scientific white for main surfaces
- soft mineral gray for workspace background
- graphite-black for high-trust actions and dark intelligence surfaces
- teal only for evidence, trust, active research context, and meaningful interaction
- amber for caution/eligibility nuance
- red only for destructive/error states

Teal must not become decorative wallpaper.

## Geometry

The platform avoids both extreme square enterprise UI and soft consumer-app pills.

- controls: 9–10px radius
- cards: 14–18px radius
- major intelligence surfaces: 20–30px radius
- pills only for true metadata/status tags

Borders are preferred over heavy shadows. Elevation is quiet and evidence-oriented.

## Navigation

The sidebar is a stable research instrument.

Navigation groups:

- Research
- Identity & evidence

Active navigation uses:

- narrow teal evidence rail
- low-opacity intelligence wash
- stronger icon state
- no oversized selected pill

The top bar provides research context, global search access, real system readiness, and Scientific Identity access.

## Information hierarchy

Each primary screen follows:

1. research context / eyebrow
2. editorial headline
3. plain-language interpretation
4. decision surface
5. evidence / controls / actions

Do not lead with grids of cards when the user first needs to understand context.

## Components

### Cards

Cards should encode one scientific decision or evidence unit.

Avoid:

- meaningless equal-size metric tiles
- decorative gradients
- generic icon-in-circle patterns
- arbitrary engagement counters

Prefer:

- provenance
- source freshness
- match reasons
- evidence state
- eligibility distinction
- clear next action

### Buttons

Primary actions use graphite, not brand teal.

Teal is reserved for scientific/evidence emphasis and active states.

### Inputs

Research-intent inputs receive more visual importance than secondary filters.

The main query field should feel like the command surface of a research system, not a form control.

### Evidence states

Verified, corroborated, source-backed, and asserted are visually distinct but restrained.

Evidence level must never be presented as researcher quality or institutional prestige.

## Motion

Motion is short and functional.

Allowed:

- 1–3px hover lift
- subtle border/elevation transitions
- mobile navigation slide
- loading shimmer
- readiness pulse

Avoid large parallax, bouncy spring motion, or decorative looping animation.

## Responsive behavior

Desktop prioritizes research density and parallel evidence.

Tablet collapses secondary side rails before reducing content legibility.

Mobile preserves:

- page context
- primary question/action
- provenance
- trust signals

Do not simply shrink desktop cards.

## Accessibility

- English is the product UI language.
- Maintain keyboard-visible focus.
- All navigation states must have semantic current-page state.
- Color may reinforce status but cannot be the only status signal.
- Body text must remain readable at typical research-workstation zoom levels.
- Dense metadata may use smaller type only when contrast and grouping remain clear.

## Product boundary

Studepartment must not visually drift toward:

- social network engagement UI
- public popularity rankings
- consumer wellness aesthetics
- crypto/fintech dashboard styling
- generic admin templates

The design should make scientific reasoning, evidence, and controlled action feel native to the product.
