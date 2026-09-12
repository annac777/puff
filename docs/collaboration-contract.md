# Collaboration contract

## Engineering / Product Integration

Owns Manifest V3 architecture, permissions, service worker, content script, aggregate telemetry, tab/idle events, persisted state, breakpoint rules, debug controls, tests, integration and demo stability.

## UX / Product Design

Owns the flow and final treatment for all six `AgentMode` states, overlay dimensions, spacing, typography, copy, button states, pet assets, empty/error states, motion timing, first-run privacy explanation and demo story.

## Frozen handoff

- Overlay target width: 320 px; bottom-right placement for MVP.
- State names and action names must not diverge from `docs/mvp-scope.md`.
- Exported assets go in `extension/assets/` using lowercase kebab-case names.
- Motion specs must name trigger, duration, easing and reduced-motion fallback.
- Engineering exposes all states through the popup; design does not need live sensing to review them.

## Merge gates

1. Skeleton and contract frozen.
2. Loadable functional extension with placeholder visual and all forced states.
3. Final visual assets integrated without changing behavior names.
4. Full real-Chrome rehearsal.
5. Submission freeze: blocker and demo-path fixes only.
