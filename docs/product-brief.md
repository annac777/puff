# Product brief

## Product

**Adaptive Break / Off-Ramp Agent** helps people step away from focused browser work without losing their place.

The problem is not simply forgetting to rest. Stopping has a cognitive cost: the user risks losing the active page, current intention, unresolved question and next step. The product waits for a plausible boundary, offers to hold a lightweight checkpoint, and gives the user a path back in.

## Core loop

```text
Observe local aggregate activity
→ Interpret sustained work and a possible boundary
→ Decide whether to stay quiet or intervene
→ Offer Later or Take a break
→ Observe the response
→ Adapt the next intervention
```

## User and moment

The MVP is for a person doing sustained knowledge work in Chrome. The key moment is the brief pause after a run of typing, scrolling or tab navigation—not an arbitrary timer expiration.

## Product promise

> The agent does not just schedule a break. It creates an off-ramp from the user's current cognitive state—and a path back in.

## Agentic product requirements

The current prototype proves the sensing and intervention UI, but the product becomes genuinely agentic only when it can complete this full loop:

```text
Understand my work → understand my commitments → choose a good moment
→ ask for permission → do a bounded task while I rest → report back
```

### 1. Know what I am doing

The agent builds a lightweight, local picture of the user's current work: active app or tab, recent activity, task duration, tab transitions, the current task phase, and whether the user is mid-action or at a plausible boundary. It should infer only what it needs and clearly distinguish observations from guesses.

### 2. Know my schedule

With permission, the agent reads the user's calendar and near-term commitments. It knows whether a meeting, deadline, commute or planned focus block is approaching, so it never proposes a break that conflicts with the day. Calendar access provides constraints, not automatic authority to change events.

### 3. Know when to intervene—and ask

The agent combines work state, schedule, elapsed focus time, recent dismissals and urgency to choose a low-cost intervention moment. It first offers a choice: keep working, take a break, or take a break while delegating one suggested task. Silence is a valid decision. The user can always dismiss, snooze or disable it.

### 4. Work for me while I rest

After the user explicitly approves a clearly scoped action, the agent can use the break to complete useful work and prepare a concise return report.

Good break-time tasks:

- Research a question and return a short, cited brief.
- Find, compare and rank resources, products or references.
- Summarize open tabs, documents or a long thread.
- Organize tabs into keep, close later and return-to groups.
- Turn rough notes into an outline, checklist or first draft.
- Prepare a meeting brief from the calendar event and linked material.
- Review the inbox, classify messages and draft suggested replies.
- Draft a Gmail reply for explicit review; sending requires a second confirmation.
- Extract decisions, action items and unresolved questions from a meeting or thread.
- Update a task list or project status using already approved information.
- Prepare a return checkpoint: what was happening, what changed and the next action.

The first hackathon implementation should support only one or two of these tasks end to end. A strong default is **research brief + return checkpoint** because both are useful, easy to demonstrate, reversible and do not require the agent to impersonate the user.

## Permission model

- **Observe automatically:** only the minimum local signals the user enabled.
- **Suggest automatically:** a break moment and one relevant task.
- **Prepare after approval:** research, summaries, organization and drafts.
- **Confirm again before external action:** sending email, posting, editing shared data, changing calendar events, purchases or any irreversible action.
- **Report every action:** show what the agent used, did, changed and left pending.

## Incentive layer

A living object may grow as the user successfully steps away and returns. A tree is one possible metaphor, not a fixed requirement. The incentive should reward completed off-ramps and gentle returns rather than punish skipped breaks or turn rest into another productivity score.

## Recommended positioning

This remains a **cognitive off-ramp agent**, not a general work assistant. Its unique job is to understand when the user can safely step away, negotiate a bounded delegation, preserve context and return completed work. “I can leave because my place is held and one small loose end is being handled.”

## What this is not

- Not a fatigue, eye-strain or cognitive-overload detector.
- Not a system-wide activity monitor.
- Not a recorder of typed text, form data or screenshots.
- Not a medical or productivity claim.

The MVP only infers a **prolonged focused browser interaction** and a **possible transition point**.
