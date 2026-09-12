Update the existing Version 4 Puff experience.

Keep the current Puff character, visual identity, weather concept, typography, colors, rounded cards, and overall interface direction.

Do not redesign the product concept.

This update is focused on how Puff behaves as an embedded floating widget on top of the user’s current webpage.

CORE INTERACTION MODEL

Puff must live directly on the user’s current webpage.

Do not open Puff in a new browser tab.

Do not navigate the user away from their current page.

Do not introduce a separate technical connection screen as part of the primary user experience.

Puff should feel like a lightweight ambient companion that stays available without blocking the user’s work.

PLACEMENT

Place Puff in the bottom right corner of the current webpage.

Maintain consistent safe spacing from the viewport edges.

The widget should visually anchor to the bottom right corner.

When expanded, the panel should grow upward and toward the left so that it remains anchored to the same bottom right location.

COLLAPSED STATE

The collapsed state should be extremely lightweight and unobtrusive.

Show only the Puff character whenever possible.

Remove the large background container behind Puff.

Do not make the collapsed state look like a card or mini window.

Puff should appear as a small floating cloud companion directly above the webpage.

Keep Puff visually consistent with the current character design.

The visible character can be compact, but maintain an accessible interactive hit area around it.

Use a minimum interactive target of approximately 44 by 44 px.

The interactive area may be visually transparent.

Add:

A subtle hover response

A clearly visible keyboard focus state

An accessible label such as:

“Open Puff”

Do not rely on Puff’s facial expression alone to communicate interactivity.

Optionally show a small tooltip on hover or keyboard focus:

“Open Puff”

EXPANDED STATE

When the user activates Puff, expand a compact panel from the same bottom right position.

The panel should expand upward and toward the left.

Do not center the panel on the screen.

Do not cover more of the webpage than necessary.

Reduce the overall height compared with the current Version 4 implementation.

Prioritize compact vertical spacing.

Show only information relevant to the current handoff state.

Do not stretch the panel simply because additional content exists.

If content becomes longer than the available panel height, use an internal scroll area rather than increasing the full widget height.

Keep primary actions visible without excessive scrolling whenever possible.

The expanded experience should still clearly contain:

Puff

Current state or status

Relevant context

Primary action

Necessary secondary controls

But avoid large decorative empty areas.

RESPONSIVE HEIGHT

Design the expanded panel so that it does not dominate the webpage.

Use a moderate default height.

Allow the panel to adapt to different viewport heights.

Set a maximum height based on the viewport rather than using one large fixed height.

For smaller screens, allow internal vertical scrolling.

Keep the panel visually anchored to the bottom right corner.

MINIMIZE

Include a clear minimize control in the expanded panel.

When the user selects minimize:

Collapse the panel back into the small Puff launcher.

Do not reset the user’s state.

Do not clear text the user already entered.

Do not cancel an active agent task.

Do not remove saved context.

Do not reset progress.

The minimized Puff should visually indicate when an agent task is still running.

For example, use a subtle small motion, glow, or status dot.

Do not use a distracting badge or continuous strong animation.

HIDE PUFF

Hide Puff must be a separate action from minimize.

Minimize means:

“Keep Puff available, but compact.”

Hide Puff means:

“Remove Puff from my current view.”

Do not combine these behaviors.

Place Hide Puff as a secondary or overflow action rather than next to the primary task controls.

Consider using a small overflow menu with:

Hide Puff

Pause Puff

Privacy or settings if needed

Do not make Hide Puff easier to trigger accidentally than Minimize.

HIDING BEHAVIOR

When Puff is hidden, the current handoff state or running agent task should not automatically be destroyed.

The UI should make it clear that hiding the companion is a visibility preference, not necessarily task cancellation.

Do not represent Hide Puff as task cancellation.

ACCESSIBILITY

Accessibility is required even when the collapsed visual is only the Puff character.

Ensure:

Minimum approximate 44 by 44 px interactive target

Keyboard accessibility

Visible focus state

Accessible control names

Sufficient contrast

No interaction that depends only on hover

No important status communicated by animation alone

Reduced motion support

If Puff is shown without a visible background container, make sure the character remains visible against both light and dark webpage backgrounds.

Consider a subtle adaptive outline, soft shadow, or neutral halo around Puff so it stays legible without looking like a button card.

Do not add a heavy rectangular background solely for contrast.

WEBSITE OCCLUSION

The main design goal of this update is to reduce how much of the current webpage Puff covers.

Prefer:

A character only collapsed launcher

A shorter expanded panel

Compact spacing

Internal scrolling for long content

Progressive disclosure for secondary information

Expandable sections for details and sources

Avoid:

Tall fixed panels

Large empty padding

Full height sidebars

Large background containers around the collapsed launcher

Separate full page experiences for basic Puff interactions

COMPANION CONSISTENCY

Keep Puff as the same character across collapsed and expanded states.

Do not create a different mascot for the launcher.

Preserve the existing weather based visual language.

In collapsed mode, weather and status changes should be simplified.

Examples:

quiet

Small calm Puff

considering

Very subtle atmospheric particles

gentle_nudge

Small warm light

checkpoint

Tiny context indicator or soft glow

on_break

Subtle active status motion

resume

Warm clear glow

Do not overcrowd the collapsed launcher with context chips or text.

Detailed context belongs inside the expanded panel.

INTERACTION PROTOTYPE

Create a click through prototype showing:

1. Puff collapsed in the bottom right corner of a webpage

2. User activates Puff

3. Puff expands upward and toward the left

4. User enters or reviews handoff content

5. User minimizes Puff

6. Puff returns to the collapsed launcher while preser
