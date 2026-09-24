/**
 * Builds the Puff screening survey as a Google Form in one run.
 *
 * How to use it
 *   1. Go to script.google.com and start a new project.
 *   2. Replace everything in the editor with this file.
 *   3. Run buildPuffSurvey. Approve the permission prompt the first time.
 *   4. The two URLs you need are printed in the execution log (View → Logs).
 *
 * It runs as-is with no configuration. CONFIG only needs editing once you move the survey
 * onto a paid panel.
 *
 * Re-running creates a second, separate form. It never edits the first one.
 */

const CONFIG = {
  title: 'How you work, and when you stop',

  // Deliberately not "Puff" or "break reminders". A title that announces the topic
  // recruits people who already care about it, which is the sample we least want.
  intro:
    'This survey is about how you work and what happens when you stop. It takes about ' +
    '5 minutes.\n\n' +
    'There are no right answers, and we are not testing you. Please answer for what you ' +
    'actually did, not what you feel you should have done.\n\n' +
    'Your answers are anonymous. We ask for an email at the very end only if you want to ' +
    'hear about the next stage — it is optional and stored separately from your answers.',

  // Leave this false for the first round — sharing the link directly, or posting it somewhere
  // free like Reddit or a Slack group. Nothing below needs filling in, and the script runs as
  // it is. Set it to true only once you are running the survey on a paid panel, and then fill
  // in the two fields under it.
  paidPanel: false,

  // From your Prolific or CloudResearch study page. Participants are not paid without it.
  // Ignored entirely while paidPanel is false.
  completionCode: 'REPLACE_WITH_YOUR_COMPLETION_CODE',

  // Prolific: https://app.prolific.com/submissions/complete?cc=YOUR_CODE
  // CloudResearch Connect shows its own return link on the study page.
  returnUrl: 'https://app.prolific.com/submissions/complete?cc=REPLACE_WITH_YOUR_COMPLETION_CODE',
};

function buildPuffSurvey() {
  const form = FormApp.create(CONFIG.title);
  form.setDescription(CONFIG.intro);
  form.setProgressBar(true);
  form.setShowLinkToRespondAgain(false);

  if (CONFIG.paidPanel) {
    form.addTextItem()
      .setTitle('Your Prolific ID')
      .setHelpText('Copy it from your Prolific account. We use it only to confirm your payment.')
      .setRequired(true);
  }

  // ---- Part A — where the work happens ------------------------------------
  form.addPageBreakItem()
    .setTitle('Your work')
    .setHelpText('Two quick questions about where your work actually happens.');

  form.addMultipleChoiceItem()
    .setTitle('Think about the last time you worked on one thing for an hour or more without ' +
              'really stopping. During that stretch, what were you mostly working in?')
    .setChoiceValues([
      'Mostly in a web browser (Google Docs, Figma in the browser, webmail, reading and research)',
      'Mostly in a desktop app (VS Code, Word, the Figma desktop app, Photoshop, Excel)',
      'Roughly an even split between the two',
      'Mostly not on a computer',
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Thinking about last week overall, roughly what share of your focused work ' +
              'happened in a web browser?')
    .setChoiceValues(['0–20%', '21–40%', '41–60%', '61–80%', '81–100%'])
    .setRequired(true);

  form.addTextItem()
    .setTitle('Which three tools do you spend the most focused time in?')
    .setHelpText('Just list them, separated by commas.')
    .setRequired(true);

  // ---- Part B — what actually happened ------------------------------------
  form.addPageBreakItem()
    .setTitle('Long stretches')
    .setHelpText('These are about what actually happened recently, not what usually happens.');

  form.addMultipleChoiceItem()
    .setTitle('In the past 7 days, how many times did you work for more than 2 hours without a ' +
              'real break?')
    .setHelpText('Checking your phone at your desk does not count.')
    .setChoiceValues(['0', '1–2', '3–5', '6 or more', "I don't remember"])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('Think about the most recent time you worked longer than you meant to. Why did ' +
              'you keep going?')
    .setHelpText('Select all that apply.')
    .setChoiceValues([
      'I lost track of time',
      "I noticed, but I didn't want to stop in the middle of something",
      "I was worried I wouldn't get back into it if I stopped",
      'A deadline',
      'I was waiting on something to finish (a build, a render, a reply)',
      "I did rest, I just didn't leave the screen",
      'Something else',
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Think about the last time you were interrupted or had to step away mid-task. ' +
              'How long did it take to get back into it?')
    .setChoiceValues([
      'Right away',
      '1–5 minutes',
      '5–15 minutes',
      'More than 15 minutes',
      'I never really got back into it that day',
    ])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('When you came back that time, which of these actually happened?')
    .setHelpText('Select all that apply.')
    .setChoiceValues([
      'I forgot what my next step was',
      "I lost a thought or question I'd had",
      "I had to hunt for the page or file I'd been in",
      'I had to re-read things to work out where I was',
      'None of these — I picked it straight back up',
    ])
    .setRequired(true);

  // ---- Part C — timing (holds the attention check) ------------------------
  form.addPageBreakItem().setTitle('Timing');

  form.addGridItem()
    .setTitle('If a reminder to take a break appeared at each of these moments, how disruptive ' +
              'would it feel?')
    .setRows([
      'While I was in the middle of typing',
      'Just after I finished reading something, before deciding what to do next',
      'Just after I saved or submitted something',
      'Just after I switched to a different tab or window',
      'Please select "Not at all disruptive" for this row',
      'At a completely random moment',
    ])
    .setColumns([
      'Not at all disruptive',
      'Slightly disruptive',
      'Moderately disruptive',
      'Very disruptive',
      'Extremely disruptive',
    ])
    .setRequired(true);

  // ---- Part D — what they already use -------------------------------------
  form.addPageBreakItem().setTitle('What you already use');

  form.addCheckboxItem()
    .setTitle('Do you use anything to remind yourself to take breaks?')
    .setHelpText('Select all that apply.')
    .setChoiceValues([
      'No, nothing',
      'A timer on my phone or computer',
      'A Pomodoro app',
      "A watch or fitness tracker's stand-up reminder",
      'A browser extension',
      'Calendar blocks',
      'Someone else tells me',
      'Something else',
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Have you ever stopped using one of them? What made you stop?')
    .setHelpText("If you've never used one, just write N/A.")
    .setRequired(true);

  // ---- Part E — the core hypothesis ---------------------------------------
  form.addPageBreakItem().setTitle('One more');

  form.addScaleItem()
    .setTitle('"If I knew I could easily pick up where I left off, I\'d be more willing to stop ' +
              'for a break."')
    .setBounds(1, 7)
    .setLabels('Strongly disagree', 'Strongly agree')
    .setRequired(true);

  // ---- Part F — the concept, last on purpose ------------------------------
  form.addPageBreakItem()
    .setTitle('Something we\'re building')
    .setHelpText(
      'A small cloud that lives in the corner of your browser. It notices when you\'ve been ' +
      'working a long stretch, waits until your hands actually stop rather than interrupting ' +
      'mid-sentence, and then offers to save where you are so you can step away. When you come ' +
      'back, it takes you back to the page, along with a note to yourself if you left one.');

  form.addScaleItem()
    .setTitle('How likely would you be to install it?')
    .setBounds(1, 5)
    .setLabels('Very unlikely', 'Very likely')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle("What's your first reaction, and what would put you off?")
    .setRequired(true);

  form.addScaleItem()
    .setTitle('To do this, it counts how often you click, type and scroll in your browser. It ' +
              'also notices when your computer goes idle. It never records what you type, what\'s ' +
              'on a page, or which apps you use. How comfortable are you with that?')
    .setBounds(1, 5)
    .setLabels('Very uncomfortable', 'Very comfortable')
    .setRequired(true);

  // ---- Part G — recruiting ------------------------------------------------
  form.addPageBreakItem().setTitle('Last thing');

  form.addMultipleChoiceItem()
    .setTitle('Would you be willing to talk to us for 30 minutes about how you work?')
    .setChoiceValues(['Yes', 'No'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Would you be willing to try it for two weeks and let us collect anonymous usage ' +
              'data?')
    .setChoiceValues(['Yes', 'No'])
    .setRequired(true);

  form.addTextItem()
    .setTitle('If you said yes to either, what email should we use?')
    .setHelpText('Optional. Stored separately from your answers, and used for nothing else.')
    .setRequired(false);

  // ---- Confirmation -------------------------------------------------------
  form.setConfirmationMessage(
    CONFIG.paidPanel
      ? 'Thank you — that was genuinely useful.\n\n' +
        'Your completion code is: ' + CONFIG.completionCode + '\n\n' +
        'Please paste it into Prolific, or use this link to return: ' + CONFIG.returnUrl
      : 'Thank you — that was genuinely useful.');

  Logger.log('Share this link with participants:\n' + form.getPublishedUrl());
  Logger.log('Edit the form here:\n' + form.getEditUrl());
  Logger.log('Responses appear under the Responses tab, and can be sent to a Google Sheet.');
}
