Revise the existing Puff cloud companion experience to reflect an updated product direction.

IMPORTANT PRODUCT SHIFT

This product is no longer primarily a break reminder or wellness timer.

It is a human to agent handoff experience for moments when a user needs to leave unfinished work.

The core user problem is:

“I do not want to leave because I may lose my thought, and explaining everything again to an AI may take longer than doing the task myself.”

The product should make leaving feel safe by:

1. Preserving the user’s current place
2. Helping the user confirm the open question
3. Preserving the user’s chosen next step
4. Proposing one bounded task the agent can perform while the user is away
5. Requiring explicit approval before the agent begins
6. Returning a concise, sourced result
7. Helping the user return to the original work context

CORE PROMISE

“Puff holds your thought while you step away.”

Keep Puff as the existing friendly cloud companion.

Puff is not primarily a wellness or growth mascot.

Puff represents the mental context the user does not want to lose.

Use small context chips around Puff to visually represent the thought being held.

Do not emphasize growth, health scores, streaks, break countdowns, or rewards.

Keep the experience calm, friendly, lightly playful, trustworthy, and professional.

DEMO SCENARIO

The user is a product designer working in Figma.

They are comparing two checkout design frames.

The unresolved question is:

“Inline or expandable help for this mobile form?”

The user wants to step away for lunch.

Puff helps preserve the current Figma anchors and the user confirms the open question.

The agent proposes one bounded task:

“Compare inline and expandable help patterns for mobile forms.”

The deliverable is:

“A short comparison with public source links, trade offs, and remaining uncertainty.”

The agent does NOT inspect screenshots or visually audit the user’s designs.

The available Figma context is metadata such as file, page, selected frame names, IDs, and connection state.

Do not show realistic thumbnails of the user’s frames.

Use labeled context chips instead.

Keep these exact internal state names:

quiet
considering
gentle_nudge
checkpoint
on_break
resume

quiet

Puff stays small and passive.

Do not emphasize focus time.

Suggested invitation when appropriate:

“Stepping away? I can hold your place.”

Primary CTA:

“Hold this thought”

Secondary CTA:

“Not now”

Include subtle hide or pause controls.

The user must always be able to manually start “Hold this thought” without waiting for a focus threshold.

considering

Puff quietly waits for an appropriate moment to offer the handoff.

Do not imply that the user is tired or finished with their task.

Keep Puff subtle and non intrusive.

gentle_nudge

Show a lightweight invitation:

“Stepping away?”

Supporting copy:

“I can hold your place.”

Primary CTA:

“Hold this thought”

Secondary CTA:

“Not now”

Dismissal should feel final and respectful rather than becoming a stronger reminder.

checkpoint

This is one of the two most important screens.

Create a context review and approval experience.

Clearly separate three layers:

OBSERVED

Show only context the system can actually know.

Example:

Figma
Checkout exploration
Frame: Checkout A
Frame: Checkout B

Use compact context or anchor chips.

Show connection state such as:

Live
Stale
Disconnected

OPEN QUESTION

Create an editable input.

Prefill:

“Inline or expandable help for this mobile form?”

Make it clear that this is user confirmed intent, not something inferred solely from frame names.

WHEN I RETURN

Create a second editable input.

Prefill:

“Review the evidence, then test the preferred pattern in the mobile frame.”

Allow the user to correct both fields without losing their existing text.

Before sharing information with an external model, include a clear provider sharing approval and an expandable preview of the data that will be shared.

TASK APPROVAL

Within checkpoint, create a prominent bounded task scope card.

Title:

“Proposed handoff”

Task:

“Compare inline and expandable help patterns for mobile forms.”

Deliverable:

“A short comparison with source links, trade offs, and an unresolved question note.”

Access:

“Your approved question and public web search.”

Limits:

“Up to 3 searches”
“2 minute execution budget”

Clarify that the time budget is an execution limit, not a guaranteed completion time and not a break timer.

Will not do:

“Edit your Figma designs”
“Send messages”
“Publish changes”
“Choose the final design for you”

Primary CTA:

“Approve handoff”

Secondary CTA:

“Just save my place”

Also include:

“Edit task”

and a back or cancel action.

Saving the user’s place and delegating work must feel like separate choices.

on_break

This state represents the user being away while the agent may be working.

Do not design this primarily as a break countdown.

Headline:

“Your thought is held.”

Show the approved task:

“Comparing inline and expandable help patterns”

Show a real task status such as:

“Gathering references…”

Include:

“Your next step is saved.”

Provide a clear:

“Cancel task”

action.

Create visual variants for:

Running
Completed
Failed
Canceled
Interrupted

Do not use fabricated progress percentages.

If the user returns while the task is still running, clearly show that work is still in progress.

resume

This is the second most important screen.

Design it as a concise return receipt.

Headline:

“Welcome back”

Section 1:

YOUR NEXT STEP

“Review the evidence, then test the preferred pattern in the mobile frame.”

Preserve this exactly as the user confirmed it.

Section 2:

WHAT I DID

“Compared inline and expandable help patterns using approved public research.”

Section 3:

WHAT I FOUND

Create a compact comparison between:

Inline help

and

Expandable help

Show concise trade offs rather than a long AI generated response.

Section 4:

SOURCES

Show a short source list with clear source links.

Section 5:

WHAT I DID NOT DO

“Your Figma file was not changed.”

Section 6:

WHAT REMAINS YOURS

“The final pattern decision.”

Primary CTA:

“Return to my frames”

Secondary CTA:

“View sources”

Also design states for:

Ready to restore
Restoring
Restored
Missing frame
Disconnected
Stale session
Browser only fallback

Do not show a successful restore until the Figma adapter confirms that the saved selection and viewport have actually been restored.

SURFACE STRATEGY

Do not squeeze the entire experience into a small Chrome popup.

Use:

A compact on page Puff companion for passive presence and invitations

A compact Chrome popup for current handoff status and entry into details

An expanded extension page for context review, bounded task approval, return receipt, sources, and restoration

Keep the popup compact.

Use a flexible layout for the expanded experience.

VISUAL SYSTEM

Preserve the existing Puff visual identity:

Same cloud silhouette
Same proportions
Same face
Same visual language across every state

Only change:

Expression
Subtle motion
Glow
Context chips
Surrounding information

Keep:

Warm palette
Rounded cards
Calm typography
Editable components
Restrained companion animation
Accessible contrast
Auto Layout

Create reusable components for:

Context anchor chips
Open question input
Next step input
Bounded task scope card
Approval controls
Task status
Comparison result
Source list
Restore status
Connection notice
Privacy notice
Primary button
Secondary button
Puff companion

Include relevant:

Default
Hover
Pressed
Disabled
Focus
Loading
Empty
Error

states.

All text must remain editable.

The key emotional transformation is:

“I cannot leave because I will lose my thought.”

to

“Puff has my thought. I can leave, and I know exactly where I will pick up when I return.”
