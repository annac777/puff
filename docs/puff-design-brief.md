# Puff

Design revision brief for Hyeji — September 12, 2026

Product name: **Puff**

**An agent that keeps your place—and moves one step forward while you step away.**

## 1. Current progress: what works and what does not

Chen has implemented a local agent backend, a Chrome extension, and a minimal Figma adapter. Real OpenRouter model calls and Exa research calls have passed using explicitly labeled synthetic design context. Editable next steps, saved checkpoints, approved research, cancellation, and sourced results exist. Twenty automated tests and the Figma build were rerun successfully today.

**The complete real-Figma experience is not yet verified.** The latest local snapshot is still labeled synthetic; there is no successful real-node restore record. The Figma adapter has passed mocked-host tests, not a live-file acceptance test. The updated Chrome extension still needs its installed-browser acceptance test. The backend currently runs locally, not in the cloud.

This brief is the new product/design direction. It supersedes the earlier Sprout/off-ramp positioning and timer-first flow. Existing implementation names remain unchanged until engineering integrates the redesign. Do not interpret a requested screen as a completed feature.

## 2. Product shift

We are not building a break reminder. We are building a **human-to-agent handoff** at the moment someone wants to leave unfinished work.

The user's concern is: “Will I lose my thought if I leave? Will explaining this to an agent take longer than just doing it myself?”

The product should make leaving feel safe by preserving the exact place, confirming the open question, accepting one bounded task, and returning a useful result with the user's chosen next step.

Lunch is the opening story, not the product category. Leaving for a meeting or ending the day can use the same interaction later. Do not promise overnight execution in the current local build.

## 3. What to keep and what to change

Keep the warm palette, rounded cards, calm typography, editable components, and restrained companion animation. The plant may remain as a supporting character; it is not required to represent wellness or growth.

Change the hierarchy:

| Earlier design | Revised priority |
| --- | --- |
| Focus minutes and break countdown | Current work, open question, and next step |
| “Take a 2 min break” | “Hold this thought” / “Approve handoff” |
| Plant recharge as the main reward | A useful, sourced result waiting on return |
| Generic “Take it from here” | One named task with explicit scope and limits |
| “You finished updating…” | Observed facts plus a user-confirmed intention |
| “Tests completed” examples | Actual research results; test execution is not supported |
| Rest completed → welcome back | Human approves → agent works → human reviews and resumes |

Do not lead with a productivity score, health claim, streak, guilt, or a timer. A manual **Hold this thought** entry must always be available; users should not have to wait for a focus threshold before leaving.

## 4. One coherent demo scenario

A designer is comparing two checkout designs in Figma. The open question is whether an inline or expandable help pattern better supports a mobile form. The user confirms that question; frame names alone do not reveal it.

The agent proposes: research the two interaction patterns using public sources and prepare a short comparison. The user reviews the scope and approves. The agent searches within a fixed budget while the user steps away. On return, the interface shows evidence, trade-offs, remaining uncertainty, and the next step the user chose. It offers to restore the saved frames.

**Important:** this is a research comparison of interaction patterns, not a visual audit of the user's designs. The current adapter captures names, IDs, selection, and changed property names—not screenshots, frame pixels, or the full design. Do not add realistic frame thumbnails unless a real, approved image-capture feature is implemented. Use labeled anchor chips for now.

## 5. Required P0 screens

### A. Quiet presence and handoff invitation

The companion stays small and out of the way. A natural pause may produce a subtle invitation; it must not claim that the task is complete or that the user is tired.

Suggested copy: **“Stepping away? I can hold your place.”**

Primary: **Hold this thought**. Secondary: **Not now**. Include hide/pause controls. Dismissal must not become a louder or more intrusive prompt later.

The manual entry and automatic invitation lead to the same handoff flow. Natural-pause detection is an opportunity to offer help, not proof of intent to leave.

### B. Review the handoff context

Show three clearly labeled layers:

1. **Observed:** Figma file/page and saved frame names, with live/stale/disconnected status.
2. **Open question:** an editable decision or uncertainty, e.g. “Inline or expandable help for this mobile form?”
3. **When I return:** an editable next step, e.g. “Review the evidence, then test the preferred pattern in the mobile frame.”

Use known context to prefill what is justified. If the open question is unknown, ask one concise question; do not require a long new chat or invent an intention. Allow correction without losing the user's text.

Before a model reads metadata or the open question, show the provider-sharing approval and expandable data preview. No provider call before approval.

### C. Choose one bounded task and approve

This is the key new screen. The agent proposes one relevant task; it should not present a generic menu of everything an AI can do.

Example task card:

- **Task:** Compare inline and expandable help patterns for mobile forms.
- **Deliverable:** A short comparison with source links, trade-offs, and an unresolved-question note.
- **Access:** The approved public question and public web search. No automatic export of private frame content.
- **Limits:** Up to three searches and a two-minute execution time budget. The time budget is a cap, not a guaranteed completion time or a break timer.
- **Will not do:** Edit designs, send messages, publish changes, or choose the final design for you.

Primary: **Approve handoff**. Secondary: **Just save my place**. Include **Edit task** and a cancel/back route.

Saving a place and delegating work are separate choices. A combined confirmation is acceptable only if the screen clearly lists both authorized actions. Do not ask the user to retype the same context into a second form.

Engineering gap: the current research task is manually entered after checkpointing. Context-grounded task proposal and the combined review flow need implementation; they are not existing features.

### D. Handoff accepted / agent working

Confirm acceptance only after the checkpoint is saved and the task has actually started. If saving succeeds but task creation fails, show **“Your place is saved. The task did not start.”** Preserve a save-only path.

Show the task title, real status, cancel action, and the promise that the saved next step is preserved. Example: **“Your thought is held. I’m gathering references.”**

Required task variants: running, completed, failed, canceled, interrupted. Use actual milestones; no fabricated percentages. If the user returns early, show that work is still running. Do not cancel merely because the popup closes.

### E. Return receipt: what happened while you were away

This is as important as the handoff screen. Show:

1. **Your next step:** the user's confirmed intention, unchanged.
2. **What I did:** a concise, factual execution summary.
3. **What I found:** a short comparison, sources, and limitations.
4. **What I did not do:** “Your Figma file was not changed.”
5. **What remains yours:** the decision or follow-up action still awaiting the user.

Primary: **Return to my frames**. Secondary: **View sources**. Do not render a long unformatted model response as the main experience. Keep the tool log in an expandable details section.

A failed or canceled task still returns the saved place and intention. Never replace failure with a fake useful-looking result.

### F. Restore and give control back

Show separate ready, restoring, restored, missing-node, disconnected, stale-session, and browser-only states. Do not show success until the adapter acknowledges selection and viewport navigation.

After restore, offer **Continue from here** and collapse the handoff UI. The agent must not modify a design or chain into another task without approval.

The current implementation requires the original plugin session to remain available. If the user closes and reopens the plugin, precise restoration may require a new checkpoint. Provide a clear fallback rather than implying that the file was restored exactly.

## 6. Surfaces and component handoff

- **On-page companion:** tiny passive presence; a compact invitation may expand to a proposed 320 px card.
- **Chrome toolbar popup:** compact current handoff/status and entry into details. Current code has a 390 px minimum width; the earlier 320 px popup is not drop-in compatible.
- **Expanded extension page:** context review, task approval, return receipt, and sources. Use a flexible layout rather than squeezing the full experience into the popup. A native side panel is not currently implemented.
- **Figma adapter:** compact connection/sharing status and stop control. Do not force the user to manage the task in both interfaces.

Create reusable components for: context/anchor chips, open-question input, next-step input, task scope card, approval controls, task status, comparison result, source list, restore status, and connection/privacy notices. Include default, hover, pressed, disabled, focus, loading, empty, and error variants where applicable. Use editable text, Auto Layout, named design tokens, SVG assets, and reduced-motion alternatives.

For compatibility, keep current internal mode names in design annotations:

| Current mode | New experience |
| --- | --- |
| quiet | Passive presence |
| considering | Waiting for an appropriate moment |
| gentle_nudge | Optional handoff invitation |
| checkpoint | Review context and approve scope |
| on_break | User away / agent task status |
| resume | Return receipt and restore |

These mappings are a design contract, not proof that every transition is already wired. CHECKPOINT / CLARIFY / COMPARE remain content variants within the review screen. Model output must select approved components, not generate arbitrary executable UI.

## 7. Priorities and acceptance checks

**Design first:** the review/approval screen and the return receipt. Then connect them with the quiet invitation, working state, and recovery states. Reuse the visual language; do not spend the remaining time redesigning a reward system.

The click-through prototype must demonstrate:

- A handoff without re-explaining the entire project.
- One correction of the agent's interpretation.
- A save-only path that starts no research.
- One explicit bounded-task approval.
- Returning while the task is still running.
- A sourced result and unchanged user intention.
- A restore failure with an honest fallback.

**Engineering gates before the full pitch becomes a live claim:** real Figma context capture; real node restore; installed-extension validation; suggested task generation; open-question persistence; compact return-receipt UI; long-request recovery; and a hosted backend before claiming no local setup.

Calendar, Gmail, Google Sheets, test execution, screenshot analysis, autonomous design editing, and persistent plant growth are outside this demo scope. They may be future adapters or capabilities, not placeholder “working” screens.

## 8. Pitch anchors

Opening:

> AI agents are supposed to give us time back. So why are we still eating lunch at our desks?

Product explanation:

> Stopping is expensive. You lose the page, the question, the tiny next step—and delegating to an agent usually means stopping again to explain all of that. Puff preserves your place, helps you confirm one bounded handoff, and returns the result when you come back.

Demo narration, to use once the integration gates pass:

> I’m comparing two designs in Figma. The agent captures the frames I’m working on, and I confirm the decision that is still open. When I’m ready to leave, it proposes one bounded task: research this interaction pattern and prepare a comparison. I approve it. When I return, it brings me back to the saved frames, shows its sources and findings, and reminds me of the next step I chose.

Closing:

> The best moment to use an agent isn’t always when you open a chat. Sometimes it’s the moment you need to leave.

Preserve this narrative, but do not claim that metadata alone reveals a design decision or that exact-frame restoration has passed until the real-file test succeeds. This brief is prepared for Chen to share; it has not been sent to Hyeji or added to the shared Google Doc.
