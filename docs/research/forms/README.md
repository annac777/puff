# Building the survey

Three ways in, depending on where it's being run. The questions are identical in all of them —
[the survey itself](../survey.md) is the source of truth, and these are just its import formats.

| File | For |
|---|---|
| `google-forms-setup.gs` | Google Forms. Fastest path, runs with no configuration. |
| `qualtrics-import.txt` | Qualtrics, if NYU's licence covers it. Better for a paid panel. |

---

## Google Forms — about three minutes

1. Open **script.google.com** and start a new project.
2. Delete what's in the editor and paste in all of `google-forms-setup.gs`.
3. Press **Run**, choose `buildPuffSurvey`, and approve the permission prompt. Google will warn
   that the script is unverified — it's your own script, so continue through the advanced link.
4. Open **Execution log**. The link to share is printed there.

It runs as-is. `CONFIG` only needs touching for a paid panel, which is step 2 below.

Running it again builds a second, separate form; it never edits the first one.

---

## Qualtrics

Projects → Create project → Survey → **Import a survey file**, and upload `qualtrics-import.txt`.

Two things the import format cannot carry, so set them by hand afterwards:

- **Force response** on everything except the final email question.
- **Anonymise** — check that Survey Options is not recording IP addresses or location.

Qualtrics is the better choice for a paid panel because it captures the participant ID from the
URL automatically, and because NYU's licence keeps the data on institutionally managed storage,
which matters if this ever goes to the IRB.

---

## Running it on a paid panel

Only relevant once a Prolific or CloudResearch account clears review.

1. Create the study on the panel and copy the **completion code** it generates.
2. **Google Forms:** set `paidPanel: true`, paste the code and the return URL into `CONFIG`, and
   run the script again to build a fresh form.
   **Qualtrics:** set the end-of-survey element to redirect to the panel's return URL.
3. Set prescreeners on the panel — 18+, US, uses a computer for work at least 4 hours a day.
   Screening on the panel rather than inside the survey avoids paying people to be screened out.
4. Pay at least **$12/hour**. For a 5-minute survey that's $1.00 per person, plus the platform
   fee — 33.3% on an academic account.

**Before the paid round, check the IRB position.** NYU requires review for student projects
intended for publication or conference presentation, *before* data collection — and that
includes anonymous surveys. A round run as product research is fine; the same data cannot be
reclassified as research data afterwards.

---

## Posting it somewhere free

Works as-is with `paidPanel: false`. r/SampleSize allows recruitment; Slack groups, mailing
lists and LinkedIn all work.

The sample will be biased and needs labelling as a convenience sample when reported. The bias
that matters most here is self-selection: a survey shared as "help me test my break reminder"
reaches people who already think about breaks, which is exactly the population that would make
the results look good and mean nothing. Share it as a survey about how people work.

**Aim for a mix that includes people who do not work in a browser.** Part A exists to measure
what share of deep work happens in a browser tab. A sample of browser-heavy people would answer
that question with our own assumption.

---

## Checking the responses

Before analysing, drop: failed attention checks (the C1 row that names its own answer), anything
finished in under 90 seconds, and nonsense in A3. The
[analysis plan](../survey.md#analysis-plan) sets the thresholds in advance, on purpose.
