const test=require("node:test"),assert=require("node:assert/strict"),core=require("../core.js");
const ready=(overrides={})=>({...core.initialState(1),activeSeconds:2400,lastEvaluatedAt:100000,idleState:"active",lastActivityAt:80000,...overrides});
test("separates work eligibility from interruptibility",()=>{const s=core.evaluate(ready({lastKeyAt:99500,lastActivityAt:99500}),100000);assert.equal(s.needScore,1);assert.equal(s.opportunityScore,0);assert.equal(s.mode,"considering");});
test("offers once after work and a natural pause",()=>{let s=core.evaluate(ready(),100000);assert.equal(s.mode,"gentle_nudge");assert.equal(s.dailyInvitations,1);s=core.evaluate(s,101000);assert.equal(s.dailyInvitations,1);});
test("a past tab switch cannot override active typing",()=>{const s=core.evaluate(ready({tabSwitches:25,lastKeyAt:99999,lastActivityAt:99999}),100000);assert.equal(s.possibleBreakpoint,false);});
test("wall time alone does not count as active work",()=>{const s=core.evaluate(core.initialState(1),86400000);assert.equal(s.activeSeconds,0);assert.equal(s.mode,"quiet");});
test("idle reset requires a sustained natural break",()=>{const s=core.evaluate(ready({idleState:"idle",idleSince:1}),130000);assert.equal(s.activeSeconds,0);assert.equal(s.mode,"quiet");});
test("Later never escalates to an intrusive checkpoint",()=>{const s=core.applyResponse(ready({mode:"gentle_nudge",sessionInvited:true}),"later",100000);assert.equal(s.cooldownUntil,100000+15*60000);assert.equal(core.evaluate(s,110000).mode,"quiet");assert.equal(s.activeSeconds,2400);});
test("two dismissals extend rather than escalate interruption",()=>{let s=core.applyResponse(ready(),"dismiss",100000);s=core.applyResponse(s,"dismiss",110000);assert.equal(s.cooldownUntil,110000+60*60000);});
test("daily cap suppresses automatic invitation",()=>{assert.equal(core.evaluate(ready({dailyInvitations:4}),100000).mode,"quiet");});
test("busy and protected pages suppress invitations",()=>{for(const fields of [{busyUntil:110000},{blocked:true},{enabled:false}])assert.equal(core.evaluate(ready(fields),100000).mode,"quiet");});
test("a break keeps an executable anchor, and the next step is optional",()=>{const initial=ready({currentTabTitle:"Draft",currentTabUrl:"https://example.com/",currentTabId:17});const bare=core.applyResponse(initial,"take_break",100000);assert.equal(bare.mode,"on_break");assert.equal(bare.checkpoint.note,"");assert.equal(bare.checkpoint.title,"Draft");const s=core.applyResponse(initial,"take_break",100000,{note:"Check tablet layout"});assert.equal(s.checkpoint.tabId,17);assert.equal(s.checkpoint.note,"Check tablet layout");assert.equal(s.mode,"on_break");});
test("resume is followed by an explicit fresh session",()=>{const s=core.applyResponse(ready(),"continue",100000);assert.equal(s.activeSeconds,0);assert.equal(s.sessionInvited,false);});
test("sanitizes URL secrets and rejects executable schemes",()=>{assert.equal(core.safeUrl("https://a.test/path?token=secret#private"),"https://a.test/path");assert.equal(core.safeUrl("javascript:alert(1)"),"");assert.equal(core.protectedUrl("https://a.test/checkout"),true);});
test("activity aggregation stores counts only and rejects future timestamps",()=>{const s=core.mergeActivity(core.initialState(1),{clicks:2,keypresses:8,scrollEvents:1,lastActivityAt:999999,keys:"private"},100);assert.equal(s.keypresses,8);assert.equal("keys" in s,false);assert.equal(s.lastActivityAt,0);});

// ── Rhythm, not just duration ────────────────────────────────────────────────
const MIN=60000;
function worked(pattern,{start=0,threshold=1800}={}){
  // pattern: one entry per minute, {clicks,keypresses,scrollEvents,tabSwitches}
  let s={...core.initialState(start),thresholdSeconds:threshold,idleState:"active"};
  let at=start;
  for(const step of pattern){
    at+=MIN;
    const {tabSwitches=0,...input}=step;
    s=core.mergeActivity({...s,lastActivityAt:at},{...input,lastActivityAt:at},at);
    for(let i=0;i<tabSwitches;i++)s=core.recordTabSwitch(s,at);
  }
  return {state:s,at};
}
const busy={clicks:20,keypresses:120,scrollEvents:10,tabSwitches:0};
const quiet={clicks:1,keypresses:2,scrollEvents:1,tabSwitches:0};

test("rhythm windows describe recent work, not the whole session",()=>{
  const {state}=worked(Array(20).fill(busy));
  assert.ok(state.windows.length<=5,"keeps a bounded lookback, not every minute");
  assert.ok(state.rhythm.intensity>0,"reports how hard the recent windows were");
  assert.equal(state.rhythm.windows>0,true);
});

test("winding down is recognised as settling",()=>{
  const steady=worked(Array(24).fill(busy)).state.rhythm.settling;
  const slowing=worked([...Array(18).fill(busy),...Array(6).fill(quiet)]).state.rhythm.settling;
  assert.ok(slowing>steady,`slowing (${slowing}) should settle more than steady (${steady})`);
});

test("settling lowers the bar for offering a break, within bounds",()=>{
  const slowing=worked([...Array(18).fill(busy),...Array(6).fill(quiet)]).state;
  assert.ok(slowing.effectiveThreshold<=slowing.thresholdSeconds,"offers sooner when winding down");
  assert.ok(slowing.effectiveThreshold>=slowing.thresholdSeconds*0.5,"never collapses to nothing");
});

test("scatter separates tab-hopping from steady work",()=>{
  const steady=worked(Array(10).fill(busy)).state.rhythm.scatter;
  const hopping=worked(Array(10).fill({...busy,tabSwitches:6})).state.rhythm.scatter;
  assert.equal(steady,0);
  assert.ok(hopping>steady,"switching between tabs registers as scatter");
});

test("a real break clears the rhythm, not just the counter",()=>{
  const {state,at}=worked(Array(20).fill(busy));
  const away=core.evaluate({...state,idleState:"idle",idleSince:at},at+3*MIN);
  assert.equal(away.activeSeconds,0);
  assert.equal(away.windows.length<=1,true,"stale windows do not survive being away");
  assert.equal(away.rhythm.intensity,0);
});

// ── Learning from the answer ─────────────────────────────────────────────────
test("dismissing teaches Puff to wait longer, accepting teaches it the moment",()=>{
  const base=ready({activeSeconds:2400});
  const waved=core.applyResponse(base,"dismiss",100000);
  assert.ok(waved.learnedThreshold>base.thresholdSeconds,"a wave-off pushes the threshold out");
  const accepted=core.applyResponse({...base,activeSeconds:1200},"take_break",100000,{note:"n"});
  assert.ok(accepted.learnedThreshold<base.thresholdSeconds,"accepting early pulls it in");
});

test("learning stays inside bounds no matter how often it is answered",()=>{
  let s=ready();
  for(let i=0;i<40;i++)s=core.applyResponse(s,"dismiss",100000+i);
  assert.ok(s.learnedThreshold<=s.thresholdSeconds*3,"cannot drift to never asking");
  for(let i=0;i<40;i++)s=core.applyResponse({...s,activeSeconds:60},"take_break",200000+i,{note:"n"});
  assert.ok(s.learnedThreshold>=s.thresholdSeconds*0.5,"cannot drift to nagging");
});

test("the last answer is remembered so it can inform the next decision",()=>{
  const s=core.applyResponse(ready(),"later",100000);
  assert.equal(s.lastAction,"later");
  assert.equal(s.lastActionAt,100000);
});

// ── Work that happens outside the browser ────────────────────────────────────
// Puff lives in Chrome, but people write code, documents and designs in desktop apps.
// chrome.idle reports input across the whole machine, so that work has to count.
test("a morning in a desktop app still counts as work",()=>{
  let s={...core.initialState(0),idleState:"active"};
  // Forty minutes at the machine with no browser input at all.
  for(let sec=0;sec<40*60;sec++)s=core.evaluate(s,(sec+1)*1000);
  assert.ok(s.activeSeconds>=39*60,`expected ~40 min of work, got ${Math.round(s.activeSeconds/60)} min`);
  assert.equal(s.needScore,1,"long enough to be worth offering a break");
});

test("a system-wide pause is a pause, even with the browser untouched",()=>{
  let s={...core.initialState(0),idleState:"active"};
  for(let sec=0;sec<40*60;sec++)s=core.evaluate(s,(sec+1)*1000);
  const at=40*60*1000;
  // They step away from the editor: chrome.idle reports the whole machine quiet.
  s=core.evaluate({...s,idleState:"idle",idleSince:at},at+20000);
  // Then they come back, and the invitation is waiting rather than missed.
  s=core.evaluate({...s,idleState:"active",idleSince:null},at+40000);
  assert.equal(s.mode,"gentle_nudge","a pause outside the browser still opens the door");
});

test("being away long enough is a real break, not a pause to act on",()=>{
  let s={...core.initialState(0),idleState:"active"};
  for(let sec=0;sec<40*60;sec++)s=core.evaluate(s,(sec+1)*1000);
  const at=40*60*1000;
  s=core.evaluate({...s,idleState:"idle",idleSince:at},at+5*60000);
  assert.equal(s.activeSeconds,0,"a real absence resets the estimate");
  assert.equal(s.pausedAt,0,"and does not leave a stale pause behind");
});

test("a pause goes stale rather than firing hours later",()=>{
  let s={...core.initialState(0),idleState:"active"};
  for(let sec=0;sec<40*60;sec++)s=core.evaluate(s,(sec+1)*1000);
  const at=40*60*1000;
  s=core.evaluate({...s,idleState:"idle",idleSince:at},at+20000);
  s={...core.evaluate({...s,idleState:"active",idleSince:null},at+30000),mode:"quiet",sessionInvited:false};
  // Five minutes of solid work later, that old pause must not still count.
  let later=at+30000;
  for(let sec=0;sec<5*60;sec++){later+=1000;s=core.mergeActivity({...s,lastActivityAt:later},{keypresses:4,lastActivityAt:later},later);}
  assert.notEqual(s.mode,"gentle_nudge","an expired pause cannot trigger an invitation");
});

// ── Round-one research: completions first, never while reading ───────────────
test("finishing something is an opening straight away, without waiting for silence",()=>{
  // Saved a second ago; still active, so no pause has happened yet.
  const s=core.evaluate(ready({lastActivityAt:99000,lastBoundaryAt:99000}),100000);
  assert.equal(s.mode,"gentle_nudge");
  assert.match(s.reason,/finished/);
});
test("a completion does not interrupt someone who has gone straight back to typing",()=>{
  const s=core.evaluate(ready({lastBoundaryAt:95000,lastKeyAt:99500,lastActivityAt:99500}),100000);
  assert.notEqual(s.mode,"gentle_nudge");
});
test("quiet after scrolling is reading, and Puff waits it out",()=>{
  // Typed at 60s, scrolled until 85s, silent since: to a timer that is a pause; to a reader it is not.
  let s=core.evaluate(ready({lastKeyAt:60000,lastScrollAt:85000,lastActivityAt:85000}),100000);
  assert.equal(s.reading,true);
  assert.notEqual(s.mode,"gentle_nudge");
  assert.equal(s.reason,"Waiting while you read");
  // Quiet after typing, not scrolling, is a seam in the work and still counts.
  s=core.evaluate(ready({lastKeyAt:85000,lastScrollAt:60000,lastActivityAt:85000}),100000);
  assert.equal(s.mode,"gentle_nudge");
});
test("once the reading has gone quiet for a while, the pause counts again",()=>{
  const s=core.evaluate(ready({lastKeyAt:10000,lastScrollAt:65000,lastActivityAt:65000}),100000);
  assert.equal(s.reading,false);
  assert.equal(s.mode,"gentle_nudge");
});
test("Pause holds every invitation until it runs out",()=>{
  let s=core.pauseUntil(ready(),100000+3600000,100000);
  assert.equal(core.evaluate(s,100000).mode,"quiet");
  assert.equal(core.evaluate(s,100000).reason,"Paused");
  s=core.evaluate({...s,lastEvaluatedAt:100000+3600001,lastActivityAt:100000+3600001-20000},100000+3600001);
  assert.equal(s.mode,"gentle_nudge","free to invite again once the pause is over");
  assert.equal(core.pauseUntil(ready({busyUntil:500000}),0,100000).busyUntil,0,"lifting a pause");
});
test("a chosen break timing replaces what was learned and ignores odd values",()=>{
  let s=core.setBreakTiming(ready({learnedThreshold:4000}),45);
  assert.equal(s.thresholdSeconds,2700);
  assert.equal(s.learnedThreshold,0);
  assert.equal(core.setBreakTiming(s,7).thresholdSeconds,2700);
});
test("video calls on Teams and Webex are protected like Meet and Zoom",()=>{
  for(const url of ["https://teams.microsoft.com/l/meetup","https://acme.webex.com/meet/x","https://meet.google.com/abc"])assert.equal(core.protectedUrl(url),true,url);
  assert.equal(core.protectedUrl("https://docs.google.com/document/d/1"),false);
});

// ── Today at a glance ─────────────────────────────────────────────────────────
test("today's total grows with work and survives a break; the count includes breaks taken without Puff",()=>{
  let s=core.evaluate({...core.initialState(0),idleState:"active",lastEvaluatedAt:0},20000);
  assert.equal(s.todaySeconds,20);
  s=core.evaluate({...s,activeSeconds:600,idleState:"idle",idleSince:25000},150000);
  assert.equal(s.activeSeconds,0,"the stretch resets");
  assert.ok(s.todaySeconds>=20,"the day does not");
  assert.equal(s.breaksToday,1);
  s=core.evaluate(s,160000);
  assert.equal(s.breaksToday,1,"one absence is one break, not one per check");
  s=core.applyResponse({...s,activeSeconds:1800,currentTabTitle:"Doc",currentTabUrl:"https://a.test/"},"take_break",170000);
  assert.equal(s.breaksToday,2);
  assert.equal(s.checkpoint.workedSeconds,1800,"remembers how long the stretch was, for the welcome back");
});
test("a new day starts the totals over",()=>{
  const s=core.evaluate({...core.initialState(0),todaySeconds:5000,breaksToday:3,day:"2000-01-01"},86400000*3);
  assert.equal(s.todaySeconds,0);assert.equal(s.breaksToday,0);
});

// ── Overdue: someone who reads or types straight through never gives a good moment ──
test("well past their timing, a reader is asked at the next brief stop",()=>{
  // 30-minute timing, 47 minutes in, scrolling until four seconds ago: that is reading.
  const reading={thresholdSeconds:1800,activeSeconds:1800*1.2,lastKeyAt:10000,lastScrollAt:96000,lastActivityAt:96000};
  let s=core.evaluate(ready(reading),100000);
  assert.notEqual(s.mode,"gentle_nudge","before one and a half times their timing, reading is still waited out");
  s=core.evaluate(ready({...reading,activeSeconds:1800*1.6}),100000);
  assert.equal(s.overdue,true);
  assert.equal(s.mode,"gentle_nudge");
  assert.equal(s.nudgeKind,"overdue");
});
test("overdue still never interrupts typing, and needs at least a brief stop",()=>{
  let s=core.evaluate(ready({activeSeconds:3000,lastKeyAt:99000,lastActivityAt:99000}),100000);
  assert.notEqual(s.mode,"gentle_nudge","typing a second ago");
  s=core.evaluate(ready({activeSeconds:3000,lastKeyAt:10000,lastScrollAt:99500,lastActivityAt:99500}),100000);
  assert.notEqual(s.mode,"gentle_nudge","still scrolling");
});
test("an overdue invitation waits to be answered instead of vanishing when work resumes",()=>{
  let s=core.evaluate(ready({activeSeconds:3000,lastKeyAt:10000,lastScrollAt:96000,lastActivityAt:96000}),100000);
  assert.equal(s.nudgeKind,"overdue");
  s=core.mergeActivity(s,{scrollEvents:3,lastActivityAt:101000,lastScrollAt:101000},101000);
  assert.equal(s.mode,"gentle_nudge");
  assert.equal(core.evaluate(s,160000).dailyInvitations,1,"and it is still one invitation");
});
test("a normal invitation says which kind of moment it was",()=>{
  assert.equal(core.evaluate(ready({lastActivityAt:99000,lastBoundaryAt:99000}),100000).nudgeKind,"finished");
  assert.equal(core.evaluate(ready(),100000).nudgeKind,"pause");
});

test("the saved page is forgotten once the break is over",()=>{
  let s=core.applyResponse(ready({currentTabTitle:"Doc",currentTabUrl:"https://example.com/doc"}),"take_break",100000,{note:"next"});
  assert.equal(s.checkpoint.title,"Doc");
  s=core.applyResponse(core.applyResponse(s,"resume",200000),"continue",201000);
  assert.equal(s.checkpoint,null);
});
