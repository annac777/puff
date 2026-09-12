# Privacy and data boundaries

> Ambient awareness without ambient surveillance.

> Observe less. Infer locally. Ask before reading.

## Collected locally

- Counts of click, keydown, throttled scroll and tab-switch events.
- Timestamps of latest activity and latest keydown.
- Chrome idle state.
- Active tab title and URL.
- User responses to an intervention.
- With the Figma adapter explicitly enabled: file/page/node names and IDs, selected nodes, a limited list of frames, and recent changed property names. No changed property values or text-node content.
- Confirmed checkpoints, job results, and tool status records in the ignored `.off-ramp/` directory.

## Not collected

- Actual typed characters.
- Click targets or form contents.
- Page body text.
- Screenshots, microphone, camera or clipboard content.
- Activity outside Chrome.
- Remote analytics. Provider calls happen only through the approvals described below.

## Permission rationale

- `idle`: receive `active`, `idle` and `locked` device state.
- `storage`: persist recoverable aggregate state because Manifest V3 workers are suspended.
- `tabs`: continuously read active-tab title/URL and tab switches. `activeTab` alone is temporary and only follows a user gesture.
- `alarms`: periodically restore/evaluate persisted state without assuming a permanent worker.
- HTTP(S) host access: inject the local overlay and counters into ordinary web pages.

Title/URL collection is less invasive than page-body access but is still browsing metadata. A production version should provide domain exclusions, retention controls and an explicit first-run explanation.

## Platform boundaries

- The extension does not represent whole-desktop activity.
- Content scripts cannot run on `chrome://` pages, the Chrome Web Store and other restricted pages.
- Cross-origin frames and unusual embedded surfaces may not expose events to the top-level content script.
- `chrome.idle` reports device idle state, not fatigue.

## Model and research approvals

The continuity agent sends workspace metadata and the user's intention to the configured model provider only after the per-request approval. Current local configuration uses OpenRouter with an OpenAI model. Names and URL paths may still be sensitive even without body text. API keys stay in ignored backend environment files, not the extension or Figma plugin. SDK tracing is disabled.

The research agent receives only the explicitly entered public question, not the saved design context automatically. It may send derived queries to Exa and return sourced suggestions. Starting research is a separate approval from saving a checkpoint; canceling it stops further local execution, but cannot undo provider requests already made.

Monitoring can be paused in the extension. Figma sharing has its own independent stop control. Stopping collection does not erase already-saved checkpoints. The prototype does not yet provide a retention/deletion UI; do not use it for confidential production material until those controls are implemented.

## Future Google integrations

Calendar and Gmail are not yet implemented. When added, each connection must be opt-in and scoped to the minimum data required.

- Calendar may be read to understand timing and constraints. Creating, moving or cancelling events requires explicit approval.
- Gmail may be searched or summarized after approval. Drafting and sending are separate actions; sending always requires a final confirmation.
- Research may use the approved question and relevant context. Results must include sources and state uncertainty.
- The agent must keep an action log and make it clear whether something was observed, inferred, drafted or actually sent.
