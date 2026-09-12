# Interaction scenarios

## Primary demo: focused writing or coding in Chrome

1. The user works across a document, reference tabs and a web tool.
2. Aggregate typing/scroll activity indicates sustained browser work.
3. The threshold passes while the user is still typing quickly; the agent remains in `considering` and does not interrupt.
4. Typing stops or the user changes tabs; the agent treats this as a possible boundary.
5. A small pet/overlay offers **Take a break** or **Later**.
6. Later returns the UI to quiet mode and records the response locally.
7. At the next candidate boundary, the intervention becomes **Save your place first?**
8. Take a break stores the active tab title/URL as a lightweight checkpoint.
9. Resume shows the held context and returns the user to work.

## Optional break-time task

Before leaving, the user can approve exactly one bounded task. The break screen shows what is running, what data it can access and how to cancel. On return, the result appears beside the checkpoint. The strongest MVP candidates are:

1. Group the current session's open tabs into Keep / Close later / Return first.
2. Collect cited links from already-open tabs into a return packet.
3. Turn the user-provided “next thought” into a concise restart card.

The first build should select only one. A broad “work while you rest” promise would collapse the product into a generic assistant and introduce too many permissions.

## Growth incentive

The visual object changes only on meaningful transitions: accepting an off-ramp, completing a break and successfully resuming. It should not grow from raw hours worked. The metaphor should communicate continuity—something was safely held while the user was away.

## Required edge scenarios

### Continuous typing

The agent must not place a strong nudge over active composition. It may show only the subdued `considering` state.

### Repeated Later

The product should become more helpful, not more aggressive: offer checkpointing rather than a louder reminder.

### Restricted browser page

On `chrome://`, Chrome Web Store and other protected pages, the content overlay cannot appear. The popup should explain that the current page is unavailable rather than implying a crash.

### Service worker sleep

Closing and reopening the popup must recover counts, mode and response history from local storage.

### Idle/locked computer

Idle or locked is a device state, not proof of a break or fatigue. It can mark a transition but must not create health claims.

### First use and privacy

Explain that the MVP counts events and reads active tab title/URL locally. It does not retain typed characters, clicked content, screenshots or page body text.

## Figma-to-code handoff

The designer can work in Figma immediately. Engineering can use the result directly only when the handoff contains implementation facts—not merely a visual screenshot.

For every state frame, provide:

- 320 px overlay width and responsive height.
- Exact spacing, corner radius, colors and type styles.
- Component variants for buttons and pet states.
- Auto Layout constraints.
- Motion trigger, duration and easing.
- SVG assets where possible; PNG only for raster art.
- A text layer for every product string so copy remains editable.
- Names matching the frozen modes: `quiet`, `considering`, `gentle_nudge`, `checkpoint`, `on_break`, `resume`.

Engineering will translate the Figma specs into `styles.css` and replace placeholder assets in `extension/assets/`. Figma is not automatically production code; Dev Mode/CSS values and exported assets speed up implementation, while interaction logic remains in the extension.
