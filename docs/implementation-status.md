# Hold That Thought implementation status

Updated September 12, 2026.

## Current progress

The local agent loop now works with real model and search calls. This is a bounded design-continuity agent, not a general-purpose coworker or a medical break detector.

| Capability | Status |
| --- | --- |
| Local activity estimates and interruption cooldowns | Implemented; policy tests passed |
| Figma selection, frame names, changed property names | Adapter implemented and compiled; real-file installation pending |
| Model reads context through a tool and chooses a checkpoint card | Live model test passed with synthetic design context |
| User corrects and confirms the next step | Implemented; browser UI test passed |
| Research agent chooses Exa queries and returns sources | Live API and browser UI tests passed |
| Job survives closing/reloading its interface | Verified by reloading during a running research job |
| Select saved Figma nodes and focus viewport | Implemented; mocked-host test passed; live Figma validation pending |
| Focus a saved Chrome tab | Implemented; mocked Chrome API test passed; updated installed extension not yet verified |
| Calendar, Gmail, cloud execution, growing companion | Not implemented |

## Product recommendation

Start with **helping a designer leave and re-enter an unfinished Figma task**. The meaningful reward is continuity: your intention survives the break, and one useful research result is waiting when you return. Keep a growing companion as a later visual layer, not the reason to force breaks.

1. Estimate sustained work locally. Default eligibility is 40 estimated active minutes; this is not a fatigue diagnosis or a scientifically validated threshold.
2. Wait for an opportunity: a 10-second pause without recent typing. Suppress invitations during protected/full-screen pages, idle states, cooldowns, and manual busy windows. Calendar is not connected; the busy field is not yet exposed in the UI.
3. Offer a small invitation, never a blocking modal. “Not yet” waits at least 15 minutes; dismiss waits 30 minutes, then 60 after repeated dismissals. At most four automatic invitations per day and one per focus session.
4. Ask the model to inspect consented context. Distinguish observed nodes/changes from inferred intent. The user corrects the intended next step.
5. Save an immutable checkpoint containing real anchors. During the break, execute only an explicitly approved public research question.
6. Return with the confirmed intention and sourced result. Report successful navigation only after the adapter acknowledges it.

The optional demo threshold is 30 seconds with a 2-second pause; it must be disclosed as a demo setting.

## Why this is an agent

The backend uses `@openai/agents` Agent/Runner and real model calls, not canned responses. The continuity agent calls `inspect_work_context`, selects CHECKPOINT / CLARIFY / COMPARE, and produces a schema-validated proposal with known anchors. The research agent chooses its own queries, calls `search_public_web`, reads the returned evidence, and synthesizes a result. It has a three-search budget, a time limit, cancellation, persistent job state, and visible tool traces.

The interruption gate remains deterministic. This deliberately limits interruption authority; it does not pretend that every timer decision is model reasoning. Saving and restoring are user-authorized application tools. There is no autonomous email sending or design editing.

Current local model configuration: OpenRouter, `openai/gpt-5.6-sol`. Keys stay on the backend. Codex usage credits are not used as API credits.

## Tests actually run

- 20 automated tests passed: policy, consent, stale/disconnected restore, immutable checkpoints, job cancellation/restart, extension bridge, and Figma adapter host contracts.
- TypeScript checks and Figma build passed.
- Live continuity test: the model called its context tool and chose COMPARE with two valid synthetic frame anchors.
- Live research test: Exa returned actual official sources and the model generated a sourced brief.
- Browser UI test: edited intention was saved, a research job continued across reload, and a W3C research brief completed with source links.

Synthetic fixtures are explicitly labeled. None of these checks proves that the adapter has worked in the team's real Figma file. That is the next integration gate.

## Setup and next integration gate

1. Keep `npm run dev` running in the repository. Open `http://127.0.0.1:4318` and connect. The dashboard can reveal a local pairing token; never publish it.
2. Reload the existing Off-Ramp extension in Chrome's extensions page. For a fresh installation, select this repository's `extension` folder, not its `tests` subfolder. Internal labels still use Off-Ramp while the new design is integrated.
3. Import `figma-adapter/manifest.json` as a development plugin in Figma desktop. Follow the adapter guide, pair it, and explicitly enable sharing.
4. Select a frame, change its spacing, and verify actual file/page/node names appear locally. Check that another collaborator's changes do not count as your activity.
5. Enter a comparison intention, approve model sharing, edit the next step, and save. Navigate away from those frames, then use **Take me back**. Verify selection and viewport in the actual file.

Hyeji: design the passive companion, invitation, three checkpoint card states, break-task progress, and return state. Chen: finish real Figma integration and then add read-only Calendar before considering Gmail drafts. The next Gmail scope should be draft-only with explicit review, never automatic sending.

## Known limits

- The local backend must remain running; this is not a cloud worker and does not continue reliably through laptop sleep.
- A plugin must stay open to observe and restore. Checkpoints are bound to that plugin session; reopening the plugin cannot silently establish the original session identity.
- The adapter exports selected nodes, up to 20 top-level frames/components/sections and 30 recent local changes. It does not understand the full design, pixels, prototype correctness, or nested frames that were not selected.
- Research is based on search highlights, not a full-page compliance audit. Model factual accuracy and citation matching still require review.
- No retention/deletion UI, production authentication, first-run privacy onboarding, domain-exclusion editor, or multi-user backend yet. This is a local hackathon build.

## API references

- [OpenAI Agents guide](https://developers.openai.com/api/docs/guides/agents/quickstart)
- [OpenRouter quickstart](https://openrouter.ai/docs/quickstart)
- [Figma PageNode API](https://developers.figma.com/docs/plugins/api/PageNode/)
- [Figma plugin events](https://developers.figma.com/docs/plugins/api/properties/figma-on/)
- [Figma manifest](https://developers.figma.com/docs/plugins/manifest/)

Use native current-page node events, not MCP-only helpers or simulated canvas scraping. Veris is for agent simulation/testing; Auth0 is for identity; Ambiguous is a workspace. They are not interchangeable.
