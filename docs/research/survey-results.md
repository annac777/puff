# Survey results — round 1

**9 responses, 24–25 September 2026.** One failed the attention check, so where the difference
matters it is noted. A convenience sample shared by the team, and the questionnaire is Hyeji's
revision of `survey.md`, so question wording differs from that file. Read every number here as
direction, not evidence.

## 1. Timing — the current trigger sits next to the worst moment

| Reminder appears… | Not / slightly disruptive | Moderately–extremely |
|---|---|---|
| Just after saving, submitting, sending or exporting | **9** | 0 |
| Just after finishing a small chunk of work | 9 | 0 |
| Just after finishing reading, before deciding what next | 7 | 2 |
| **After input stops for a short period** — Puff's current pause | 6 | **3** |
| Mid-typing | 3 | 6 |
| **While actively reading** | 2 | **7** |

Easiest moments to step away: after saving/submitting/sending/exporting (8 of 9), while waiting
for something to load or build (6), finishing the task entirely (4).

**Implication.** Reading produces no input, so to Puff it looks exactly like a pause — and it is
the moment people least want to be interrupted. Triggering on *completion events* (a save, a
submit, a download finishing, a page loading) should replace silence as the primary signal, with
silence kept as a fallback that stays clear of reading.

## 2. Privacy — titles and input counts are the sensitive ones

| Signal, processed locally | Uncomfortable | Neutral | Comfortable |
|---|---|---|---|
| How long the browser has been active | 2 | 5 | 2 |
| How often I click, type or scroll | **5** | 2 | 2 |
| When I switch tabs or windows | 4 | 4 | 1 |
| **Titles and URLs of open tabs** | **7** | 2 | 0 |
| My position in a page, to return there | 3 | 2 | 4 |

**Acted on in 0.12.0:** Puff no longer keeps the title or URL of the tab in front. It reads the
page once, when someone saves it. Input counts still drive the rhythm model; whether to keep them
is a decision for the team.

## 3. The companion should stay out of sight

- 6 of 9 prefer a companion that *stays hidden and appears only when it has something to say*;
  1 prefers one that is always visible.
- "Having a small companion present" split sharply — 3 rated it not useful at all.
- The most common reason people would stop: *it interrupts me at the wrong time* (4).

**Acted on in 0.12.0:** the cloud is tucked away while Puff is only watching, and shows itself when
it invites a break, while a place is held, or when opened from the toolbar.

## 4. The core hypothesis holds on one side only

**Coming back is hard — supported.** 6 of 9 found resuming somewhat or very difficult; 7 had to
re-read, 5 had to recall their next step. *Reminding me where I left off* was the highest-rated
part of the concept (5 very or extremely useful).

**Fear of losing context keeps people working — not supported.** Only 2 of 9 kept going because
they worried about getting back into flow. The drivers were wanting to finish a part (8) and
deadlines (7). What finally stopped them was a physical need (5).

**Finding the page again matters less than expected.** Only 2 had to hunt for the tab or file.
The gap is the *next step* and *where in the content* — which argues for the note, not the tab.

## 5. Scope

7 of 9 did at least 41% of their focused work in a browser (4 did 81–100%), so a browser
extension is not the wrong container. The tool lists still include Word, IntelliJ, Obsidian and
Claude Code.

## Also

- 6 of 9 use nothing to remind themselves to take breaks today.
- Likelihood to try (1–5): four 4s, three 3s, one 2, one 1.
- 5 would join a two-week pilot. Contact details stay in the response sheet, not here.
