# Chrome Web Store listing: Puff 1.0.0

Everything the Developer Dashboard asks for, ready to paste. Images are in this folder.

## Package

Run `store/package.sh`. It writes `store/puff-1.0.0.zip` (the `extension` folder without tests). Upload that zip under **Package**.

## Store listing tab

**Name** (from the manifest): Puff

**Summary** (from the manifest, 132 characters max):
A small cloud that waits for a good moment to suggest a break, and remembers where you left off.

**Category:** Productivity → Workflow & Planning

**Language:** English

**Description:**

```
Puff is a small cloud that keeps you company on long work days.

It watches how long you have been working, and its weather shows it: sun, then rain, then a storm. When you have been at it a while, Puff waits for a good moment to suggest a break: right after you save or send something, or when you pause. Never while you are typing.

When you take a break, Puff holds your place. It remembers the page you were on and an optional note, and brings you back to it when you return.

What Puff does
• Shows how long you have worked, today's total and breaks taken
• Suggests a break at a natural stopping point, once, and is easy to wave off
• If no good moment comes for a long time, asks at the next brief stop
• Holds your place while you are away
• Lets you choose how often (20, 30, 45 or 60 minutes), mute it for an hour or the rest of the day, or hide it until it has something to say

Private by design
• Counts clicks, typing and scrolling, never what you type or what is on a page
• Reads a page's title and address only when you save it for a break, and forgets it when the break ends
• Stays quiet on video calls, payment pages and in full screen
• Everything stays in your browser. No account, no server, no analytics.

Made by Anna Chen and Hyeji Han.
```

**Icon:** already in the package (`extension/assets/icons/puff-128.png`, 96px artwork with 16px padding).

**Screenshots** (1280×800, upload in this order):
1. `screenshots/context-2-open.png`: how long you have worked, today, breaks
2. `screenshots/context-3-suggestion.png`: a break suggested after you finish something
3. `screenshots/context-4-on-a-break.png`: your place is held while you are away
4. `screenshots/context-5-welcome-back.png`: back where you were
5. `screenshots/context-1-working.png`: Puff sits in the corner while you work

**Small promo tile** (440×280): `promo-small-440x280.png`

**Marquee** (1400×560): optional, skipped for now.

**Official URL / Homepage:** https://annac777.github.io/puff/ (once GitHub Pages is on)

**Support URL:** https://github.com/annac777/puff/issues

## Privacy tab

**Single purpose:**
Puff helps people take breaks during long work sessions: it notices how long they have been working, suggests a break at a natural stopping point, and remembers the page they were on so they can return to it.

**Permission justifications:**

| Permission | Justification |
|---|---|
| `tabs` | To know which tab is active so Puff appears there and pauses on protected pages, and to read the title and address of the one page the user chooses to save before a break, so Puff can reopen it afterwards. |
| `idle` | To tell whether the user is at their computer, including while they work in other apps, so work time and breaks are measured correctly. |
| `storage` | To keep settings, today's totals and the saved page on the user's computer (`chrome.storage.local`). |
| `alarms` | To re-check every 30 seconds whether it is a good moment to suggest a break, since the service worker sleeps between events. |
| Host permissions (`http://*/*`, `https://*/*`) | Puff's cloud is shown on the page the user is working on, and its content script counts clicks, keypresses and scrolls there (counts only, never content) to recognise pauses and completed actions such as saving or submitting. It has to run on any site because people work on any site. |

**Remote code:** No, I am not using remote code. (All scripts and fonts are packaged.)

**Data usage:** tick the following, and nothing else:
- **User activity**: counts of clicks, keypresses and scrolls, and whether the user is idle. Used only to time break suggestions; stays on the device.
- **Web history**: the title and address of the single page the user saves before a break. Used only to bring them back to it; cleared when the break ends; stays on the device.

Certify all three statements (not sold, not used for unrelated purposes, not used for creditworthiness).

**Privacy policy URL:** https://annac777.github.io/puff/privacy.html

## Distribution tab

- Free
- All regions
- Visibility: **Public** (or **Unlisted** first, to share by link before it shows in search)

## Test instructions tab

No login needed. To see a suggestion quickly: open Puff, choose 20m in settings (≡), work for 20 minutes, then press ⌘S / Ctrl+S.

## Before submitting

- [ ] Developer account registered (one-time fee, paid by the account owner) with 2-step verification on
- [ ] GitHub Pages on, and the privacy URL opens
- [ ] `store/package.sh` run on the latest build, and the zip loads with *Load unpacked* after unzipping
- [ ] Reviews of broad host permissions can take longer than usual; allow several days
