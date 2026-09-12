# Test results

This file records evidence, not assumptions. Update the real-Chrome section during manual verification.

## Automated checks

Run from the project root:

```bash
npm test
```

The tests cover waiting during recent typing, detecting a possible breakpoint, adapting after Later, creating a lightweight checkpoint, and storing counts without key content.

**Result (2026-09-12): PASS — 5/5 tests.** Node syntax checks passed for `core.js`, `background.js`, `content.js` and `popup.js`; `manifest.json` parsed successfully.

## Static extension checks

The manifest and scripts can be parsed without Chrome. Static checks establish that the required permissions, content script, service worker and debug UI are present. They do not prove that Chrome grants permissions or dispatches real browser events.

**Result: PASS.** Manifest V3 declares `alarms`, `idle`, `storage`, `tabs`, HTTP(S) host access, the background service worker, content script, overlay stylesheet and popup.

## Real Chrome verification matrix

| Requirement | Current status | Manual evidence to capture |
|---|---|---|
| Read active tab title and URL | Pending real Chrome | Popup/service-worker state on a normal HTTPS tab |
| Count page clicks | Pending real Chrome | Counter increases without target content |
| Count keydowns | Pending real Chrome | Counter increases without characters |
| Count throttled scrolls | Pending real Chrome | Counter increases at most twice/second |
| Count tab switches | Pending real Chrome | Switch between two HTTP(S) tabs |
| Idle API state | Pending real Chrome | Short detection interval; wait for idle/active transition |
| Inject overlay | Pending real Chrome | Overlay visible on an ordinary HTTP(S) page |
| Show all metrics | Pending real Chrome | Screenshot of overlay/popup |
| Later/Take a break/Resume | Pending real Chrome | State transition and response history |
| Content → worker messaging | Pending real Chrome | Counters visible after content events |
| Persistence after worker suspension | Pending real Chrome | Inspect storage/reopen popup after waiting |

## Restricted pages

Expect no injection on `chrome://extensions`, other `chrome://` pages, the Chrome Web Store and browser-protected surfaces. Test on a normal `https://` page.
