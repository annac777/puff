# Puff — screening survey

**Purpose.** Test whether the problem Puff solves is real, and whether the people who have it
do their work somewhere Puff can reach. Recruit for interviews and for the field trial.

**What this survey is not.** It is not the experiment. The experiment the advisor proposed is a
three-arm trial (fixed timer / wait-for-pause / wait-for-pause + pet). This survey comes before
that: it sizes the problem, kills or confirms the core hypothesis, and supplies a baseline.

**Core hypothesis under test**

> A break is easier to accept when the system first reduces the cost of resuming the task.

**Hard go/no-go.** Puff can only hold a place that is a browser tab. Part A measures how much
deep work actually happens in the browser. If most of it happens in desktop apps, the
"remembers your place" half of the product does not apply to most people, and the positioning
has to change. Part A is therefore the most consequential section, not the warm-up.

---

## Administration

| | |
|---|---|
| Target length | 5 minutes |
| Question count | 15 (1 matrix, 3 open text) |
| Form tool | Qualtrics if NYU's licence covers it, otherwise Google Forms |
| Panel | Prolific or CloudResearch Connect |
| Attention check | One embedded row in C1 — exclude failures before analysis |
| Identifiers | None, except the email volunteered in G2 (stored separately from responses) |

**Screening happens on the panel, not in the survey.** Paying people to be screened out is
waste. Set the panel prescreeners to: 18+, in the US, and uses a computer for work at least
4 hours a day. Anyone who reaches the survey is already eligible.

---

## Part A — Where the work actually happens

**A1.** Think about the last time you worked on one thing for an hour or more without really
stopping. During that stretch, what were you mostly working in? *(single choice)*

- Mostly in a web browser (Google Docs, Figma in the browser, webmail, reading and research)
- Mostly in a desktop app (VS Code, Word, the Figma desktop app, Photoshop, Excel)
- Roughly an even split between the two
- Mostly not on a computer

**A2.** Thinking about last week overall, roughly what share of your focused work happened in a
web browser? *(slider, 0–100%)*

**A3.** Which three tools do you spend the most focused time in? *(open text, one line)*

> Open-ended on purpose. A checklist of our own guesses would confirm our guesses.

---

## Part B — What actually happened

> Past behaviour, not intentions. Asking people what they would like leads them; asking what
> they did last Tuesday does not.

**B1.** In the past 7 days, how many times did you work for more than 2 hours without a real
break — not counting checking your phone at your desk? *(single choice)*

- 0 · 1–2 · 3–5 · 6 or more · I don't remember

**B2.** Think about the most recent time you worked longer than you meant to. Why did you keep
going? *(multiple choice, select all)*

- I lost track of time
- I noticed, but I didn't want to stop in the middle of something
- I was worried I wouldn't get back into it if I stopped
- A deadline
- I was waiting on something to finish (a build, a render, a reply)
- I did rest, I just didn't leave the screen
- Something else

> The third option is direct evidence for the core hypothesis. It sits among ordinary
> alternatives so that it is a finding rather than a suggestion.

**B3.** Think about the last time you were interrupted or had to step away mid-task. How long
did it take to get back into it? *(single choice)*

- Right away · 1–5 minutes · 5–15 minutes · More than 15 minutes · I never really got back into
  it that day

**B4.** When you came back that time, which of these actually happened? *(multiple choice,
select all)*

- I forgot what my next step was
- I lost a thought or question I'd had
- I had to hunt for the page or file I'd been in
- I had to re-read things to work out where I was
- None of these — I picked it straight back up

---

## Part C — Timing

**C1.** If a reminder to take a break appeared at each of these moments, how disruptive would it
feel? *(matrix, 5-point: Not at all disruptive → Extremely disruptive)*

| Row | |
|---|---|
| 1 | While I was in the middle of typing |
| 2 | Just after I finished reading something, before deciding what to do next |
| 3 | Just after I saved or submitted something |
| 4 | Just after I switched to a different tab or window |
| 5 | **Attention check — please select "Not at all disruptive" for this row** |
| 6 | At a completely random moment |

> This is the evidence base for waiting on a natural pause, and it maps onto the difference
> between arm A and arm B of the trial. If rows 1 and 6 do not score worse than rows 2–4, the
> mechanism Puff is built on has no support and we should know that before running a trial.

---

## Part D — What people already use

**D1.** Do you use anything to remind yourself to take breaks? *(multiple choice, select all)*

- No, nothing
- A timer on my phone or computer
- A Pomodoro app
- A watch or fitness tracker's stand-up reminder
- A browser extension
- Calendar blocks
- Someone else tells me
- Something else

**D2.** *(shown only if D1 ≠ "No, nothing")* Have you ever stopped using one of them? What made
you stop? *(open text)*

> The most valuable question in the survey. Why timers fail needs to come from people who
> abandoned one, in their words — not from our inference about arm A.

---

## Part E — The core hypothesis

**E1.** How much do you agree? *(7-point: Strongly disagree → Strongly agree)*

> "If I knew I could easily pick up where I left off, I'd be more willing to stop for a break."

> This question leads the respondent and will overstate agreement. It is here to be
> cross-checked against B2, B3 and B4, and it is not reportable on its own. If E1 is high while
> B4 is mostly "I picked it straight back up," the hypothesis is weaker than E1 suggests.

---

## Part F — Reaction to the concept

> Last, so that the description does not colour Parts A–E.

**F1.** Here is something we're building:

> *A small cloud that lives in the corner of your browser. It notices when you've been working a
> long stretch, waits until your hands actually stop rather than interrupting mid-sentence, and
> then offers to save where you are so you can step away. When you come back, it takes you back
> to the page and reminds you what you were about to do.*

How likely would you be to install it? *(5-point: Very unlikely → Very likely)*

**F2.** What's your first reaction, and what would put you off? *(open text)*

**F3.** To do this, it counts how often you click, type and scroll in your browser. It does not
record what you type, the contents of pages, or anything outside the browser. How comfortable
are you with that? *(5-point: Very uncomfortable → Very comfortable)*

> Privacy is the main barrier to installing any extension. Measuring it here is cheaper than
> discovering it in install numbers.

---

## Part G — Recruiting

**G1.** Would you be willing to talk to us for 30 minutes about how you work? *(yes / no)*

**G2.** Would you be willing to try Puff for two weeks and let us collect anonymous usage data?
*(yes / no)* — *email, optional, stored separately from your answers*

---

## Analysis plan

Decide these before the data arrives, so the data cannot talk us into a conclusion.

**Exclusions.** Failed attention check (C1 row 5). Completion time under 90 seconds. A3 left
blank or filled with nonsense.

**Go/no-go on positioning.** If the median A2 is below 40%, "remembers your place" serves a
minority and the product leads with the break invitation instead.

**Does the problem exist.** The share reporting B1 ≥ 3 *and* at least one item in B4.

**Does the hypothesis hold.** Cross-tabulate E1 against B4. Agreement paired with real
resumption friction supports it; agreement paired with "picked it straight back up" does not.

**Does timing matter.** Compare C1 rows 2–4 against rows 1 and 6.

**Why timers fail.** Code D2 into themes. This feeds the trial's arm A and the product copy.

**Baseline for the trial.** B1 and B3 give the pre-trial distributions.
