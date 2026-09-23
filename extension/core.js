(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.OffRampCore=api;})(typeof self!=="undefined"?self:globalThis,function(){
  const MODES=["quiet","considering","gentle_nudge","checkpoint","on_break","resume"];
  const day=now=>new Date(now).toLocaleDateString("en-CA");
  const clamp=(value,low,high)=>Math.min(high,Math.max(low,value));
  const round2=value=>Math.round(value*100)/100;
  // Kaur et al. (CHI 2020) found short windows over the recent past beat one running total, and
  // that interaction data is the strongest signal available without a camera. Windows scale with
  // the threshold so the demo setting stays demonstrable.
  const windowMs=state=>Math.max(5_000,Math.round(state.thresholdSeconds*1000/4));
  const LOOKBACK_WINDOWS=4;
  function rollWindows(list,now,span,activeDelta,counted){
    const at=Math.floor(now/span)*span;
    const out=list.slice();
    if(!out.length||out[out.length-1].at!==at)out.push({at,clicks:0,keypresses:0,scrollEvents:0,tabSwitches:0,activeSeconds:0});
    if(counted&&activeDelta>0)out[out.length-1].activeSeconds+=activeDelta;
    return out.filter(w=>now-w.at<=span*(LOOKBACK_WINDOWS+1)).slice(-(LOOKBACK_WINDOWS+1));
  }
  /** Describes the shape of recent work, not just how much of it there has been. */
  function rhythmOf(list){
    const active=list.filter(w=>w.activeSeconds>=5);
    if(!active.length)return {intensity:0,scatter:0,settling:0,windows:0};
    const rate=w=>{const minutes=Math.max(1,w.activeSeconds/60);
      return {input:(w.clicks+w.keypresses+w.scrollEvents)/minutes,switches:w.tabSwitches/minutes};};
    const rates=active.map(rate);
    const mean=values=>values.reduce((a,b)=>a+b,0)/values.length;
    const latest=rates[rates.length-1];
    const earlier=rates.slice(0,-1);
    const baseline=earlier.length?mean(earlier.map(r=>r.input)):latest.input;
    return {
      intensity:round2(mean(rates.map(r=>r.input))),
      scatter:round2(mean(rates.map(r=>r.switches))),
      // 1 means the newest window is far quieter than the run before it: someone winding down.
      settling:baseline>0?round2(clamp(1-latest.input/baseline,0,1)):0,
      windows:active.length,
    };
  }
  function initialState(now=Date.now()){return {version:2,sessionStartedAt:now,sessionSeconds:0,lastEvaluatedAt:now,activeSeconds:0,
    idleState:"unknown",idleSince:null,clicks:0,keypresses:0,scrollEvents:0,tabSwitches:0,currentTabTitle:"",currentTabUrl:"",currentTabId:null,
    lastActivityAt:0,lastKeyAt:0,lastTabChangeAt:0,designLastChangeAt:0,designConnected:false,recentTyping:false,possibleBreakpoint:false,
    mode:"quiet",laterCount:0,cooldownUntil:0,responseHistory:[],checkpoint:null,demoMode:false,thresholdSeconds:1800,
    windows:[],rhythm:{intensity:0,scatter:0,settling:0,windows:0},learnedThreshold:0,lastAction:"",lastActionAt:0,pausedAt:0,
    dailyInvitations:0,day:day(now),sessionInvited:false,enabled:true,blocked:false,busyUntil:0,needScore:0,opportunityScore:0,reason:"Waiting for activity"};}
  function evaluate(state,now=Date.now()){
    const next={...initialState(now),...state};
    if(next.day!==day(now)){next.day=day(now);next.dailyInvitations=0;}
    const elapsed=Math.min(30,Math.max(0,(now-next.lastEvaluatedAt)/1000));
    const recentActivity=Math.max(next.lastActivityAt,next.designConnected?next.designLastChangeAt:0);
    // chrome.idle watches input across the whole machine, so work in an editor or a desktop app
    // still counts. Gating on browser input alone meant a morning in VS Code registered as zero.
    const present=next.idleState==="active";
    const counting=next.enabled&&!next.blocked&&present&&!["on_break","resume"].includes(next.mode);
    if(counting)next.activeSeconds+=elapsed;
    next.windows=rollWindows(next.windows,now,windowMs(next),elapsed,counting);
    next.rhythm=rhythmOf(next.windows);
    next.lastEvaluatedAt=now;next.sessionSeconds=Math.floor(next.activeSeconds);
    if(["idle","locked"].includes(next.idleState)){
      next.idleSince=next.idleSince??now;
      if(now-next.idleSince>=120_000){next.activeSeconds=0;next.sessionSeconds=0;next.sessionInvited=false;next.windows=[];next.rhythm=rhythmOf([]);next.pausedAt=0;}
    }else next.idleSince=null;
    const pauseMs=next.demoMode?2000:10_000;
    next.recentTyping=next.lastKeyAt>0&&now-next.lastKeyAt<pauseMs;
    // Two ways to notice someone's hands have stopped. In the browser we see it within ten
    // seconds. Outside it, chrome.idle tells us the whole machine went quiet — coarser, at a
    // fifteen-second floor, but it is the only such signal that works in a desktop app.
    const browserPause=recentActivity>0&&now-recentActivity>=pauseMs;
    // A short quiet spell is a pause worth acting on; a long one is an actual break, and the
    // reset above has already cleared the session it belonged to.
    const idleFor=next.idleSince?now-next.idleSince:0;
    const systemPause=next.idleState==="idle"&&idleFor<=120_000;
    if(systemPause||browserPause)next.pausedAt=now;
    // A pause still counts for a short while afterwards, so stepping away from an editor and
    // coming back lands on an invitation instead of missing it.
    const pause=next.pausedAt>0&&now-next.pausedAt<=(next.demoMode?10_000:120_000);
    // Someone visibly winding down is offered a break sooner; someone still at full tilt waits.
    const base=next.learnedThreshold||next.thresholdSeconds;
    next.effectiveThreshold=Math.round(clamp(base*(1-0.25*next.rhythm.settling),next.thresholdSeconds*0.5,next.thresholdSeconds*3));
    next.needScore=Math.min(1,next.activeSeconds/next.effectiveThreshold);
    next.opportunityScore=pause&&!next.recentTyping?1:0;
    next.possibleBreakpoint=next.needScore>=1&&next.opportunityScore>=1;
    const blocked=!next.enabled||next.blocked||next.busyUntil>now||next.idleState!=="active";
    next.reason=!next.enabled?"Monitoring paused":next.blocked?"Protected or full-screen page":next.busyUntil>now?"Manual busy window":next.idleState!=="active"?"Browser not active":
      now<next.cooldownUntil?"Respecting your cooldown":next.recentTyping?"Waiting while you type":next.needScore<1?"Focus threshold not reached":!pause?"Waiting for a natural pause":"Sustained work followed by a pause";
    if(["checkpoint","on_break","resume"].includes(next.mode))return next;
    if(blocked||now<next.cooldownUntil||next.dailyInvitations>=4){next.mode="quiet";return next;}
    if(next.mode==="gentle_nudge"&&!pause){next.mode="quiet";next.cooldownUntil=now+60_000;return next;}
    if(next.mode==="gentle_nudge")return next;
    if(next.sessionInvited){next.mode="quiet";return next;}
    if(next.needScore<1){next.mode="quiet";return next;}
    next.mode="considering";
    if(next.possibleBreakpoint){next.mode="gentle_nudge";next.dailyInvitations++;next.sessionInvited=true;}
    return next;
  }
  function mergeActivity(state,delta,now=Date.now()){
    const next=evaluate(state,now);
    const current=next.windows[next.windows.length-1];
    for(const key of ["clicks","keypresses","scrollEvents"]){
      const amount=Math.min(1000,Math.max(0,Number(delta[key])||0));
      next[key]+=amount;
      if(current)current[key]+=amount;
    }
    for(const key of ["lastActivityAt","lastKeyAt"])if(Number.isFinite(delta[key])&&delta[key]<=now&&delta[key]>0)next[key]=Math.max(next[key],delta[key]);
    return evaluate(next,now);
  }
  /**
   * The paper's general model explained far less than its personalised ones, so a threshold that
   * is the same for everyone is the weakest version of this. Puff moves its own toward the moments
   * this person actually accepts, and away from ones they wave off. Bounded, and explainable.
   */
  function learnThreshold(state,action){
    const base=state.thresholdSeconds;
    const current=state.learnedThreshold||base;
    if(action==="take_break"||action==="save_place")return clamp(current+(state.activeSeconds-current)*0.3,base*0.5,base*3);
    if(action==="later")return clamp(current*1.1,base*0.5,base*3);
    if(action==="dismiss")return clamp(current*1.25,base*0.5,base*3);
    return current;
  }
  /** Switching tabs is the scatter signal, so it has to land in the current window too. */
  function recordTabSwitch(state,now=Date.now()){
    const next=evaluate({...state,tabSwitches:state.tabSwitches+1,lastTabChangeAt:now,lastActivityAt:now},now);
    const current=next.windows[next.windows.length-1];
    if(current)current.tabSwitches+=1;
    return next;
  }
  function applyResponse(state,action,now=Date.now(),fields={}){
    const next={...state,responseHistory:[...state.responseHistory,{action,timestamp:now,interventionMode:state.mode}].slice(-100),
      learnedThreshold:Math.round(learnThreshold(state,action)),lastAction:action,lastActionAt:now};
    if(["later","dismiss"].includes(action)){
      next.laterCount++;next.mode="quiet";
      const minutes=action==="dismiss"?(next.laterCount>=2?60:30):15;
      next.cooldownUntil=now+minutes*60_000;
    }else if(action==="save_place"){next.mode="checkpoint";}
    else if(action==="take_break"){
      const note=String(fields.note||"").trim().slice(0,500);
      if(!note)return {...next,error:"Confirm a next step before saving."};
      next.checkpoint={title:state.currentTabTitle,url:state.currentTabUrl,tabId:state.currentTabId,note,savedAt:now};
      next.mode="on_break";next.breakStartedAt=now;
    }else if(action==="resume"){next.mode="resume";}
    else if(action==="continue"){next.mode="quiet";next.activeSeconds=0;next.sessionSeconds=0;next.sessionStartedAt=now;next.sessionInvited=false;next.laterCount=0;next.cooldownUntil=0;next.windows=[];next.rhythm=rhythmOf([]);}
    return next;
  }
  function interventionFor(state){
    const copy={quiet:["Your place, held gently","Open Off-Ramp whenever you want to save your place."],considering:["Waiting for a pause","You have been working for a while. I will wait."],gentle_nudge:["A place to pause","Save your place before stepping away?"],checkpoint:["Keep your intention","Confirm what you want to do when you return."],on_break:["Your place is saved","You can let go for a moment."],resume:["Pick up your thread","Return to the saved page and your next step."]}[state.mode];
    return {mode:state.mode,title:copy[0],message:copy[1],reason:state.reason};
  }
  function safeUrl(value){try{const u=new URL(value);if(!["http:","https:"].includes(u.protocol))return "";u.search="";u.hash="";u.username="";u.password="";return u.href;}catch{return "";}}
  function protectedUrl(value){try{const u=new URL(value);return /(^|\.)(meet.google.com|zoom.us|paypal.com|stripe.com)$/.test(u.hostname)||/checkout|payment|banking|exam|password/i.test(u.pathname);}catch{return true;}}
  return {MODES,initialState,evaluate,mergeActivity,recordTabSwitch,applyResponse,interventionFor,safeUrl,protectedUrl};
});
