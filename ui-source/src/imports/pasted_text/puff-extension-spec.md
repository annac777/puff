Design a polished, friendly Chrome extension experience for an adaptive break agent with a small cloud companion named “Puff.”

CORE PRODUCT IDEA

This is not a Pomodoro timer or a generic break reminder.

People often avoid breaks because stopping feels expensive. While deeply focused, they are holding temporary context in their head, such as what they just changed, why they changed it, what they need to check next, and what is still unresolved.

Puff reduces this task resumption cost.

Puff quietly observes lightweight local activity signals, waits for a natural stopping point, saves the user’s work context, encourages a short recovery break, and helps the user immediately resume afterward.

The core promise is:

“Puff holds your place, so you can clear your head.”

The cloud metaphor represents mental load. During focused work, Puff quietly stays nearby. At a natural stopping point, Puff holds the user’s work context. During the break, Puff keeps that context safe. When the user returns, Puff gives it back as a clear next step.

PRODUCT PERSONALITY

Puff should feel:

Warm
Calm
Supportive
Cute
Trustworthy
Playful
Non judgmental
Quietly intelligent

The experience should have light gamification and emotional personality without feeling childish.

Think of Puff as a quiet companion, not a productivity coach.

Never use guilt based language.

Never make the user feel punished for skipping a break.

Never make Puff look sick, sad, angry, or disappointed because the user continued working.

VISUAL DIRECTION

Create a minimal, soft cloud character.

Puff should have:

A simple rounded cloud silhouette
Two small expressive eyes
A very subtle mouth when appropriate
Soft expressions
Minimal details
No complex human body
No detailed arms or legs

Use Puff’s shape, expression, glow, surrounding particles, and subtle motion to communicate state.

Use a modern productivity app aesthetic with:

Warm off white or very light neutral background
Soft sky blue as the primary companion color
A small warm yellow accent representing recovery and sunlight
Dark neutral text with accessible contrast
Rounded cards
Generous whitespace
Subtle shadows
Simple iconography
Clean modern typography

Avoid excessive gradients, glassmorphism, cartoon styling, bright gaming UI, or complex dashboards.

CHROME EXTENSION REQUIREMENTS

Design the experience specifically as a compact Chrome extension popup.

Use exactly 320 px width.

Use vertical Auto Layout throughout.

Keep the experience compact and scannable.

Use approximately:

16 px outer padding
12 to 16 px spacing between major sections
8 to 12 px corner radius for cards
40 to 44 px button height

Create reusable components.

All text must remain editable.

Do not convert important UI copy into images.

SIX REQUIRED STATES

Create six separate extension frames.

Use these exact frame and state names:

quiet
considering
gentle_nudge
checkpoint
on_break
resume

Do not rename these states.

1. quiet

Purpose:

The user is actively working and Puff should remain unobtrusive.

Puff:

Small
Calm
Floating gently
Neutral happy expression

Headline:

“You’re in a good flow.”

Supporting copy:

“I’ll stay out of the way.”

Show a subtle status:

“Focused for 32 min”

Do not show a primary CTA.

The overall feeling should be:

“I’m here if you need me, but I won’t interrupt you.”

Motion annotation:

Puff slowly floats or breathes.

Duration: 2.4 seconds
Ease in out
Loop

2. considering

Purpose:

Puff notices that the user has been focused for a while but does not yet believe this is the right moment to interrupt.

Puff:

Slightly more alert
Eyes looking upward or sideways
A few tiny dots or particles suggesting quiet processing

Headline:

“Finding a good moment…”

Supporting copy:

“You’ve been focused for a while.”

Add a very subtle status indicator suggesting Puff is waiting rather than actively interrupting.

Do not use a loading spinner.

Do not make the state feel urgent.

Motion annotation:

Very subtle cloud movement or small floating dots.

Duration: 1.2 seconds
Ease in out
Loop

3. gentle_nudge

Purpose:

A possible transition point is approaching, but Puff is still protecting the user’s focus.

Puff:

Moves slightly closer
Small friendly expression
A subtle glow or tiny movement to attract attention without demanding it

Headline:

“Almost a good time to pause.”

Supporting copy:

“I’ll wait until you reach a natural stopping point.”

Include a subtle secondary action:

“Remind me later”

This state should communicate:

“I noticed you may need a break, but your focus comes first.”

Motion annotation:

One gentle upward movement or soft bounce.

Duration: 300 milliseconds
No continuous distracting animation

4. checkpoint

THIS IS THE MOST IMPORTANT STATE.

Give this frame the strongest visual hierarchy and most design attention.

Purpose:

Puff has detected a natural stopping point and preserved enough work context for the user to safely step away.

Puff should visually communicate:

“I’ve got your place.”

Make Puff slightly larger and more expressive.

Show a subtle visual metaphor of Puff holding the user’s context.

For example, small abstract context tokens or tiny labels can gently float inside or around Puff:

“navbar”
“768px”
“tests”

Keep these subtle and visually clean.

Headline:

“Good stopping point”

Supporting message:

“I saved your place.”

Create a prominent context card titled:

“Saved your place”

Inside the card show:

“Just finished”
“Updating the responsive navbar”

Then:

“Next”
“Check the 768px breakpoint”

Clearly differentiate the completed context from the next action.

Primary CTA:

“Take a 2 min break”

Secondary CTA:

“Not now”

Include an optional tertiary action:

“Take it from here”

Below it, explain:

“I can run the remaining tests while you take a break.”

The primary visual message should be:

The user does not need to remember everything because Puff is holding the context.

Motion annotation:

Context card gently expands into view.

Duration: 240 milliseconds
Ease out

Puff can give a very subtle reassuring bounce.

5. on_break

Purpose:

The user accepted the break.

The visual experience should feel noticeably lighter than the focused states.

Puff:

Relaxed
Floating comfortably
Receiving subtle warm sunlight
Closed or relaxed eyes
Clearly recharging without looking sleepy or unproductive

Headline:

“Your place is saved.”

Supporting copy:

“Step away. Stretch. Grab some water.”

Show a prominent countdown:

“01:42”

Add a subtle gamification message:

“Puff is recharging too.”

If the user chose “Take it from here,” show a small agent status card:

“Running tests while you recharge…”

Do not overload this screen with information.

The user should feel comfortable physically leaving the computer.

Motion annotation:

Warm glow or sunlight gently pulses.

Duration: 800 milliseconds
Slow and subtle

6. resume

Purpose:

The user has returned and should be able to immediately reconstruct their mental context.

Puff:

Bright
Refreshed
Slightly more energetic
Small warm glow or sunlight behind it

Use a very small visual reward showing that a healthy recovery moment was completed.

Do not use points or competitive scores.

Headline:

“Welcome back”

Supporting copy:

“Here’s where you left off.”

Create a context card.

Section:

“Completed”

“Updated responsive navbar”

Section:

“Next”

“Check the 768px breakpoint”

If Puff performed the bounded task during the break, add:

“While you were away”

“Tests completed”

“1 mobile breakpoint test still needs attention.”

Primary CTA:

“Resume work”

Secondary CTA:

“View details”

The “Next” action should be visually prominent so the user can immediately continue.

Motion annotation:

Puff becomes slightly brighter and a tiny warm light appears.

Duration: 400 milliseconds
Soft spring motion

GAMIFICATION SYSTEM

Use very light, emotionally positive gamification.

Do not use:

Leaderboards
Competitive points
Punishing streaks
Lost streak warnings
Badges everywhere
Levels that dominate the interface

Instead use visual recovery.

Every completed healthy break slightly improves Puff’s surrounding atmosphere.

Examples:

A tiny warm light appears
A small star appears
The sky around Puff becomes slightly clearer
Puff becomes subtly brighter
A small sunlight particle appears

Optionally show a small status such as:

“3 recovery moments today”

Keep this secondary.

The purpose of gamification is to make healthy breaks feel rewarding, not obligatory.

PRIVACY ONBOARDING

Create three additional 320 px Chrome extension onboarding frames.

Use the same visual system and Puff character.

Onboarding 1

Show Puff holding a few small abstract context tokens.

Headline:

“Take breaks without losing your flow”

Body:

“Puff finds natural moments to pause and keeps track of where you left off.”

Primary CTA:

“Continue”

Onboarding 2

Show Puff with a small privacy shield.

Headline:

“Private by default”

Body:

“Puff uses lightweight activity signals such as typing, idle time, tab switching, and save events.”

Create a visually emphasized privacy statement:

“We don’t read your page content unless you give permission.”

Primary CTA:

“Got it”

Onboarding 3

Headline:

“You stay in control”

Body:

“Puff will always ask before reading screenshots, documents, code, or page content.”

Show a simple permission control:

“Allow page context when needed”

Add supporting text explaining that this permission can be changed later.

Primary CTA:

“Start focusing”

COMPONENTS

Create reusable components for:

Puff companion
Context card
Status indicator
Timer
Primary button
Secondary button
Tertiary text button
Permission toggle

BUTTON STATES

For primary and secondary buttons create:

Default
Hover
Pressed
Disabled

Keep interactions accessible and clearly differentiated.

DEMO STORY

Make the six frames visually tell one continuous story.

The demo user is working on a responsive navbar.

They have been working continuously for approximately 55 minutes.

Puff initially stays quiet.

Puff notices a possible transition point but waits while the user is actively working.

The user finishes editing the responsive navbar and runs tests.

Puff detects this as a natural stopping point.

Puff preserves:

Completed:
Responsive navbar update

Next:
Check the 768px breakpoint

Puff suggests a two minute break.

The user chooses:

“Take it from here”

Puff runs the remaining tests while the user takes a break.

When the user returns, Puff reports:

Tests completed.

One mobile breakpoint still needs attention.

The user sees exactly what to do next and selects:

“Resume work”

DESIGN PRINCIPLE

The most important concept the design should communicate is:

Puff is not reminding the user to stop working.

Puff is making it easier to stop because the user knows their mental context will not be lost.

The emotional transformation should feel like:

“I can’t stop right now because I’ll lose my place.”

to

“Puff has my place. I can step away for two minutes.”

Prioritize checkpoint, on_break, and resume as the strongest moments of the experience.

Make the result polished enough for a hackathon demo while keeping all UI practical enough for a developer to recreate in CSS.
