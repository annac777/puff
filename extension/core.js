(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.OffRampCore=api;})(typeof self!=="undefined"?self:globalThis,function(){
  const MODES=["quiet","considering","gentle_nudge","checkpoint","on_break","resume"];
  const day=now=>new Date(now).toLocaleDateString("en-CA");
  function initialState(now=Date.now()){return {version:2,sessionStartedAt:now,sessionSeconds:0,lastEvaluatedAt:now,activeSeconds:0,
    idleState:"unknown",idleSince:null,clicks:0,keypresses:0,scrollEvents:0,tabSwitches:0,currentTabTitle:"",currentTabUrl:"",currentTabId:null,
    lastActivityAt:0,lastKeyAt:0,lastTabChangeAt:0,designLastChangeAt:0,designConnected:false,recentTyping:false,possibleBreakpoint:false,
    mode:"quiet",laterCount:0,cooldownUntil:0,responseHistory:[],checkpoint:null,demoMode:false,thresholdSeconds:1800,
    dailyInvitations:0,day:day(now),sessionInvited:false,enabled:true,blocked:false,busyUntil:0,needScore:0,opportunityScore:0,reason:"Waiting for activity"};}
  function evaluate(state,now=Date.now()){
    const next={...initialState(now),...state};
    if(next.day!==day(now)){next.day=day(now);next.dailyInvitations=0;}
    const elapsed=Math.min(30,Math.max(0,(now-next.lastEvaluatedAt)/1000));
    const recentActivity=Math.max(next.lastActivityAt,next.designConnected?next.designLastChangeAt:0);
    if(next.enabled&&!next.blocked&&next.idleState==="active"&&recentActivity>0&&now-recentActivity<=60_000&&!["on_break","resume"].includes(next.mode))next.activeSeconds+=elapsed;
    next.lastEvaluatedAt=now;next.sessionSeconds=Math.floor(next.activeSeconds);
    if(["idle","locked"].includes(next.idleState)){
      next.idleSince=next.idleSince??now;
      if(now-next.idleSince>=120_000){next.activeSeconds=0;next.sessionSeconds=0;next.sessionInvited=false;}
    }else next.idleSince=null;
    const pauseMs=next.demoMode?2000:10_000;
    next.recentTyping=next.lastKeyAt>0&&now-next.lastKeyAt<pauseMs;
    const pause=recentActivity>0&&now-recentActivity>=pauseMs;
    next.needScore=Math.min(1,next.activeSeconds/next.thresholdSeconds);
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
    for(const key of ["clicks","keypresses","scrollEvents"])next[key]+=Math.min(1000,Math.max(0,Number(delta[key])||0));
    for(const key of ["lastActivityAt","lastKeyAt"])if(Number.isFinite(delta[key])&&delta[key]<=now&&delta[key]>0)next[key]=Math.max(next[key],delta[key]);
    return evaluate(next,now);
  }
  function applyResponse(state,action,now=Date.now(),fields={}){
    const next={...state,responseHistory:[...state.responseHistory,{action,timestamp:now,interventionMode:state.mode}].slice(-100)};
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
    else if(action==="continue"){next.mode="quiet";next.activeSeconds=0;next.sessionSeconds=0;next.sessionStartedAt=now;next.sessionInvited=false;next.laterCount=0;next.cooldownUntil=0;}
    return next;
  }
  function interventionFor(state){
    const copy={quiet:["Your place, held gently","Open Off-Ramp whenever you want to save your place."],considering:["Waiting for a pause","You have been working for a while. I will wait."],gentle_nudge:["A place to pause","Save your place before stepping away?"],checkpoint:["Keep your intention","Confirm what you want to do when you return."],on_break:["Your place is saved","You can let go for a moment."],resume:["Pick up your thread","Return to the saved page and your next step."]}[state.mode];
    return {mode:state.mode,title:copy[0],message:copy[1],reason:state.reason};
  }
  function safeUrl(value){try{const u=new URL(value);if(!["http:","https:"].includes(u.protocol))return "";u.search="";u.hash="";u.username="";u.password="";return u.href;}catch{return "";}}
  function protectedUrl(value){try{const u=new URL(value);return /(^|\.)(meet.google.com|zoom.us|paypal.com|stripe.com)$/.test(u.hostname)||/checkout|payment|banking|exam|password/i.test(u.pathname);}catch{return true;}}
  return {MODES,initialState,evaluate,mergeActivity,applyResponse,interventionFor,safeUrl,protectedUrl};
});
