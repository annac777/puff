# Privacy and data boundaries

> Ambient awareness without ambient surveillance.

> Observe less. Infer locally. Ask before reading.

## Collected locally

- Counts of click, keydown, throttled scroll and tab-switch events.
- Timestamps of latest activity and latest keydown.
- Chrome idle state.
- Active tab title and URL.
- User responses to an intervention.

## Not collected

- Actual typed characters.
- Click targets or form contents.
- Page body text.
- Screenshots, microphone, camera or clipboard content.
- Activity outside Chrome.
- Remote analytics or model input.

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
