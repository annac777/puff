Update the Puff companion visual system to use weather as a meaningful visual metaphor across the six existing states.

IMPORTANT

Keep Puff as one consistent character across all six states.

Puff must always preserve exactly the same:

Cloud silhouette
Body proportions
Facial construction
Eye style
Core color palette
Illustration style
Overall visual identity

Do not redesign Puff into six different characters.

Instead, communicate changes in state through:

Subtle facial expression
Cloud density
Glow
Sunlight
Small atmospheric particles
Gentle wind
Context chips
Motion around Puff

CORE WEATHER METAPHOR

Puff represents the user’s temporary mental context.

The surrounding weather represents how that context is being held, transferred, processed, and returned.

Weather should NOT represent whether the user is being productive, healthy, happy, stressed, or doing something good or bad.

Avoid negative emotional weather metaphors.

Do not use storms, lightning, heavy rain, dark threatening clouds, or sad weather as punishment for working too long or dismissing Puff.

The weather system should feel:

Calm
Friendly
Ambient
Playful
Intelligent
Reassuring
Lightly magical

The visual progression should move from quiet awareness, to gathering context, to holding the thought, to agent activity, to clarity on return.

STATE 1

quiet

Weather concept:

Clear Cloud

Show Puff as a small, soft cloud floating peacefully in a mostly clear atmosphere.

Puff has a calm neutral expression.

Use almost no surrounding visual effects.

The experience should communicate:

“I’m here, but I’m staying out of your way.”

Use an extremely subtle floating animation.

Do not use sunlight as a reward yet.

STATE 2

considering

Weather concept:

Gathering Cloud

Keep the exact same Puff character.

Introduce two or three very subtle cloud wisps, dots, or atmospheric particles slowly gathering near Puff.

These represent lightweight context being noticed.

Puff may look slightly more attentive, but not concerned.

Do not make Puff darker or stormy.

The visual should communicate:

“I’m noticing what’s happening and waiting for the right moment.”

STATE 3

gentle_nudge

Weather concept:

Partly Sunny

Keep the same Puff.

Introduce a small warm sun edge or soft ray of light appearing from behind Puff.

This represents an opportunity opening up rather than a reward.

Puff can move slightly closer to the user.

Use the invitation:

“Stepping away?”

Supporting copy:

“I can hold your place.”

Primary action:

“Hold this thought”

Secondary action:

“Not now”

The weather should make the invitation feel optimistic and low pressure.

STATE 4

checkpoint

Weather concept:

Holding the Thought

This is the most important visual state.

Keep Puff clearly recognizable as the same cloud.

Puff now visually holds the user’s temporary context.

Introduce small, clean context chips floating gently around or partially within Puff.

Example context chips:

“Checkout A”

“Checkout B”

“Inline or expandable?”

“Next: review evidence”

Use only a few chips so the interface remains clean.

The chips should visually feel gathered and protected by Puff rather than randomly floating around the screen.

Add a subtle soft glow around Puff to communicate that the context has been captured.

Do not imply that Puff visually inspected the Figma designs.

Use text based anchor chips only.

The emotional message should be:

“I’ve got your thought. You don’t need to keep holding it in your head.”

The weather metaphor should support the handoff review and approval experience without competing with the UI.

STATE 5

on_break

Weather concept:

Cloud in Motion

Keep Puff visually consistent.

Show subtle movement in the surrounding atmosphere, such as:

A gentle breeze
Small moving wisps
Slowly traveling particles
A soft directional motion

This represents the approved agent task being actively performed while the user is away.

Do not make this primarily a relaxation scene.

Do not show Puff sleeping, taking a vacation, or simply recharging.

Puff is holding the user’s context while the agent works.

Show task status such as:

“Your thought is held.”

“Comparing inline and expandable help patterns”

“Gathering references…”

The weather should communicate:

“Something is moving forward while you are away.”

Do not use fabricated progress percentages.

STATE 6

resume

Weather concept:

Clear Sky / Sun Breakthrough

Keep the exact same Puff.

Introduce the clearest and warmest atmosphere of the six states.

Show a soft warm sun appearing behind or beside Puff.

Use a subtle ray of light or small sparkle.

This should represent clarity and orientation, not a gamification reward.

The user has returned and Puff is returning the preserved context in a structured way.

Show:

“Welcome back”

Then prioritize the return receipt:

Your next step

What I did

What I found

Sources

What I did not do

What remains yours

Primary action:

“Return to my frames”

Secondary action:

“View sources”

The visual feeling should communicate:

“You know exactly where you are and what to do next.”

WEATHER TRANSITION SYSTEM

Make the six states feel like one continuous atmospheric story:

quiet

Clear, calm cloud

→

considering

Context begins gently gathering

→

gentle_nudge

A small opening of sunlight appears

→

checkpoint

Puff gathers and holds the user’s thought

→

on_break

The atmosphere moves while the agent works

→

resume

The atmosphere clears and warm sunlight returns

The transitions should be subtle enough for a professional productivity tool.

Do not make the experience look like a weather app.

Do not add temperature, weather forecasts, weather icons, or literal weather labels to the user interface.

Weather is a visual metaphor only.

MOTION

Use restrained motion that can realistically be recreated in CSS.

quiet:

Very subtle vertical float
2.4 seconds
Ease in out
Loop

considering:

Small particles slowly gather toward Puff
1.6 seconds
Ease in out

gentle_nudge:

Soft sunlight fade in
300 milliseconds
Ease out

checkpoint:

Context chips gently gather around Puff
400 milliseconds
Ease out

Add a subtle Puff glow after the context is held.

on_break:

Very slow directional movement of wisps or particles
2 seconds
Linear or gentle ease
Loop

resume:

Soft sunlight reveal
400 milliseconds
Ease out

Optional single sparkle
No continuous celebratory animation

ACCESSIBILITY

Create a reduced motion version of every state.

In reduced motion mode, communicate the weather changes through static differences in:

Sun visibility
Atmospheric particles
Context chip position
Glow
Cloud surroundings

Do not rely on animation alone to communicate state.

DESIGN PRINCIPLE

Puff is always the same companion.

The weather around Puff tells the story.

The weather should help users intuitively understand:

Puff noticed the moment.

Puff gathered the context.

Puff held the thought.

The agent moved one bounded task forward.

Puff returned the thought with greater clarity.

Keep the companion friendly and memorable while ensuring that the handoff context, task approval, and return receipt remain more important than the mascot.
