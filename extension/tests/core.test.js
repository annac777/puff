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
test("break requires confirmed intent and preserves an executable anchor",()=>{const initial=ready({currentTabTitle:"Draft",currentTabUrl:"https://example.com/",currentTabId:17});assert.notEqual(core.applyResponse(initial,"take_break",100000).mode,"on_break");const s=core.applyResponse(initial,"take_break",100000,{note:"Check tablet layout"});assert.equal(s.checkpoint.tabId,17);assert.equal(s.checkpoint.note,"Check tablet layout");assert.equal(s.mode,"on_break");});
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
