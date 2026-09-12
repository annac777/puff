# MVP scope and frozen contract

## Included

- Browser click, keydown and throttled scroll counts.
- Active tab title and URL.
- Tab-switch count.
- Chrome Idle API state.
- Local persistence in `chrome.storage.local`.
- Six UI states: `quiet`, `considering`, `gentle_nudge`, `checkpoint`, `on_break`, `resume`.
- `Take a break`, `Later`, `Resume` and hide interactions.
- 15-second demo threshold and a 50-minute non-demo threshold.
- Popup debug controls that can force every state.
- Lightweight checkpoint placeholder containing the current tab title, URL and generic return note.

## Deferred

- Page-content reading and LLM-generated checkpoint summaries.
- System-wide sensing.
- Screenshots, semantic keyboard capture and remote telemetry.
- Calendar/meeting awareness.
- Cross-device state and production analytics.

## Frozen UI input types

```ts
type AgentMode = "quiet" | "considering" | "gentle_nudge" | "checkpoint" | "on_break" | "resume";

type ActivitySnapshot = {
  sessionSeconds: number;
  idleState: "active" | "idle" | "locked" | "unknown";
  clicks: number;
  keypresses: number;
  scrollEvents: number;
  tabSwitches: number;
  currentTabTitle?: string;
  recentTyping: boolean;
  possibleBreakpoint: boolean;
};

type UserResponse = {
  action: "take_break" | "later" | "dismiss" | "resume";
  timestamp: number;
  interventionMode: AgentMode;
};
```

## Current state policy

- Before threshold: `quiet`.
- Near/after threshold while actively typing: `considering`, with no strong prompt.
- After sustained work plus a short activity pause, tab transition or idle signal: `gentle_nudge`.
- If the user previously chose Later, the next eligible intervention becomes `checkpoint`.
- Take a break stores lightweight tab context and enters `on_break`.
- Resume displays the saved context and enters `resume`.
